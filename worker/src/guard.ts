import type { Context, Next } from "hono";
import type { Env } from "./index";
import { GLOBAL_SHARDS, positive, shardLimit } from "./limits";
import { hashToken } from "./key-token";
export function failure(
  code: string,
  message: string,
  status = 429,
  retryAfter = 60,
) {
  return Response.json(
    { error: { code, message }, message },
    {
      status,
      headers: {
        "Retry-After": String(retryAfter),
        "Cache-Control": "no-store",
      },
    },
  );
}
/** Fixed shards have disjoint budgets: their sum never exceeds the global cap. */
export async function globalBudget(env: Env, actor: string, category = "http") {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(actor),
  );
  const shard = new Uint8Array(digest)[0] % GLOBAL_SHARDS;
  const total = positive(
    category === "inbound"
      ? env.GLOBAL_INBOUND_DAILY_LIMIT
      : env.GLOBAL_API_DAILY_LIMIT,
    category === "inbound" ? 100_000 : 100_000,
  );
  return env.ACCESS.getByName("global:" + category + ":" + shard).consume([
    { key: "day", seconds: 86400, max: shardLimit(total, shard) },
  ]);
}
export async function edgeGuard(c: Context<{ Bindings: Env }>, next: Next) {
  if (c.req.method === "OPTIONS") return next();
  const ip = c.req.header("CF-Connecting-IP") ?? "local";
  if (!(await c.env.EDGE_IP.limit({ key: ip })).success)
    return failure("RATE_LIMITED", "Too many requests");
  const key = c.req.header("X-API-Key") ?? c.req.header("Authorization");
  if (
    key &&
    (key.length > 1024 ||
      !(await c.env.EDGE_KEY.limit({ key: await hashToken(key) })).success)
  )
    return failure("RATE_LIMITED", "Too many requests");
  await next();
}
export async function reserveGlobal(env: Env, actor: string) {
  if (env.SUSPEND_DATABASE_ACCESS === "true")
    return failure("SERVICE_PAUSED", "Service temporarily paused", 503);
  const result = await globalBudget(env, actor);
  return result.allowed
    ? null
    : failure(
        "GLOBAL_QUOTA_EXCEEDED",
        "Daily service capacity reached",
        429,
        result.retryAfter,
      );
}
