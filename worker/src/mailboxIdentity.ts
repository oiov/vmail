// worker/src/mailboxIdentity.ts
// 深模块: 邮箱身份（域名白名单 + HMAC Token）的唯一真源
// Interface: MailboxIdentity 实例 — isAllowed(address) / createToken(address, now, ttl) / verifyToken(token, now)
//            纯函数 isAllowedMailboxAddress(address, csv) 保持兼容
// Implementation: EMAIL_DOMAIN 在构造时一次性解析为 Set，HMAC-SHA256 细节隐藏
// 之前: EMAIL_DOMAIN 原始 CSV 字符串每次由调用方传入，3 个路由重复 split/trim/lower 逻辑
// 之后: 调用方只传 address，解析与归一化由 Module 拥有 — locality 集中

const textEncoder = new TextEncoder();

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}
function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
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

export function parseAllowedDomains(csv: string): Set<string> {
  return new Set(
    csv
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

// 兼容旧签名的纯函数，供 index.ts / tests 直接使用
export function isAllowedMailboxAddress(
  address: string,
  emailDomains: string,
): boolean {
  const normalized = address.trim().toLowerCase();
  const sep = normalized.lastIndexOf("@");
  if (sep <= 0 || sep === normalized.length - 1) return false;
  const domain = normalized.slice(sep + 1);
  return parseAllowedDomains(emailDomains).has(domain);
}

interface MailboxTokenPayload {
  v: 1;
  address: string;
  expiresAt: number;
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
  const sig = await crypto.subtle.sign(
    "HMAC",
    await importHmacKey(secret),
    textEncoder.encode(encodedPayload),
  );
  return `${encodedPayload}.${bytesToBase64Url(new Uint8Array(sig))}`;
}

export async function verifyMailboxToken(
  token: string,
  secret: string,
  now: number = Date.now(),
): Promise<string | null> {
  try {
    const [encodedPayload, encodedSignature, extra] = token.split(".");
    if (!encodedPayload || !encodedSignature || extra) return null;
    const valid = await crypto.subtle.verify(
      "HMAC",
      await importHmacKey(secret),
      base64UrlToBytes(encodedSignature),
      textEncoder.encode(encodedPayload),
    );
    if (!valid) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(encodedPayload)),
    ) as MailboxTokenPayload;
    if (
      payload.v !== 1 ||
      typeof payload.address !== "string" ||
      typeof payload.expiresAt !== "number" ||
      payload.expiresAt <= now
    )
      return null;
    return payload.address;
  } catch {
    return null;
  }
}

export function getBearerToken(authorizationHeader?: string): string | null {
  const m = authorizationHeader?.match(/^Bearer\s+([^\s]+)$/i);
  return m?.[1] ?? null;
}

// 深模块对象：构造时固化白名单解析与 secret，调用方只关心行为
export interface MailboxIdentity {
  isAllowed(address: string): boolean;
  isAllowedDomain(domain: string): boolean;
  createToken(
    address: string,
    now?: number,
    ttlSeconds?: number,
  ): Promise<string | null>;
  verifyToken(token: string, now?: number): Promise<string | null>;
  getBearerToken(header?: string): string | null;
}

export function createMailboxIdentity(
  emailDomains: string,
  tokenSecret?: string,
): MailboxIdentity {
  const allowed = parseAllowedDomains(emailDomains);
  return {
    isAllowed(address: string): boolean {
      const n = address.trim().toLowerCase();
      const sep = n.lastIndexOf("@");
      if (sep <= 0 || sep === n.length - 1) return false;
      return allowed.has(n.slice(sep + 1));
    },
    isAllowedDomain(domain: string): boolean {
      return allowed.has(domain.trim().toLowerCase());
    },
    async createToken(
      address: string,
      now?: number,
      ttlSeconds?: number,
    ): Promise<string | null> {
      if (!tokenSecret) return null;
      return createMailboxToken(address, tokenSecret, now, ttlSeconds);
    },
    async verifyToken(token: string, now?: number): Promise<string | null> {
      if (!tokenSecret) return null;
      return verifyMailboxToken(token, tokenSecret, now);
    },
    getBearerToken,
  };
}
