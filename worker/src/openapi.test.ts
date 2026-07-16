import assert from "node:assert/strict";
import test from "node:test";
import { createOpenApiDisabledResponse, isOpenApiEnabled } from "./openapi.ts";

function createEnv(overrides: { ENABLE_OPENAPI?: string } = {}) {
  return overrides;
}

test("OpenAPI access is disabled by default when env var is missing", () => {
  assert.equal(isOpenApiEnabled(createEnv()), false);
});

test("OpenAPI access is enabled only when ENABLE_OPENAPI is explicitly true", () => {
  assert.equal(isOpenApiEnabled(createEnv({ ENABLE_OPENAPI: "false" })), false);
  assert.equal(
    isOpenApiEnabled(createEnv({ ENABLE_OPENAPI: "${ENABLE_OPENAPI}" })),
    false,
  );
  assert.equal(isOpenApiEnabled(createEnv({ ENABLE_OPENAPI: "1" })), false);
  assert.equal(isOpenApiEnabled(createEnv({ ENABLE_OPENAPI: "true" })), true);
  assert.equal(isOpenApiEnabled(createEnv({ ENABLE_OPENAPI: " TRUE " })), true);
});

test("disabled response uses the shared OpenAPI disabled error format", async () => {
  const response = createOpenApiDisabledResponse();

  assert.equal(response.status, 403);
  assert.equal(response.headers.get("Content-Type"), "application/json");
  const body = (await response.json()) as {
    error?: { code?: string; message?: string };
  };
  assert.equal(body.error?.code, "OPENAPI_DISABLED");
  assert.match(body.error?.message ?? "", /disabled/i);
});
