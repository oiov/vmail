import { Hono } from 'hono';
import type { Env } from '../../../index';
import { getD1DB } from '../../../database/db';
import { nanoid } from 'nanoid/non-secure';
import {
  insertMailbox,
  findMailboxById,
  getMailboxMessages,
  findMailboxMessage,
  deleteMailboxMessage,
  getMailboxMessageCount,
  incrementAddressesCreated,
} from '../../../database/dao';

// 随机邮箱名称生成
function generateRandomLocalPart(): string {
  const adjectives = ['quick', 'lazy', 'happy', 'sad', 'bright', 'dark', 'warm', 'cold', 'soft', 'hard'];
  const nouns = ['fox', 'dog', 'cat', 'bird', 'fish', 'lion', 'bear', 'wolf', 'deer', 'hawk'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}-${noun}-${num}`;
}

const mailboxesRouter = new Hono<{ Bindings: Env }>();

// POST /api/v1/mailboxes - 创建邮箱
mailboxesRouter.post('/', async (c) => {
  const db = getD1DB(c.env.DB);
  const apiKey = c.get('apiKey') as { id: string; rateLimit: number };

  let body: { localPart?: string; domain?: string; expiresIn?: number } = {};
  try {
    body = await c.req.json();
  } catch {
    // 允许空请求体
  }

  // 获取可用域名
  const availableDomains = c.env.EMAIL_DOMAIN ? c.env.EMAIL_DOMAIN.split(',').map(d => d.trim()) : [];
  if (availableDomains.length === 0) {
    return c.json({
      error: {
        code: 'CONFIGURATION_ERROR',
        message: 'No email domains configured',
      }
    }, 500);
  }

  // 验证域名
  const domain = body.domain || availableDomains[0];
  if (!availableDomains.includes(domain)) {
    return c.json({
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid domain. Available domains: ${availableDomains.join(', ')}`,
        details: { field: 'domain', allowed: availableDomains }
      }
    }, 400);
  }

  // 生成邮箱地址
  const localPart = body.localPart || generateRandomLocalPart();
  const address = `${localPart}@${domain}`;

  // 计算过期时间
  const expiresIn = body.expiresIn || 24 * 60 * 60; // 默认 24 小时
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  const now = new Date();
  const mailbox = {
    id: nanoid(),
    address,
    domain,
    expiresAt,
    apiKeyId: apiKey.id,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await insertMailbox(db, mailbox);
    // 增加邮箱地址创建计数
    await incrementAddressesCreated(db);
    return c.json({
      data: {
        id: mailbox.id,
        address: mailbox.address,
        domain: mailbox.domain,
        expiresAt: mailbox.expiresAt.toISOString(),
        createdAt: mailbox.createdAt.toISOString(),
      }
    }, 201);
  } catch (e: any) {
    if (e.message?.includes('UNIQUE constraint failed')) {
      return c.json({
        error: {
          code: 'CONFLICT',
          message: 'Email address already exists',
        }
      }, 409);
    }
    console.error('Create mailbox error:', e);
    return c.json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create mailbox',
      }
    }, 500);
  }
});

// GET /api/v1/mailboxes/:id - 获取邮箱信息
mailboxesRouter.get('/:id', async (c) => {
  const db = getD1DB(c.env.DB);
  const apiKey = c.get('apiKey') as { id: string; rateLimit: number };
  const { id } = c.req.param();

  const mailbox = await findMailboxById(db, id);
  if (!mailbox) {
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: 'Mailbox not found',
      }
    }, 404);
  }

  // 验证所属关系
  if (mailbox.apiKeyId !== apiKey.id) {
    return c.json({
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have access to this mailbox',
      }
    }, 403);
  }

  const messageCount = await getMailboxMessageCount(db, mailbox.address);

  return c.json({
    data: {
      id: mailbox.id,
      address: mailbox.address,
      domain: mailbox.domain,
      expiresAt: mailbox.expiresAt?.toISOString() || null,
      createdAt: mailbox.createdAt.toISOString(),
      messageCount,
    }
  });
});

// GET /api/v1/mailboxes/:id/messages - 获取收件箱
mailboxesRouter.get('/:id/messages', async (c) => {
  const db = getD1DB(c.env.DB);
  const apiKey = c.get('apiKey') as { id: string; rateLimit: number };
  const { id } = c.req.param();

  const mailbox = await findMailboxById(db, id);
  if (!mailbox) {
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: 'Mailbox not found',
      }
    }, 404);
  }

  // 验证所属关系
  if (mailbox.apiKeyId !== apiKey.id) {
    return c.json({
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have access to this mailbox',
      }
    }, 403);
  }

  // 解析分页参数
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20', 10)));
  const sort = c.req.query('sort') === 'asc' ? 'asc' : 'desc';

  const { messages, total, totalPages } = await getMailboxMessages(db, mailbox.address, { page, limit, sort });

  return c.json({
    data: messages.map((msg) => ({
      id: msg.id,
      from: msg.from,
      subject: msg.subject,
      preview: msg.text?.substring(0, 100) || null,
      receivedAt: msg.createdAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    }
  });
});

// GET /api/v1/mailboxes/:id/messages/:messageId - 获取邮件详情
mailboxesRouter.get('/:id/messages/:messageId', async (c) => {
  const db = getD1DB(c.env.DB);
  const apiKey = c.get('apiKey') as { id: string; rateLimit: number };
  const { id, messageId } = c.req.param();

  const mailbox = await findMailboxById(db, id);
  if (!mailbox) {
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: 'Mailbox not found',
      }
    }, 404);
  }

  // 验证所属关系
  if (mailbox.apiKeyId !== apiKey.id) {
    return c.json({
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have access to this mailbox',
      }
    }, 403);
  }

  const message = await findMailboxMessage(db, mailbox.address, messageId);
  if (!message) {
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: 'Message not found',
      }
    }, 404);
  }

  return c.json({
    data: {
      id: message.id,
      messageId: message.messageId,
      from: message.from,
      to: message.to,
      cc: message.cc,
      bcc: message.bcc,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
      headers: message.headers,
      receivedAt: message.createdAt.toISOString(),
    }
  });
});

// DELETE /api/v1/mailboxes/:id/messages/:messageId - 删除邮件
mailboxesRouter.delete('/:id/messages/:messageId', async (c) => {
  const db = getD1DB(c.env.DB);
  const apiKey = c.get('apiKey') as { id: string; rateLimit: number };
  const { id, messageId } = c.req.param();

  const mailbox = await findMailboxById(db, id);
  if (!mailbox) {
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: 'Mailbox not found',
      }
    }, 404);
  }

  // 验证所属关系
  if (mailbox.apiKeyId !== apiKey.id) {
    return c.json({
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have access to this mailbox',
      }
    }, 403);
  }

  const deleted = await deleteMailboxMessage(db, mailbox.address, messageId);
  if (!deleted) {
    return c.json({
      error: {
        code: 'NOT_FOUND',
        message: 'Message not found',
      }
    }, 404);
  }

  return c.json({
    data: {
      deleted: true,
      id: messageId,
    }
  });
});

export default mailboxesRouter;
