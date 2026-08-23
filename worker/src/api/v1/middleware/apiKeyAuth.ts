import { Context, Next } from 'hono';
import { getD1DB } from '../../../database/db';
import { findApiKeyByKey, incrementApiCalls, incrementDailyApiCalls } from '../../../database/dao';
import { checkRateLimit, createDrizzleRateLimitStore, rateLimitHeaders } from '../../rateLimit';
import { incrementAndGetApiRateWindowCount } from '../../../database/dao';
import type { Env } from '../../../index';

/**
 * API Key 认证中间件
 * 从请求头 X-API-Key 或 Authorization: Bearer <key> 中提取 API Key
 */
export const apiKeyAuth = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const db = getD1DB(c.env.DB);
  const now = Math.floor(Date.now() / 1000);
  const configuredLimit = Number.parseInt(c.env.API_RATE_LIMIT_PER_MINUTE ?? '', 10);
  const rateLimit = Number.isFinite(configuredLimit) && configuredLimit > 0 ? configuredLimit : 100;

  // 1. 提取 API Key
  let apiKey = c.req.header('X-API-Key');

  if (!apiKey) {
    const authHeader = c.req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      apiKey = authHeader.substring(7);
    }
  }

  if (!apiKey) {
    return c.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing API Key. Provide it via X-API-Key header or Authorization: Bearer <key>',
      }
    }, 401);
  }

  // 2. 尝试从缓存获取 API Key 信息
  const cache = caches.default;
  const cacheKey = new Request(`https://apikey-cache.internal/${apiKey}`);
  const cached = await cache.match(cacheKey);

  let keyRecord;
  if (cached) {
    // 从缓存读取
    keyRecord = await cached.json();
  } else {
    // 缓存未命中，从数据库查询
    keyRecord = await findApiKeyByKey(db, apiKey);

    if (!keyRecord) {
      return c.json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid API Key',
        }
      }, 401);
    }

    // 将结果缓存5分钟
    const response = new Response(JSON.stringify(keyRecord), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
      },
    });
    c.executionCtx.waitUntil(cache.put(cacheKey, response));
  }

  // 3. 检查是否启用
  if (!keyRecord.isActive) {
    return c.json({
      error: {
        code: 'FORBIDDEN',
        message: 'API Key is disabled',
      }
    }, 403);
  }

  // 4. 检查是否过期
  if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
    return c.json({
      error: {
        code: 'FORBIDDEN',
        message: 'API Key has expired',
      }
    }, 403);
  }

  // 5. 限流检查 — 通过 RateLimit 深模块，window 计算与 header 推导集中在一处
  const store = createDrizzleRateLimitStore(db, incrementAndGetApiRateWindowCount as any);
  const rl = await checkRateLimit(keyRecord.id, rateLimit, now, store);

  if (!rl.allowed) {
    const headers = rateLimitHeaders(rl);
    c.header('X-RateLimit-Limit', headers['X-RateLimit-Limit']);
    c.header('X-RateLimit-Remaining', headers['X-RateLimit-Remaining']);
    c.header('Retry-After', headers['Retry-After']!);
    return c.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: `Rate limit exceeded. Max ${rateLimit} requests per minute`,
        },
      },
      429,
    );
  }

  // 6. 增加 API 调用计数 (异步，不阻塞请求)
  c.executionCtx.waitUntil(Promise.all([incrementApiCalls(db), incrementDailyApiCalls(db)]));

  c.header('X-RateLimit-Limit', String(rl.limit));
  c.header('X-RateLimit-Remaining', String(rl.remaining));

  // 7. 将 API Key 信息存入上下文
  c.set('apiKey', {
    id: keyRecord.id,
    rateLimit,
  });

  await next();
};
