// worker/src/app/siteGate.ts
// 深模块: 站点门禁的唯一真源
// Interface: isSiteUnlocked(request, env) · shouldBypassSiteGate(pathname) · SITE_AUTH_COOKIE
// Implementation: 内部隐藏 PASSWORD==空即放行、cookie 解析细节
// 之前: index.ts 的 2 个函数与 1 个常量散落在 688 行 God-Module 中，无独立测试面
// 之后: 行为通过一个小接口测试，修改锁逻辑只需改此 Module

export const SITE_AUTH_COOKIE = "vmail_site_auth";

export function isSiteUnlocked(request: Request, env: { PASSWORD?: string }): boolean {
  if (!env.PASSWORD) return true;
  const cookie = request.headers.get("cookie") ?? "";
  return cookie.split(";").some((part) => {
    const [key, value] = part.trim().split("=");
    return key === SITE_AUTH_COOKIE && value === "1";
  });
}

export function shouldBypassSiteGate(pathname: string): boolean {
  if (pathname === "/" || pathname === "/index.html") return true;
  if (pathname.startsWith("/api/") || pathname === "/config") return true;
  if (pathname === "/auth/unlock" || pathname === "/auth/logout" || pathname === "/auth/status") return true;
  if (pathname.startsWith("/assets/")) return true;
  if (pathname === "/favicon.ico" || pathname.endsWith(".map")) return true;
  return false;
}
