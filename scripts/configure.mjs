import fs from "node:fs";
import process from "node:process";
if (fs.existsSync(".env")) process.loadEnvFile(".env");
const env = process.env;
const secrets = [
  "MAILBOX_TOKEN_SECRET",
  "BETTER_AUTH_SECRET",
  "API_KEY_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "TURNSTILE_SECRET",
  "PASSWORD",
  "RESEND_API_KEY",
  "MAILCHANNELS_API_KEY",
  "ADMIN_EMAILS",
];
const optional = ["TURNSTILE_KEY", "SHOW_AFF", "SEND_CHANNEL", "SENDER_EMAIL"];
const numbers = {
  API_RATE_LIMIT_PER_MINUTE: 30,
  API_DAILY_LIMIT: 1000,
  MAILBOX_DAILY_LIMIT: 20,
  MAX_ACTIVE_MAILBOXES: 20,
  GLOBAL_API_DAILY_LIMIT: 100000,
  GLOBAL_INBOUND_DAILY_LIMIT: 100000,
  MAILBOX_INBOUND_DAILY_LIMIT: 100,
  MAX_EMAIL_BYTES: 262144,
  SEND_RATE_LIMIT_PER_MINUTE: 3,
  SEND_IP_RATE_LIMIT_PER_MINUTE: 10,
};
const enabled = env.ENABLE_OPENAPI?.trim().toLowerCase() === "true";
const required = [
  "D1_DATABASE_NAME",
  "D1_DATABASE_ID",
  "EMAIL_DOMAIN",
  "MAILBOX_TOKEN_SECRET",
];
const oauth = [
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "API_KEY_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
];
if (enabled) required.push(...oauth);
const missing = required.filter(
  (name) => !env[name]?.trim() || env[name].startsWith("replace-with-"),
);
if (missing.length) {
  console.error(
    "Deployment configuration is incomplete. Missing: " + missing.join(", "),
  );
  console.error("Upgrade instructions: docs/UPGRADE.md / docs/UPGRADE.en.md");
  process.exit(1);
}
for (const name of [
  "MAILBOX_TOKEN_SECRET",
  "BETTER_AUTH_SECRET",
  "API_KEY_SECRET",
])
  if (env[name] && env[name].length < 32) {
    console.error(name + " must contain at least 32 characters.");
    process.exit(1);
  }
if (env.BETTER_AUTH_URL) {
  const url = new URL(env.BETTER_AUTH_URL);
  if (
    url.protocol !== "https:" ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    console.error(
      "BETTER_AUTH_URL must be your HTTPS site origin, without a path.",
    );
    process.exit(1);
  }
}
if (Boolean(env.TURNSTILE_KEY) !== Boolean(env.TURNSTILE_SECRET)) {
  console.error("Set both TURNSTILE_KEY and TURNSTILE_SECRET.");
  process.exit(1);
}
if (!env.ADMIN_EMAILS)
  console.warn(
    "No bootstrap administrator configured. Set ADMIN_EMAILS to your verified OAuth email. New users are ordinary users.",
  );
if (!enabled)
  console.warn(
    "Public API remains disabled. Complete OAuth settings before setting ENABLE_OPENAPI=true.",
  );
if (oauth.some((name) => !env[name]))
  console.warn(
    "OAuth sign-in is not fully configured; the login dialog will show a setup message.",
  );
let config = fs.readFileSync("wrangler.toml", "utf8");
const vars = {
  EMAIL_DOMAIN: env.EMAIL_DOMAIN,
  BETTER_AUTH_URL: env.BETTER_AUTH_URL ?? "",
  ENABLE_OPENAPI: String(enabled),
  SUSPEND_DATABASE_ACCESS:
    env.SUSPEND_DATABASE_ACCESS === "true" ? "true" : "false",
};
for (const name of optional) vars[name] = env[name] ?? "";
for (const [name, fallback] of Object.entries(numbers)) {
  const value = env[name] ? Number(env[name]) : fallback;
  if (!Number.isSafeInteger(value) || value <= 0) {
    console.error(name + " must be a positive integer.");
    process.exit(1);
  }
  vars[name] = String(value);
}
if (vars.SEND_CHANNEL === "send_email") vars.SEND_CHANNEL = "cloudflare";
if (
  vars.SEND_CHANNEL &&
  (!["resend", "mailchannels", "cloudflare"].includes(vars.SEND_CHANNEL) ||
    !vars.SENDER_EMAIL)
) {
  console.error("Configure a supported SEND_CHANNEL and SENDER_EMAIL.");
  process.exit(1);
}
if (
  (vars.SEND_CHANNEL === "resend" && !env.RESEND_API_KEY) ||
  (vars.SEND_CHANNEL === "mailchannels" && !env.MAILCHANNELS_API_KEY)
) {
  console.error("Sender provider secret is missing.");
  process.exit(1);
}
config = config
  .replace(
    /database_name = .*\n/,
    "database_name = " + JSON.stringify(env.D1_DATABASE_NAME) + "\n",
  )
  .replace(
    /database_id = .*\n/,
    "database_id = " + JSON.stringify(env.D1_DATABASE_ID) + "\n",
  );
config = config.replace(
  /\[vars\][\s\S]*?(?=\n\[)/,
  "[vars]\n" +
    Object.entries(vars)
      .map(([name, value]) => name + " = " + JSON.stringify(value))
      .join("\n") +
    "\n",
);
if (!process.argv.includes("--check"))
  fs.writeFileSync("wrangler.deploy.toml", config);
if (process.argv.includes("--secrets-json")) {
  // Pipe directly to wrangler secret bulk. Never log this output.
  process.stdout.write(
    JSON.stringify(
      Object.fromEntries(
        secrets.filter((name) => env[name]).map((name) => [name, env[name]]),
      ),
    ),
  );
} else {
  console.log(
    "Configuration validated. " +
      (process.argv.includes("--check")
        ? ""
        : "Generated wrangler.deploy.toml without secrets."),
  );
  console.log(
    "Upgrade changes: legacy API keys are disabled; legacy mailbox passwords no longer authorize access.",
  );
  if (env.BETTER_AUTH_URL)
    for (const provider of ["github", "google"])
      console.log(
        provider +
          " callback: " +
          new URL("/api/auth/callback/" + provider, env.BETTER_AUTH_URL).href,
      );
}
