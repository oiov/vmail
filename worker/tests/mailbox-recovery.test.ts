import { beforeAll, describe, expect, inject, it } from "vitest";
import {
  applyD1Migrations,
  createExecutionContext,
  env,
  runInDurableObject,
  waitOnExecutionContext,
} from "cloudflare:test";
import worker, { type Env } from "../src/index";
import { recoverMailbox } from "../src/mailbox-recovery";
import { DEFAULT_MAX_ACTIVE_MAILBOXES } from "../src/limits";
import { createMailboxToken } from "../src/sender";

const bindings = env as Env;
beforeAll(() => applyD1Migrations(bindings.DB, inject("migrations")));
async function user(role = "user") {
  const id = crypto.randomUUID(),
    token = crypto.randomUUID(),
    now = Date.now();
  await bindings.DB.prepare(
    "INSERT INTO auth_user (id,name,email,email_verified,role,created_at,updated_at) VALUES (?,? ,?,1,?,?,?)",
  )
    .bind(id, "Recovery test", id + "@example.com", role, now, now)
    .run();
  await bindings.DB.prepare(
    "INSERT INTO auth_session (id,token,expires_at,created_at,updated_at,user_id) VALUES (?,?,?,?,?,?)",
  )
    .bind(crypto.randomUUID(), token, now + 86400_000, now, now, id)
    .run();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(bindings.BETTER_AUTH_SECRET!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = btoa(
    String.fromCharCode(
      ...new Uint8Array(
        await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(token)),
      ),
    ),
  );
  return {
    id,
    headers: {
      Cookie:
        "better-auth.session_token=" +
        encodeURIComponent(token + "." + signature),
      Origin: "http://localhost:8787",
      "Content-Type": "application/json",
    },
  };
}
const address = () => crypto.randomUUID() + "@example.test";
async function request(
  path: string,
  init: RequestInit = {},
  overrides: Partial<Env> = {},
) {
  const ctx = createExecutionContext();
  const response = await worker.fetch(
    new Request("http://localhost:8787/api/account" + path, init),
    { ...bindings, ...overrides },
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return response;
}
function input(userId: string, email = address()) {
  return {
    userId,
    actorId: userId,
    address: email,
    reason: "Verified support request",
    allowClaim: true,
  };
}
async function expire(email: string) {
  await bindings.DB.prepare(
    "UPDATE mailboxes SET expires_at=unixepoch()-1 WHERE address=?",
  )
    .bind(email)
    .run();
  await runInDurableObject(
    bindings.ACCESS.getByName("mailbox:" + email),
    (_, state) => {
      state.storage.kv.put("mailboxExpiry", Date.now() - 1000);
    },
  );
}

describe("mailbox recovery", () => {
  it("receives fresh messages after recovery and does not change 24-hour message retention", async () => {
    const owner = await user(),
      data = input(owner.id);
    await recoverMailbox(bindings, data);
    let rejected = "";
    const raw = `From: sender@example.com\r\nTo: ${data.address}\r\nSubject: Recovery receipt\r\nMessage-ID: <${crypto.randomUUID()}@example.com>\r\nContent-Type: text/plain\r\n\r\nA new message after recovery.\r\n`;
    const ctx = createExecutionContext();
    await worker.email(
      {
        from: "sender@example.com",
        to: data.address,
        headers: new Headers(),
        raw: new Response(raw).body!,
        rawSize: new TextEncoder().encode(raw).length,
        setReject: (reason: string) => {
          rejected = reason;
        },
        forward: async () => {},
        reply: async () => {},
      },
      bindings,
      ctx,
    );
    await waitOnExecutionContext(ctx);
    expect(rejected).toBe("");
    expect(
      await bindings.DB.prepare("SELECT subject FROM emails WHERE message_to=?")
        .bind(data.address)
        .first(),
    ).toEqual({ subject: "Recovery receipt" });
    await bindings.DB.prepare(
      "UPDATE emails SET created_at=unixepoch()-172800 WHERE message_to=?",
    )
      .bind(data.address)
      .run();
    const scheduledCtx = createExecutionContext();
    await worker.scheduled(
      { scheduledTime: Date.now(), cron: "0 * * * *", noRetry() {} },
      bindings,
      scheduledCtx,
    );
    await waitOnExecutionContext(scheduledCtx);
    expect(
      await bindings.DB.prepare("SELECT id FROM emails WHERE message_to=?")
        .bind(data.address)
        .first(),
    ).toBeNull();
    expect((await recoverMailbox(bindings, data)).code).toBe("RECOVERED");
    expect(
      await bindings.DB.prepare("SELECT id FROM emails WHERE message_to=?")
        .bind(data.address)
        .first(),
    ).toBeNull();
  });
  it("imports 38 approved addresses under the default 100-slot cap", async () => {
    const owner = await user();
    for (let i = 0; i < 38; i++) {
      expect((await recoverMailbox(bindings, input(owner.id))).code).toBe(
        "RECOVERED",
      );
    }
    expect(
      await bindings.DB.prepare(
        "SELECT COUNT(*) AS n FROM mailboxes WHERE user_id=? AND expires_at>unixepoch()",
      )
        .bind(owner.id)
        .first(),
    ).toEqual({ n: 38 });
  });
  it("preserves legacy record identity but does not preserve a longer legacy lifetime", async () => {
    const owner = await user(),
      data = input(owner.id),
      id = crypto.randomUUID();
    await bindings.DB.prepare(
      "INSERT INTO mailboxes (id,address,domain,api_key_id,created_at,updated_at,expires_at) VALUES (?,?,'example.test','legacy',1,1,?)",
    )
      .bind(id, data.address, Math.floor(Date.now() / 1000) + 7 * 86400)
      .run();
    const result = await recoverMailbox(bindings, data);
    expect(result.code).toBe("RECOVERED");
    expect(result.id).toBe(id);
    expect(result.expiresAt! - Date.now()).toBeLessThanOrEqual(86400_000);
    expect(
      await bindings.DB.prepare(
        "SELECT created_at,api_key_id FROM mailboxes WHERE id=?",
      )
        .bind(id)
        .first(),
    ).toEqual({ created_at: 1, api_key_id: "legacy" });
  });
  it("refuses case-insensitive address collisions rather than creating a duplicate", async () => {
    const owner = await user(),
      data = input(owner.id);
    await bindings.DB.prepare(
      "INSERT INTO mailboxes (id,address,domain,api_key_id,created_at,updated_at) VALUES (?,?,'example.test','legacy',1,1)",
    )
      .bind(crypto.randomUUID(), data.address.toUpperCase())
      .run();
    expect((await recoverMailbox(bindings, data)).code).toBe(
      "ADDRESS_CASE_CONFLICT",
    );
  });
  it("rate limits self-service recovery independently of creation", async () => {
    const owner = await user(),
      data = input(owner.id);
    const box = await recoverMailbox(bindings, data);
    await expire(data.address);
    const ledger = bindings.ACCESS.getByName("user:" + owner.id);
    for (let i = 0; i < 10; i++)
      await ledger.consume([
        { key: "reactivate-minute", max: 10, seconds: 60 },
      ]);
    expect(
      (
        await request("/mailboxes/" + box.id + "/reactivate", {
          method: "POST",
          headers: owner.headers,
        })
      ).status,
    ).toBe(429);
    expect(
      await bindings.ACCESS.getByName(
        "mailbox:" + data.address,
      ).mailboxActive(),
    ).toBe(false);
  });
  it("previews without binding, then imports missing legacy rows with an audit record", async () => {
    const owner = await user();
    const data = input(owner.id);
    expect(
      (await recoverMailbox(bindings, { ...data, dryRun: true })).code,
    ).toBe("READY");
    expect(
      await bindings.DB.prepare("SELECT id FROM mailboxes WHERE address=?")
        .bind(data.address)
        .first(),
    ).toBeNull();
    expect(
      (
        await bindings.ACCESS.getByName(
          "mailbox:" + data.address,
        ).mailboxState()
      ).owner,
    ).toBe("");
    const result = await recoverMailbox(bindings, data);
    expect(result.code).toBe("RECOVERED");
    expect(result.expiresAt! - Date.now()).toBeGreaterThan(86390_000);
    expect(result.expiresAt! - Date.now()).toBeLessThanOrEqual(86400_000);
    expect(
      await bindings.DB.prepare("SELECT user_id FROM mailboxes WHERE id=?")
        .bind(result.id)
        .first(),
    ).toEqual({ user_id: owner.id });
    expect(
      (
        await bindings.ACCESS.getByName(
          "mailbox:" + data.address,
        ).mailboxState()
      ).owner,
    ).toBe(owner.id);
    expect(
      await bindings.ACCESS.getByName("mailbox:" + data.address).acceptMail(
        100,
      ),
    ).toBe(true);
    expect(
      await bindings.DB.prepare(
        "SELECT status,action FROM mailbox_recovery_logs WHERE address=?",
      )
        .bind(data.address)
        .first(),
    ).toEqual({ status: "completed", action: "admin_import" });
    const retry = await recoverMailbox(bindings, data);
    expect(retry.id).toBe(result.id);
    expect(retry.expiresAt).toBe(result.expiresAt);
  });
  it("enforces admin role, same-origin checks and explicit ownership confirmation", async () => {
    const admin = await user("admin"),
      owner = await user();
    const path = "/admin/users/" + owner.id + "/mailboxes/recover";
    const body = JSON.stringify({
      addresses: [address()],
      reason: "Verified support request",
      ownershipConfirmed: true,
    });
    expect(
      (
        await request(path, {
          method: "POST",
          headers: { Origin: admin.headers.Origin },
          body,
        })
      ).status,
    ).toBe(401);
    expect(
      (await request(path, { method: "POST", headers: owner.headers, body }))
        .status,
    ).toBe(403);
    expect(
      (
        await request(path, {
          method: "POST",
          headers: { ...admin.headers, Origin: "https://elsewhere.test" },
          body,
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(path, {
          method: "POST",
          headers: admin.headers,
          body: "{}",
        })
      ).status,
    ).toBe(400);
    const preview = await request(path, {
      method: "POST",
      headers: admin.headers,
      body,
    });
    expect(preview.status).toBe(200);
    expect((await preview.json<{ dryRun: boolean }>()).dryRun).toBe(true);
    const imported = await request(path, {
      method: "POST",
      headers: admin.headers,
      body: JSON.stringify({ ...JSON.parse(body), dryRun: false }),
    });
    expect(
      (await imported.json<{ results: { code: string }[] }>()).results[0].code,
    ).toBe("RECOVERED");
    expect(
      (
        await request("/admin/users/" + owner.id + "/mailbox-recoveries", {
          headers: admin.headers,
        })
      ).status,
    ).toBe(200);
  });
  it("allows expired owned mailboxes to reactivate without an old token but rejects other accounts", async () => {
    const owner = await user(),
      other = await user();
    const data = input(owner.id),
      recovered = await recoverMailbox(bindings, data);
    await expire(data.address);
    const path = "/mailboxes/" + recovered.id;
    expect(
      (await request(path + "/messages", { headers: owner.headers })).status,
    ).toBe(404);
    expect(
      (
        await request(path + "/reactivate", {
          method: "POST",
          headers: other.headers,
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await request(path + "/reactivate", {
          method: "POST",
          headers: { Origin: owner.headers.Origin },
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await request(path + "/reactivate", {
          method: "POST",
          headers: { ...owner.headers, Origin: "https://elsewhere.test" },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(path + "/reactivate", {
          method: "POST",
          headers: owner.headers,
        })
      ).status,
    ).toBe(200);
    expect(
      (await request(path + "/messages", { headers: owner.headers })).status,
    ).toBe(200);
    expect(
      await bindings.ACCESS.getByName("mailbox:" + data.address).acceptMail(
        100,
      ),
    ).toBe(true);
  });
  it("does not claim anonymous rows through the self-service endpoint", async () => {
    const owner = await user();
    const data = input(owner.id);
    const recovered = await recoverMailbox(bindings, data);
    await bindings.DB.prepare("UPDATE mailboxes SET user_id=NULL WHERE id=?")
      .bind(recovered.id)
      .run();
    expect(
      (
        await request("/mailboxes/" + recovered.id + "/reactivate", {
          method: "POST",
          headers: owner.headers,
        })
      ).status,
    ).toBe(404);
  });
  it("requires the owning session even if an old signed bearer token has not expired", async () => {
    const owner = await user(),
      other = await user(),
      data = input(owner.id);
    const token = await createMailboxToken(
      data.address,
      bindings.MAILBOX_TOKEN_SECRET!,
    );
    await recoverMailbox(bindings, data);
    for (const cookie of [
      undefined,
      other.headers.Cookie,
      owner.headers.Cookie,
    ]) {
      const ctx = createExecutionContext();
      const response = await worker.fetch(
        new Request("http://localhost:8787/api/emails/meta", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
            ...(cookie ? { Cookie: cookie } : {}),
          },
        }),
        bindings,
        ctx,
      );
      await waitOnExecutionContext(ctx);
      expect(response.status).toBe(cookie === owner.headers.Cookie ? 200 : 401);
      const loginCtx = createExecutionContext();
      const login = await worker.fetch(
        new Request("http://localhost:8787/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(cookie ? { Cookie: cookie } : {}),
          },
          body: JSON.stringify({ password: token }),
        }),
        bindings,
        loginCtx,
      );
      await waitOnExecutionContext(loginCtx);
      expect(login.status).toBe(cookie === owner.headers.Cookie ? 200 : 401);
    }
  });
  it("refuses conflicts from either D1 or DO, including expired addresses", async () => {
    const a = await user(),
      b = await user();
    const first = input(a.id);
    await recoverMailbox(bindings, first);
    await expire(first.address);
    expect(
      (await recoverMailbox(bindings, input(b.id, first.address))).code,
    ).toBe("OWNERSHIP_CONFLICT");
    await bindings.DB.prepare("DELETE FROM mailboxes WHERE address=?")
      .bind(first.address)
      .run();
    expect(
      (await recoverMailbox(bindings, input(b.id, first.address))).code,
    ).toBe("OWNERSHIP_CONFLICT");
    const second = input(a.id);
    await recoverMailbox(bindings, second);
    await runInDurableObject(
      bindings.ACCESS.getByName("mailbox:" + second.address),
      (_, state) => {
        state.storage.kv.delete("owner");
        state.storage.kv.delete("mailboxExpiry");
      },
    );
    expect(
      (await recoverMailbox(bindings, input(b.id, second.address))).code,
    ).toBe("OWNERSHIP_CONFLICT");
  });
  it("does not take over active anonymous mailboxes", async () => {
    const owner = await user();
    const data = input(owner.id);
    await bindings.ACCESS.getByName("mailbox:" + data.address).activateMailbox(
      Date.now() + 60000,
    );
    expect((await recoverMailbox(bindings, data)).code).toBe(
      "OWNERSHIP_CONFLICT",
    );
  });
  it("rejects banned accounts, unverified accounts and disabled domains", async () => {
    const owner = await user();
    const data = input(owner.id);
    expect(
      (
        await recoverMailbox(bindings, {
          ...data,
          address: "test@disabled.test",
        })
      ).code,
    ).toBe("INVALID_ADDRESS");
    await bindings.DB.prepare("UPDATE auth_user SET banned=1 WHERE id=?")
      .bind(owner.id)
      .run();
    expect((await recoverMailbox(bindings, data)).code).toBe("ACCOUNT_BANNED");
    await bindings.DB.prepare(
      "UPDATE auth_user SET banned=0,email_verified=0 WHERE id=?",
    )
      .bind(owner.id)
      .run();
    expect((await recoverMailbox(bindings, data)).code).toBe(
      "ACCOUNT_NOT_VERIFIED",
    );
    expect(
      (
        await recoverMailbox(
          { ...bindings, SUSPEND_DATABASE_ACCESS: "true" },
          data,
        )
      ).code,
    ).toBe("SERVICE_PAUSED");
  });
  it("enforces the configured active capacity without consuming the new-mailbox daily quota", async () => {
    const owner = await user();
    const limited = { ...bindings, MAX_ACTIVE_MAILBOXES: "1" };
    const first = input(owner.id);
    expect((await recoverMailbox(limited, first)).code).toBe("RECOVERED");
    expect((await recoverMailbox(limited, input(owner.id))).code).toBe(
      "MAILBOX_LIMIT",
    );
    expect((await recoverMailbox(limited, first)).code).toBe("RECOVERED");
    expect(
      (
        await bindings.ACCESS.getByName("user:" + owner.id).quota({
          key: "create-day",
          max: 20,
          seconds: 86400,
        })
      ).used,
    ).toBe(0);
  });
  it("defaults to 100 concurrent active slots and protects reservation ownership", async () => {
    expect(DEFAULT_MAX_ACTIVE_MAILBOXES).toBe(100);
    const ledger = bindings.ACCESS.getByName("user:" + crypto.randomUUID());
    const results = await Promise.all(
      Array.from({ length: 105 }, (_, i) =>
        ledger.reserveMailbox(
          String(i),
          Date.now() + 60000,
          DEFAULT_MAX_ACTIVE_MAILBOXES,
          "first",
        ),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(100);
    await ledger.releaseMailbox("0", "other-attempt");
    expect(await ledger.reserveMailbox("new", Date.now() + 60000, 100)).toBe(
      false,
    );
    await ledger.releaseMailbox("0", "first");
    expect(await ledger.reserveMailbox("new", Date.now() + 60000, 100)).toBe(
      true,
    );
  });
  it("serializes competing recovery attempts without reassigning ownership", async () => {
    const a = await user(),
      b = await user(),
      email = address();
    const results = await Promise.all([
      recoverMailbox(bindings, input(a.id, email)),
      recoverMailbox(bindings, input(b.id, email)),
    ]);
    expect(results.filter((r) => r.code === "RECOVERED")).toHaveLength(1);
    const row = await bindings.DB.prepare(
      "SELECT user_id FROM mailboxes WHERE address=?",
    )
      .bind(email)
      .first<{ user_id: string }>();
    expect(
      await bindings.ACCESS.getByName("mailbox:" + email).mailboxOwner(),
    ).toBe(row!.user_id);
  });
  it("keeps a failed D1 import inactive and safely retries it without consuming another slot", async () => {
    const owner = await user(),
      data = input(owner.id),
      trigger = "fail_" + owner.id.replaceAll("-", "");
    await bindings.DB.exec(
      `CREATE TRIGGER ${trigger} BEFORE INSERT ON mailboxes WHEN NEW.address='${data.address}' BEGIN SELECT RAISE(ABORT, 'test failure'); END;`,
    );
    const limited = { ...bindings, MAX_ACTIVE_MAILBOXES: "1" };
    try {
      expect((await recoverMailbox(limited, data)).code).toBe("RETRY_REQUIRED");
      expect(
        await bindings.ACCESS.getByName(
          "mailbox:" + data.address,
        ).mailboxActive(),
      ).toBe(false);
    } finally {
      await bindings.DB.exec(`DROP TRIGGER ${trigger};`);
    }
    expect((await recoverMailbox(limited, data)).code).toBe("RECOVERED");
  });
  it("does not extend or replace a mailbox during a recovery lease", async () => {
    const ledger = bindings.ACCESS.getByName("mailbox:" + address());
    const pending = await ledger.beginMailboxRecovery("owner", true);
    expect(pending.code).toBe("READY");
    expect(
      await ledger.activateMailbox(Date.now() + 60000, false, "other"),
    ).toBe(false);
    expect((await ledger.beginMailboxRecovery("other", true)).code).toBe(
      "RECOVERY_BUSY",
    );
    expect(
      await ledger.finishMailboxRecovery("wrong-operation", Date.now() + 60000),
    ).toBe(false);
    if (pending.code === "READY")
      expect(
        await ledger.finishMailboxRecovery(
          pending.operationId,
          Date.now() + 60000,
        ),
      ).toBe(true);
    expect(await ledger.mailboxOwner()).toBe("owner");
  });
});
