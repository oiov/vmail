// worker/src/app/ingestion.ts
// 深模块: 入站邮件的唯一加工口
// Interface: mapPostalToInsertEmail(mail, message, now, id) · ingestEmail(db, message, deps?)
// Implementation: 内部隐藏 PostalMime 字段映射与 insert/统计细节，映射逻辑可纯测

import { insertEmailSchema, type InsertEmail } from "../database/schema.ts";

export interface ParsedMail {
  headers?: unknown[];
  from?: unknown;
  sender?: unknown;
  replyTo?: unknown;
  deliveredTo?: string;
  returnPath?: string;
  to?: unknown[];
  cc?: unknown[];
  bcc?: unknown[];
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
  const newEmail: InsertEmail = {
    id,
    messageFrom: message.from,
    messageTo: message.to,
    headers: (mail.headers as any) || [],
    from: mail.from as any,
    sender: mail.sender as any,
    replyTo: mail.replyTo as any,
    deliveredTo: mail.deliveredTo,
    returnPath: mail.returnPath,
    to: mail.to as any,
    cc: mail.cc as any,
    bcc: mail.bcc as any,
    subject: mail.subject,
    messageId: mail.messageId as any,
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
