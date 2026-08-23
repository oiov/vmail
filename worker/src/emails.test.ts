import assert from "node:assert/strict";
import test from "node:test";
import { insertEmail } from "./database/emails.ts";

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
