// worker/src/app/ingestion.ts
// 深模块: 入站邮件的唯一加工口
// Interface: mapPostalToInsertEmail(mail, message, now, id) · ingestEmail(db, message, deps?)
// Implementation: 内部隐藏 PostalMime 字段映射与 insert/统计细节，映射逻辑可纯测

import {
  type Address,
  type Header,
  insertEmailSchema,
  type InsertEmail,
} from "../database/schema.ts";

// PostalMime 解析出的地址对象形状（address 必有，name 可缺省）
export interface ParsedAddress {
  address: string;
  name?: string;
}

// 与 schema 的 Header[]/Address/Address[] 结构对齐，映射层不再需要宽化断言
export interface ParsedMail {
  headers?: Header[];
  from?: Address;
  sender?: Address;
  replyTo?: Address[];
  deliveredTo?: string;
  returnPath?: string;
  to?: Address[];
  cc?: Address[];
  bcc?: Address[];
  subject?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string;
  date?: string;
  html?: string;
  text?: string;
}

export interface ForwardableEmailLike {
  from: string;
  to: string;
  raw: ReadableStream | string;
  setReject?: (reason: string) => void;
}

export function mapPostalToInsertEmail(
  mail: ParsedMail,
  message: Pick<ForwardableEmailLike, "from" | "to">,
  now: Date,
  id: string,
): InsertEmail {
  // parse 入参允许缺省字段（如 messageId），由 schema 校验把门；parse 返回值才是 InsertEmail
  const newEmail: Omit<InsertEmail, "messageId"> & { messageId?: string } = {
    id,
    messageFrom: message.from,
    messageTo: message.to,
    headers: mail.headers || [],
    from: mail.from ?? { address: message.from, name: "" },
    sender: mail.sender,
    replyTo: mail.replyTo,
    deliveredTo: mail.deliveredTo,
    returnPath: mail.returnPath,
    to: mail.to,
    cc: mail.cc,
    bcc: mail.bcc,
    subject: mail.subject,
    messageId: mail.messageId,
    inReplyTo: mail.inReplyTo,
    references: mail.references,
    date: mail.date,
    html: mail.html,
    text: mail.text,
    createdAt: now,
    updatedAt: now,
  };
  return insertEmailSchema.parse(newEmail);
}
