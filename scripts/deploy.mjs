import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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
  if (result.status !== 0)
    throw new Error(args[0] + " failed with exit code " + result.status);
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
// Upload secrets with the new version: old plaintext bindings are replaced atomically.
const directory = fs.mkdtempSync(path.join(os.tmpdir(), "vmail-deploy-"));
const secretFile = path.join(directory, "secrets.json");
try {
  fs.writeFileSync(secretFile, secretData, { mode: 0o600 });
  run([
    "pnpm",
    "exec",
    "wrangler",
    "deploy",
    "--config",
    "wrangler.deploy.toml",
    "--secrets-file",
    secretFile,
  ]);
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
