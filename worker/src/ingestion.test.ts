import assert from "node:assert/strict";
import test from "node:test";
import { mapPostalToInsertEmail, type ParsedMail } from "./app/ingestion.ts";

test("Ingestion Module — 字段映射不丢属性且通过 schema 校验", () => {
  const now = new Date("2025-01-01T00:00:00.000Z");
  const mail: ParsedMail = {
    headers: [{ key: "x-test", value: "1" }],
    from: { address: "sender@example.com", name: "Sender" },
    sender: undefined,
    replyTo: [{ address: "reply@example.com", name: "" }],
    deliveredTo: "delivered@example.com",
    returnPath: "bounce@example.com",
    to: [{ address: "alice@wenxi.dev", name: "" }],
    cc: undefined,
    bcc: undefined,
    subject: "Hello",
    messageId: "<mid@example.com>",
    inReplyTo: undefined,
    references: undefined,
    date: "Wed, 01 Jan 2025 00:00:00 +0000",
    html: "<p>hi</p>",
    text: "hi",
  };
  const inserted = mapPostalToInsertEmail(
    mail,
    { from: "sender@example.com", to: "alice@wenxi.dev" },
    now,
    "test-id-1",
  );
  assert.equal(inserted.id, "test-id-1");
  assert.equal(inserted.messageFrom, "sender@example.com");
  assert.equal(inserted.messageTo, "alice@wenxi.dev");
  assert.equal(inserted.subject, "Hello");
  assert.equal(inserted.createdAt.toISOString(), now.toISOString());
  assert.equal(inserted.headers.length, 1);
});

test("Ingestion Module — 缺少 messageId 时 schema 校验失败", () => {
  const now = new Date();
  const mail: ParsedMail = {
    headers: [],
    from: { address: "a@b.com", name: "" },
    subject: "s",
    messageId: undefined,
  };
  assert.throws(() =>
    mapPostalToInsertEmail(
      mail,
      { from: "a@b.com", to: "b@wenxi.dev" },
      now,
      "id2",
    ),
  );
});
