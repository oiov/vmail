import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCloudflareMimeMessage,
  buildMailChannelsPayload,
  buildResendPayload,
  createMailboxToken,
  getBearerToken,
  getConfiguredSendChannel,
  isAllowedMailboxAddress,
  quoteDisplayName,
  sendRequestSchema,
  verifyMailboxToken,
  type OutgoingEmail,
} from "./sender.ts";

const configuredEnv = {
  SEND_CHANNEL: "resend",
  SENDER_EMAIL: "sender@example.com",
  RESEND_API_KEY: "test-key",
  MAILBOX_TOKEN_SECRET: "test-secret",
};

const outgoingEmail: OutgoingEmail = {
  senderName: "Alice",
  receiverEmail: "recipient@example.net",
  subject: "Hello",
  content: "Message body",
  type: "text/plain",
  replyTo: "alice@example.com",
};

test("send channel is enabled only when all required configuration exists", () => {
  assert.equal(getConfiguredSendChannel(configuredEnv), "resend");
  assert.equal(
    getConfiguredSendChannel({ ...configuredEnv, RESEND_API_KEY: "" }),
    null,
  );
  assert.equal(
    getConfiguredSendChannel({ ...configuredEnv, SENDER_EMAIL: "" }),
    null,
  );
  assert.equal(
    getConfiguredSendChannel({ ...configuredEnv, MAILBOX_TOKEN_SECRET: "" }),
    null,
  );
  assert.equal(
    getConfiguredSendChannel({ ...configuredEnv, SEND_CHANNEL: "unknown" }),
    null,
  );
  assert.equal(
    getConfiguredSendChannel({
      ...configuredEnv,
      SEND_CHANNEL: "cloudflare",
      SEND_EMAIL: { async send() {} },
    }),
    "cloudflare",
  );
  assert.equal(
    getConfiguredSendChannel({
      ...configuredEnv,
      SEND_CHANNEL: "send_email",
      SEND_EMAIL: { async send() {} },
    }),
    "cloudflare",
  );
  assert.equal(
    getConfiguredSendChannel({
      ...configuredEnv,
      SEND_CHANNEL: "cloudflare",
    }),
    null,
  );
});

test("mailbox tokens verify the signed address and reject tampering or expiry", async () => {
  const now = 1_700_000_000_000;
  const token = await createMailboxToken(
    "Alice@Example.com",
    "secret",
    now,
    60,
  );

  assert.equal(
    await verifyMailboxToken(token, "secret", now + 1_000),
    "alice@example.com",
  );
  assert.equal(
    await verifyMailboxToken(`${token}x`, "secret", now + 1_000),
    null,
  );
  assert.equal(
    await verifyMailboxToken(token, "wrong-secret", now + 1_000),
    null,
  );
  assert.equal(await verifyMailboxToken(token, "secret", now + 61_000), null);
});

test("bearer token parsing is strict", () => {
  assert.equal(getBearerToken("Bearer abc.def"), "abc.def");
  assert.equal(getBearerToken("bearer token"), "token");
  assert.equal(getBearerToken("Basic token"), null);
  assert.equal(getBearerToken("Bearer two tokens"), null);
});

test("mailbox addresses must use an explicitly configured domain", () => {
  assert.equal(
    isAllowedMailboxAddress("Alice@Example.com", "example.com, mail.test"),
    true,
  );
  assert.equal(
    isAllowedMailboxAddress("alice@sub.example.com", "example.com"),
    false,
  );
  assert.equal(isAllowedMailboxAddress("not-an-email", "example.com"), false);
});

test("send request schema rejects spoofed sender fields and header injection", () => {
  assert.equal(
    sendRequestSchema.safeParse({
      receiverEmail: "recipient@example.net",
      subject: "Hello",
      content: "Body",
      senderEmail: "spoofed@example.net",
    }).success,
    false,
  );
  assert.equal(
    sendRequestSchema.safeParse({
      receiverEmail: "recipient@example.net",
      subject: "Hello\r\nBcc: victim@example.net",
      content: "Body",
    }).success,
    false,
  );
});

test("provider payloads use the configured sender and authenticated reply-to", () => {
  const resendPayload = buildResendPayload(
    outgoingEmail,
    "verified@example.com",
  );
  assert.equal(resendPayload.from, '"Alice via Vmail" <verified@example.com>');
  assert.equal(resendPayload.reply_to, "alice@example.com");
  assert.equal(
    resendPayload.text,
    "Message body\n\n--\nReply-To: Alice <alice@example.com>",
  );

  const mailChannelsPayload = buildMailChannelsPayload(
    outgoingEmail,
    "verified@example.com",
  ) as any;
  assert.equal(mailChannelsPayload.from.email, "verified@example.com");
  assert.equal(mailChannelsPayload.reply_to.email, "alice@example.com");

  const cloudflareMime = buildCloudflareMimeMessage(
    outgoingEmail,
    "verified@example.com",
  );
  assert.match(cloudflareMime, /^From: .*<verified@example\.com>\r?$/m);
  assert.match(cloudflareMime, /^Reply-To: <alice@example\.com>\r?$/m);
  assert.match(cloudflareMime, /^To: <recipient@example\.net>\r?$/m);
});

test("display names are quoted and escaped against address-token injection", () => {
  // senderName 含 <> 时不得被解析成第二个地址 token（RFC 5322 引号层防御）
  assert.equal(quoteDisplayName("evil <a@b.c>"), '"evil <a@b.c>"');
  // String.raw 保证期望值中的反斜杠不被二次转义
  assert.equal(quoteDisplayName('say "hi"'), String.raw`"say \"hi\""`);
  const payload = buildResendPayload(
    { ...outgoingEmail, senderName: "evil <spoof@x.com>" },
    "verified@example.com",
  );
  assert.equal(
    payload.from,
    '"evil <spoof@x.com> via Vmail" <verified@example.com>',
  );
});

test("HTML attribution escapes user-controlled sender metadata", () => {
  const payload = buildResendPayload(
    {
      ...outgoingEmail,
      senderName: "<img src=x onerror=alert(1)>",
      type: "text/html",
      content: "<strong>Allowed message HTML</strong>",
    },
    "verified@example.com",
  );

  assert.match(
    payload.html as string,
    /<strong>Allowed message HTML<\/strong>/,
  );
  assert.doesNotMatch(payload.html as string, /<img src=x/);
  assert.match(payload.html as string, /&lt;img src=x onerror=alert\(1\)&gt;/);
});

// 契约(2026-08-25 review-A1): quoteDisplayName 只用于 Resend 字符串插值 from;
// MailChannels/Cloudflare 是结构化 name 字段, 由 provider 侧自行编码,
// 共享层再包引号会被 mimetext 当普通字符二次 RFC2047 编码, 收件方看到带字面引号的显示名
test("structured-field channels use bare display names (no double quoting)", async () => {
  const { buildMailChannelsPayload, buildCloudflareMimeMessage } = await import(
    "./outbound.ts"
  );
  const mailChannelsPayload = buildMailChannelsPayload(
    outgoingEmail,
    "verified@example.com",
  ) as any;
  // 结构化字段必须是裸名: 引号只属于 Resend 插值路径
  assert.equal(mailChannelsPayload.from.name, "Alice via Vmail");

  const cloudflareMime = buildCloudflareMimeMessage(
    outgoingEmail,
    "verified@example.com",
  );
  // mimetext 对裸名做 RFC2047 编码后不应包含字面双引号内容
  const fromLine = cloudflareMime
    .split(/\r?\n/)
    .find((l) => l.startsWith("From:"))!;
  if (/=?utf-8?B?[A-Za-z0-9+/=]+?=/.test(fromLine)) {
    // 解出 base64 验证显示名无字面引号
    const b64 = fromLine.match(/=\?utf-8\?B\?([A-Za-z0-9+/=]+)\?=/)![1];
    const decoded = Buffer.from(b64, "base64").toString("utf8");
    if (decoded.includes('"')) {
      throw new Error("mimetext 显示名含字面引号: " + decoded);
    }
  }
});
