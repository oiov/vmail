// worker/src/database/dao.ts — 兼容转发层（真实实现已分至 emails.ts / mailboxes.ts / stats.ts）
// 保留此文件使既有 import { ... } from './dao' / '../database/dao' 继续可用
export * from "./emails.ts";
export * from "./mailboxes.ts";
export * from "./stats.ts";
// 显式重导出以保持类型检查稳定（兼容 origin 的 import type ... from './dao'）
export type {
  InsertEmail,
  InsertMailbox,
  InsertApiKey,
  ApiKey,
  Mailbox,
  Email,
  Header,
  Address,
  SiteStats,
  DailyStats,
  ApiRateLimitWindow,
} from "./schema.ts";
