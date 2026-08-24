// worker/src/env.ts — 共享绑定类型，深模块与浅入口共用
// 单源为 wrangler types 生成的 worker-configuration.d.ts (Cloudflare.Env)，
// 本文件仅做转发，避免手写 Env 与生成类型漂移（review S5）。
export type Env = Cloudflare.Env;
