// worker/src/database/stats.ts
// 深模块: 站点统计的唯一写入口 + 统一 record(event)
// Interface: getSiteStats / record(event) / recordDaily(event) + 兼容的 increment* 函数
// Implementation: site_stats 单行的懒初始化 + daily_stats 的 upsert，细节对调用方隐藏
// 之前: 调用方必须记得 incrementAddressesCreated + incrementDailyAddressesCreated 成对调用
// 之后: 调用方只需 stats.record(db, "addressCreated")，Module 内部同时写 site + daily
import { eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import {
  siteStats,
  type SiteStats,
  dailyStats,
  type DailyStats,
  apiRateLimits,
} from "./schema.ts";

const GLOBAL_STATS_ID = "global";

export async function getSiteStats(
  db: DrizzleD1Database,
): Promise<SiteStats | null> {
  try {
    const r = await db
      .select()
      .from(siteStats)
      .where(eq(siteStats.id, GLOBAL_STATS_ID))
      .execute();
    return r.length === 1 ? r[0] : null;
  } catch (e) {
    console.error("getSiteStats error:", e);
    return null;
  }
}
export async function initSiteStats(db: DrizzleD1Database) {
  try {
    const existing = await getSiteStats(db);
    if (!existing)
      await db
        .insert(siteStats)
        .values({
          id: GLOBAL_STATS_ID,
          totalAddressesCreated: 0,
          totalEmailsReceived: 0,
          totalApiCalls: 0,
          totalApiKeysCreated: 0,
          updatedAt: new Date(),
        })
        .execute();
  } catch (e) {
    console.error("initSiteStats error:", e);
  }
}
export async function incrementEmailsReceived(
  db: DrizzleD1Database,
  amount = 1,
) {
  try {
    await initSiteStats(db);
    await db
      .update(siteStats)
      .set({
        totalEmailsReceived: sql`${siteStats.totalEmailsReceived} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(siteStats.id, GLOBAL_STATS_ID))
      .execute();
  } catch (e) {
    console.error("incrementEmailsReceived error:", e);
  }
}
export async function incrementAddressesCreated(
  db: DrizzleD1Database,
  amount = 1,
) {
  try {
    await initSiteStats(db);
    await db
      .update(siteStats)
      .set({
        totalAddressesCreated: sql`${siteStats.totalAddressesCreated} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(siteStats.id, GLOBAL_STATS_ID))
      .execute();
  } catch (e) {
    console.error("incrementAddressesCreated error:", e);
  }
}
export async function incrementApiKeysCreated(
  db: DrizzleD1Database,
  amount = 1,
) {
  try {
    await initSiteStats(db);
    await db
      .update(siteStats)
      .set({
        totalApiKeysCreated: sql`${siteStats.totalApiKeysCreated} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(siteStats.id, GLOBAL_STATS_ID))
      .execute();
  } catch (e) {
    console.error("incrementApiKeysCreated error:", e);
  }
}
export async function incrementApiCalls(db: DrizzleD1Database, amount = 1) {
  try {
    await initSiteStats(db);
    await db
      .update(siteStats)
      .set({
        totalApiCalls: sql`${siteStats.totalApiCalls} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(siteStats.id, GLOBAL_STATS_ID))
      .execute();
  } catch (e) {
    console.error("incrementApiCalls error:", e);
  }
}
function getDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
export async function getDailyStatsByDate(
  db: DrizzleD1Database,
  dateKey: string,
): Promise<DailyStats | null> {
  try {
    const r = await db
      .select()
      .from(dailyStats)
      .where(eq(dailyStats.date, dateKey))
      .execute();
    return r.length === 1 ? r[0] : null;
  } catch (e) {
    console.error("getDailyStatsByDate error:", e);
    return null;
  }
}
async function upsertDailyStatsField(
  db: DrizzleD1Database,
  field: "addressesCreated" | "emailsReceived" | "apiCalls" | "apiKeysCreated",
  amount: number,
  dateKey: string = getDateKey(),
) {
  const now = new Date();
  // 字段名 → drizzle 列对象显式映射，替代旧的动态索引类型逃逸
  const dailyColumn = {
    addressesCreated: dailyStats.addressesCreated,
    emailsReceived: dailyStats.emailsReceived,
    apiCalls: dailyStats.apiCalls,
    apiKeysCreated: dailyStats.apiKeysCreated,
  }[field];
  const updates: Record<string, unknown> = {
    updatedAt: now,
    [field]: sql`${dailyColumn} + ${amount}`,
  };
  await db
    .insert(dailyStats)
    .values({
      date: dateKey,
      addressesCreated: field === "addressesCreated" ? amount : 0,
      emailsReceived: field === "emailsReceived" ? amount : 0,
      apiCalls: field === "apiCalls" ? amount : 0,
      apiKeysCreated: field === "apiKeysCreated" ? amount : 0,
      updatedAt: now,
    })
    .onConflictDoUpdate({ target: dailyStats.date, set: updates })
    .execute();
}
export async function incrementDailyAddressesCreated(
  db: DrizzleD1Database,
  amount = 1,
  dateKey?: string,
) {
  try {
    await upsertDailyStatsField(db, "addressesCreated", amount, dateKey);
  } catch (e) {
    console.error("incrementDailyAddressesCreated error:", e);
  }
}
export async function incrementDailyEmailsReceived(
  db: DrizzleD1Database,
  amount = 1,
  dateKey?: string,
) {
  try {
    await upsertDailyStatsField(db, "emailsReceived", amount, dateKey);
  } catch (e) {
    console.error("incrementDailyEmailsReceived error:", e);
  }
}
export async function incrementDailyApiCalls(
  db: DrizzleD1Database,
  amount = 1,
  dateKey?: string,
) {
  try {
    await upsertDailyStatsField(db, "apiCalls", amount, dateKey);
  } catch (e) {
    console.error("incrementDailyApiCalls error:", e);
  }
}
export async function incrementDailyApiKeysCreated(
  db: DrizzleD1Database,
  amount = 1,
  dateKey?: string,
) {
  try {
    await upsertDailyStatsField(db, "apiKeysCreated", amount, dateKey);
  } catch (e) {
    console.error("incrementDailyApiKeysCreated error:", e);
  }
}
export async function incrementAndGetApiRateWindowCount(
  db: DrizzleD1Database,
  apiKeyId: string,
  windowStartEpochSec: number,
): Promise<number> {
  try {
    const result = await db
      .insert(apiRateLimits)
      .values({ apiKeyId, windowStartEpochSec, requestCount: 1 })
      .onConflictDoUpdate({
        target: [apiRateLimits.apiKeyId, apiRateLimits.windowStartEpochSec],
        set: { requestCount: sql`${apiRateLimits.requestCount} + 1` },
      })
      .returning({ requestCount: apiRateLimits.requestCount })
      .execute();
    return result[0]?.requestCount ?? 1;
  } catch (e) {
    // 有意降级 (fail-open): DB 故障时返回 1 放行请求，不因限流计数器故障阻断正常调用。
    // 该策略为上游既有行为 (CodeRabbit PR#39 #3580 说明保留)，契约由 stats.rateLimit.test.ts 锁定。
    console.error("incrementAndGetApiRateWindowCount error:", e);
    return 1;
  }
}

// 深接口: 统一 record，内部同时写 site + daily，调用方不再漏掉一半
export type StatEvent =
  | "addressCreated"
  | "emailReceived"
  | "apiCall"
  | "apiKeyCreated";
export async function record(
  db: DrizzleD1Database,
  event: StatEvent,
  amount = 1,
  dateKey?: string,
) {
  switch (event) {
    case "addressCreated":
      await Promise.all([
        incrementAddressesCreated(db, amount),
        incrementDailyAddressesCreated(db, amount, dateKey),
      ]);
      break;
    case "emailReceived":
      await Promise.all([
        incrementEmailsReceived(db, amount),
        incrementDailyEmailsReceived(db, amount, dateKey),
      ]);
      break;
    case "apiCall":
      await Promise.all([
        incrementApiCalls(db, amount),
        incrementDailyApiCalls(db, amount, dateKey),
      ]);
      break;
    case "apiKeyCreated":
      await Promise.all([
        incrementApiKeysCreated(db, amount),
        incrementDailyApiKeysCreated(db, amount, dateKey),
      ]);
      break;
  }
}
