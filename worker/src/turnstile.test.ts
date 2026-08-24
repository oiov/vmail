import assert from "node:assert/strict";
import test from "node:test";
import {
  isTurnstileEnabled,
  parseJsonBody,
  verifyTurnstileToken,
} from "./turnstile.ts";

test("Turnstile Module — siteverify fetch 带 15s 超时信号 (契约: 出站请求必须有界)", async () => {
  const originalFetch = globalThis.fetch;
  let capturedSignal: AbortSignal | undefined;
  globalThis.fetch = (async (input: unknown, init?: RequestInit) => {
    capturedSignal = init?.signal;
    // 模拟上游挂起: 若调用方未传 signal 则永远挂住，测试将因超时失败而暴露缺陷
    if (!capturedSignal) await new Promise(() => {});
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  try {
    const ok = await verifyTurnstileToken("tok", { TURNSTILE_SECRET: "s" });
    assert.equal(ok, true);
    assert.ok(capturedSignal, "fetch 必须携带 AbortSignal");
    assert.equal(capturedSignal.aborted, false, "正常响应时 signal 不应已中止");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Turnstile Module — isTurnstileEnabled 仅当 KEY+SECRET 都存在时为 true", () => {
  assert.equal(
    isTurnstileEnabled({ TURNSTILE_KEY: "k", TURNSTILE_SECRET: "s" }),
    true,
  );
  assert.equal(isTurnstileEnabled({ TURNSTILE_KEY: "k" }), false);
  assert.equal(isTurnstileEnabled({ TURNSTILE_SECRET: "s" }), false);
  assert.equal(isTurnstileEnabled({}), false);
  assert.equal(
    isTurnstileEnabled({ TURNSTILE_KEY: "", TURNSTILE_SECRET: "s" }),
    false,
  );
});

test("Turnstile Module — parseJsonBody 隔离 JSON 解析错误", async () => {
  const ok = await parseJsonBody({
    req: {
      async text() {
        return '{"a":1}';
      },
    },
  } as any);
  assert.deepEqual(ok.body, { a: 1 });
  assert.equal(ok.errorResponse, undefined);

  const empty = await parseJsonBody({
    req: {
      async text() {
        return "";
      },
    },
  } as any);
  assert.deepEqual(empty.body, {});

  const bad = await parseJsonBody({
    req: {
      async text() {
        return "{bad";
      },
    },
  } as any);
  assert.equal(bad.body, null);
  assert.ok(bad.errorResponse);
  assert.equal(bad.errorResponse!.status, 400);
});
