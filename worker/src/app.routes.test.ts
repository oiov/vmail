// worker/src/app.routes.test.ts
// 契约(review-F1 + CodeRabbit PR#42 CR-1): 未匹配的 /api 与 /auth 路径必须回落
// Hono 默认 404，不得落入任何 catch-all(旧 serveStatic 死路由)变 500。
// 本测试直接调用生产 createApp() — 测的是真实路由构造，app.ts 若重新引入
// 错误 catch-all，本组测试立即变红（不再复刻最小 Hono 实例）。
import assert from "node:assert/strict";
import test from "node:test";

const { createApp } = await import("./app.ts");
const app = createApp();

// 无 PASSWORD: 门禁直通; 本组路径不触达 DB
const env = {} as never;

// workerHandlers.fetch(request, env, ctx) 签名
function fetchPath(pathname: string): Promise<Response> {
  return app.fetch(new Request(`https://vmail.test${pathname}`), env, {
    waitUntil() {},
    passThroughOnException() {},
  } as never) as unknown as Promise<Response>;
}

test("未匹配的 /api GET 返回 404, 不命中 catch-all 变 500", async () => {
  const res = await fetchPath("/api/__no_such_route__");
  assert.equal(res.status, 404);
});

test("未匹配的 /auth GET 同样回落 404", async () => {
  const res = await fetchPath("/auth/__no_such__");
  assert.equal(res.status, 404);
});

test("生产 createApp 暴露 fetch/email/scheduled 三入口 (Worker 契约)", () => {
  assert.equal(typeof app.fetch, "function");
  assert.equal(typeof app.email, "function");
  assert.equal(typeof app.scheduled, "function");
});
