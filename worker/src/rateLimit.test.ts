import assert from "node:assert/strict";
import test from "node:test";
import {
  checkRateLimit,
  createMemoryRateLimitStore,
  rateLimitHeaders,
} from "./rateLimit.ts";

test("RateLimit Module — 单 key 在限额内保持 allowed，remaining 递减", async () => {
  const store = createMemoryRateLimitStore();
  const now = 1_700_000_000;
  const key = "send-mailbox:alice@example.com";
  const limit = 3;

  const r1 = await checkRateLimit(key, limit, now, store);
  assert.equal(r1.allowed, true);
  assert.equal(r1.count, 1);
  assert.equal(r1.remaining, 2);
  assert.equal(r1.retryAfter, 0);

  const r2 = await checkRateLimit(key, limit, now, store);
  assert.equal(r2.allowed, true);
  assert.equal(r2.count, 2);
  assert.equal(r2.remaining, 1);

  const r3 = await checkRateLimit(key, limit, now, store);
  assert.equal(r3.allowed, true);
  assert.equal(r3.count, 3);
  assert.equal(r3.remaining, 0);
});

test("RateLimit Module — 超限后 allowed=false 且 retryAfter>0，header 包含 Retry-After", async () => {
  const store = createMemoryRateLimitStore();
  const now = 1_700_000_000;
  const key = "api-key:test-id";
  const limit = 2;

  await checkRateLimit(key, limit, now, store);
  await checkRateLimit(key, limit, now, store);
  const r3 = await checkRateLimit(key, limit, now, store);
  assert.equal(r3.allowed, false);
  assert.equal(r3.count, 3);
  assert.equal(r3.remaining, 0);
  assert.ok(r3.retryAfter >= 1 && r3.retryAfter <= 60);

  const headers = rateLimitHeaders(r3);
  assert.equal(headers["X-RateLimit-Limit"], "2");
  assert.equal(headers["X-RateLimit-Remaining"], "0");
  assert.ok(headers["Retry-After"]);
});

test("RateLimit Module — 不同 key 互不影响，跨 window 计数重置", async () => {
  const store = createMemoryRateLimitStore();
  const now = 1_700_000_000;
  const limit = 2;

  const rA1 = await checkRateLimit(
    "send-mailbox:a@example.com",
    limit,
    now,
    store,
  );
  const rB1 = await checkRateLimit(
    "send-mailbox:b@example.com",
    limit,
    now,
    store,
  );
  assert.equal(rA1.count, 1);
  assert.equal(rB1.count, 1);

  const nextWindow = now + 61;
  const rA2 = await checkRateLimit(
    "send-mailbox:a@example.com",
    limit,
    nextWindow,
    store,
  );
  assert.equal(rA2.count, 1);
  assert.equal(rA2.windowStart, Math.floor(nextWindow / 60) * 60);
});

test("RateLimit Module — window 计算为 floor(now/60)*60", async () => {
  const store = createMemoryRateLimitStore();
  const now = 1_700_000_061;
  const r = await checkRateLimit("k", 10, now, store);
  assert.equal(r.windowStart, Math.floor(now / 60) * 60);
});

test("RateLimit Module — Drizzle 适配器通过注入 incrementFn 工作", async () => {
  let calls: Array<[string, number]> = [];
  const fakeIncrement = async (_db: unknown, key: string, win: number) => {
    calls.push([key, win]);
    return 5;
  };
  const { createDrizzleRateLimitStore } = await import("./rateLimit.ts");
  const drizzleStore = createDrizzleRateLimitStore({}, fakeIncrement);
  const r = await checkRateLimit("my-key", 3, 1_700_000_000, drizzleStore);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "my-key");
  assert.equal(r.count, 5);
  assert.equal(r.allowed, false);
});
