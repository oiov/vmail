import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import * as z from "zod";

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