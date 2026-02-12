import { Context, Next } from 'hono';
import { getD1DB } from '../../../database/db';
import { findApiKeyByKey, updateApiKeyLastUsed, incrementApiCalls } from '../../../database/dao';
import type { Env } from '../../../index';

/**
 * API Key 认证中间件
 * 从请求头 X-API-Key 或 Authorization: Bearer <key> 中提取 API Key
 */
export const apiKeyAuth = async (c: Context<{ Bindings: Env }>, next: Next) => {
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
  const db = getD1DB(c.env.DB);
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

  // 5. 更新最后使用时间 (异步，不阻塞请求)
  c.executionCtx.waitUntil(updateApiKeyLastUsed(db, keyRecord.id));

  // 6. 增加 API 调用计数 (异步，不阻塞请求)
  c.executionCtx.waitUntil(incrementApiCalls(db));

  // 7. 将 API Key 信息存入上下文
  c.set('apiKey', {
    id: keyRecord.id,
    rateLimit: keyRecord.rateLimit || 100,
  });

  await next();
};
