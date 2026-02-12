import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import * as z from "zod";

// ==================== API Keys 表 ====================
export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),            // API Key 值
  keyPrefix: text("key_prefix").notNull(),        // Key 前缀用于显示 (如 vmail_xxx...)
  name: text("name"),                             // API Key 名称
  rateLimit: integer("rate_limit").default(100),  // 每分钟请求限制
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  lastUsedAt: integer("last_used_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const insertApiKeySchema = createInsertSchema(apiKeys);
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

// ==================== Mailboxes 表 ====================
export const mailboxes = sqliteTable("mailboxes", {
  id: text("id").primaryKey(),
  address: text("address").notNull().unique(),    // 完整邮箱地址
  domain: text("domain").notNull(),               // 邮箱域名
  expiresAt: integer("expires_at", { mode: "timestamp" }),
  apiKeyId: text("api_key_id").notNull(),         // 关联的 API Key ID
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const insertMailboxSchema = createInsertSchema(mailboxes);
export type InsertMailbox = z.infer<typeof insertMailboxSchema>;
export type Mailbox = typeof mailboxes.$inferSelect;

// 定义 Header 类型，用于存储邮件头信息
export type Header = Record<string, string>;

// 定义 Address 类型，用于存储发件人、收件人等地址信息
export type Address = {
  address: string;
  name: string;
};

// 定义 Email 类型，通过 drizzle-orm 从数据库表结构推断得出
export type Email = typeof emails.$inferSelect;

// 使用 drizzle-orm 定义 emails 表的结构
export const emails = sqliteTable("emails", {
  id: text("id").primaryKey(),
  messageFrom: text("message_from").notNull(),
  messageTo: text("message_to").notNull(),
  headers: text("headers", { mode: "json" }).$type<Header[]>().notNull(),
  from: text("from", { mode: "json" }).$type<Address>().notNull(),
  sender: text("sender", { mode: "json" }).$type<Address>(),
  replyTo: text("reply_to", { mode: "json" }).$type<Address[]>(),
  deliveredTo: text("delivered_to"),
  returnPath: text("return_path"),
  to: text("to", { mode: "json" }).$type<Address[]>(),
  cc: text("cc", { mode: "json" }).$type<Address[]>(),
  bcc: text("bcc", { mode: "json" }).$type<Address[]>(),
  subject: text("subject"),
  messageId: text("message_id").notNull(),
  inReplyTo: text("in_reply_to"),
  references: text("references"),
  date: text("date"),
  html: text("html"),
  text: text("text"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// 使用 Zod 定义 Address 对象的验证 schema
const AddressSchema = z.object({
  address: z.string(),
  name: z.string(),
});

// 使用 drizzle-zod 基于 emails 表结构创建用于插入操作的 Zod schema
export const insertEmailSchema = createInsertSchema(emails, {
  headers: z.array(z.record(z.string())),
  from: AddressSchema,
  sender: AddressSchema.optional(),
  replyTo: z.array(AddressSchema).optional(),
  to: z.array(AddressSchema).optional(),
  cc: z.array(AddressSchema).optional(),
  bcc: z.array(AddressSchema).optional(),
});

// 定义 InsertEmail 类型，从 Zod schema 推断
export type InsertEmail = z.infer<typeof insertEmailSchema>;

// ==================== Site Stats 表 ====================
export const siteStats = sqliteTable("site_stats", {
  id: text("id").primaryKey(),                    // 统计项 ID (固定为 'global')
  totalAddressesCreated: integer("total_addresses_created").default(0).notNull(),  // 累计创建邮址数量
  totalEmailsReceived: integer("total_emails_received").default(0).notNull(),       // 累计接收邮件数量
  totalApiCalls: integer("total_api_calls").default(0).notNull(),                   // 累计 API 调用次数
  totalApiKeysCreated: integer("total_api_keys_created").default(0).notNull(),     // 累计创建 API Key 数量
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type SiteStats = typeof siteStats.$inferSelect;