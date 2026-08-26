import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
// 导入数据库相关的模块
import {
  deleteEmails,
  findEmailById,
  getEmailsByMessageTo,
  insertEmail,
  deleteExpiredEmails,
  insertApiKey,
  getSiteStats,
  getMailboxMetaByAddress,
} from "./database/dao.ts";
import { getD1DB } from "./database/db.ts";
import { nanoid } from "nanoid/non-secure";
import PostalMime from "postal-mime";
// 导入加解密工具函数
import { decrypt } from "./utils.ts";
// 导入 v1 API
import v1Api from "./api/v1/index.ts";
import { isOpenApiEnabled, requireOpenApi } from "./openapi.ts";
import {
  createMailboxIdentity,
  createMailboxToken,
  getBearerToken,
  getConfiguredSendChannel,
  sendEmail,
  sendRequestSchema,
  verifyMailboxToken,
} from "./sender.ts";
import { checkRateLimit, createDrizzleRateLimitStore } from "./rateLimit.ts";
import { incrementAndGetApiRateWindowCount as drizzleIncrementRateWindow } from "./database/dao.ts";
import {
  isTurnstileEnabled,
  parseJsonBody,
  verifyTurnstileToken,
} from "./turnstile.ts";
import type { Env } from "./env.ts";
export type { Env } from "./env.ts";
import {
  SITE_AUTH_COOKIE,
  SITE_GATE_TTL_MS,
  createSiteGateCookieValue,
  isSiteUnlocked,
  shouldBypassSiteGate,
} from "./app/siteGate.ts";
import { mapPostalToInsertEmail, type ParsedMail } from "./app/ingestion.ts";
import { record } from "./database/stats.ts";

// Env 来自共享模块，保持单源

// 初始化 Hono 应用
const app = new Hono<{ Bindings: Env }>();

// 配置 CORS
app.use("/api/v1/*", cors());

function parseRateLimitPerMinute(env: Env): number {
  const parsed = Number.parseInt(env.API_RATE_LIMIT_PER_MINUTE ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 100;
  }
  return parsed;
}

function parsePositiveLimit(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, 1000);
}

function getMailboxTokenTtlSeconds(): number {
  return 24 * 60 * 60;
}

// isSiteUnlocked / shouldBypassSiteGate 由 ./app/siteGate 深模块唯一拥有，此处不再本地重定义

// 显式校验 helper，供处理器直接使用，避免 c.set/c.get 隐式接口
type TurnstileBody = { token?: string } | undefined;
async function requireTurnstile(
  c: Context<{ Bindings: Env }>,
  body: TurnstileBody,
): Promise<Response | null> {
  if (!isTurnstileEnabled(c.env)) return null;
  const token = body?.token || c.req.header("cf-turnstile-token");
  const ip = c.req.header("CF-Connecting-IP");
  if (!token) {
    return c.json({ message: "缺少 turnstile token" }, 400);
  }
  const ok = await verifyTurnstileToken(token, c.env, ip);
  if (!ok) {
    return c.json({ message: "token 无效" }, 400);
  }
  return null;
}

// API 路由组
const api = app.basePath("/api");

// feat: 新增一个专门用于人机验证的接口。
// 前端应在生成邮箱地址前先调用此接口。
api.post("/verify", async (c) => {
  const parsed = await parseJsonBody(c);
  if (parsed.errorResponse) return parsed.errorResponse;
  const body = parsed.body as { domain?: string; token?: string };
  const turnstileError = await requireTurnstile(c, body);
  if (turnstileError) return turnstileError;
  const domain = body?.domain?.trim().toLowerCase();
  const identity = createMailboxIdentity(
    c.env.EMAIL_DOMAIN,
    c.env.MAILBOX_TOKEN_SECRET,
  );
  if (!domain || !identity.isAllowedDomain(domain)) {
    return c.json(
      {
        code: "INVALID_MAILBOX",
        message: "Mailbox domain is not configured",
      },
      400,
    );
  }
  const mailbox = `${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}@${domain}`;

  const db = getD1DB(c.env.DB);
  await record(db, "addressCreated");

  const mailboxToken = c.env.MAILBOX_TOKEN_SECRET
    ? await createMailboxToken(
        mailbox,
        c.env.MAILBOX_TOKEN_SECRET,
        Date.now(),
        getMailboxTokenTtlSeconds(),
      )
    : undefined;

  return c.json({
    success: true,
    bypassed: !isTurnstileEnabled(c.env),
    mailbox,
    mailboxToken,
  });
});

api.post("/mailbox-token/refresh", async (c) => {
  if (!c.env.MAILBOX_TOKEN_SECRET) {
    return c.json(
      { code: "SEND_UNAVAILABLE", message: "Email sending is unavailable" },
      503,
    );
  }

  const token = getBearerToken(c.req.header("Authorization"));
  const mailbox = token
    ? await verifyMailboxToken(token, c.env.MAILBOX_TOKEN_SECRET)
    : null;
  if (
    !mailbox ||
    !createMailboxIdentity(c.env.EMAIL_DOMAIN).isAllowed(mailbox)
  ) {
    return c.json(
      {
        code: "SEND_UNAUTHORIZED",
        message: "Mailbox authorization is invalid or expired",
      },
      401,
    );
  }

  return c.json({
    mailboxToken: await createMailboxToken(
      mailbox,
      c.env.MAILBOX_TOKEN_SECRET,
      Date.now(),
      getMailboxTokenTtlSeconds(),
    ),
  });
});

// Unified, authenticated email sending endpoint.
api.post("/send", async (c) => {
  const sendChannel = getConfiguredSendChannel(c.env);
  if (!sendChannel || !c.env.MAILBOX_TOKEN_SECRET || !c.env.SENDER_EMAIL) {
    return c.json(
      { code: "SEND_UNAVAILABLE", message: "Email sending is unavailable" },
      503,
    );
  }

  const token = getBearerToken(c.req.header("Authorization"));
  const mailbox = token
    ? await verifyMailboxToken(token, c.env.MAILBOX_TOKEN_SECRET)
    : null;
  if (
    !mailbox ||
    !createMailboxIdentity(c.env.EMAIL_DOMAIN).isAllowed(mailbox)
  ) {
    return c.json(
      {
        code: "SEND_UNAUTHORIZED",
        message: "Mailbox authorization is invalid or expired",
      },
      401,
    );
  }

  let requestBody: unknown;
  try {
    requestBody = await c.req.json();
  } catch {
    return c.json(
      { code: "INVALID_SEND_REQUEST", message: "Invalid JSON request body" },
      400,
    );
  }

  const parsedRequest = sendRequestSchema.safeParse(requestBody);
  if (!parsedRequest.success) {
    return c.json(
      { code: "INVALID_SEND_REQUEST", message: "Invalid email fields" },
      400,
    );
  }

  const db = getD1DB(c.env.DB);
  const nowSec = Math.floor(Date.now() / 1000);
  const mailboxLimit = parsePositiveLimit(c.env.SEND_RATE_LIMIT_PER_MINUTE, 3);
  const ipLimit = parsePositiveLimit(c.env.SEND_IP_RATE_LIMIT_PER_MINUTE, 10);
  const clientIp = c.req.header("CF-Connecting-IP") || "unknown";
  // 通过 RateLimit 深模块统一 window 计算与 header 推导
  const drizzleStore = createDrizzleRateLimitStore(
    db,
    drizzleIncrementRateWindow,
  );
  const mailboxRl = await checkRateLimit(
    `send-mailbox:${mailbox}`,
    mailboxLimit,
    nowSec,
    drizzleStore,
  );
  const ipRl = await checkRateLimit(
    `send-ip:${clientIp}`,
    ipLimit,
    nowSec,
    drizzleStore,
  );

  // 暴露 mailbox 维度的剩余配额（与原行为一致）
  c.header("X-RateLimit-Limit", String(mailboxRl.limit));
  c.header("X-RateLimit-Remaining", String(mailboxRl.remaining));
  if (!mailboxRl.allowed || !ipRl.allowed) {
    const retryAfter = String(
      Math.max(mailboxRl.retryAfter, ipRl.retryAfter, 1),
    );
    c.header("Retry-After", retryAfter);
    return c.json(
      {
        code: "SEND_RATE_LIMITED",
        message: "Email sending rate limit exceeded",
      },
      429,
    );
  }

  const outgoingEmail = {
    ...parsedRequest.data,
    replyTo: mailbox,
  };

  try {
    await sendEmail(c.env, outgoingEmail);
    return c.json({ success: true, channel: sendChannel });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("SEND_UNAVAILABLE")) {
      console.error("邮件发送不可用:", error);
      return c.json(
        { code: "SEND_UNAVAILABLE", message: "Email sending is unavailable" },
        503,
      );
    }
    console.error("邮件发送失败:", error);
    return c.json(
      { code: "SEND_PROVIDER_ERROR", message: "Email provider is unavailable" },
      502,
    );
  }
});

// 生成 API Key 的函数 — 使用 CSPRNG (crypto.getRandomValues) 保证不可预测性
// （API Key 是凭证，不能用 Math.random；mailboxToken 已是 HMAC-SHA256，强度对齐）
function generateApiKey(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const random = new Uint32Array(32);
  crypto.getRandomValues(random);
  let key = "vmail_";
  for (let i = 0; i < 32; i++) {
    // 拒绝采样避免模偏差：Uint32 上界 2^32 无法被 62 整除，丢弃超界值
    let byte = random[i];
    while (byte >= Math.floor(0x100000000 / chars.length) * chars.length) {
      crypto.getRandomValues(random.subarray(i, i + 1));
      byte = random[i];
    }
    key += chars.charAt(byte % chars.length);
  }
  return key;
}

// 创建 API Key 接口（需要 Turnstile 验证）
api.post("/api-keys", requireOpenApi, async (c) => {
  const parsed = await parseJsonBody(c);
  if (parsed.errorResponse) return parsed.errorResponse;
  const body = parsed.body as { name?: string; token?: string };
  const turnstileError = await requireTurnstile(c, body);
  if (turnstileError) return turnstileError;
  const db = getD1DB(c.env.DB);

  const now = new Date();
  const apiKey = generateApiKey();
  const keyPrefix = apiKey.substring(0, 12) + "...";

  const newApiKey = {
    id: nanoid(),
    key: apiKey,
    keyPrefix: keyPrefix,
    name: body?.name || null,
    rateLimit: 100,
    isActive: true,
    lastUsedAt: null,
    expiresAt: null,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await insertApiKey(db, newApiKey);
    // 通过 Stats 深模块同时写 site + daily
    await record(db, "apiKeyCreated");
    // 只返回一次完整的 API Key，之后无法再获取
    return c.json(
      {
        data: {
          id: newApiKey.id,
          key: apiKey, // 完整的 API Key，只展示这一次
          keyPrefix: keyPrefix,
          name: newApiKey.name,
          createdAt: now.toISOString(),
        },
        message:
          "API Key created successfully. Please save it now, it will not be shown again!",
      },
      201,
    );
  } catch (e) {
    console.error("Create API Key error:", e);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create API Key",
        },
      },
      500,
    );
  }
});

// fix: 移除获取邮件列表接口的 turnstile 验证。
// 这个接口现在是公开的，刷新收件箱时可以直接调用，不再需要重复验证。
api.post("/emails", async (c) => {
  const db = getD1DB(c.env.DB);
  let body: Record<string, unknown> | null;
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch (e) {
    return c.json({ message: "错误的请求：请求体无效或为空。" }, 400);
  }
  const address = typeof body?.address === "string" ? body.address : undefined;
  const limit = Number.parseInt(
    typeof body?.limit === "string"
      ? body.limit
      : typeof body?.limit === "number" && Number.isFinite(body.limit)
        ? String(body.limit)
        : "",
    10,
  );

  if (!address) {
    return c.json({ message: "address is required" }, 400);
  }
  const safeLimit =
    Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 50;
  const emails = await getEmailsByMessageTo(db, address as string, safeLimit);
  return c.json(emails);
});

api.post("/emails/meta", async (c) => {
  const db = getD1DB(c.env.DB);
  let body: Record<string, unknown> | null;
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ message: "错误的请求：请求体无效或为空。" }, 400);
  }

  const address = typeof body?.address === "string" ? body.address : undefined;
  if (!address) {
    return c.json({ message: "address is required" }, 400);
  }

  const meta = await getMailboxMetaByAddress(db, address as string);
  return c.json(meta);
});

// 获取单封邮件详情
api.get("/emails/:id", async (c) => {
  const db = getD1DB(c.env.DB);
  const { id } = c.req.param();
  // 函数调用修正：使用 findEmailById 函数
  const email = await findEmailById(db, id);
  if (!email) {
    return c.json({ message: "Email not found" }, 404);
  }
  return c.json(email);
});

// fix: 删除邮件接口不再需要 turnstile 验证，因为通常这是在已知邮箱上下文中操作的。
api.post("/delete-emails", async (c) => {
  const db = getD1DB(c.env.DB);
  let body: Record<string, unknown> | null;
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ message: "错误的请求：请求体无效或为空。" }, 400);
  }
  const ids =
    typeof body?.ids !== "undefined" && Array.isArray(body.ids)
      ? body.ids
      : undefined;
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return c.json({ message: "ids are required" }, 400);
  }
  const result = await deleteEmails(db, ids as string[]);
  return c.json(result);
});

// 修复：移除登录接口的 turnstile 中间件，使其不再需要人机验证。
api.post("/login", async (c) => {
  // 与 /verify、/delete-emails 同款：parseJsonBody 统一守卫，坏 JSON 返回 400 而非未捕获异常
  const parsed = await parseJsonBody(c);
  if (parsed.errorResponse) return parsed.errorResponse;
  const body = parsed.body as { password?: string };
  const password = body?.password;

  if (!password) {
    return c.json({ message: "Password is required" }, 400);
  }

  try {
    // 解密密码以获取邮箱地址
    const address = decrypt(password, c.env.COOKIES_SECRET);

    // **核心修复**：移除数据库邮件检查逻辑
    // 不再需要查询数据库中是否存在该地址的邮件
    // const emails = await getEmailsByMessageTo(db, address);
    // if (emails.length === 0) {
    // 如果该地址从未收到过邮件，则视为无效密码
    // return c.json({ message: 'Invalid password' }, 404);
    // }

    // 可选：添加一个简单的邮箱地址格式校验，增加健壮性
    // 例如，检查是否包含 '@' 符号
    if (!address || typeof address !== "string" || !address.includes("@")) {
      console.error("解密后的地址格式无效:", address);
      return c.json({ message: "Invalid password" }, 400); // 地址格式不对也视为密码无效
    }

    // Legacy passwords are client-derived and therefore cannot prove send ownership.
    return c.json({ address });
  } catch (e) {
    console.error("Login error:", e);
    // 如果解密失败或发生其他错误，返回无效密码错误
    return c.json({ message: "Invalid password" }, 400);
  }
});

// 前端配置接口
app.get("/config", (c) => {
  // feat: 将 emailDomain 拆分为数组以支持多域名
  const emailDomain = c.env.EMAIL_DOMAIN
    ? c.env.EMAIL_DOMAIN.split(",").map((d) => d.trim())
    : [];
  const turnstileEnabled = isTurnstileEnabled(c.env);
  const openApiEnabled = isOpenApiEnabled(c.env);

  const sendChannel = getConfiguredSendChannel(c.env);
  const enabledSenders = sendChannel ? [sendChannel] : [];

  return c.json({
    emailDomain: emailDomain, // 返回域名数组
    turnstileKey: c.env.TURNSTILE_KEY,
    turnstileEnabled,
    cookiesSecret: c.env.COOKIES_SECRET,
    sitePasswordEnabled: Boolean(c.env.PASSWORD),
    apiRateLimitPerMinute: parseRateLimitPerMinute(c.env),
    openApiEnabled,
    showAff: c.env.SHOW_AFF === "true",
    enabledSenders,
    sendChannel: sendChannel || "",
    senderEmail: sendChannel ? c.env.SENDER_EMAIL : "",
  });
});

// 站点统计数据接口（公开）
api.get("/stats", async (c) => {
  const cache = caches.default;
  const cacheKey = new Request(c.req.url, c.req.raw);
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  const db = getD1DB(c.env.DB);
  const stats = await getSiteStats(db);

  const totals = {
    totalAddressesCreated: stats?.totalAddressesCreated ?? 0,
    totalEmailsReceived: stats?.totalEmailsReceived ?? 0,
    totalApiCalls: stats?.totalApiCalls ?? 0,
    totalApiKeysCreated: stats?.totalApiKeysCreated ?? 0,
  };

  const response = c.json({
    totals,
  });

  response.headers.set("Cache-Control", "public, max-age=300");
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});

app.post("/auth/unlock", async (c) => {
  if (!c.env.PASSWORD) {
    return c.json({ success: true, bypassed: true });
  }

  // 与 /api/login 同款: parseJsonBody 统一守卫 + 可选链，
  // 合法 JSON null / 数组等畸形体走 401/400，不再抛 TypeError 由兜底返回 500
  const parsed = await parseJsonBody(c);
  if (parsed.errorResponse) return parsed.errorResponse;
  const body = parsed.body as { password?: string } | null;

  if (body?.password !== c.env.PASSWORD) {
    return c.json({ message: "Invalid password" }, 401);
  }

  const cookieValue = await createSiteGateCookieValue(c.env.PASSWORD);
  c.header(
    "Set-Cookie",
    // review-D4: Max-Age 与签名有效期共用 SITE_GATE_TTL_MS 单源，避免双源漂移
    `${SITE_AUTH_COOKIE}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SITE_GATE_TTL_MS / 1000}; Secure`,
  );

  return c.json({ success: true });
});

app.get("/auth/status", async (c) => {
  const unlocked = await isSiteUnlocked(c.req.raw, c.env);
  return c.json({
    unlocked,
    sitePasswordEnabled: Boolean(c.env.PASSWORD),
  });
});

app.post("/auth/logout", (c) => {
  c.header(
    "Set-Cookie",
    `${SITE_AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`,
  );
  return c.json({ success: true });
});

// 挂载 v1 API 路由
app.route("/api/v1", v1Api);

// review-F1: 移除 hono/cloudflare-workers 的 serveStatic 死路由。
// 本仓静态资源由 wrangler.toml [assets] 绑定在 Worker 之前直接服务,
// Worker 内仅走 env.ASSETS.fetch + 404 回退 index.html;
// 该适配器属旧 Workers-Sites KV 模型(__STATIC_CONTENT), 命中未匹配的
// /api|/auth GET 时会抛 ReferenceError 致 500 而非干净 404 (契约见 app.routes.test.ts)。

// Worker 主处理逻辑
const workerHandlers = {
  // 邮件处理逻辑
  async email(
    message: ForwardableEmailMessage,
    env: Env,
    ctx: ExecutionContext,
  ) {
    try {
      const db = getD1DB(env.DB);
      // 将原始邮件流转换为文本
      const raw = await new Response(message.raw).text();
      // 使用 postal-mime 解析邮件
      const mail = await new PostalMime().parse(raw);
      const now = new Date();

      // **关键修复**：显式地从解析结果中映射字段，而不是使用对象展开(...)
      // 这样可以避免属性覆盖和类型不匹配的问题
      // 通过 Ingestion 深模块完成 PostalMime → InsertEmail 映射与校验
      const email = mapPostalToInsertEmail(
        mail as unknown as ParsedMail,
        message,
        now,
        nanoid(),
      );
      // 插入数据库
      await insertEmail(db, email);
      // 通过 Stats 深模块同时写 site + daily
      await record(db, "emailReceived");
    } catch (e) {
      // **关键修复**：向 Cloudflare 发出拒绝信号
      // 当发生任何错误时，调用 message.setReject() 告知 Cloudflare 处理失败。
      // 这会让 Cloudflare 尝试重新投递邮件，而不是直接删除。
      console.error("处理邮件失败:", e);
      const msg = e instanceof Error ? e.message : String(e);
      message.setReject(`邮件处理失败: ${msg}`);
    }
  },

  // HTTP 请求处理逻辑
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    if (
      !shouldBypassSiteGate(url.pathname) &&
      !(await isSiteUnlocked(request, env))
    ) {
      return new Response(JSON.stringify({ message: "Site is locked" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // API 路由
    if (
      url.pathname.startsWith("/api/") ||
      url.pathname === "/config" ||
      url.pathname.startsWith("/auth/")
    ) {
      return app.fetch(request, env, ctx);
    }

    // 静态资源请求
    const response = await env.ASSETS.fetch(request);

    // SPA 路由回退：如果静态资源返回 404，则返回 index.html
    // 这样可以支持直接访问 /api-docs 等前端路由
    if (response.status === 404) {
      const indexRequest = new Request(
        new URL("/", request.url).toString(),
        request,
      );
      return env.ASSETS.fetch(indexRequest);
    }

    return response;
  },

  // 定时任务 (清理过期邮件)
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const db = getD1DB(env.DB);
    // 修复：将清理时间从1小时修改为24小时（1天）
    const oneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
    await deleteExpiredEmails(db, oneDayAgo);
    console.log(`已清理 ${oneDayAgo.toISOString()} 之前的过期邮件`); // 添加日志
  },
};
export function createApp() {
  return workerHandlers;
}
export default workerHandlers;
