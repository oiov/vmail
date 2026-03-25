import { Context, Next } from 'hono';
import { getD1DB } from '../../../database/db';
import { findApiKeyByKey, updateApiKeyLastUsed, incrementApiCalls, incrementDailyApiCalls, incrementAndGetApiRateWindowCount } from '../../../database/dao';
import type { Env } from '../../../index';

/**
 * API Key 认证中间件
 * 从请求头 X-API-Key 或 Authorization: Bearer <key> 中提取 API Key
 */
export const apiKeyAuth = async (c: Context<{ Bindings: Env }>, next: Next) => {
  const db = getD1DB(c.env.DB);
  const now = Math.floor(Date.now() / 1000);
  const currentWindow = Math.floor(now / 60) * 60;
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

  // 2. 验证 API Key
  const keyRecord = await findApiKeyByKey(db, apiKey);

  if (!keyRecord) {
    return c.json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid API Key',
      }
    }, 401);
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
  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    return c.json({
      error: {
        code: 'FORBIDDEN',
        message: 'API Key has expired',
      }
    }, 403);
  }

  // 5. 原子限流检查
  const currentCount = await incrementAndGetApiRateWindowCount(
    db,
    keyRecord.id,
    currentWindow,
  );

  if (currentCount > rateLimit) {
    const retryAfter = currentWindow + 60 - now;
    c.header('X-RateLimit-Limit', `${rateLimit}`);
    c.header('X-RateLimit-Remaining', '0');
    c.header('Retry-After', `${retryAfter > 0 ? retryAfter : 1}`);
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

  // 6. 更新最后使用时间 (异步，不阻塞请求)
  c.executionCtx.waitUntil(updateApiKeyLastUsed(db, keyRecord.id));

  // 7. 增加 API 调用计数 (异步，不阻塞请求)
  c.executionCtx.waitUntil(Promise.all([incrementApiCalls(db), incrementDailyApiCalls(db)]));

  const remaining = Math.max(rateLimit - currentCount, 0);
  c.header('X-RateLimit-Limit', `${rateLimit}`);
  c.header('X-RateLimit-Remaining', `${remaining}`);

  // 8. 将 API Key 信息存入上下文
  c.set('apiKey', {
    id: keyRecord.id,
    rateLimit,
  });

  await next();
};
