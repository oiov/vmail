import type { Context, Next } from "hono";
import type { Env } from "../../../index";
import { getKeyOwner, hashToken } from "../../../key-token";
import { failure, reserveGlobal } from "../../../guard";
import { positive } from "../../../limits";
export const apiKeyAuth = async (
  c: Context<{
    Bindings: Env;
    Variables: { apiKey: { id: string; userId: string; rateLimit: number } };
  }>,
  next: Next,
) => {
  const token =
    c.req.header("X-API-Key") ??
    c.req.header("Authorization")?.replace(/^Bearer /, "");
  if (!token || !c.env.API_KEY_SECRET)
    return failure("UNAUTHORIZED", "API key required", 401);
  const owner = await getKeyOwner(token, c.env.API_KEY_SECRET);
  if (!owner) return failure("UNAUTHORIZED", "Invalid API key", 401);
  const rateLimit = positive(c.env.API_RATE_LIMIT_PER_MINUTE, 30);
  const rules = [
    { key: "api-minute", seconds: 60, max: rateLimit },
    {
      key: "api-day",
      seconds: 86400,
      max: positive(c.env.API_DAILY_LIMIT, 1000),
    },
  ];
  if (c.req.method === "POST" && /\/mailboxes\/?$/.test(c.req.path))
    rules.push({
      key: "create-day",
      seconds: 86400,
      max: positive(c.env.MAILBOX_DAILY_LIMIT, 20),
    });
  const decision = await c.env.ACCESS.getByName("user:" + owner).authorize(
    await hashToken(token),
    rules,
    owner,
  );
  if (!decision.valid)
    return failure("UNAUTHORIZED", "API key revoked or expired", 401);
  if (!decision.allowed)
    return failure(
      "QUOTA_EXCEEDED",
      "Shared user quota exceeded",
      429,
      decision.retryAfter,
    );
  const budget = await reserveGlobal(c.env, owner);
  if (budget) return budget;
  c.set("apiKey", { id: decision.id, userId: owner, rateLimit });
  c.header("X-RateLimit-Remaining", String(decision.remaining));
  await next();
};
