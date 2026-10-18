import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { authReady, createAuth } from "./auth";
import { apikey } from "./auth-schema";
import type { Env } from "./index";
import { failure, reserveGlobal } from "./guard";
import { hashToken } from "./key-token";
import { MAX_API_KEYS } from "./limits";
function effectiveUser<
  T extends { email: string; role: string; email_verified?: number },
>(row: T, env: Env): T {
  if (
    row.email_verified &&
    (env.ADMIN_EMAILS ?? "")
      .split(",")
      .some((email) => email.trim().toLowerCase() === row.email.toLowerCase())
  )
    return { ...row, role: "admin" };
  return row;
}
const routes = new Hono<{
  Bindings: Env;
  Variables: {
    account: { id: string; name: string; email: string; role: string };
  };
}>();
routes.use("*", async (c, next) => {
  if (!authReady(c.env))
    return failure("AUTH_UNAVAILABLE", "Sign-in is not configured yet", 503);
  const budget = await reserveGlobal(
    c.env,
    c.req.header("CF-Connecting-IP") ?? "account",
  );
  if (budget) return budget;
  if (
    !["GET", "HEAD"].includes(c.req.method) &&
    c.req.header("Origin") !== new URL(c.env.BETTER_AUTH_URL!).origin
  )
    return failure("FORBIDDEN", "Invalid request origin", 403);
  const session = await createAuth(c.env).api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) return failure("UNAUTHORIZED", "Sign in to continue", 401);
  if (
    (await c.env.ACCESS.getByName("user:" + session.user.id).accessState())
      .banned
  )
    return failure("ACCOUNT_BANNED", "Account is banned", 403);
  const row = await c.env.DB.prepare(
    "SELECT id, name, email, role FROM auth_user WHERE id = ?",
  )
    .bind(session.user.id)
    .first<{ id: string; name: string; email: string; role: string }>();
  if (!row) return failure("UNAUTHORIZED", "Account not found", 401);
  const admins = (c.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  // Allow-listed administrators still need to authenticate with a trusted OAuth provider.
  if (session.user.emailVerified && admins.includes(row.email.toLowerCase()))
    row.role = "admin";
  c.set("account", row);
  await next();
});
routes.get("/me", (c) =>
  c.json({ user: c.get("account"), maxKeys: MAX_API_KEYS }),
);
routes.get("/keys", async (c) => {
  const keys = await drizzle(c.env.DB)
    .select({
      id: apikey.id,
      name: apikey.name,
      start: apikey.start,
      createdAt: apikey.createdAt,
      expiresAt: apikey.expiresAt,
      enabled: apikey.enabled,
    })
    .from(apikey)
    .where(eq(apikey.referenceId, c.get("account").id));
  return c.json({
    keys: keys.filter(
      (k) => k.enabled && (!k.expiresAt || k.expiresAt.getTime() > Date.now()),
    ),
    maxKeys: MAX_API_KEYS,
  });
});
routes.post("/keys", async (c) => {
  if (c.env.ENABLE_OPENAPI !== "true")
    return failure("OPENAPI_DISABLED", "API access is disabled", 403);
  const user = c.get("account");
  const ledger = c.env.ACCESS.getByName("user:" + user.id);
  const issuance = await ledger.accessState();
  if (issuance.keysPaused)
    return failure(
      "MODERATION_PENDING",
      "Key management is temporarily locked",
      409,
    );
  if (issuance.banned)
    return failure("ACCOUNT_BANNED", "Account is banned", 403);
  const limit = await ledger.consume([
    { key: "key-create", seconds: 86400, max: 10 },
  ]);
  if (!limit.allowed)
    return failure(
      "RATE_LIMITED",
      "Daily key creation limit reached",
      429,
      limit.retryAfter,
    );
  const body = await c.req.json<{ name?: string; token?: string }>();
  if (c.env.TURNSTILE_SECRET) {
    const result = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: c.env.TURNSTILE_SECRET,
          response: body.token ?? "",
          remoteip: c.req.header("CF-Connecting-IP") ?? "",
        }),
      },
    );
    if (!(await result.json<{ success: boolean }>()).success)
      return failure(
        "CAPTCHA_REQUIRED",
        "Please complete the verification",
        400,
      );
  }
  try {
    const key = await createAuth(c.env, user.id).api.createApiKey({
      body: {
        userId: user.id,
        name: (body.name ?? "API Key").trim().slice(0, 64) || "API Key",
        expiresIn: 90 * 86400,
      },
    });
    // If registration fails, remove the unusable key. Never expose it before registration.
    try {
      if (
        !(await ledger.registerKey(
          {
            id: key.id,
            digest: await hashToken(key.key),
            expiresAt: new Date(key.expiresAt!).getTime(),
          },
          issuance.epoch,
        ))
      )
        throw new Error("API_KEY_LIMIT");
    } catch (error) {
      await drizzle(c.env.DB).delete(apikey).where(eq(apikey.id, key.id));
      throw error;
    }
    return c.json({ key: key.key, id: key.id }, 201);
  } catch (error) {
    if (
      String(error).includes("API_KEY_LIMIT") ||
      String(error).includes("Failed to create API key")
    )
      return failure(
        "API_KEY_LIMIT",
        "You can have at most 3 active API keys",
        409,
      );
    throw error;
  }
});
routes.delete("/keys/:id", async (c) => {
  const user = c.get("account"),
    id = c.req.param("id");
  // Revocation reaches the authoritative request registry before the D1 record is removed.
  await c.env.ACCESS.getByName("user:" + user.id).revokeKey(id);
  await drizzle(c.env.DB)
    .delete(apikey)
    .where(and(eq(apikey.id, id), eq(apikey.referenceId, user.id)));
  return c.json({ success: true });
});
routes.use("/admin/*", async (c, next) => {
  if (c.get("account").role !== "admin")
    return failure("FORBIDDEN", "Administrator access required", 403);
  await next();
});
routes.patch("/admin/users/:id/role", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ role?: string }>();
  if (!["user", "admin"].includes(body.role ?? ""))
    return failure("VALIDATION_ERROR", "Role must be user or admin", 400);
  if (id === c.get("account").id)
    return failure(
      "FORBIDDEN",
      "You cannot change your own administrator role",
      403,
    );
  const target = await c.env.DB.prepare(
    "SELECT email FROM auth_user WHERE id = ?",
  )
    .bind(id)
    .first<{ email: string }>();
  if (!target) return failure("NOT_FOUND", "User not found", 404);
  if (
    (c.env.ADMIN_EMAILS ?? "")
      .split(",")
      .some(
        (email) => email.trim().toLowerCase() === target.email.toLowerCase(),
      )
  )
    return failure(
      "FORBIDDEN",
      "This administrator is managed by ADMIN_EMAILS",
      403,
    );
  await c.env.DB.prepare(
    "UPDATE auth_user SET role = ?, updated_at = ? WHERE id = ?",
  )
    .bind(body.role, Date.now(), id)
    .run();
  return c.json({ success: true });
});

routes.post("/admin/users/:id/disable-keys", async (c) => {
  const id = c.req.param("id");
  if (
    !(await c.env.DB.prepare("SELECT id FROM auth_user WHERE id = ?")
      .bind(id)
      .first())
  )
    return failure("NOT_FOUND", "User not found", 404);
  const ledger = c.env.ACCESS.getByName("user:" + id);
  const epoch = await ledger.beginModeration();
  if (epoch === null)
    return failure(
      "MODERATION_PENDING",
      "Another moderation action is in progress",
      409,
    );
  await c.env.DB.prepare(
    "UPDATE auth_apikey SET enabled=0, updated_at=? WHERE reference_id=?",
  )
    .bind(Date.now(), id)
    .run();
  await ledger.finishModeration(epoch);
  return c.json({ success: true });
});
routes.patch("/admin/users/:id/ban", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ banned?: boolean }>();
  if (typeof body.banned !== "boolean")
    return failure("VALIDATION_ERROR", "banned must be boolean", 400);
  const target = await c.env.DB.prepare(
    "SELECT email, role, email_verified FROM auth_user WHERE id=?",
  )
    .bind(id)
    .first<{ email: string; role: string; email_verified: number }>();
  if (!target) return failure("NOT_FOUND", "User not found", 404);
  if (
    id === c.get("account").id ||
    effectiveUser(target, c.env).role === "admin"
  )
    return failure(
      "FORBIDDEN",
      "Remove the administrator role before banning this account; you cannot ban yourself",
      403,
    );
  const ledger = c.env.ACCESS.getByName("user:" + id);
  // Fail closed: block at the authoritative ledger before updating D1.
  const epoch = await ledger.beginModeration(body.banned ? true : undefined);
  if (epoch === null)
    return failure(
      "MODERATION_PENDING",
      "Another moderation action is in progress",
      409,
    );
  await c.env.DB.batch([
    c.env.DB.prepare(
      "UPDATE auth_user SET banned=?, updated_at=? WHERE id=?",
    ).bind(Number(body.banned), Date.now(), id),
    c.env.DB.prepare(
      "UPDATE auth_apikey SET enabled=0, updated_at=? WHERE reference_id=?",
    ).bind(Date.now(), id),
    c.env.DB.prepare("DELETE FROM auth_session WHERE user_id=?").bind(id),
  ]);
  await ledger.finishModeration(epoch, !body.banned);
  return c.json({ success: true });
});
routes.get("/admin/logs", async (c) => {
  const owner = c.req.query("userId") ?? "";
  if (owner.length > 128)
    return failure("VALIDATION_ERROR", "Invalid user", 400);
  let before = Date.now() + 1,
    id = "";
  const cursor = c.req.query("cursor");
  if (cursor) {
    try {
      if (cursor.length > 512) throw new Error();
      const decoded = JSON.parse(atob(cursor));
      if (
        !Number.isSafeInteger(decoded.time) ||
        typeof decoded.id !== "string" ||
        decoded.id.length > 64
      )
        throw new Error();
      before = decoded.time;
      id = decoded.id;
    } catch {
      return failure("VALIDATION_ERROR", "Invalid cursor", 400);
    }
  }
  const conditions = owner ? "user_id = ? AND " : "";
  const args: (string | number)[] = owner ? [owner] : [];
  args.push(Date.now() - 7 * 86400_000, before, id);
  const result = await c.env.DB.prepare(
    "SELECT * FROM api_request_logs WHERE " +
      conditions +
      "created_at >= ? AND (created_at, id) < (?, ?) ORDER BY created_at DESC, id DESC LIMIT 51",
  )
    .bind(...args)
    .all<{ id: string; created_at: number; user_id: string }>();
  const logs = result.results.slice(0, 50);
  const ids = [...new Set(logs.map((row) => row.user_id))];
  const users = ids.length
    ? await c.env.DB.prepare(
        "SELECT id,name,email FROM auth_user WHERE id IN (" +
          ids.map(() => "?").join(",") +
          ")",
      )
        .bind(...ids)
        .all<{ id: string; name: string; email: string }>()
    : { results: [] };
  const last = logs.at(-1);
  return c.json({
    logs: logs.map((row) => ({
      ...row,
      user: users.results.find((user) => user.id === row.user_id) ?? null,
    })),
    nextCursor:
      result.results.length > 50 && last
        ? btoa(JSON.stringify({ time: last.created_at, id: last.id }))
        : null,
    retentionDays: 7,
    delaySeconds: 60,
  });
});

routes.get("/admin/users", async (c) => {
  const cursor = c.req.query("cursor") ?? "";
  const result = await c.env.DB.prepare(
    "SELECT id, name, email, image, role, banned, email_verified, created_at FROM auth_user WHERE id > ? ORDER BY id LIMIT 51",
  )
    .bind(cursor)
    .all<{
      id: string;
      name: string;
      email: string;
      role: string;
      email_verified: number;
    }>();
  const users = result.results
    .slice(0, 50)
    .map((row) => effectiveUser(row, c.env));
  return c.json({
    users,
    nextCursor: result.results.length > 50 ? users.at(-1)?.id : null,
  });
});
routes.get("/admin/users/:id", async (c) => {
  const id = c.req.param("id");
  const since = new Date(Date.now() - 30 * 86400_000)
    .toISOString()
    .slice(0, 10);
  const cursor = c.req.query("cursor") ?? "";
  const results = await c.env.DB.batch<Record<string, unknown>>([
    c.env.DB.prepare(
      "SELECT id, name, email, role, banned, email_verified, created_at FROM auth_user WHERE id = ?",
    ).bind(id),
    c.env.DB.prepare(
      "SELECT id, name, start, enabled, created_at, expires_at FROM auth_apikey WHERE reference_id = ? ORDER BY created_at DESC LIMIT 100",
    ).bind(id),
    c.env.DB.prepare(
      "SELECT * FROM usage_daily WHERE owner_id = ? AND date >= ? ORDER BY date DESC LIMIT 1000",
    ).bind(id, since),
    c.env.DB.prepare(
      "SELECT id, address, created_at, expires_at FROM mailboxes WHERE user_id = ? AND id > ? ORDER BY id LIMIT 51",
    ).bind(id, cursor),
  ]);
  const boxes = results[3].results.slice(0, 50);
  return c.json({
    user: results[0].results[0]
      ? effectiveUser(
          results[0].results[0] as {
            email: string;
            role: string;
            email_verified: number;
          },
          c.env,
        )
      : null,
    keys: results[1].results,
    usage: results[2].results,
    mailboxes: boxes,
    nextCursor: results[3].results.length > 50 ? boxes.at(-1)?.id : null,
    statisticsDelaySeconds: 300,
  });
});
export default routes;
