// worker/src/database/mailboxes.ts
// 深模块: 邮箱容器 + API Key 的归属
import { eq, lt } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import {
  mailboxes,
  apiKeys,
  type InsertMailbox,
  type InsertApiKey,
} from "./schema.ts";

export async function insertMailbox(
  db: DrizzleD1Database,
  mailbox: InsertMailbox,
) {
  try {
    await db.insert(mailboxes).values(mailbox).execute();
    return mailbox;
  } catch (e) {
    console.error("insertMailbox error:", e);
    throw e;
  }
}
export async function findMailboxById(db: DrizzleD1Database, id: string) {
  try {
    const r = await db
      .select()
      .from(mailboxes)
      .where(eq(mailboxes.id, id))
      .execute();
    return r.length === 1 ? r[0] : null;
  } catch (e) {
    console.error("findMailboxById error:", e);
    return null;
  }
}
export async function findMailboxByAddress(
  db: DrizzleD1Database,
  address: string,
) {
  try {
    const r = await db
      .select()
      .from(mailboxes)
      .where(eq(mailboxes.address, address))
      .execute();
    return r.length === 1 ? r[0] : null;
  } catch (e) {
    console.error("findMailboxByAddress error:", e);
    return null;
  }
}
export async function deleteExpiredMailboxes(db: DrizzleD1Database) {
  try {
    const now = new Date();
    const r = await db
      .delete(mailboxes)
      .where(lt(mailboxes.expiresAt, now))
      .execute();
    // D1 删除行数在 D1Result.meta.changes（rowsAffected 属性不存在，旧写法恒得 0）
    return { count: r.meta.changes ?? 0 };
  } catch (e) {
    console.error("deleteExpiredMailboxes error:", e);
    return { count: 0 };
  }
}

// API Keys 归属于此切片: key 是 mailbox 的能力凭证
export async function findApiKeyByKey(db: DrizzleD1Database, key: string) {
  try {
    const r = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, key))
      .execute();
    return r.length === 1 ? r[0] : null;
  } catch (e) {
    console.error("findApiKeyByKey error:", e);
    return null;
  }
}
export async function updateApiKeyLastUsed(db: DrizzleD1Database, id: string) {
  try {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date(), updatedAt: new Date() })
      .where(eq(apiKeys.id, id))
      .execute();
  } catch (e) {
    console.error("updateApiKeyLastUsed error:", e);
  }
}
export async function insertApiKey(
  db: DrizzleD1Database,
  apiKey: InsertApiKey,
) {
  try {
    await db.insert(apiKeys).values(apiKey).execute();
    return apiKey;
  } catch (e) {
    console.error("insertApiKey error:", e);
    return null;
  }
}
