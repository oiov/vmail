import assert from "node:assert/strict";
import test from "node:test";
import { drizzle } from "drizzle-orm/d1";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import {
  deleteEmails,
  deleteMailboxMessage,
  insertEmail,
} from "./database/emails.ts";

// 契约: 插入失败必须向上抛出，让 email() 的 catch 走 message.setReject()
// 触发 Cloudflare 重投，而不是吞掉错误导致邮件静默丢失
test("insertEmail 失败时抛出异常而非吞掉", async () => {
  const db: any = {
    insert() {
      return {
        values() {
          return {
            execute: async () => {
              throw new Error("D1 unavailable");
            },
          };
        },
      };
    },
  };
  await assert.rejects(() => insertEmail(db, {} as any), /D1 unavailable/);
});

// fake D1Database: stmt.run() 返回 Cloudflare D1 标准形状 {results,success,meta:{changes}}
// （worker-configuration.d.ts interface D1Meta: 行数在 meta.changes, 无 rowsAffected 属性）
function makeFakeD1(changes: number | Error): D1Database {
  return {
    prepare() {
      return {
        bind() {
          return {
            run: async () => {
              if (changes instanceof Error) throw changes;
              return { results: [], success: true, meta: { changes } };
            },
            all: async () => ({ results: [] }),
            raw: async () => [],
          };
        },
      };
    },
    batch: async () => [],
  } as unknown as D1Database;
}

// 契约: 删除计数必须取自 D1Result.meta.changes（此前取不存在的 rowsAffected 属性恒得 0，
// 导致 v1 DELETE 即使删除成功也判 404、/api/delete-emails 计数恒 0）
test("deleteEmails 从 meta.changes 提取删除行数", async () => {
  const db = drizzle(makeFakeD1(2));
  const result = await deleteEmails(db, ["a", "b"]);
  assert.deepEqual(result, { count: 2 });
});

test("deleteEmails D1 故障时降级返回 {count:0} 不抛出", async () => {
  const db = drizzle(makeFakeD1(new Error("D1 unavailable")));
  const result = await deleteEmails(db, ["a"]);
  assert.deepEqual(result, { count: 0 });
});

test("deleteMailboxMessage 用 meta.changes 判定删除成败", async () => {
  const okDb = drizzle(makeFakeD1(1));
  assert.equal(await deleteMailboxMessage(okDb, "a@b.c", "m1"), true);
  const zeroDb = drizzle(makeFakeD1(0));
  assert.equal(await deleteMailboxMessage(zeroDb, "a@b.c", "m1"), false);
  const failDb = drizzle(makeFakeD1(new Error("D1 unavailable")));
  assert.equal(await deleteMailboxMessage(failDb, "a@b.c", "m1"), false);
});
