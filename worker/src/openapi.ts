import type { Context, Next } from 'hono';

interface OpenApiEnv {
  ENABLE_OPENAPI?: string;
}

export function isOpenApiEnabled(env: OpenApiEnv): boolean {
  return env.ENABLE_OPENAPI?.trim().toLowerCase() !== 'false';
}

export function createOpenApiDisabledResponse(): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: 'OPENAPI_DISABLED',
        message: 'OpenAPI access is disabled by the site administrator. Please self-host Vmail if you need API access.',
      },
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );
}

export async function requireOpenApi(
  c: Context<{ Bindings: OpenApiEnv }>,
  next: Next,
) {
  if (!isOpenApiEnabled(c.env)) {
    return createOpenApiDisabledResponse();
  }

  await next();
}
