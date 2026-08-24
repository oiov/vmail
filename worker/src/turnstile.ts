// worker/src/turnstile.ts
// 深模块: Turnstile 校验的唯一入口
// Interface: isTurnstileEnabled(env) · verifyTurnstileToken(token, env, ip) -> boolean
//            parseJsonBody(c) -> { body, errorResponse? }
// Implementation: 内部完成 Cloudflare siteverify 调用，调用方不再关心 URLSearchParams 细节
// 之前: index.ts 内 30 行 turnstile 中间件直接 fetch+解析，两个处理器靠 c.set('parsedBody') 隐式耦合
// 之后: 中间件委托 verifyTurnstileToken，处理器显式拿 body

export function isTurnstileEnabled(env: {
  TURNSTILE_KEY?: string;
  TURNSTILE_SECRET?: string;
}): boolean {
  return Boolean(env.TURNSTILE_KEY && env.TURNSTILE_SECRET);
}

export async function verifyTurnstileToken(
  token: string,
  env: { TURNSTILE_SECRET?: string },
  ip?: string,
): Promise<boolean> {
  const params = new URLSearchParams();
  params.append("secret", env.TURNSTILE_SECRET!);
  params.append("response", token);
  if (ip) params.append("remoteip", ip);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        signal: AbortSignal.timeout(15_000), // 与 outbound.ts 出站标准一致: 15s 有界
      },
    );

    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: unknown;
    };
    if (!data.success) {
      console.error("Turnstile 验证失败:", data["error-codes"]);
      return false;
    }
    return true;
  } catch (e) {
    // siteverify 不可达/超时/非 JSON 响应 = 验证未通过，返回 false 走调用方既有 400 分支，
    // 不向上抛出致 hono 兜底 500（与 outbound 的 502 映射不同，此处语义即"校验失败"）
    console.error("Turnstile siteverify 请求失败:", e);
    return false;
  }
}

// 供处理器在无中间件时显式解析的 helper，保持 body 读取集中
export async function parseJsonBody(c: {
  req: { text(): Promise<string> };
}): Promise<{ body: unknown; errorResponse?: Response }> {
  try {
    const rawBody = await c.req.text();
    return { body: rawBody ? JSON.parse(rawBody) : {} };
  } catch (e) {
    console.error("请求体解析为JSON时出错:", e);
    return {
      body: null,
      errorResponse: new Response(
        JSON.stringify({ message: "错误的请求：请求体无效或为空。" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      ),
    };
  }
}
