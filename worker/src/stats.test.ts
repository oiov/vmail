import assert from "node:assert/strict";
import test from "node:test";
import { record } from "./database/stats.ts";

function fakeDb() {
  const calls: string[] = [];
  // 构造一个最小的 Drizzle-like stub，足以让 stats.ts 的 update/upsert 路径走到 execute
  const db: any = {
    calls,
    select() {
      return {
        from() {
          return {
            where() {
              return { execute: async () => [] };
            },
          };
        },
      };
    },
    insert(_table: any) {
      return {
        values(v: any) {
          const chain: any = {
            execute: async () => {
              calls.push(`insert:${v.date ?? v.id ?? "row"}`);
              return [];
            },
            onConflictDoUpdate(_opts: any) {
              return {
                execute: async () => {
                  calls.push("upsert:daily");
                  return [];
                },
                returning() {
                  return { execute: async () => [{ requestCount: 1 }] };
                },
              };
            },
            returning() {
              return { execute: async () => [{ requestCount: 1 }] };
            },
          };
          return chain;
        },
      };
    },
    update(_table: any) {
      return {
        set(_v: any) {
          return {
            where() {
              return {
                execute: async () => {
                  calls.push("update:site");
                },
              };
            },
          };
        },
      };
    },
    delete() {
      return {
        where() {
          return { execute: async () => ({ rowsAffected: 0 }) };
        },
      };
    },
  };
  return db as any;
}

test("Stats Module — record 深接口同时写 site + daily", async () => {
  const db = fakeDb();
  await record(db, "addressCreated");
  assert.ok(
    db.calls.some((c: string) => c.startsWith("update:")),
    "应更新 site_stats",
  );
  // 契约: daily 写入必须走 upsert 路径（insert:global 来自 initSiteStats，不能作为 daily 证据）
  assert.ok(
    db.calls.includes("upsert:daily"),
    "应 upsert daily_stats: " + db.calls.join(", "),
  );
});

test("Stats Module — 兼容的 increment* 函数仍可用", async () => {
  const { incrementAddressesCreated, incrementDailyAddressesCreated } =
    await import("./database/stats.ts");
  assert.equal(typeof incrementAddressesCreated, "function");
  assert.equal(typeof incrementDailyAddressesCreated, "function");
});
