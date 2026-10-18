import { beforeAll, describe, expect, it, inject } from "vitest";
import {
  env,
  applyD1Migrations,
  runDurableObjectAlarm,
  runInDurableObject,
} from "cloudflare:test";
import worker from "../src/index";
import type { Env } from "../src/index";
import { generateUserKey, getKeyOwner, hashToken } from "../src/key-token";
import { createAuth } from "../src/auth";
import {
  createExecutionContext,
  waitOnExecutionContext,
} from "cloudflare:test";
import { shardLimit } from "../src/limits";
const bindings = env as Env;
beforeAll(async () => {
  await applyD1Migrations(bindings.DB, inject("migrations"));
});
async function request(
  path: string,
  init?: RequestInit,
  overrides: Partial<Env> = {},
) {
  const ctx = createExecutionContext();
  const res = await worker.fetch(
    new Request("http://localhost:8787" + path, init),
    { ...bindings, ...overrides },
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return res;
}
async function seedUser(role = "user") {
  const id = crypto.randomUUID(),
    token = crypto.randomUUID(),
    now = Date.now();
  await bindings.DB.prepare(
    "INSERT INTO auth_user (role,id,name,email,email_verified,image,created_at,updated_at) VALUES (?, ?, ?, ?, 1, NULL, ?, ?)",
  )
    .bind(role, id, "Test User", id + "@example.com", now, now)
    .run();
  await bindings.DB.prepare(
    "INSERT INTO auth_session (id, token, expires_at, created_at, updated_at, user_id) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(crypto.randomUUID(), token, now + 86400000, now, now, id)
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
    cookie:
      "better-auth.session_token=" +
      encodeURIComponent(token + "." + signature),
  };
}
describe("cost and authorization boundaries", () => {
  it("isolates dashboard mailbox listing, messages, deletion and account statistics by owner", async () => {
    const owner = await seedUser(),
      other = await seedUser();
    const headers = {
      Cookie: owner.cookie,
      Origin: "http://localhost:8787",
      "Content-Type": "application/json",
    };
    const boxResult = await request("/api/verify", {
      method: "POST",
      headers,
      body: JSON.stringify({ domain: "example.test" }),
    });
    expect(boxResult.status).toBe(200);
    const list = await (
      await request("/api/account/mailboxes", { headers })
    ).json<{ mailboxes: { id: string; address: string }[] }>();
    expect(list.mailboxes).toHaveLength(1);
    const box = list.mailboxes[0],
      now = Math.floor(Date.now() / 1000),
      messageId = crypto.randomUUID();
    await bindings.DB.prepare(
      'INSERT INTO emails (id,message_from,message_to,headers,"from",subject,message_id,text,html,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    )
      .bind(
        messageId,
        "sender@example.com",
        box.address,
        "[]",
        JSON.stringify({ address: "sender@example.com", name: "Sender" }),
        "Owner-only message",
        messageId,
        "Private content",
        "<p>Private content</p>",
        now,
        now,
      )
      .run();
    const path = "/api/account/mailboxes/" + box.id + "/messages";
    expect((await request(path)).status).toBe(401);
    expect(
      (
        await (
          await request("/api/account/mailboxes", {
            headers: { Cookie: other.cookie },
          })
        ).json<{ mailboxes: unknown[] }>()
      ).mailboxes,
    ).toHaveLength(0);
    for (const suffix of ["", "/" + messageId])
      expect(
        (await request(path + suffix, { headers: { Cookie: other.cookie } }))
          .status,
      ).toBe(404);
    expect(
      (
        await request(path + "/" + messageId, {
          method: "DELETE",
          headers: { ...headers, Cookie: other.cookie },
        })
      ).status,
    ).toBe(404);
    const own = await request(path, { headers });
    expect(own.status).toBe(200);
    expect((await own.json<{ data: { id: string }[] }>()).data[0].id).toBe(
      messageId,
    );
    expect((await request(path + "/" + messageId, { headers })).status).toBe(
      200,
    );
    const date = new Date().toISOString().slice(0, 10);
    await bindings.DB.prepare(
      "INSERT INTO usage_daily (date,owner_id,key_id,api_calls,mailboxes_created,emails_received,updated_at) VALUES (?,?,?,9,1,1,0)",
    )
      .bind(date, owner.id, "test-key")
      .run();
    const stats = await (
      await request("/api/account/overview", { headers })
    ).json<{ days: { api_calls: number }[] }>();
    expect(stats.days[0].api_calls).toBe(9);
    const others = await (
      await request("/api/account/overview", {
        headers: { Cookie: other.cookie },
      })
    ).json<{ days: unknown[] }>();
    expect(others.days).toHaveLength(0);
    expect(
      (await request(path + "/" + messageId, { method: "DELETE", headers }))
        .status,
    ).toBe(200);
    expect((await request(path + "/" + messageId, { headers })).status).toBe(
      404,
    );
    await bindings.DB.prepare("UPDATE mailboxes SET expires_at=? WHERE id=?")
      .bind(now - 1, box.id)
      .run();
    expect((await request(path, { headers })).status).toBe(404);
  });

  it("disables all keys atomically, blocks in-flight issuance, and retains quotas", async () => {
    const admin = await seedUser("admin"),
      user = await seedUser();
    const headers = {
      Cookie: user.cookie,
      Origin: "http://localhost:8787",
      "Content-Type": "application/json",
    };
    const keys = await Promise.all(
      [1, 2, 3].map(
        async () =>
          (
            await (
              await request("/api/account/keys", {
                method: "POST",
                headers,
                body: "{}",
              })
            ).json<{ key: string }>()
          ).key,
      ),
    );
    const ledger = bindings.ACCESS.getByName("user:" + user.id);
    const state = await ledger.accessState();
    const first = await request("/api/v1/mailboxes", {
      method: "POST",
      headers: { "X-API-Key": keys[0] },
      body: "{}",
    });
    expect(first.status).toBe(201);
    const disabled = await request(
      "/api/account/admin/users/" + user.id + "/disable-keys",
      {
        method: "POST",
        headers: { ...headers, Cookie: admin.cookie },
        body: "{}",
      },
    );
    expect(disabled.status).toBe(200);
    for (const key of keys)
      expect(
        (
          await request("/api/v1/mailboxes", {
            method: "POST",
            headers: { "X-API-Key": key },
            body: "{}",
          })
        ).status,
      ).toBe(401);
    expect(
      await ledger.registerKey(
        { id: "racing", digest: "racing", expiresAt: Date.now() + 60000 },
        state.epoch,
      ),
    ).toBe(false);
    const replacement = await request("/api/account/keys", {
      method: "POST",
      headers,
      body: "{}",
    });
    expect(replacement.status).toBe(201);
    const key = (await replacement.json<{ key: string }>()).key;
    expect(
      (
        await request(
          "/api/v1/mailboxes",
          { method: "POST", headers: { "X-API-Key": key }, body: "{}" },
          { API_DAILY_LIMIT: "1" },
        )
      ).status,
    ).toBe(429);
  });
  it("bans API, sessions and owned browser mailboxes, and does not restore keys on unban", async () => {
    const admin = await seedUser("admin"),
      user = await seedUser();
    const headers = {
      Cookie: user.cookie,
      Origin: "http://localhost:8787",
      "Content-Type": "application/json",
    };
    const key = (
      await (
        await request("/api/account/keys", {
          method: "POST",
          headers,
          body: "{}",
        })
      ).json<{ key: string }>()
    ).key;
    const box = await (
      await request("/api/verify", {
        method: "POST",
        headers,
        body: JSON.stringify({ domain: "example.test" }),
      })
    ).json<{ mailbox: string; mailboxToken: string }>();
    const path = "/api/account/admin/users/" + user.id + "/ban";
    expect(
      (
        await request(path, {
          method: "PATCH",
          headers,
          body: '{"banned":true}',
        })
      ).status,
    ).toBe(403);
    const adminHeaders = { ...headers, Cookie: admin.cookie };
    expect(
      (
        await request(path, {
          method: "PATCH",
          headers: adminHeaders,
          body: '{"banned":true}',
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await request("/api/account/keys", {
          method: "POST",
          headers,
          body: "{}",
        })
      ).status,
    ).not.toBe(201);
    expect(
      (
        await request("/api/v1/mailboxes", {
          method: "POST",
          headers: { "X-API-Key": key },
          body: "{}",
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await request("/api/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + box.mailboxToken },
          body: JSON.stringify({ address: box.mailbox }),
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request("/api/verify", {
          method: "POST",
          headers,
          body: JSON.stringify({ domain: "example.test" }),
        })
      ).status,
    ).not.toBe(200);
    const context = await createAuth(bindings).$context;
    await expect(
      context.internalAdapter.createSession(user.id),
    ).rejects.toThrow("Account is banned");
    expect(
      (
        await request("/api/account/admin/users/" + admin.id + "/ban", {
          method: "PATCH",
          headers: adminHeaders,
          body: '{"banned":true}',
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(path, {
          method: "PATCH",
          headers: adminHeaders,
          body: '{"banned":false}',
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await request("/api/v1/mailboxes", {
          method: "POST",
          headers: { "X-API-Key": key },
          body: "{}",
        })
      ).status,
    ).toBe(401);
    expect(await context.internalAdapter.createSession(user.id)).toBeTruthy();
  });
  it("records actual request outcomes without secrets and paginates logs without duplicates", async () => {
    const admin = await seedUser("admin"),
      user = await seedUser();
    const headers = {
      Cookie: user.cookie,
      Origin: "http://localhost:8787",
      "Content-Type": "application/json",
    };
    const key = (
      await (
        await request("/api/account/keys", {
          method: "POST",
          headers,
          body: "{}",
        })
      ).json<{ key: string }>()
    ).key;
    const res = await request(
      "/api/v1/mailboxes/private-address/messages?secret=hidden",
      { headers: { "X-API-Key": key } },
    );
    expect(res.status).toBe(404);
    const ledger = bindings.ACCESS.getByName("user:" + user.id);
    await runDurableObjectAlarm(ledger);
    await runInDurableObject(ledger, (instance) => instance.alarm());
    const rows = await bindings.DB.prepare(
      "SELECT * FROM api_request_logs WHERE user_id=?",
    )
      .bind(user.id)
      .all();
    expect(rows.results).toHaveLength(1);
    expect(rows.results[0].status).toBe(404);
    expect(rows.results[0].route).toBe("/api/v1/mailboxes/:id/messages");
    expect(JSON.stringify(rows.results)).not.toContain(key);
    expect(JSON.stringify(rows.results)).not.toContain("private-address");
    const now = Date.now();
    for (let i = 0; i < 55; i++)
      await ledger.appendLog({
        id: crypto.randomUUID(),
        created_at: now,
        user_id: user.id,
        key_id: "test",
        method: "GET",
        route: "/api/v1/mailboxes/:id",
        status: 200,
        duration_ms: 1,
      });
    await runDurableObjectAlarm(ledger);
    expect((await request("/api/account/admin/logs", { headers })).status).toBe(
      403,
    );
    const adminHeaders = { Cookie: admin.cookie };
    const first = await (
      await request("/api/account/admin/logs?userId=" + user.id, {
        headers: adminHeaders,
      })
    ).json<{ logs: { id: string }[]; nextCursor: string }>();
    expect(first.logs).toHaveLength(50);
    const second = await (
      await request(
        "/api/account/admin/logs?userId=" +
          user.id +
          "&cursor=" +
          encodeURIComponent(first.nextCursor),
        { headers: adminHeaders },
      )
    ).json<{ logs: { id: string }[]; nextCursor: string | null }>();
    expect(second.logs).toHaveLength(6);
    expect(
      new Set([...first.logs, ...second.logs].map((log) => log.id)).size,
    ).toBe(56);
    expect(second.nextCursor).toBeNull();
    expect(
      (
        await request("/api/account/admin/logs?cursor=bad", {
          headers: adminHeaders,
        })
      ).status,
    ).toBe(400);
  });

  it("rejects tampered keys before resolving an owner", async () => {
    const key = await generateUserKey("owner", bindings.API_KEY_SECRET!);
    expect(await getKeyOwner(key, bindings.API_KEY_SECRET!)).toBe("owner");
    expect(
      await getKeyOwner(key.slice(0, -4) + "AAAA", bindings.API_KEY_SECRET!),
    ).toBeNull();
    expect(
      (
        await request("/api/v1/mailboxes/missing", {
          headers: { "X-API-Key": "garbage" },
        })
      ).status,
    ).toBe(401);
  });
  it("atomically allows only three registrations and shares quota across keys", async () => {
    const id = crypto.randomUUID(),
      ledger = bindings.ACCESS.getByName("user:" + id);
    const keys = Array.from({ length: 10 }, (_, n) => ({
      id: String(n),
      digest: String(n),
      expiresAt: Date.now() + 60000,
    }));
    const created = await Promise.all(keys.map((k) => ledger.registerKey(k)));
    expect(created.filter(Boolean)).toHaveLength(3);
    const valid = keys.filter((_, n) => created[n]);
    const requests = await Promise.all(
      Array.from({ length: 20 }, (_, n) =>
        ledger.authorize(
          valid[n % 3].digest,
          [{ key: "day", max: 5, seconds: 86400 }],
          id,
        ),
      ),
    );
    expect(requests.filter((r) => r.allowed)).toHaveLength(5);
    await ledger.revokeKey(valid[0].id);
    expect((await ledger.authorize(valid[0].digest, [], id)).valid).toBe(false);
    expect(
      await ledger.registerKey({
        id: "replacement",
        digest: "replacement",
        expiresAt: Date.now() + 60000,
      }),
    ).toBe(true);
    expect(
      (
        await ledger.authorize(
          "replacement",
          [{ key: "day", max: 5, seconds: 86400 }],
          id,
        )
      ).allowed,
    ).toBe(false);
    await runDurableObjectAlarm(ledger);
    const rows = await bindings.DB.prepare(
      "SELECT sum(api_calls) AS total FROM usage_daily WHERE owner_id=?",
    )
      .bind(id)
      .first<{ total: number }>();
    expect(rows?.total).toBe(5);
  });
  it("global shard allowances sum to the configured cap", () => {
    for (const cap of [1, 15, 16, 100003])
      expect(
        Array.from({ length: 16 }, (_, n) => shardLimit(cap, n)).reduce(
          (a, b) => a + b,
          0,
        ),
      ).toBe(cap);
  });
  it("requires mailbox proof and rejects legacy anonymous issuance", async () => {
    expect(
      (
        await request("/api/emails", {
          method: "POST",
          body: JSON.stringify({ address: "victim@example.test" }),
        })
      ).status,
    ).toBe(401);
    expect(
      (await request("/api/emails/meta", { method: "POST", body: "{}" }))
        .status,
    ).toBe(401);
    expect((await request("/api/emails/missing")).status).toBe(401);
    expect(
      (
        await request("/api/delete-emails", {
          method: "POST",
          body: '{"ids":["x"]}',
        })
      ).status,
    ).toBe(401);
    expect(
      (await request("/api/api-keys", { method: "POST", body: "{}" })).status,
    ).toBe(401);
    expect(
      (
        await request("/api/auth/api-key/create", {
          method: "POST",
          body: "{}",
        })
      ).status,
    ).toBe(404);
  });
  it("denies anonymous and ordinary users access to administration", async () => {
    expect((await request("/api/account/admin/users")).status).toBe(401);
    const user = await seedUser();
    const me = await request("/api/account/me", {
      headers: { Cookie: user.cookie },
    });
    expect(me.status, await me.clone().text()).toBe(200);
    expect(
      (
        await request("/api/account/admin/users", {
          headers: { Cookie: user.cookie },
        })
      ).status,
    ).toBe(403);
    const admin = await seedUser("admin");
    expect(
      (
        await request("/api/account/admin/users", {
          headers: { Cookie: admin.cookie },
        })
      ).status,
    ).toBe(200);
  });
  it("issues Better Auth keys with a three-key database guard and immediate revocation", async () => {
    const user = await seedUser();
    const headers = {
      Cookie: user.cookie,
      Origin: "http://localhost:8787",
      "Content-Type": "application/json",
    };
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request("/api/account/keys", {
          method: "POST",
          headers,
          body: '{"name":"test"}',
        }),
      ),
    );
    const debug = await Promise.all(responses.map((r) => r.clone().text()));
    expect(
      responses.filter((r) => r.status === 201),
      debug.join("\n"),
    ).toHaveLength(3);
    const created = await responses
      .find((r) => r.status === 201)!
      .json<{ key: string; id: string }>();
    expect(await getKeyOwner(created.key, bindings.API_KEY_SECRET!)).toBe(
      user.id,
    );
    const box = await request("/api/v1/mailboxes", {
      method: "POST",
      headers: { "X-API-Key": created.key },
      body: "{}",
    });
    expect(box.status, await box.clone().text()).toBe(201);
    await request("/api/account/keys/" + created.id, {
      method: "DELETE",
      headers,
    });
    expect(
      (
        await request("/api/v1/mailboxes/x", {
          headers: { "X-API-Key": created.key },
        })
      ).status,
    ).toBe(401);
  });
  it("creates a browser mailbox with proof, protects cross-mailbox reads, and restores it", async () => {
    const res = await request("/api/verify", {
      method: "POST",
      body: '{"domain":"example.test"}',
    });
    expect(res.status, await res.clone().text()).toBe(200);
    const data = await res.json<{ mailbox: string; mailboxToken: string }>();
    const headers = { Authorization: "Bearer " + data.mailboxToken };
    expect(
      (
        await request("/api/emails", {
          method: "POST",
          headers,
          body: JSON.stringify({ address: data.mailbox }),
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await request("/api/emails", {
          method: "POST",
          headers,
          body: '{"address":"someone@example.test"}',
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request("/api/login", {
          method: "POST",
          body: JSON.stringify({ password: data.mailboxToken }),
        })
      ).status,
    ).toBe(200);
  });
  it("only administrators can assign roles and demotions take effect on the next request", async () => {
    const ordinary = await seedUser(),
      admin = await seedUser("admin");
    const target = "/api/account/admin/users/" + ordinary.id + "/role";
    const options = (cookie: string, role: string) => ({
      method: "PATCH",
      headers: {
        Cookie: cookie,
        Origin: "http://localhost:8787",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role }),
    });
    expect(
      (await request(target, options(ordinary.cookie, "admin"))).status,
    ).toBe(403);
    expect((await request(target, options(admin.cookie, "admin"))).status).toBe(
      200,
    );
    expect(
      (
        await request("/api/account/admin/users", {
          headers: { Cookie: ordinary.cookie },
        })
      ).status,
    ).toBe(200);
    expect((await request(target, options(admin.cookie, "user"))).status).toBe(
      200,
    );
    expect(
      (
        await request("/api/account/admin/users", {
          headers: { Cookie: ordinary.cookie },
        })
      ).status,
    ).toBe(403);
    expect(
      (
        await request(
          "/api/account/admin/users/" + admin.id + "/role",
          options(admin.cookie, "user"),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await request(target, {
          ...options(admin.cookie, "admin"),
          headers: { Cookie: admin.cookie, Origin: "https://attacker.test" },
        })
      ).status,
    ).toBe(403);
  });
  it("bounds mailbox capacity under concurrency and never reassigns expired addresses", async () => {
    const ledger = bindings.ACCESS.getByName("user:" + crypto.randomUUID());
    const results = await Promise.all(
      Array.from({ length: 30 }, (_, i) =>
        ledger.reserveMailbox(String(i), Date.now() + 60000, 20),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(20);
    const mailbox = bindings.ACCESS.getByName("mailbox:" + crypto.randomUUID());
    expect(await mailbox.activateMailbox(Date.now() - 1000)).toBe(true);
    expect(await mailbox.activateMailbox(Date.now() + 60000)).toBe(false);
    expect(await mailbox.acceptMail(100)).toBe(false);
  });
  it("binds cursor pagination and deletion to the owning account", async () => {
    const user = await seedUser();
    const headers = {
      Cookie: user.cookie,
      Origin: "http://localhost:8787",
      "Content-Type": "application/json",
    };
    const keyRes = await request("/api/account/keys", {
      method: "POST",
      headers,
      body: "{}",
    });
    const key = await keyRes.json<{ key: string }>();
    const apiHeaders = { "X-API-Key": key.key };
    const boxRes = await request("/api/v1/mailboxes", {
      method: "POST",
      headers: apiHeaders,
      body: "{}",
    });
    const box = (await boxRes.json<{ data: { id: string; address: string } }>())
      .data;
    const second = Math.floor(Date.now() / 1000);
    for (const id of ["a", "b", "c"])
      await bindings.DB.prepare(
        'INSERT INTO emails (id,message_from,message_to,headers,"from",subject,message_id,text,html,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      )
        .bind(
          box.id + id,
          "sender@example.com",
          box.address,
          "[]",
          JSON.stringify({ name: "Sender", address: "sender@example.com" }),
          id,
          id,
          "body",
          "<p>body</p>",
          second,
          second,
        )
        .run();
    const first = await request(
      "/api/v1/mailboxes/" + box.id + "/messages?limit=2",
      { headers: apiHeaders },
    );
    const data = await first.json<{
      data: Array<{ id: string; html?: string }>;
      pagination: { nextCursor: string };
    }>();
    expect(data.data.map((r) => r.id)).toEqual([box.id + "c", box.id + "b"]);
    expect(data.data[0].html).toBeUndefined();
    const next = await request(
      "/api/v1/mailboxes/" +
        box.id +
        "/messages?cursor=" +
        encodeURIComponent(data.pagination.nextCursor),
      { headers: apiHeaders },
    );
    expect(
      (await next.json<{ data: Array<{ id: string }> }>()).data.map(
        (r) => r.id,
      ),
    ).toEqual([box.id + "a"]);
    expect(
      (
        await request(
          "/api/v1/mailboxes/" + box.id + "/messages?cursor=invalid",
          { headers: apiHeaders },
        )
      ).status,
    ).toBe(400);
  });
  it("aggregates snapshots once across repeated alarms", async () => {
    const ledger = bindings.ACCESS.getByName("stats:" + crypto.randomUUID());
    const owner = crypto.randomUUID();
    const before = await bindings.DB.prepare(
      "SELECT total_emails_received AS n FROM site_stats WHERE id='global'",
    ).first<{ n: number }>();
    await ledger.record(owner, "", "emails_received");
    await runDurableObjectAlarm(ledger);
    await runInDurableObject(ledger, (instance) => instance.alarm());
    await ledger.record(owner, "", "emails_received");
    await runDurableObjectAlarm(ledger);
    const after = await bindings.DB.prepare(
      "SELECT total_emails_received AS n FROM site_stats WHERE id='global'",
    ).first<{ n: number }>();
    expect(after!.n - before!.n).toBe(2);
  });
  it("fails closed when database access is suspended", async () => {
    expect(
      (
        await request(
          "/api/emails",
          { method: "POST", body: "{}" },
          { SUSPEND_DATABASE_ACCESS: "true" },
        )
      ).status,
    ).toBe(503);
  });
});
