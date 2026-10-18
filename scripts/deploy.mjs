import { spawnSync } from "node:child_process";
import fs from "node:fs";
if (fs.existsSync(".env")) process.loadEnvFile(".env");
const env = {
  ...process.env,
  CLOUDFLARE_API_TOKEN:
    process.env.CLOUDFLARE_API_TOKEN ?? process.env.CF_API_TOKEN,
  CLOUDFLARE_ACCOUNT_ID:
    process.env.CLOUDFLARE_ACCOUNT_ID ?? process.env.CF_ACCOUNT_ID,
};
function run(args, options = {}) {
  const result = spawnSync(args[0], args.slice(1), {
    stdio: "inherit",
    env,
    ...options,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
  return result;
}
run(["node", "scripts/configure.mjs"]);
run(["pnpm", "test"]);
run(["pnpm", "typecheck"]);
run(["pnpm", "build"]);
run([
  "pnpm",
  "exec",
  "wrangler",
  "d1",
  "migrations",
  "apply",
  "DB",
  "--remote",
  "--config",
  "wrangler.deploy.toml",
]);
const secretData = run(["node", "scripts/configure.mjs", "--secrets-json"], {
  stdio: ["ignore", "pipe", "inherit"],
}).stdout;
run(
  [
    "pnpm",
    "exec",
    "wrangler",
    "secret",
    "bulk",
    "--config",
    "wrangler.deploy.toml",
  ],
  { input: secretData, stdio: ["pipe", "inherit", "inherit"] },
);
run(["pnpm", "exec", "wrangler", "deploy", "--config", "wrangler.deploy.toml"]);
