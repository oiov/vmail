import { z } from "zod";

export type SendChannel = "resend" | "mailchannels" | "cloudflare";

export interface SenderEnv {
  SEND_CHANNEL?: string;
  SENDER_EMAIL?: string;
  RESEND_API_KEY?: string;
  MAILCHANNELS_API_KEY?: string;
  MAILBOX_TOKEN_SECRET?: string;
  SEND_EMAIL?: { send(message: any): Promise<void> };
}

const emailAddress = z.string().trim().email().max(254);
const senderName = z
  .string()
  .trim()
  .max(100)
  .refine(
    (value) => !/[\r\n]/.test(value),
    "Header values cannot contain line breaks",
  );
const subject = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .refine(
    (value) => !/[\r\n]/.test(value),
    "Header values cannot contain line breaks",
  );

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

interface MailboxTokenPayload {
  v: 1;
  address: string;
  expiresAt: number;
}

const textEncoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export function getConfiguredSendChannel(env: SenderEnv): SendChannel | null {
  if (!env.MAILBOX_TOKEN_SECRET || !env.SENDER_EMAIL) {
    return null;
  }

  switch (env.SEND_CHANNEL) {
    case "resend":
      return env.RESEND_API_KEY ? "resend" : null;
    case "mailchannels":
      return env.MAILCHANNELS_API_KEY ? "mailchannels" : null;
    case "cloudflare":
    case "send_email": // Deprecated compatibility alias.
      return env.SEND_EMAIL ? "cloudflare" : null;
    default:
      return null;
  }
}

export function isAllowedMailboxAddress(
  address: string,
  emailDomains: string,
): boolean {
  const normalizedAddress = address.trim().toLowerCase();
  const separatorIndex = normalizedAddress.lastIndexOf("@");
  if (separatorIndex <= 0 || separatorIndex === normalizedAddress.length - 1) {
    return false;
  }

  const domain = normalizedAddress.slice(separatorIndex + 1);
  return emailDomains
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(domain);
}

export async function createMailboxToken(
  address: string,
  secret: string,
  now: number = Date.now(),
  ttlSeconds: number = 24 * 60 * 60,
): Promise<string> {
  const payload: MailboxTokenPayload = {
    v: 1,
    address: address.trim().toLowerCase(),
    expiresAt: now + ttlSeconds * 1000,
  };
  const encodedPayload = bytesToBase64Url(
    textEncoder.encode(JSON.stringify(payload)),
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    await importHmacKey(secret),
    textEncoder.encode(encodedPayload),
  );

  return `${encodedPayload}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifyMailboxToken(
  token: string,
  secret: string,
  now: number = Date.now(),
): Promise<string | null> {
  try {
    const [encodedPayload, encodedSignature, extra] = token.split(".");
    if (!encodedPayload || !encodedSignature || extra) {
      return null;
    }

    const validSignature = await crypto.subtle.verify(
      "HMAC",
      await importHmacKey(secret),
      base64UrlToBytes(encodedSignature),
      textEncoder.encode(encodedPayload),
    );
    if (!validSignature) {
      return null;
    }

    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(encodedPayload)),
    ) as MailboxTokenPayload;

    if (
      payload.v !== 1 ||
      typeof payload.address !== "string" ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= now
    ) {
      return null;
    }

    return payload.address;
  } catch {
    return null;
  }
}

export function getBearerToken(authorizationHeader?: string): string | null {
  const match = authorizationHeader?.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] ?? null;
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function senderAttribution(message: OutgoingEmail): string {
  return message.senderName
    ? `${message.senderName} <${message.replyTo}>`
    : message.replyTo;
}

export function appendSenderAttribution(message: OutgoingEmail): string {
  const attribution = senderAttribution(message);
  if (message.type === "text/html") {
    return `${message.content}<hr style="border:0;border-top:1px solid #e0e0e0;margin-top:24px"/><p style="font-size:12px;color:#666;">Reply-To: ${escapeHtml(attribution)}</p>`;
  }
  return `${message.content}\n\n--\nReply-To: ${attribution}`;
}

export function getProviderSenderName(message: OutgoingEmail): string {
  return message.senderName ? `${message.senderName} via Vmail` : "Vmail";
}

export function buildResendPayload(
  message: OutgoingEmail,
  senderEmail: string,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    from: `${getProviderSenderName(message)} <${senderEmail}>`,
    to: [message.receiverEmail],
    reply_to: message.replyTo,
    subject: message.subject,
  };

  if (message.type === "text/html") {
    payload.html = appendSenderAttribution(message);
  } else {
    payload.text = appendSenderAttribution(message);
  }

  return payload;
}

export function buildMailChannelsPayload(
  message: OutgoingEmail,
  senderEmail: string,
): Record<string, unknown> {
  return {
    personalizations: [{ to: [{ email: message.receiverEmail }] }],
    from: {
      email: senderEmail,
      name: getProviderSenderName(message),
    },
    reply_to: { email: message.replyTo },
    subject: message.subject,
    content: [
      {
        type: message.type,
        value: appendSenderAttribution(message),
      },
    ],
  };
}
