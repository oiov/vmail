import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { emails, mailboxes } from './database/schema';
import { authReady, createAuth } from './auth';
import accountRoutes from './account-routes';
import { edgeGuard, reserveGlobal, failure, globalBudget } from './guard';
import { positive, GLOBAL_SHARDS } from './limits';
import { hashToken } from './key-token';
export { AccessLedger } from './access-ledger';
import { cors } from 'hono/cors';
// 导入数据库相关的模块
import { deleteEmails, findEmailById, getEmailsByMessageTo, insertEmail, deleteExpiredEmails, insertApiKey, getSiteStats, incrementEmailsReceived, incrementApiKeysCreated, incrementAddressesCreated, incrementDailyAddressesCreated, incrementDailyEmailsReceived, incrementDailyApiKeysCreated, getMailboxMetaByAddress, incrementAndGetApiRateWindowCount } from './database/dao';
import { getD1DB } from './database/db';
import { InsertEmail, insertEmailSchema } from './database/schema';
import { nanoid } from 'nanoid/non-secure';
import PostalMime from 'postal-mime';
import { EmailMessage } from 'cloudflare:email';
// 导入加解密工具函数
import { decrypt } from './utils';
// 导入 v1 API
import v1Api from './api/v1';
import { isOpenApiEnabled, requireOpenApi } from './openapi';
import {
  buildCloudflareMimeMessage,
  buildMailChannelsPayload,
  buildResendPayload,
  createMailboxToken,
  getBearerToken,
  getConfiguredSendChannel,
  isAllowedMailboxAddress,
  sendRequestSchema,
  verifyMailboxToken,
} from './sender';


// 定义 Cloudflare 绑定和环境变量的类型
export interface Env extends Omit<CloudflareBindings, 'RESEND_API_KEY' | 'MAILCHANNELS_API_KEY' | 'MAILBOX_TOKEN_SECRET' | 'BETTER_AUTH_SECRET' | 'API_KEY_SECRET' | 'GITHUB_CLIENT_ID' | 'GITHUB_CLIENT_SECRET' | 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET'> {
  BETTER_AUTH_SECRET?: string;
  API_KEY_SECRET?: string;
  BETTER_AUTH_URL: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  ADMIN_EMAILS?: string;

  RESEND_API_KEY?: string;
  MAILCHANNELS_API_KEY?: string;
  MAILBOX_TOKEN_SECRET?: string;

}

// 初始化 Hono 应用
type AppVariables = { parsedBody: any; mailbox: string; apiKey: { id: string; userId: string; rateLimit: number } };
const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();
app.onError((error, c) => { console.error('Request failed', error.message); return failure('SERVICE_UNAVAILABLE', 'Service temporarily unavailable', 503); });
app.use('/api/*', bodyLimit({ maxSize: 131072 }));
app.use('/api/*', edgeGuard);
app.use('/api/*', async (c, next) => { if (c.env.SUSPEND_DATABASE_ACCESS === 'true') return failure('SERVICE_PAUSED', 'Service temporarily paused', 503); await next(); });
app.route('/api/account', accountRoutes);
app.all('/api/auth/*', async c => {
  if (!authReady(c.env)) return failure('AUTH_UNAVAILABLE', 'Sign-in is not configured yet', 503);
  // Issuance goes through our session-checked wrapper; plugin HTTP endpoints cannot bypass it.
  const path = c.req.path.slice('/api/auth'.length);
  if (!['/sign-in/social', '/get-session', '/sign-out', '/error'].includes(path) && !/^\/callback\/(github|google)$/.test(path)) return failure('NOT_FOUND', 'Not found', 404);
  const budget = await reserveGlobal(c.env, c.req.header('CF-Connecting-IP') ?? 'auth');
  if (budget) return budget;
  return createAuth(c.env).handler(c.req.raw);
});

// 配置 CORS
app.use('/api/v1/*', cors());

const SITE_AUTH_COOKIE = 'vmail_site_auth';

function isTurnstileEnabled(env: Env): boolean {
  return Boolean(env.TURNSTILE_KEY && env.TURNSTILE_SECRET);
}

function parseRateLimitPerMinute(env: Env): number {
  const parsed = Number.parseInt(env.API_RATE_LIMIT_PER_MINUTE ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 100;
  }
  return parsed;
}

function parsePositiveLimit(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, 1000);
}

function getMailboxTokenTtlSeconds(): number {
  return 24 * 60 * 60;
}

function isSiteUnlocked(request: Request, env: Env): boolean {
  if (!env.PASSWORD) {
    return true;
  }

  const cookie = request.headers.get('cookie') ?? '';
  return cookie.split(';').some((part) => {
    const [key, value] = part.trim().split('=');
    return key === SITE_AUTH_COOKIE && value === '1';
  });
}

function shouldBypassSiteGate(pathname: string): boolean {
  if (pathname === '/' || pathname === '/index.html') {
    return true;
  }
  if (pathname.startsWith('/api/') || pathname === '/config') {
    return true;
  }
  if (pathname === '/auth/unlock' || pathname === '/auth/logout' || pathname === '/auth/status') {
    return true;
  }
  if (pathname.startsWith('/assets/')) {
    return true;
  }
  if (pathname === '/favicon.ico' || pathname.endsWith('.map')) {
    return true;
  }
  return false;
}

// fix: 增强请求体验证逻辑。
// 此前的实现方式在请求体解析失败时会静默处理，导致后续处理流程因缺少数据而返回一个模糊的400错误。
// 新的实现方式会严格校验请求体，如果解析为JSON失败（例如请求体为空或格式错误），将立即返回一个明确的400错误，从而阻止无效请求继续执行。
const turnstile: import('hono').MiddlewareHandler<{ Bindings: Env; Variables: AppVariables }> = async (c, next) => {
  let body: any;
  try {
    const rawBody = await c.req.text();
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch (e) {
    // 捕获异常，记录错误日志，并返回一个清晰的错误响应。
    console.error("请求体解析为JSON时出错:", e);
    return c.json({ message: '错误的请求：请求体无效或为空。' }, 400);
  }

  // 将解析后的 body 存入上下文，以便下游处理器直接使用，避免重复解析。
  c.set('parsedBody', body);

  if (!isTurnstileEnabled(c.env)) {
    await next();
    return;
  }

  const token = body.token || c.req.header('cf-turnstile-token');
  const ip = c.req.header('CF-Connecting-IP');

  if (!token) {
    return c.json({ message: '缺少 turnstile token' }, 400);
  }

  // fix: 切换到 application/x-www-form-urlencoded 格式来发送验证请求。
  // 这可以提高兼容性，并可能解决由 FormData 编码引起的边界问题。
  const params = new URLSearchParams();
  params.append('secret', c.env.TURNSTILE_SECRET);
  params.append('response', token);
  if (ip) {
    params.append('remoteip', ip);
  }

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json<{ success: boolean; 'error-codes'?: string[] }>();
  if (!data.success) {
    // feat: 增加详细的错误日志，方便调试
    console.error("Turnstile 验证失败:", data['error-codes']);
    return c.json({ message: 'token 无效' }, 400);
  }

  await next();
};

// API 路由组
const api = app.basePath('/api');
api.use('*', async (c, next) => {
  if (c.req.path.startsWith('/api/v1/') || c.req.path.startsWith('/api/account/') || c.req.path.startsWith('/api/auth/')) return next();
  const ip = c.req.header('CF-Connecting-IP') ?? 'local';
  const decision = await c.env.ACCESS.getByName('web-ip:' + ip).consume([{ key: 'requests', max: 3000, seconds: 86400 }]);
  if (!decision.allowed) return failure('QUOTA_EXCEEDED', 'Daily request limit reached', 429, decision.retryAfter);
  const budget = await reserveGlobal(c.env, ip);
  if (budget) return budget;
  await next();
});
const mailboxAuth: import('hono').MiddlewareHandler<{ Bindings: Env; Variables: AppVariables }> = async (c, next) => {
  const token = getBearerToken(c.req.header('Authorization'));
  const mailbox = token && c.env.MAILBOX_TOKEN_SECRET ? await verifyMailboxToken(token, c.env.MAILBOX_TOKEN_SECRET) : null;
  if (!mailbox || !isAllowedMailboxAddress(mailbox, c.env.EMAIL_DOMAIN) || !await c.env.ACCESS.getByName('mailbox:' + mailbox).mailboxActive()) return failure('UNAUTHORIZED', 'Mailbox authorization is invalid or expired', 401);
  const decision = await c.env.ACCESS.getByName('mailbox:' + mailbox).consume([{ key: 'web-minute', max: 30, seconds: 60 }, { key: 'web-day', max: 3000, seconds: 86400 }]);
  if (!decision.allowed) return failure('QUOTA_EXCEEDED', 'Mailbox request limit reached', 429, decision.retryAfter);
  c.set('mailbox', mailbox);
  await next();
};

// feat: 新增一个专门用于人机验证的接口。
// 前端应在生成邮箱地址前先调用此接口。
api.post('/verify', turnstile, async (c) => {
  const body = c.get('parsedBody') as { domain?: string };
  const domain = body?.domain?.trim().toLowerCase();
  if (!domain || !isAllowedMailboxAddress(`mailbox@${domain}`, c.env.EMAIL_DOMAIN)) {
    return c.json({
      code: 'INVALID_MAILBOX',
      message: 'Mailbox domain is not configured',
    }, 400);
  }
  const mailbox = `${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}@${domain}`;

  if (!c.env.MAILBOX_TOKEN_SECRET) return failure('SERVICE_UNAVAILABLE', 'Mailbox authorization is not configured', 503);
  const ip = c.req.header('CF-Connecting-IP') ?? 'local';
  const allowed = await c.env.ACCESS.getByName('web-ip:' + ip).consume([{ key: 'create', max: 20, seconds: 86400 }]);
  if (!allowed.allowed) return failure('QUOTA_EXCEEDED', 'Mailbox creation limit reached', 429, allowed.retryAfter);
  // If signed in, attribute browser mailbox activity to the same account.
  const account = authReady(c.env) ? await createAuth(c.env).api.getSession({ headers: c.req.raw.headers }) : null;
  const owner = account?.user.id ?? '';
  if (owner) {
    const userLedger = c.env.ACCESS.getByName('user:' + owner);
    const createQuota = await userLedger.consume([{ key: 'create-day', seconds: 86400, max: positive(c.env.MAILBOX_DAILY_LIMIT, 20) }]);
    if (!createQuota.allowed || !await userLedger.reserveMailbox(mailbox, Date.now() + 86400_000, positive(c.env.MAX_ACTIVE_MAILBOXES, 20))) return failure('MAILBOX_LIMIT', 'Mailbox creation limit reached', 429);
  }
  await c.env.ACCESS.getByName('mailbox:' + mailbox).activateMailbox(Date.now() + 86400_000, false, owner);
  await getD1DB(c.env.DB).insert(mailboxes).values({ id: crypto.randomUUID(), address: mailbox, domain, apiKeyId: 'web', userId: owner || null, expiresAt: new Date(Date.now() + 86400_000), createdAt: new Date(), updatedAt: new Date() });
  await recordMailboxUsage(c.env, owner, mailbox, 'mailboxes_created');
  const mailboxToken = await createMailboxToken(mailbox, c.env.MAILBOX_TOKEN_SECRET, Date.now(), getMailboxTokenTtlSeconds());

  return c.json({
    success: true,
    bypassed: !isTurnstileEnabled(c.env),
    mailbox,
    mailboxToken,
  });
});

api.post('/mailbox-token/refresh', mailboxAuth, async (c) => {
  if (!c.env.MAILBOX_TOKEN_SECRET) {
    return c.json({ code: 'SEND_UNAVAILABLE', message: 'Email sending is unavailable' }, 503);
  }

  const token = getBearerToken(c.req.header('Authorization'));
  const mailbox = token
    ? await verifyMailboxToken(token, c.env.MAILBOX_TOKEN_SECRET)
    : null;
  if (!mailbox || !isAllowedMailboxAddress(mailbox, c.env.EMAIL_DOMAIN)) {
    return c.json({ code: 'SEND_UNAUTHORIZED', message: 'Mailbox authorization is invalid or expired' }, 401);
  }

  const owner = await c.env.ACCESS.getByName('mailbox:' + mailbox).mailboxOwner();
  if (owner && !await c.env.ACCESS.getByName('user:' + owner).reserveMailbox(mailbox, Date.now() + 86400_000, positive(c.env.MAX_ACTIVE_MAILBOXES, 20))) return failure('MAILBOX_LIMIT', 'Active mailbox limit reached', 429);
  await c.env.ACCESS.getByName('mailbox:' + mailbox).activateMailbox(Date.now() + 86400_000, true);
  await getD1DB(c.env.DB).update(mailboxes).set({ expiresAt: new Date(Date.now() + 86400_000) }).where(eq(mailboxes.address, mailbox));
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
api.post('/send', mailboxAuth, async (c) => {
  const sendChannel = getConfiguredSendChannel(c.env);
  if (!sendChannel || !c.env.MAILBOX_TOKEN_SECRET || !c.env.SENDER_EMAIL) {
    return c.json({ code: 'SEND_UNAVAILABLE', message: 'Email sending is unavailable' }, 503);
  }

  const token = getBearerToken(c.req.header('Authorization'));
  const mailbox = token
    ? await verifyMailboxToken(token, c.env.MAILBOX_TOKEN_SECRET)
    : null;
  if (!mailbox || !isAllowedMailboxAddress(mailbox, c.env.EMAIL_DOMAIN)) {
    return c.json({ code: 'SEND_UNAUTHORIZED', message: 'Mailbox authorization is invalid or expired' }, 401);
  }

  let requestBody: unknown;
  try {
    requestBody = await c.req.json();
  } catch {
    return c.json({ code: 'INVALID_SEND_REQUEST', message: 'Invalid JSON request body' }, 400);
  }

  const parsedRequest = sendRequestSchema.safeParse(requestBody);
  if (!parsedRequest.success) {
    return c.json({ code: 'INVALID_SEND_REQUEST', message: 'Invalid email fields' }, 400);
  }

  const mailboxLimit = parsePositiveLimit(c.env.SEND_RATE_LIMIT_PER_MINUTE, 3);
  const ipLimit = parsePositiveLimit(c.env.SEND_IP_RATE_LIMIT_PER_MINUTE, 10);
  const first = await c.env.ACCESS.getByName('mailbox:' + mailbox).consume([{ key: 'send', max: mailboxLimit, seconds: 60 }]);
  const second = await c.env.ACCESS.getByName('web-ip:' + (c.req.header('CF-Connecting-IP') ?? 'local')).consume([{ key: 'send', max: ipLimit, seconds: 60 }]);
  if (!first.allowed || !second.allowed) return failure('SEND_RATE_LIMITED', 'Sending limit reached');
  const outgoingEmail = {
    ...parsedRequest.data,
    replyTo: mailbox,
  };

  try {
    if (sendChannel === 'resend') {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildResendPayload(outgoingEmail, c.env.SENDER_EMAIL)),
      });
      if (!response.ok) {
        console.error('Resend send failed:', response.status, await response.text());
        return c.json({ code: 'SEND_PROVIDER_ERROR', message: 'Email provider rejected the message' }, 502);
      }
    } else if (sendChannel === 'mailchannels') {
      const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': c.env.MAILCHANNELS_API_KEY!,
        },
        body: JSON.stringify(buildMailChannelsPayload(outgoingEmail, c.env.SENDER_EMAIL)),
      });
      if (!response.ok) {
        console.error('MailChannels send failed:', response.status, await response.text());
        return c.json({ code: 'SEND_PROVIDER_ERROR', message: 'Email provider rejected the message' }, 502);
      }
    } else {
      const emailMessage = new EmailMessage(
        c.env.SENDER_EMAIL,
        outgoingEmail.receiverEmail,
        buildCloudflareMimeMessage(outgoingEmail, c.env.SENDER_EMAIL),
      );
      await c.env.SEND_EMAIL!.send(emailMessage);
    }

    return c.json({ success: true, channel: sendChannel });
  } catch (error) {
    console.error('Email send failed:', error);
    return c.json({ code: 'SEND_PROVIDER_ERROR', message: 'Email provider is unavailable' }, 502);
  }
});

// Old anonymous key issuance is intentionally retired.
api.post('/api-keys', c => failure('LOGIN_REQUIRED', 'Sign in at /api-docs to create a free API key', 401));
api.post('/emails', mailboxAuth, async c => {
  const body = await c.req.json<{ address?: string; limit?: number }>();
  if (body.address !== c.get('mailbox')) return failure('FORBIDDEN', 'Mailbox does not match authorization', 403);
  const rows = await getD1DB(c.env.DB).select({ id: emails.id, from: emails.from, subject: emails.subject, date: emails.date, createdAt: emails.createdAt, text: sql<string>`substr(${emails.text},1,100)` }).from(emails).where(eq(emails.messageTo, c.get('mailbox'))).orderBy(sql`${emails.createdAt} desc`).limit(Math.min(50, positive(String(body.limit ?? ''), 50)));
  return c.json(rows);
});
api.post('/emails/meta', mailboxAuth, async c => c.json(await getMailboxMetaByAddress(getD1DB(c.env.DB), c.get('mailbox'))));
api.get('/emails/:id', mailboxAuth, async c => {
  const rows = await getD1DB(c.env.DB).select().from(emails).where(and(eq(emails.id, c.req.param('id')), eq(emails.messageTo, c.get('mailbox')))).limit(1);
  return rows[0] ? c.json(rows[0]) : failure('NOT_FOUND', 'Email not found', 404);
});
api.post('/delete-emails', mailboxAuth, async c => {
  const body = await c.req.json<{ids?: unknown}>();
  if (!Array.isArray(body.ids) || body.ids.length < 1 || body.ids.length > 50 || !body.ids.every(id => typeof id === 'string' && id.length <= 128)) return failure('VALIDATION_ERROR', 'Provide 1–50 message IDs', 400);
  const result = await getD1DB(c.env.DB).delete(emails).where(and(eq(emails.messageTo, c.get('mailbox')), inArray(emails.id, body.ids)));
  return c.json({ count: result.meta.changes });
});
api.post('/login', async c => {
  const body = await c.req.json<{password?: string}>();
  const address = body.password && c.env.MAILBOX_TOKEN_SECRET ? await verifyMailboxToken(body.password, c.env.MAILBOX_TOKEN_SECRET) : null;
  if (!address || !await c.env.ACCESS.getByName('mailbox:' + address).mailboxActive()) return failure('UNAUTHORIZED', 'Invalid or expired mailbox access token', 401);
  return c.json({ address, mailboxToken: body.password });
});

// 前端配置接口
app.get('/config', (c) => {
  // feat: 将 emailDomain 拆分为数组以支持多域名
  const emailDomain = c.env.EMAIL_DOMAIN ? c.env.EMAIL_DOMAIN.split(',').map(d => d.trim()) : [];
  const turnstileEnabled = isTurnstileEnabled(c.env);
  const openApiEnabled = isOpenApiEnabled(c.env);

  const sendChannel = getConfiguredSendChannel(c.env);
  const enabledSenders = sendChannel ? [sendChannel] : [];

  return c.json({
    emailDomain: emailDomain, // 返回域名数组
    turnstileKey: c.env.TURNSTILE_KEY,
    turnstileEnabled,
    cookiesSecret: '',
    authEnabled: authReady(c.env),
    apiDailyLimit: positive(c.env.API_DAILY_LIMIT, 1000),
    mailboxDailyLimit: positive(c.env.MAILBOX_DAILY_LIMIT, 20),
    maxApiKeys: 3,
    setupRequired: !c.env.MAILBOX_TOKEN_SECRET,
    upgradeNotice: 'signed-mailbox-tokens-v2',
    sitePasswordEnabled: Boolean(c.env.PASSWORD),
    apiRateLimitPerMinute: positive(c.env.API_RATE_LIMIT_PER_MINUTE, 30),
    openApiEnabled,
    showAff: c.env.SHOW_AFF === 'true',
    enabledSenders,
    sendChannel: sendChannel || '',
    senderEmail: sendChannel ? c.env.SENDER_EMAIL : '',
  });
});

// 站点统计数据接口（公开）
api.get('/stats', async (c) => {
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

  response.headers.set('Cache-Control', 'public, max-age=300');
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
});

app.post('/auth/unlock', async (c) => {
  if (!c.env.PASSWORD) {
    return c.json({ success: true, bypassed: true });
  }

  let body: { password?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ message: 'Invalid request body' }, 400);
  }

  if (body.password !== c.env.PASSWORD) {
    return c.json({ message: 'Invalid password' }, 401);
  }

  c.header(
    'Set-Cookie',
    `${SITE_AUTH_COOKIE}=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400; Secure`,
  );

  return c.json({ success: true });
});

app.get('/auth/status', (c) => {
  const unlocked = isSiteUnlocked(c.req.raw, c.env);
  return c.json({
    unlocked,
    sitePasswordEnabled: Boolean(c.env.PASSWORD),
  });
});

app.post('/auth/logout', (c) => {
  c.header(
    'Set-Cookie',
    `${SITE_AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`,
  );
  return c.json({ success: true });
});

// 挂载 v1 API 路由
app.route('/api/v1', v1Api);

// 修正: 确保 serveStatic 正确指向静态文件目录
// Hono v4 中 serveStatic 默认处理根路径，我们需要确保它指向正确的子目录




// Worker 主处理逻辑
export default {
  // 邮件处理逻辑
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
    try {
      if (env.SUSPEND_DATABASE_ACCESS === 'true' || message.rawSize > positive(env.MAX_EMAIL_BYTES, 262144)) { message.setReject('Mailbox unavailable or message too large'); return; }
      const ledger = env.ACCESS.getByName('mailbox:' + message.to.toLowerCase());
      if (!await ledger.acceptMail(positive(env.MAILBOX_INBOUND_DAILY_LIMIT, 100))) { message.setReject('Mailbox expired or receiving limit reached'); return; }
      if (!(await globalBudget(env, message.to.toLowerCase(), 'inbound')).allowed) { message.setReject('Daily receiving capacity reached'); return; }
      const owner = await ledger.mailboxOwner();
      const db = getD1DB(env.DB);
      // 将原始邮件流转换为文本
      const raw = await new Response(message.raw).text();
      // 使用 postal-mime 解析邮件
      const mail = await new PostalMime().parse(raw);
      const now = new Date();

      // **关键修复**：显式地从解析结果中映射字段，而不是使用对象展开(...)
      // 这样可以避免属性覆盖和类型不匹配的问题
      const newEmail = {
        id: nanoid(),
        messageFrom: message.from,
        messageTo: message.to,
        headers: mail.headers || [], // 确保 headers 存在
        from: mail.from,
        sender: mail.sender,
        replyTo: mail.replyTo,
        deliveredTo: mail.deliveredTo,
        returnPath: mail.returnPath,
        to: mail.to,
        cc: mail.cc,
        bcc: mail.bcc,
        subject: mail.subject,
        messageId: mail.messageId, // messageId 在数据库中是必需的
        inReplyTo: mail.inReplyTo,
        references: mail.references,
        date: mail.date,
        html: mail.html,
        text: mail.text,
        createdAt: now,
        updatedAt: now,
      };

      // 验证待插入的数据是否符合 schema
      const email = insertEmailSchema.parse(newEmail);
      // 插入数据库
      await insertEmail(db, email);
      // 增加邮件接收计数
      await recordMailboxUsage(env, owner, message.to, 'emails_received');
    } catch (e: any) {
      // **关键修复**：向 Cloudflare 发出拒绝信号
      // 当发生任何错误时，调用 message.setReject() 告知 Cloudflare 处理失败。
      // 这会让 Cloudflare 尝试重新投递邮件，而不是直接删除。
      console.error('处理邮件失败:', e);
      message.setReject(`邮件处理失败: ${e.message}`);
    }
  },

  // HTTP 请求处理逻辑
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (!shouldBypassSiteGate(url.pathname) && !isSiteUnlocked(request, env)) {
      return new Response(JSON.stringify({ message: 'Site is locked' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // API 路由
    if (url.pathname.startsWith('/api/') || url.pathname === '/config' || url.pathname.startsWith('/auth/')) {
      return app.fetch(request, env, ctx);
    }

    // 静态资源请求
    const response = await env.ASSETS.fetch(request);

    // SPA 路由回退：如果静态资源返回 404，则返回 index.html
    // 这样可以支持直接访问 /api-docs 等前端路由
    if (response.status === 404) {
      const indexRequest = new Request(new URL('/', request.url).toString(), request);
      return env.ASSETS.fetch(indexRequest);
    }

    return response;
  },

  // 定时任务 (清理过期邮件)
  async scheduled(event: ScheduledController, env: Env, ctx: ExecutionContext) {
      const db = getD1DB(env.DB);
      if (env.SUSPEND_DATABASE_ACCESS === 'true') return;
      // 修复：将清理时间从1小时修改为24小时（1天）
      const oneDayAgo = new Date(Date.now() - 1000 * 60 * 60 * 24);
      await deleteExpiredEmails(db, oneDayAgo);
      console.log(`已清理 ${oneDayAgo.toISOString()} 之前的过期邮件`); // 添加日志
  },
};

async function recordMailboxUsage(env: Env, owner: string, address: string, field: 'mailboxes_created' | 'emails_received') {
  const identity = owner || 'anonymous:' + ((await hashToken(address.toLowerCase())).charCodeAt(0) % GLOBAL_SHARDS);
  await env.ACCESS.getByName(owner ? 'user:' + owner : identity).record(identity, '', field);
}
