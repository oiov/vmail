import assert from "node:assert/strict";
import test from "node:test";
import { isTurnstileEnabled, parseJsonBody } from "./turnstile.ts";

test("Turnstile Module — isTurnstileEnabled 仅当 KEY+SECRET 都存在时为 true", () => {
  assert.equal(isTurnstileEnabled({ TURNSTILE_KEY: "k", TURNSTILE_SECRET: "s" }), true);
  assert.equal(isTurnstileEnabled({ TURNSTILE_KEY: "k" }), false);
  assert.equal(isTurnstileEnabled({ TURNSTILE_SECRET: "s" }), false);
  assert.equal(isTurnstileEnabled({}), false);
  assert.equal(isTurnstileEnabled({ TURNSTILE_KEY: "", TURNSTILE_SECRET: "s" }), false);
});

test("Turnstile Module — parseJsonBody 隔离 JSON 解析错误", async () => {
  const ok = await parseJsonBody({ req: { async text() { return '{"a":1}'; } } } as any);
  assert.deepEqual(ok.body, { a: 1 });
  assert.equal(ok.errorResponse, undefined);

  const empty = await parseJsonBody({ req: { async text() { return ""; } } } as any);
  assert.deepEqual(empty.body, {});

  const bad = await parseJsonBody({ req: { async text() { return "{bad"; } } } as any);
  assert.equal(bad.body, null);
  assert.ok(bad.errorResponse);
  assert.equal(bad.errorResponse!.status, 400);
});
