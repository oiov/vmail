// worker/src/app/siteGate.ts
// 深模块: 站点门禁的唯一真源
// Interface: createSiteGateCookie(password) · isSiteUnlocked(request, env) · shouldBypassSiteGate(pathname) · SITE_AUTH_COOKIE
// Implementation: cookie 值为 <expiryMs>.<HMAC-SHA256(expiryMs, PASSWORD)>，内部隐藏 PASSWORD==空即放行、签名校验细节
// 之前: index.ts 的 2 个函数与 1 个常量散落在 688 行 God-Module 中，无独立测试面
// 之后: 行为通过一个小接口测试，修改锁逻辑只需改此 Module

export const SITE_AUTH_COOKIE = "vmail_site_auth";

// 门禁 cookie 有效期（与旧版 Max-Age=86400 一致）
export const SITE_GATE_TTL_MS = 24 * 60 * 60 * 1000;

async function signValue(value: string, password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/** 签发已解锁的门禁 cookie 值: <expiryMs>.<hmac> */
export async function createSiteGateCookieValue(
  password: string,
): Promise<string> {
  const expiry = Date.now() + SITE_GATE_TTL_MS;
  const value = `${expiry}.${await signValue(String(expiry), password)}`;
  return value;
}

export async function isSiteUnlocked(
  request: Request,
  env: { PASSWORD?: string },
): Promise<boolean> {
  if (!env.PASSWORD) return true;
  const cookie = request.headers.get("cookie") ?? "";
  const raw = cookie
    .split(";")
    .find((part) => part.trim().startsWith(`${SITE_AUTH_COOKIE}=`));
  if (!raw) return false;
  const value = raw.trim().slice(SITE_AUTH_COOKIE.length + 1);
  const dot = value.indexOf(".");
  if (dot <= 0) return false;
  const expiry = value.slice(0, dot);
  if (!/^\d+$/.test(expiry) || Number(expiry) <= Date.now()) return false;
  const expected = await signValue(expiry, env.PASSWORD);
  // 长度守卫防越界读取；XOR 循环本身恒定工作量跑满 43 字符，不构成逐字符时序泄漏
  if (expected.length !== value.slice(dot + 1).length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++)
    diff |= expected.charCodeAt(i) ^ value.charCodeAt(dot + 1 + i);
  return diff === 0;
}

export function shouldBypassSiteGate(pathname: string): boolean {
  if (pathname === "/" || pathname === "/index.html") return true;
  if (pathname.startsWith("/api/") || pathname === "/config") return true;
  if (
    pathname === "/auth/unlock" ||
    pathname === "/auth/logout" ||
    pathname === "/auth/status"
  )
    return true;
  if (pathname.startsWith("/assets/")) return true;
  if (pathname === "/favicon.ico" || pathname.endsWith(".map")) return true;
  return false;
}
