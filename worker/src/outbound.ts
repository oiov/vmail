// worker/src/outbound.ts
// 深模块: 出站邮件（渠道选择 + Provider Payload + Cloudflare MIME）的唯一出口
// Interface: getConfiguredSendChannel(env) + build*Payload + buildCloudflareMimeMessage + sendEmail(env, outgoing)
// Implementation: 内部封装 Resend/MailChannels/Cloudflare 三个 Adapter 的分支
import { z } from "zod";
import { createMimeMessage, Mailbox } from "mimetext/browser";

export type SendChannel = "resend" | "mailchannels" | "cloudflare";
export interface SenderEnv {
  SEND_CHANNEL?: string;
  SENDER_EMAIL?: string;
  RESEND_API_KEY?: string;
  MAILCHANNELS_API_KEY?: string;
  MAILBOX_TOKEN_SECRET?: string;
  // 与 Cloudflare 官方绑定一致: SendEmail.send 返回 Promise<EmailSendResult>
  // （wrangler types 生成的 Env.SEND_EMAIL 即此形状，勿再手写窄化签名）
  SEND_EMAIL?: SendEmail;
}

const emailAddress = z.string().trim().email().max(254);
const senderName = z
  .string()
  .trim()
  .max(100)
  .refine((v) => !/[\r\n]/.test(v), "Header values cannot contain line breaks");
const subject = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .refine((v) => !/[\r\n]/.test(v), "Header values cannot contain line breaks");

export const sendRequestSchema = z
  .object({
    senderName: senderName.optional().default(""),
    receiverEmail: emailAddress,
    subject,
    content: z.string().min(1).max(100_000),
    type: z.enum(["text/plain", "text/html"]).default("text/plain"),
  })
  .strict();

export type SendRequest = z.infer<typeof sendRequestSchema>;
export interface OutgoingEmail extends SendRequest {
  replyTo: string;
}

export function getConfiguredSendChannel(env: SenderEnv): SendChannel | null {
  if (!env.MAILBOX_TOKEN_SECRET || !env.SENDER_EMAIL) return null;
  switch (env.SEND_CHANNEL) {
    case "resend":
      return env.RESEND_API_KEY ? "resend" : null;
    case "mailchannels":
      return env.MAILCHANNELS_API_KEY ? "mailchannels" : null;
    case "cloudflare":
    case "send_email":
      return env.SEND_EMAIL ? "cloudflare" : null;
    default:
      return null;
  }
}

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      (
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }) as Record<string, string>
      )[c]!,
  );
}
// RFC 5322 显示名加引号并转义，防止名称中的 <> 被解析成第二个地址 token
// （schema 已挡 CRLF 注入，这里补引号层防御，CodeRabbit PR#39 #3586）
export function quoteDisplayName(name: string): string {
  return `"${name.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
function senderAttribution(m: OutgoingEmail): string {
  return m.senderName ? `${m.senderName} <${m.replyTo}>` : m.replyTo;
}
export function appendSenderAttribution(m: OutgoingEmail): string {
  const a = senderAttribution(m);
  if (m.type === "text/html")
    return `${m.content}<hr style="border:0;border-top:1px solid #e0e0e0;margin-top:24px"/><p style="font-size:12px;color:#666;">Reply-To: ${escapeHtml(a)}</p>`;
  return `${m.content}\n\n--\nReply-To: ${a}`;
}
// review-A1: 返回裸名——MailChannels/Cloudflare 走结构化 name 字段，
// provider 侧自行做 RFC2047 编码；引号层防御只属于 Resend 的字符串插值路径，
// 在共享层包引号会被 mimetext 当普通字符二次编码，收件方看到带字面引号的显示名
export function getProviderSenderName(m: OutgoingEmail): string {
  return m.senderName ? `${m.senderName} via Vmail` : "Vmail";
}

export function buildResendPayload(
  m: OutgoingEmail,
  senderEmail: string,
): Record<string, unknown> {
  const p: Record<string, unknown> = {
    // Resend from 是字符串插值，加引号防名称中的 <> 解析成第二个地址 token
    from: quoteDisplayName(getProviderSenderName(m)) + " <" + senderEmail + ">",
    to: [m.receiverEmail],
    reply_to: m.replyTo,
    subject: m.subject,
  };
  if (m.type === "text/html") p.html = appendSenderAttribution(m);
  else p.text = appendSenderAttribution(m);
  return p;
}
export function buildMailChannelsPayload(
  m: OutgoingEmail,
  senderEmail: string,
): Record<string, unknown> {
  return {
    personalizations: [{ to: [{ email: m.receiverEmail }] }],
    from: { email: senderEmail, name: getProviderSenderName(m) },
    reply_to: { email: m.replyTo },
    subject: m.subject,
    content: [{ type: m.type, value: appendSenderAttribution(m) }],
  };
}
export function buildCloudflareMimeMessage(
  m: OutgoingEmail,
  senderEmail: string,
): string {
  const mime = createMimeMessage();
  mime.setSender({ name: getProviderSenderName(m), addr: senderEmail });
  mime.setRecipient(m.receiverEmail);
  mime.setSubject(m.subject);
  mime.setHeader("Reply-To", new Mailbox(m.replyTo));
  mime.addMessage({ contentType: m.type, data: appendSenderAttribution(m) });
  return mime.asRaw();
}

// 深模块统一发件入口 — 隐藏三分支，调用方只处理成功/异常
// EmailMessage 仅在 Cloudflare Worker 运行时存在，不在 Node 测试中静态导入
export async function sendEmail(
  env: SenderEnv,
  outgoing: OutgoingEmail,
): Promise<SendChannel> {
  const channel = getConfiguredSendChannel(env);
  if (!channel || !env.SENDER_EMAIL) throw new Error("SEND_UNAVAILABLE");
  if (channel === "resend") {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildResendPayload(outgoing, env.SENDER_EMAIL)),
      // 出站请求加超时，provider 挂起时不拖住 Worker（CodeRabbit PR#39 #3594）
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok)
      throw new Error(`Resend 发送失败: ${r.status} ${await r.text()}`);
    return channel;
  } else if (channel === "mailchannels") {
    const r = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": env.MAILCHANNELS_API_KEY!,
      },
      body: JSON.stringify(
        buildMailChannelsPayload(outgoing, env.SENDER_EMAIL),
      ),
      signal: AbortSignal.timeout(15_000),
    });
    if (!r.ok)
      throw new Error(`MailChannels 发送失败: ${r.status} ${await r.text()}`);
    return channel;
  } else {
    // 仅在 Worker 运行时解析 cloudflare:email，避免 Node 测试时静态导入失败
    // 动态导入的最小结构契约：构造器产物即官方全局 EmailMessage 类型
    interface CloudflareEmailModule {
      EmailMessage: new (from: string, to: string, raw: string) => EmailMessage;
    }
    const emailMod = (await import("cloudflare:email").catch(
      () => null,
    )) as CloudflareEmailModule | null;
    if (!emailMod?.EmailMessage)
      throw new Error("SEND_UNAVAILABLE: 当前运行时 SEND_EMAIL 绑定不可用");
    const msg = new emailMod.EmailMessage(
      env.SENDER_EMAIL,
      outgoing.receiverEmail,
      buildCloudflareMimeMessage(outgoing, env.SENDER_EMAIL),
    );
    // emailMod 动态导入自 cloudflare:email，运行时类型与官方 SendEmail 参数一致
    await env.SEND_EMAIL!.send(msg);
    return channel;
  }
}
