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
        !(await ledger.registerKey({
          id: key.id,
          digest: await hashToken(key.key),
          expiresAt: new Date(key.expiresAt!).getTime(),
        }))
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
routes.get("/admin/users", async (c) => {
  const cursor = c.req.query("cursor") ?? "";
  const result = await c.env.DB.prepare(
    "SELECT id, name, email, image, role, email_verified, created_at FROM auth_user WHERE id > ? ORDER BY id LIMIT 51",
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
      "SELECT id, name, email, role, email_verified, created_at FROM auth_user WHERE id = ?",
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
