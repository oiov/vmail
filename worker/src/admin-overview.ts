import type {
  AdminOverview,
  ServiceDay,
  ServiceQuota,
  ServiceUsage,
} from "../../shared/admin";
import type { Env } from "./index";
import { GLOBAL_SHARDS, positive, shardLimit } from "./limits";
import { isOpenApiEnabled } from "./openapi";
import { getConfiguredSendChannel } from "./sender";
import { version } from "../../package.json";

async function shardedQuota(
  env: Env,
  category: "http" | "inbound",
  limit: number,
): Promise<ServiceQuota> {
  const quotas = await Promise.all(
    Array.from({ length: GLOBAL_SHARDS }, (_, shard) =>
      env.ACCESS.getByName(`global:${category}:${shard}`).quota({
        key: "day",
        seconds: 86400,
        max: shardLimit(limit, shard),
      }),
    ),
  );
  return {
    limit,
    used: quotas.reduce((sum, quota) => sum + quota.used, 0),
    remaining: quotas.reduce((sum, quota) => sum + quota.remaining, 0),
    resetsAt: Math.min(...quotas.map((quota) => quota.resetsAt)),
  };
}

export async function adminOverview(env: Env): Promise<AdminOverview> {
  const now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10);
  const todayStart = Date.parse(today + "T00:00:00Z");
  const since30 = todayStart - 29 * 86400_000;
  const since7 = todayStart - 6 * 86400_000;
  const date30 = new Date(since30).toISOString().slice(0, 10);
  const admins = [
    ...new Set(
      (env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  const adminCondition =
    "role='admin' OR (email_verified=1 AND lower(email) IN (SELECT value FROM json_each(?)))";

  // Each aggregate is bounded by a date window or a single inventory table. Do not fetch message bodies or credentials.
  const statements = [
    env.DB.prepare(
      `SELECT COUNT(*) AS total, COALESCE(SUM(${adminCondition}),0) AS admins,
      COALESCE(SUM(banned=1),0) AS banned, COALESCE(SUM(email_verified=1),0) AS verified,
      COALESCE(SUM(created_at>=? AND created_at<=?),0) AS registeredToday,
      COALESCE(SUM(created_at>=? AND created_at<=?),0) AS registered7Days,
      COALESCE(SUM(created_at>=? AND created_at<=?),0) AS registered30Days FROM auth_user`,
    ).bind(JSON.stringify(admins), todayStart, now, since7, now, since30, now),
    env.DB.prepare(
      `SELECT COUNT(*) AS total, COALESCE(SUM(expires_at>?),0) AS active,
      COALESCE(SUM(expires_at>? AND COALESCE(user_id,'')<>''),0) AS activeOwned,
      COALESCE(SUM(expires_at>? AND COALESCE(user_id,'')=''),0) AS activeAnonymous,
      COALESCE(SUM(expires_at IS NULL OR expires_at<=?),0) AS expired FROM mailboxes`,
    ).bind(
      Math.floor(now / 1000),
      Math.floor(now / 1000),
      Math.floor(now / 1000),
      Math.floor(now / 1000),
    ),
    env.DB.prepare(
      `SELECT COUNT(*) AS total,
      COALESCE(SUM(k.enabled=1 AND (k.expires_at IS NULL OR k.expires_at>?) AND u.banned=0),0) AS active,
      COALESCE(SUM(COALESCE(k.enabled,0)=0),0) AS disabled,
      COALESCE(SUM(k.expires_at IS NOT NULL AND k.expires_at<=?),0) AS expired
      FROM auth_apikey k LEFT JOIN auth_user u ON u.id=k.reference_id`,
    ).bind(now, now),
    env.DB.prepare(
      "SELECT COUNT(*) AS count FROM emails WHERE created_at>=? AND created_at<=?",
    ).bind(Math.floor(now / 1000) - 86400, Math.floor(now / 1000)),
    env.DB
      .prepare(`SELECT total_api_calls AS apiCalls, total_addresses_created AS mailboxesCreated,
      total_emails_received AS emailsReceived, total_api_keys_created AS keysCreated FROM site_stats WHERE id='global'`),
    env.DB.prepare(
      `SELECT date, api_calls AS apiCalls, addresses_created AS mailboxesCreated,
      emails_received AS emailsReceived, api_keys_created AS keysCreated FROM daily_stats WHERE date>=? AND date<=? ORDER BY date`,
    ).bind(date30, today),
    env.DB.prepare(
      "SELECT strftime('%Y-%m-%d',created_at/1000,'unixepoch') AS date,COUNT(*) AS registrations FROM auth_user WHERE created_at>=? AND created_at<=? GROUP BY date",
    ).bind(since30, now),
    env.DB.prepare(
      `SELECT COUNT(*) AS total, COALESCE(SUM(status='sent'),0) AS sent,
      COALESCE(SUM(status='failed'),0) AS failed, COALESCE(SUM(status='pending'),0) AS pending,
      COUNT(DISTINCT user_id) AS senders FROM outbound_logs WHERE created_at>=? AND created_at<=?`,
    ).bind(since30, now),
    env.DB.prepare(
      `SELECT strftime('%Y-%m-%d',created_at/1000,'unixepoch') AS date,
      SUM(status='sent') AS sent, SUM(status='failed') AS failed, SUM(status='pending') AS pending
      FROM outbound_logs WHERE created_at>=? AND created_at<=? GROUP BY date`,
    ).bind(since30, now),
    env.DB.prepare(
      `SELECT channel,COUNT(*) AS total,SUM(status='sent') AS sent,SUM(status='failed') AS failed,SUM(status='pending') AS pending
      FROM outbound_logs WHERE created_at>=? AND created_at<=? GROUP BY channel ORDER BY total DESC,channel`,
    ).bind(since30, now),
    env.DB.prepare(
      `SELECT COUNT(*) AS total, COALESCE(SUM(status>=200 AND status<400),0) AS successful,
      COALESCE(SUM(status>=400 AND status<500),0) AS clientErrors, COALESCE(SUM(status>=500),0) AS serverErrors,
      COUNT(DISTINCT user_id) AS users, AVG(duration_ms) AS averageDurationMs
      FROM api_request_logs WHERE created_at>=? AND created_at<=?`,
    ).bind(since7, now),
    env.DB.prepare(
      `SELECT method,route,COUNT(*) AS total,SUM(status>=400) AS errors FROM api_request_logs
      WHERE created_at>=? AND created_at<=? GROUP BY method,route ORDER BY total DESC,method,route LIMIT 10`,
    ).bind(since7, now),
    env.DB.prepare(
      "SELECT domain,COUNT(*) AS total,COALESCE(SUM(expires_at>?),0) AS active FROM mailboxes GROUP BY domain ORDER BY total DESC,domain LIMIT 20",
    ).bind(Math.floor(now / 1000)),
    env.DB.prepare(
      `SELECT u.id,u.name,u.email,SUM(d.api_calls) AS apiCalls,SUM(d.mailboxes_created) AS mailboxesCreated,SUM(d.emails_received) AS emailsReceived
      FROM usage_daily d JOIN auth_user u ON u.id=d.owner_id WHERE d.date>=? AND d.date<=?
      GROUP BY u.id HAVING SUM(d.api_calls+d.mailboxes_created+d.emails_received)>0
      ORDER BY apiCalls DESC,emailsReceived DESC,u.id LIMIT 10`,
    ).bind(date30, today),
    env.DB.prepare(
      `SELECT COUNT(*) AS count FROM auth_user WHERE id IN (
      SELECT owner_id FROM usage_daily WHERE date>=? AND date<=? AND api_calls+mailboxes_created+emails_received>0
      UNION SELECT user_id FROM outbound_logs WHERE created_at>=? AND created_at<=?)`,
    ).bind(date30, today, since30, now),
    env.DB.prepare(
      "SELECT action,status,COUNT(*) AS count FROM mailbox_recovery_logs WHERE created_at>=? AND created_at<=? GROUP BY action,status ORDER BY action,status",
    ).bind(since30, now),
  ];
  const [rows, http, inbound, outbound] = await Promise.all([
    env.DB.batch<Record<string, unknown>>(statements),
    shardedQuota(env, "http", positive(env.GLOBAL_API_DAILY_LIMIT, 100000)),
    shardedQuota(
      env,
      "inbound",
      positive(env.GLOBAL_INBOUND_DAILY_LIMIT, 100000),
    ),
    env.ACCESS.getByName("global:outbound").quota({
      key: "send-day",
      seconds: 86400,
      max: positive(env.SEND_GLOBAL_DAILY_LIMIT, 100),
    }),
  ]);
  const usage = new Map(
    (rows[5].results as (ServiceUsage & { date: string })[]).map((row) => [
      row.date,
      row,
    ]),
  );
  const registrations = new Map(
    (rows[6].results as { date: string; registrations: number }[]).map(
      (row) => [row.date, row.registrations],
    ),
  );
  const sending = new Map(
    (
      rows[8].results as Pick<
        ServiceDay,
        "date" | "sent" | "failed" | "pending"
      >[]
    ).map((row) => [row.date, row]),
  );
  const emptyUsage = {
    apiCalls: 0,
    mailboxesCreated: 0,
    emailsReceived: 0,
    keysCreated: 0,
  };
  const days = Array.from({ length: 30 }, (_, index): ServiceDay => {
    const date = new Date(since30 + index * 86400_000)
      .toISOString()
      .slice(0, 10);
    return {
      ...emptyUsage,
      date,
      registrations: registrations.get(date) ?? 0,
      sent: 0,
      failed: 0,
      pending: 0,
      ...usage.get(date),
      ...sending.get(date),
    };
  });
  const sendChannel = getConfiguredSendChannel(env);
  return {
    generatedAt: now,
    today,
    statisticsDelaySeconds: 300,
    logDelaySeconds: 60,
    users: {
      ...(rows[0].results[0] as Omit<AdminOverview["users"], "active30Days">),
      active30Days: Number(rows[14].results[0].count),
    },
    mailboxes: rows[1].results[0] as AdminOverview["mailboxes"],
    keys: rows[2].results[0] as AdminOverview["keys"],
    retainedEmails: Number(rows[3].results[0].count),
    totals: (rows[4].results[0] as ServiceUsage | undefined) ?? emptyUsage,
    days,
    outgoing: {
      ...(rows[7].results[0] as Omit<AdminOverview["outgoing"], "channels">),
      channels: rows[9].results as AdminOverview["outgoing"]["channels"],
    },
    apiLogs: {
      ...(rows[10].results[0] as Omit<AdminOverview["apiLogs"], "routes">),
      routes: rows[11].results as AdminOverview["apiLogs"]["routes"],
    },
    domains: rows[12].results as AdminOverview["domains"],
    topUsers: rows[13].results as AdminOverview["topUsers"],
    recoveries: rows[15].results as AdminOverview["recoveries"],
    quotas: { http, inbound, outbound },
    services: {
      version,
      openApi: isOpenApiEnabled(env),
      outbound: !!sendChannel,
      sendChannel: sendChannel ?? "",
      turnstile: !!(env.TURNSTILE_KEY && env.TURNSTILE_SECRET),
    },
  };
}
