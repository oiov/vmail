import assert from "node:assert/strict";
import test from "node:test";
import { incrementAndGetApiRateWindowCount } from "./database/stats.ts";

// 契约: 限流计数器 DB 故障时返回 1 (fail-open)，绝不抛出阻断正常请求
// 这是上游既有降级策略 (CodeRabbit PR#39 #3580 说明保留)，测试锁定该行为防回归
test("限流计数器 DB 故障时 fail-open 返回 1 而非抛出", async () => {
  const brokenDb = {
    insert() {
      throw new Error("D1 unavailable");
    },
  } as any;

  const count = await incrementAndGetApiRateWindowCount(brokenDb, "key-1", 123);
  assert.equal(count, 1);
});
