import { beforeAll, describe, expect, inject, it } from "vitest";
import {
  applyD1Migrations,
  createExecutionContext,
  env,
  waitOnExecutionContext,
} from "cloudflare:test";
import worker, { type Env } from "../src/index";
import type { AdminOverview, PageInfo } from "../../shared/admin";

const bindings = env as Env;
const day = 86400_000;
beforeAll(async () => {
  await applyD1Migrations(bindings.DB, inject("migrations"));
});

async function request(
  path: string,
  cookie = "",
  overrides: Partial<Env> = {},
) {
  const ctx = createExecutionContext();
  const response = await worker.fetch(
    new Request("http://localhost:8787/api/account" + path, {
      headers: { Cookie: cookie },
    }),
    { ...bindings, ...overrides },
    ctx,
  );
  await waitOnExecutionContext(ctx);
  return response;
}

async function user(
  role = "user",
  createdAt = Date.now(),
  verified = 1,
  email = crypto.randomUUID() + "@example.test",
) {
  const id = crypto.randomUUID(),
    token = crypto.randomUUID(),
    now = Date.now();
  await bindings.DB.prepare(
    "INSERT INTO auth_user (id,name,email,role,email_verified,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
  )
    .bind(id, "Admin test " + id, email, role, verified, createdAt, now)
    .run();
  await bindings.DB.prepare(
    "INSERT INTO auth_session (id,token,user_id,expires_at,created_at,updated_at) VALUES (?,?,?,?,?,?)",
  )
    .bind(crypto.randomUUID(), token, id, now + day, now, now)
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
    email,
    cookie:
      "better-auth.session_token=" +
      encodeURIComponent(token + "." + signature),
  };
}

function outgoing(
  owner: string,
  id: string,
  createdAt: number,
  status = "sent",
  channel = "cloudflare",
) {
  return bindings.DB.prepare(
    "INSERT INTO outbound_logs (id,created_at,user_id,mailbox,recipient,channel,status,sender_name,subject,content,content_type) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
  ).bind(
    id,
    createdAt,
    owner,
    "sender@example.test",
    "recipient@example.test",
    channel,
    status,
    "Sender",
    "private-test-subject",
    "private-test-body",
    "text/plain",
  );
}

describe("administrator reporting", () => {
  it("protects overview and outgoing pagination from anonymous and ordinary users", async () => {
    const ordinary = await user(),
      admin = await user("admin");
    for (const path of [
      "/admin/overview",
      "/admin/outbound?page=2&pageSize=20",
    ]) {
      expect((await request(path)).status).toBe(401);
      expect((await request(path, ordinary.cookie)).status).toBe(403);
      const response = await request(path, admin.cookie);
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
    }
    const empty = await (
      await request("/admin/overview", admin.cookie)
    ).json<AdminOverview>();
    expect(empty.days).toHaveLength(30);
    expect(empty.apiLogs.averageDurationMs).toBeNull();
    expect(empty.outgoing).toMatchObject({
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
    });
    expect(empty.domains).toEqual([]);
    expect(empty.retainedEmails).toBe(0);
  });

  it("aggregates inventory, UTC usage, log windows, quotas and recovery without exposing content", async () => {
    const admin = await user("admin"),
      now = Date.now(),
      today = new Date(now).toISOString().slice(0, 10);
    const date = (daysAgo: number) =>
      new Date(now - daysAgo * day).toISOString().slice(0, 10);
    const bootstrapEmail = crypto.randomUUID() + "@example.test";
    const unverifiedEmail = crypto.randomUUID() + "@example.test";
    const overrides = {
      ADMIN_EMAILS: ` ${bootstrapEmail.toUpperCase()}, ${unverifiedEmail} `,
    };
    const read = async () => {
      const response = await request(
        "/admin/overview",
        admin.cookie,
        overrides,
      );
      expect(response.status).toBe(200);
      return response.json<AdminOverview>();
    };
    const before = await read();
    const owner = await user("user", now - 31 * day);
    const banned = await user("user", now, 0, unverifiedEmail);
    await user("user", now - day, 1, bootstrapEmail);
    await bindings.DB.prepare("UPDATE auth_user SET banned=1 WHERE id=?")
      .bind(banned.id)
      .run();

    const keyIds = Array.from({ length: 4 }, () => crypto.randomUUID());
    await bindings.DB.batch(
      keyIds.map((id, index) =>
        bindings.DB.prepare(
          "INSERT INTO auth_apikey (id,key,reference_id,enabled,expires_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?)",
        ).bind(
          id,
          "private-test-key-" + id,
          index === 3 ? banned.id : owner.id,
          index === 1 ? 0 : 1,
          index === 1 || index === 2 ? now - 1000 : now + day,
          now,
          now,
        ),
      ),
    );
    await bindings.DB.batch([
      bindings.DB.prepare(
        "INSERT INTO usage_daily VALUES (?,?,?,?,?,?,?)",
      ).bind(today, owner.id, keyIds[0], 9, 2, 5, now),
      bindings.DB.prepare(
        "INSERT INTO usage_daily VALUES (?,?,?,?,?,?,?)",
      ).bind(today, "anonymous:overview-test", "", 0, 3, 4, now),
      bindings.DB.prepare(
        "INSERT INTO usage_daily VALUES (?,?,?,?,?,?,?)",
      ).bind(date(1), owner.id, "", 4, 1, 2, now),
      bindings.DB.prepare(
        "INSERT INTO usage_daily VALUES (?,?,?,?,?,?,?)",
      ).bind(date(31), owner.id, "", 100, 100, 100, now),
    ]);
    const seconds = Math.floor(now / 1000);
    await bindings.DB.batch(
      Array.from({ length: 3 }, (_, index) =>
        bindings.DB.prepare(
          "INSERT INTO mailboxes (id,address,domain,api_key_id,user_id,expires_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)",
        ).bind(
          crypto.randomUUID(),
          crypto.randomUUID() + "@overview.test",
          "overview.test",
          "web",
          index === 1 ? null : owner.id,
          index === 2 ? seconds - 1 : seconds + 86400,
          seconds,
          seconds,
        ),
      ),
    );
    await bindings.DB.batch(
      [seconds, seconds - 90000].map((createdAt) =>
        bindings.DB.prepare(
          'INSERT INTO emails (id,message_from,message_to,headers,"from",message_id,subject,text,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
        ).bind(
          crypto.randomUUID(),
          "from@example.test",
          "to@example.test",
          "[]",
          "{}",
          crypto.randomUUID(),
          "private-test-subject",
          "private-test-body",
          createdAt,
          createdAt,
        ),
      ),
    );
    await bindings.DB.batch([
      outgoing(owner.id, crypto.randomUUID(), now - 100, "sent"),
      outgoing(owner.id, crypto.randomUUID(), now - 100, "failed"),
      outgoing(banned.id, crypto.randomUUID(), now - 100, "pending", "resend"),
      outgoing(owner.id, crypto.randomUUID(), now - day, "sent"),
      outgoing(owner.id, crypto.randomUUID(), now - 31 * day, "failed"),
    ]);
    await bindings.DB.batch(
      [
        [now - 100, 200, 100, owner.id],
        [now - day, 404, 200, owner.id],
        [now - 100, 500, 300, banned.id],
        [now - 8 * day, 200, 900, owner.id],
        [now + day, 200, 900, owner.id],
      ].map(([time, status, duration, id]) =>
        bindings.DB.prepare(
          "INSERT INTO api_request_logs VALUES (?,?,?,?,?,?,?,?)",
        ).bind(
          crypto.randomUUID(),
          time,
          id,
          keyIds[0],
          "GET",
          "/api/v1/mailboxes",
          status,
          duration,
        ),
      ),
    );
    await bindings.DB.batch(
      [
        ["admin_import", "completed", now - 100],
        ["reactivate", "retry_required", now - 100],
        ["admin_import", "completed", now - 31 * day],
      ].map(([action, status, time]) =>
        bindings.DB.prepare(
          "INSERT INTO mailbox_recovery_logs (id,actor_id,user_id,address,action,reason,expires_at,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
        ).bind(
          crypto.randomUUID(),
          admin.id,
          owner.id,
          "box@example.test",
          action,
          "private-audit-reason",
          now + day,
          status,
          time,
          time,
        ),
      ),
    );
    await bindings.ACCESS.getByName("global:inbound:0").consume([
      { key: "day", max: 6250, seconds: 86400 },
    ]);
    await bindings.ACCESS.getByName("global:outbound").consume([
      { key: "send-day", max: 100, seconds: 86400 },
    ]);

    const result = await read();
    expect(result.users).toMatchObject({
      total: before.users.total + 3,
      admins: before.users.admins + 1,
      banned: before.users.banned + 1,
      registeredToday: before.users.registeredToday + 1,
      registered7Days: before.users.registered7Days + 2,
      registered30Days: before.users.registered30Days + 2,
      active30Days: before.users.active30Days + 2,
    });
    expect(result.mailboxes).toEqual({
      total: before.mailboxes.total + 3,
      active: before.mailboxes.active + 2,
      activeOwned: before.mailboxes.activeOwned + 1,
      activeAnonymous: before.mailboxes.activeAnonymous + 1,
      expired: before.mailboxes.expired + 1,
    });
    expect(result.keys).toEqual({
      total: before.keys.total + 4,
      active: before.keys.active + 1,
      disabled: before.keys.disabled + 1,
      expired: before.keys.expired + 2,
    });
    expect(result.retainedEmails).toBe(before.retainedEmails + 1);
    expect(result.totals).toEqual({
      apiCalls: before.totals.apiCalls + 113,
      mailboxesCreated: before.totals.mailboxesCreated + 106,
      emailsReceived: before.totals.emailsReceived + 111,
      keysCreated: before.totals.keysCreated + 4,
    });
    expect(result.days).toHaveLength(30);
    expect(result.days[0].date).toBe(date(29));
    expect(result.days.at(-1)).toMatchObject({
      date: today,
      apiCalls: 9,
      mailboxesCreated: 5,
      emailsReceived: 9,
      keysCreated: 4,
      sent: 1,
      failed: 1,
      pending: 1,
    });
    expect(result.days.find((row) => row.date === date(1))).toMatchObject({
      apiCalls: 4,
      sent: 1,
    });
    expect(result.days.find((row) => row.date === date(2))).toMatchObject({
      apiCalls: 0,
      registrations: 0,
      sent: 0,
    });
    expect(result.outgoing).toMatchObject({
      total: 4,
      sent: 2,
      failed: 1,
      pending: 1,
      senders: 2,
    });
    expect(result.apiLogs).toMatchObject({
      total: 3,
      successful: 1,
      clientErrors: 1,
      serverErrors: 1,
      averageDurationMs: 200,
      users: 2,
    });
    expect(result.apiLogs.routes).toContainEqual({
      method: "GET",
      route: "/api/v1/mailboxes",
      total: 3,
      errors: 2,
    });
    expect(result.domains).toContainEqual({
      domain: "overview.test",
      total: 3,
      active: 2,
    });
    expect(result.topUsers.find((row) => row.id === owner.id)).toMatchObject({
      apiCalls: 13,
      mailboxesCreated: 3,
      emailsReceived: 7,
    });
    expect(result.topUsers.some((row) => row.id.startsWith("anonymous:"))).toBe(
      false,
    );
    expect(result.recoveries).toEqual([
      { action: "admin_import", status: "completed", count: 1 },
      { action: "reactivate", status: "retry_required", count: 1 },
    ]);
    expect(result.quotas.inbound.used).toBe(before.quotas.inbound.used + 1);
    expect(result.quotas.outbound.used).toBe(before.quotas.outbound.used + 1);
    expect(result.quotas.http.limit).toBe(100000);
    expect(result.quotas.http.used + result.quotas.http.remaining).toBe(100000);
    const serialized = JSON.stringify(result);
    for (const secret of [
      "private-test-key-",
      "private-test-body",
      "private-test-subject",
      "private-audit-reason",
      bindings.BETTER_AUTH_SECRET!,
    ])
      expect(serialized).not.toContain(secret);
  });

  it("paginates all outgoing records and filtered records with stable ordering and correct totals", async () => {
    const admin = await user("admin"),
      owner = await user(),
      other = await user();
    const now = Date.now(),
      prefix = crypto.randomUUID();
    const rows = Array.from({ length: 45 }, (_, index) => ({
      id: `${prefix}-${String(44 - index).padStart(2, "0")}`,
      created_at: now - 60000 + Math.floor(index / 3) * 1000,
    }));
    await bindings.DB.batch(
      rows.map((row, index) =>
        outgoing(
          owner.id,
          row.id,
          row.created_at,
          ["sent", "failed", "pending"][index % 3],
        ),
      ),
    );
    await bindings.DB.batch([
      outgoing(other.id, crypto.randomUUID(), now - 1000),
      outgoing(owner.id, crypto.randomUUID(), now - 31 * day),
    ]);
    const expected = [...rows]
      .sort((a, b) => b.created_at - a.created_at || (a.id < b.id ? 1 : -1))
      .map((row) => row.id);
    type History = PageInfo & {
      logs: { id: string; user_id: string; content?: string }[];
      stats: { status: string; count: number }[];
    };
    const list = async (query: string) => {
      const response = await request("/admin/outbound?" + query, admin.cookie);
      expect(response.status).toBe(200);
      return response.json<History>();
    };
    const ids: string[] = [];
    for (let page = 1; page <= 3; page++) {
      const result = await list(`userId=${owner.id}&pageSize=20&page=${page}`);
      expect(result).toMatchObject({
        total: 45,
        page,
        pageSize: 20,
        totalPages: 3,
      });
      expect(result.stats).toEqual([
        { status: "failed", count: 15 },
        { status: "pending", count: 15 },
        { status: "sent", count: 15 },
      ]);
      expect(
        result.logs.every(
          (row) => row.user_id === owner.id && row.content === undefined,
        ),
      ).toBe(true);
      ids.push(...result.logs.map((row) => row.id));
    }
    expect(ids).toEqual(expected);
    expect(new Set(ids).size).toBe(45);
    const repeat = await list(`userId=${owner.id}&pageSize=20&page=2`);
    expect(repeat.logs.map((row) => row.id)).toEqual(expected.slice(20, 40));
    const oldest = await list(`userId=${owner.id}&pageSize=20&sort=oldest`);
    expect(oldest.logs.map((row) => row.id)).toEqual(
      [...expected].reverse().slice(0, 20),
    );
    expect(
      await list(`userId=${owner.id}&pageSize=20&page=99999`),
    ).toMatchObject({ page: 3 });
    expect(await list("userId=missing&page=99999")).toMatchObject({
      total: 0,
      totalPages: 1,
      page: 1,
      logs: [],
    });
    const all = await list("pageSize=100");
    expect(all.total).toBeGreaterThanOrEqual(46);
    expect(all.stats.reduce((total, row) => total + row.count, 0)).toBe(
      all.total,
    );
    expect(all.logs.some((row) => row.user_id === other.id)).toBe(true);
    expect(await list(`userId=${owner.id}`)).toMatchObject({
      page: 1,
      pageSize: 50,
      total: 45,
      totalPages: 1,
    });
    for (const query of [
      "page=0",
      "page=1.5",
      "page=abc",
      "pageSize=21",
      "sort=invalid",
      "userId=" + "x".repeat(129),
    ])
      expect(
        (await request("/admin/outbound?" + query, admin.cookie)).status,
      ).toBe(400);
  });
});
