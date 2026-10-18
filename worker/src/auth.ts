import { APIError } from "better-auth/api";
import { betterAuth } from "better-auth";
import { apiKey } from "@better-auth/api-key";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./auth-schema";
import type { Env } from "./index";
import { generateUserKey, hashToken } from "./key-token";
export function authReady(env: Env) {
  return Boolean(
    env.BETTER_AUTH_SECRET &&
      env.API_KEY_SECRET &&
      env.BETTER_AUTH_URL &&
      env.GITHUB_CLIENT_ID &&
      env.GITHUB_CLIENT_SECRET &&
      env.GOOGLE_CLIENT_ID &&
      env.GOOGLE_CLIENT_SECRET,
  );
}
export function createAuth(env: Env, creatingFor?: string) {
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(drizzle(env.DB), { provider: "sqlite", schema }),
    databaseHooks: {
      session: {
        create: {
          before: async (session) => {
            if (
              (
                await env.ACCESS.getByName(
                  "user:" + session.userId,
                ).accessState()
              ).banned
            )
              throw new APIError("FORBIDDEN", { message: "Account is banned" });
          },
        },
      },
    },
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID ?? "",
        clientSecret: env.GITHUB_CLIENT_SECRET ?? "",
      },
      google: {
        clientId: env.GOOGLE_CLIENT_ID ?? "",
        clientSecret: env.GOOGLE_CLIENT_SECRET ?? "",
      },
    },
    user: {
      additionalFields: {
        role: { type: "string", defaultValue: "user", input: false },
      },
    },
    session: { cookieCache: { enabled: true, maxAge: 120 } },
    advanced: { ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] } },
    // Authentication endpoints also use the atomic ledger; no isolate-local counters.
    rateLimit: {
      enabled: true,
      window: 60,
      max: 30,
      customStorage: {
        consume: async (key, rule) => {
          const result = await env.ACCESS.getByName(
            "auth:" + (await hashToken(key)),
          ).consume([{ key: "auth", max: rule.max, seconds: rule.window }]);
          return {
            allowed: result.allowed,
            retryAfter: result.allowed ? null : result.retryAfter,
          };
        },
      },
    },
    plugins: [
      apiKey({
        // Better Auth manages issuance and hashed records. The request path uses
        // the authoritative DO registry + atomic per-user quotas, not verifyApiKey
        // (which would update D1 on every verification).
        rateLimit: { enabled: false },
        keyExpiration: { defaultExpiresIn: 90, maxExpiresIn: 90 },
        customKeyGenerator: async () => {
          if (!creatingFor || !env.API_KEY_SECRET)
            throw new Error("Key issuance requires a verified session");
          return generateUserKey(creatingFor, env.API_KEY_SECRET);
        },
      }),
    ],
  });
}
