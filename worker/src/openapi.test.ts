import assert from 'node:assert/strict';
import test from 'node:test';
import { createOpenApiDisabledResponse, isOpenApiEnabled } from './openapi.ts';

function createEnv(overrides: { ENABLE_OPENAPI?: string } = {}) {
  return overrides;
}

test('OpenAPI access is enabled by default when env var is missing', () => {
  assert.equal(isOpenApiEnabled(createEnv()), true);
});

test('OpenAPI access is disabled only when ENABLE_OPENAPI is false', () => {
  assert.equal(isOpenApiEnabled(createEnv({ ENABLE_OPENAPI: 'false' })), false);
  assert.equal(isOpenApiEnabled(createEnv({ ENABLE_OPENAPI: 'FALSE' })), false);
  assert.equal(isOpenApiEnabled(createEnv({ ENABLE_OPENAPI: 'true' })), true);
});

test('disabled response uses the shared OpenAPI disabled error format', async () => {
  const response = createOpenApiDisabledResponse();

  assert.equal(response.status, 403);
  assert.equal(response.headers.get('Content-Type'), 'application/json');
  const body = await response.json() as { error?: { code?: string; message?: string } };
  assert.equal(body.error?.code, 'OPENAPI_DISABLED');
  assert.match(body.error?.message ?? '', /disabled/i);
});
