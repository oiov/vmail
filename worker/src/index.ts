import workerHandlers, { createApp } from "./app";
export type { Env } from "./env";
// 薄入口：Worker 的三个入口由深模块 App 统一拥有，index.ts 仅做 seam 转发
export default workerHandlers;
export { createApp };
// 兼容：保留具名导出供测试直接命中 fetch/email/scheduled seam
export const fetch = workerHandlers.fetch;
export const email = workerHandlers.email;
export const scheduled = workerHandlers.scheduled;
