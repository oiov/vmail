// worker/src/database/emails.ts
// 深模块: 邮箱消息的唯一读写口
// Interface: insert/find/get/delete + inbox/meta
// Implementation: Drizzle over D1，内部隐藏 order/limit/索引细节
import { count, desc, asc, eq, and, inArray, lt, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { emails, type InsertEmail } from "./schema.ts";

// 契约: 插入失败必须抛出，由 email() 的 catch 走 setReject() 触发 Cloudflare 重投
// 吞掉错误会导致邮件静默丢失且统计照常递增（CodeRabbit PR#39 #3772/#3777）
export async function insertEmail(db: DrizzleD1Database, email: InsertEmail) {
  await db.insert(emails).values(email).execute();
}
export async function getEmails(db: DrizzleD1Database) {
  try {
    return await db.select().from(emails).execute();
  } catch (e) {
    // 读路径吞错是既有降级策略，但必须留痕：否则 D1 故障伪装成空收件箱无法察觉
    console.error("getEmails error:", e);
    return [];
  }
}
export async function findEmailById(db: DrizzleD1Database, id: string) {
  try {
    const result = await db
      .select()
      .from(emails)
      .where(and(eq(emails.id, id)))
      .execute();
    return result.length === 1 ? result[0] : null;
  } catch (e) {
    console.error("findEmailById error:", e);
    return null;
  }
}
export async function getEmailsByMessageTo(
  db: DrizzleD1Database,
  messageTo: string,
  limit?: number,
) {
  try {
    let query = db
      .select()
      .from(emails)
      .where(eq(emails.messageTo, messageTo))
      .orderBy(desc(emails.createdAt));
    if (limit && limit > 0) query = query.limit(limit) as typeof query;
    return await query.execute();
  } catch (e) {
    console.error("getEmailsByMessageTo error:", e);
    return [];
  }
}
export async function getMailboxMetaByAddress(
  db: DrizzleD1Database,
  address: string,
): Promise<{ count: number; latestEmailCreatedAt: string | null }> {
  try {
    const [countResult, latestResult] = await Promise.all([
      db
        .select({ count: count() })
        .from(emails)
        .where(eq(emails.messageTo, address))
        .execute(),
      db
        .select({ createdAt: emails.createdAt })
        .from(emails)
        .where(eq(emails.messageTo, address))
        .orderBy(desc(emails.createdAt))
        .limit(1)
        .execute(),
    ]);
    return {
      count: countResult[0]?.count ?? 0,
      latestEmailCreatedAt: latestResult[0]?.createdAt
        ? latestResult[0].createdAt.toISOString()
        : null,
    };
  } catch (e) {
    console.error("getMailboxMetaByAddress error:", e);
    return { count: 0, latestEmailCreatedAt: null };
  }
}
export async function getEmailsCount(db: DrizzleD1Database) {
  try {
    const res = await db.select({ count: count() }).from(emails);
    return res[0]?.count;
  } catch (e) {
    console.error("getEmailsCount error:", e);
    return 0;
  }
}
export async function deleteEmails(db: DrizzleD1Database, ids: string[]) {
  if (!ids || ids.length === 0) return { count: 0 };
  try {
    const result = await db.delete(emails).where(inArray(emails.id, ids));
    // D1 删除行数在 D1Result.meta.changes（rowsAffected 属性不存在，旧写法恒得 0）
    return { count: result.meta.changes ?? 0 };
  } catch (e) {
    console.error(e);
    return { count: 0 };
  }
}
export async function deleteExpiredEmails(
  db: DrizzleD1Database,
  expirationTime: Date,
) {
  try {
    const result = await db
      .delete(emails)
      .where(lt(emails.createdAt, expirationTime))
      .execute();
    // D1 删除行数在 D1Result.meta.changes（rowsAffected 属性不存在，旧写法恒得 0）
    return { count: result.meta.changes ?? 0 };
  } catch (e) {
    console.error("清理过期邮件失败:", e);
    return { count: 0 };
  }
}
export async function getMailboxMessages(
  db: DrizzleD1Database,
  address: string,
  options: { page: number; limit: number; sort: "asc" | "desc" },
) {
  try {
    const offset = (options.page - 1) * options.limit;
    const orderFn = options.sort === "asc" ? asc : desc;
    const [messages, countResult] = await Promise.all([
      db
        .select()
        .from(emails)
        .where(eq(emails.messageTo, address))
        .orderBy(orderFn(emails.createdAt))
        .limit(options.limit)
        .offset(offset)
        .execute(),
      db
        .select({ count: count() })
        .from(emails)
        .where(eq(emails.messageTo, address))
        .execute(),
    ]);
    const total = countResult[0]?.count || 0;
    return { messages, total, totalPages: Math.ceil(total / options.limit) };
  } catch (e) {
    console.error("getMailboxMessages error:", e);
    return { messages: [], total: 0, totalPages: 0 };
  }
}
export async function findMailboxMessage(
  db: DrizzleD1Database,
  address: string,
  messageId: string,
) {
  try {
    const result = await db
      .select()
      .from(emails)
      .where(and(eq(emails.id, messageId), eq(emails.messageTo, address)))
      .execute();
    return result.length === 1 ? result[0] : null;
  } catch (e) {
    console.error("findMailboxMessage error:", e);
    return null;
  }
}
export async function deleteMailboxMessage(
  db: DrizzleD1Database,
  address: string,
  messageId: string,
) {
  try {
    const result = await db
      .delete(emails)
      .where(and(eq(emails.id, messageId), eq(emails.messageTo, address)))
      .execute();
    // D1 删除行数在 D1Result.meta.changes（rowsAffected 属性不存在，旧写法恒判失败）
    return (result.meta.changes ?? 0) > 0;
  } catch (e) {
    console.error("deleteMailboxMessage error:", e);
    return false;
  }
}
export async function getMailboxMessageCount(
  db: DrizzleD1Database,
  address: string,
) {
  try {
    const result = await db
      .select({ count: count() })
      .from(emails)
      .where(eq(emails.messageTo, address))
      .execute();
    return result[0]?.count || 0;
  } catch (e) {
    console.error("getMailboxMessageCount error:", e);
    return 0;
  }
}
