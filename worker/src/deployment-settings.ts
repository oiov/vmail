import type { Env } from "./index";
import { version } from "../../package.json";
import { authReady } from "./auth";
import { isOpenApiEnabled } from "./openapi";
import { getConfiguredSendChannel } from "./sender";
import { MAX_API_KEYS, positive } from "./limits";
/** Explicit allowlist: never serialize the environment or secret values. */
export function deploymentSettings(env: Env) {
  const publicNames = [
    "EMAIL_DOMAIN",
    "BETTER_AUTH_URL",
    "ADMIN_EMAILS",
    "GITHUB_CLIENT_ID",
    "GOOGLE_CLIENT_ID",
    "TURNSTILE_KEY",
    "ENABLE_OPENAPI",
    "SHOW_AFF",
    "SEND_CHANNEL",
    "SENDER_EMAIL",
    "SUSPEND_DATABASE_ACCESS",
  ] as const;
  const quotas = {
    API_RATE_LIMIT_PER_MINUTE: 30,
    API_DAILY_LIMIT: 1000,
    MAILBOX_DAILY_LIMIT: 20,
    MAX_ACTIVE_MAILBOXES: 20,
    GLOBAL_API_DAILY_LIMIT: 100000,
    GLOBAL_INBOUND_DAILY_LIMIT: 100000,
    MAILBOX_INBOUND_DAILY_LIMIT: 100,
    MAX_EMAIL_BYTES: 262144,
  };
  const secretNames = [
    "BETTER_AUTH_SECRET",
    "API_KEY_SECRET",
    "MAILBOX_TOKEN_SECRET",
    "GITHUB_CLIENT_SECRET",
    "GOOGLE_CLIENT_SECRET",
    "TURNSTILE_SECRET",
    "PASSWORD",
    "RESEND_API_KEY",
    "MAILCHANNELS_API_KEY",
    "COOKIES_SECRET",
  ] as const;
  const variables: {
    name: string;
    value: string | null;
    configured: boolean;
    secret: boolean;
    effective: number | null;
  }[] = publicNames.map((name) => ({
    name,
    value: env[name] ?? "",
    configured: !!env[name],
    secret: false,
    effective: null as number | null,
  }));
  for (const [name, fallback] of Object.entries(quotas)) {
    const value = env[name as keyof typeof quotas];
    variables.push({
      name,
      value: value ?? "",
      configured: !!value,
      secret: false,
      effective: positive(value, fallback),
    });
  }
  for (const name of [
    "SEND_RATE_LIMIT_PER_MINUTE",
    "SEND_IP_RATE_LIMIT_PER_MINUTE",
  ] as const)
    variables.push({
      name,
      value: env[name] ?? "",
      configured: !!env[name],
      secret: false,
      effective: null,
    });
  const send = getConfiguredSendChannel(env);
  return {
    version,
    checkedAt: new Date().toISOString(),
    features: [
      { name: "openApi", enabled: isOpenApiEnabled(env) },
      { name: "authentication", enabled: authReady(env) },
      {
        name: "github",
        enabled: !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
      },
      {
        name: "google",
        enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      },
      {
        name: "turnstile",
        enabled: !!(env.TURNSTILE_KEY && env.TURNSTILE_SECRET),
      },
      { name: "sitePassword", enabled: !!env.PASSWORD },
      { name: "mailboxSigning", enabled: !!env.MAILBOX_TOKEN_SECRET },
      { name: "outboundEmail", enabled: !!send },
      { name: "promotion", enabled: env.SHOW_AFF === "true" },
      {
        name: "databasePaused",
        enabled: env.SUSPEND_DATABASE_ACCESS === "true",
      },
    ],
    sendChannel: send,
    maxApiKeys: MAX_API_KEYS,
    variables: [
      ...variables,
      ...secretNames.map((name) => ({
        name,
        value: null,
        configured: !!env[name],
        secret: true,
        effective: null,
      })),
    ],
    bindings: [
      "DB",
      "ACCESS",
      "ASSETS",
      "EDGE_IP",
      "EDGE_KEY",
      "SEND_EMAIL",
    ].map((name) => ({ name, configured: !!env[name as keyof Env] })),
  };
}
