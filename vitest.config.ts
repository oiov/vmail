import { defineConfig } from "vitest/config";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
export default defineConfig({
  plugins: [
    cloudflareTest({
      main: "./worker/src/index.ts",
      miniflare: {
        compatibilityDate: "2026-10-18",
        compatibilityFlags: ["nodejs_compat"],
        d1Databases: ["DB"],
        durableObjects: {
          ACCESS: { className: "AccessLedger", useSQLite: true },
        },
        bindings: {
          BETTER_AUTH_URL: "http://localhost:8787",
          BETTER_AUTH_SECRET:
            "test-auth-secret-which-is-at-least-32-characters",
          API_KEY_SECRET: "test-api-secret-which-is-at-least-32-characters",
          MAILBOX_TOKEN_SECRET: "test-mailbox-secret",
          GOOGLE_CLIENT_ID: "test",
          GOOGLE_CLIENT_SECRET: "test",
          GITHUB_CLIENT_ID: "test",
          GITHUB_CLIENT_SECRET: "test",
          EMAIL_DOMAIN: "example.test",
          ENABLE_OPENAPI: "true",
          API_RATE_LIMIT_PER_MINUTE: "30",
          API_DAILY_LIMIT: "1000",
          GLOBAL_API_DAILY_LIMIT: "100000",
          TURNSTILE_SECRET: "",
          TURNSTILE_KEY: "",
          PASSWORD: "",
        },
        ratelimits: {
          EDGE_IP: {
            namespace_id: "1001",
            simple: { limit: 10000, period: 60 },
          },
          EDGE_KEY: {
            namespace_id: "1002",
            simple: { limit: 10000, period: 60 },
          },
        },
      },
    }),
  ],
  test: {
    include: ["worker/tests/**/*.test.ts"],
    provide: { migrations: await readD1Migrations("worker/drizzle") },
    testTimeout: 30000,
  },
});
