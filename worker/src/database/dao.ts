import { count, desc, asc, eq, and, inArray, lt } from "drizzle-orm";
// fix: 将数据库类型从 LibSQLDatabase 更改为 DrizzleD1Database，以匹配 Cloudflare D1
import { DrizzleD1Database } from "drizzle-orm/d1";
// refactor: 更新 schema 的导入路径
import { emails, InsertEmail, apiKeys, InsertApiKey, mailboxes, InsertMailbox } from "./schema";

export async function insertEmail(db: DrizzleD1Database, email: InsertEmail) {
  try {
    await db.insert(emails).values(email).execute();
  } catch (e) {
    console.error(e);
  }
}

export async function getEmails(db: DrizzleD1Database) {
  try {
    return await db.select().from(emails).execute();
  } catch (e) {
    return [];
  }
}

// 函数重命名：将 getEmail 重命名为 findEmailById 以匹配 worker 中的调用
export async function findEmailById(db: DrizzleD1Database, id: string) {
  try {
    const result = await db
      .select()
      .from(emails)
      .where(and(eq(emails.id, id)))
      .execute();
    if (result.length != 1) {
      return null;
    }
    return result[0];
  } catch (e) {
    return null;
  }
}

// 该函数已不再需要，因为密码现在是邮箱地址的加密版本
// export async function getEmailByPassword(db: DrizzleD1Database, id: string) {
// ...
// }

export async function getEmailsByMessageTo(
  db: DrizzleD1Database,
  messageTo: string
) {
  try {
    return await db
      .select()
      .from(emails)
      .where(eq(emails.messageTo, messageTo))
      .orderBy(desc(emails.createdAt))
      .execute();
  } catch (e) {
    return [];
  }
}

export async function getEmailsCount(db: DrizzleD1Database) {
  try {
    const res = await db.select({ count: count() }).from(emails);
    return res[0]?.count;
  } catch (e) {
    return 0;
  }
}

// 新增函数：添加 worker 中缺失的 deleteEmails 函数
export async function deleteEmails(db: DrizzleD1Database, ids: string[]) {
    if (!ids || ids.length === 0) {
        return { count: 0 };
    }
    try {
        const result = await db.delete(emails).where(inArray(emails.id, ids));
        return { count: result.rowsAffected };
    } catch (e) {
        console.error(e);
        return { count: 0 };
    }
}

/**
 * 新增函数：根据提供的过期时间删除此时间之前的所有邮件。
 * @param db Drizzle 数据库实例。
 * @param expirationTime 一个 Date 对象，表示过期时间点。
 * @returns 返回一个包含已删除邮件数量的对象，或在出错时返回 { count: 0 }。
 */
export async function deleteExpiredEmails(db: DrizzleD1Database, expirationTime: Date) {
    try {
        // 使用Drizzle的lt（小于）操作符来比较createdAt字段和expirationTime
        const result = await db.delete(emails).where(lt(emails.createdAt, expirationTime)).execute();
        // 返回受影响的行数，即已删除的邮件数量
        return { count: result.rowsAffected };
    } catch (e) {
        // 如果在删除过程中发生错误，则在控制台打印错误信息
        console.error('清理过期邮件失败:', e);
        // 并返回一个表示删除数量为0的对象
        return { count: 0 };
    }
}

// ==================== API Key 相关函数 ====================

/**
 * 通过 API Key 值查找记录
 */
export async function findApiKeyByKey(db: DrizzleD1Database, key: string) {
  try {
    const result = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, key))
      .execute();
    return result.length === 1 ? result[0] : null;
  } catch (e) {
    console.error('findApiKeyByKey error:', e);
    return null;
  }
}

/**
 * 更新 API Key 最后使用时间
 */
export async function updateApiKeyLastUsed(db: DrizzleD1Database, id: string) {
  try {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date(), updatedAt: new Date() })
      .where(eq(apiKeys.id, id))
      .execute();
  } catch (e) {
    console.error('updateApiKeyLastUsed error:', e);
  }
}

/**
 * 创建 API Key
 */
export async function insertApiKey(db: DrizzleD1Database, apiKey: InsertApiKey) {
  try {
    await db.insert(apiKeys).values(apiKey).execute();
    return apiKey;
  } catch (e) {
    console.error('insertApiKey error:', e);
    return null;
  }
}

// ==================== Mailbox 相关函数 ====================

/**
 * 创建邮箱
 */
export async function insertMailbox(db: DrizzleD1Database, mailbox: InsertMailbox) {
  try {
    await db.insert(mailboxes).values(mailbox).execute();
    return mailbox;
  } catch (e) {
    console.error('insertMailbox error:', e);
    throw e;
  }
}

/**
 * 通过 ID 查找邮箱
 */
export async function findMailboxById(db: DrizzleD1Database, id: string) {
  try {
    const result = await db
      .select()
      .from(mailboxes)
      .where(eq(mailboxes.id, id))
      .execute();
    return result.length === 1 ? result[0] : null;
  } catch (e) {
    console.error('findMailboxById error:', e);
    return null;
  }
}

/**
 * 通过邮箱地址查找邮箱
 */
export async function findMailboxByAddress(db: DrizzleD1Database, address: string) {
  try {
    const result = await db
      .select()
      .from(mailboxes)
      .where(eq(mailboxes.address, address))
      .execute();
    return result.length === 1 ? result[0] : null;
  } catch (e) {
    console.error('findMailboxByAddress error:', e);
    return null;
  }
}

/**
 * 获取邮箱的邮件列表（带分页）
 */
export async function getMailboxMessages(
  db: DrizzleD1Database,
  address: string,
  options: { page: number; limit: number; sort: 'asc' | 'desc' }
) {
  try {
    const offset = (options.page - 1) * options.limit;
    const orderFn = options.sort === 'asc' ? asc : desc;

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

    return {
      messages,
      total,
      totalPages: Math.ceil(total / options.limit),
    };
  } catch (e) {
    console.error('getMailboxMessages error:', e);
    return { messages: [], total: 0, totalPages: 0 };
  }
}

/**
 * 获取特定邮箱的特定邮件（验证所属关系）
 */
export async function findMailboxMessage(
  db: DrizzleD1Database,
  address: string,
  messageId: string
) {
  try {
    const result = await db
      .select()
      .from(emails)
      .where(and(eq(emails.id, messageId), eq(emails.messageTo, address)))
      .execute();
    return result.length === 1 ? result[0] : null;
  } catch (e) {
    console.error('findMailboxMessage error:', e);
    return null;
  }
}

/**
 * 删除特定邮箱的特定邮件（验证所属关系）
 */
export async function deleteMailboxMessage(
  db: DrizzleD1Database,
  address: string,
  messageId: string
) {
  try {
    const result = await db
      .delete(emails)
      .where(and(eq(emails.id, messageId), eq(emails.messageTo, address)))
      .execute();
    return result.rowsAffected > 0;
  } catch (e) {
    console.error('deleteMailboxMessage error:', e);
    return false;
  }
}

/**
 * 获取邮箱的邮件数量
 */
export async function getMailboxMessageCount(
  db: DrizzleD1Database,
  address: string
) {
  try {
    const result = await db
      .select({ count: count() })
      .from(emails)
      .where(eq(emails.messageTo, address))
      .execute();
    return result[0]?.count || 0;
  } catch (e) {
    console.error('getMailboxMessageCount error:', e);
    return 0;
  }
}

/**
 * 删除过期的邮箱
 */
export async function deleteExpiredMailboxes(db: DrizzleD1Database) {
  try {
    const now = new Date();
    const result = await db
      .delete(mailboxes)
      .where(lt(mailboxes.expiresAt, now))
      .execute();
    return { count: result.rowsAffected };
  } catch (e) {
    console.error('deleteExpiredMailboxes error:', e);
    return { count: 0 };
  }
}