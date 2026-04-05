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

// 随机邮箱名称生成（模拟真实用户命名习惯）
function generateRandomLocalPart(): string {
  const firstNames = [
    // male
    'james', 'john', 'robert', 'michael', 'william', 'david', 'richard', 'joseph', 'thomas', 'charles',
    'christopher', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua',
    'kenneth', 'kevin', 'brian', 'george', 'timothy', 'ronald', 'edward', 'jason', 'jeffrey', 'ryan',
    'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon',
    'benjamin', 'samuel', 'raymond', 'gregory', 'frank', 'alexander', 'patrick', 'jack', 'dennis', 'jerry',
    'aaron', 'alan', 'adam', 'andy', 'barry', 'bill', 'bob', 'brad', 'brett', 'brent',
    'bruce', 'bryan', 'chad', 'charlie', 'chris', 'clark', 'clay', 'cliff', 'clint', 'craig',
    'dale', 'dan', 'darrell', 'dave', 'derek', 'devin', 'doug', 'duane', 'dustin', 'dwight',
    'earl', 'edgar', 'eli', 'elliot', 'ethan', 'evan', 'finn', 'gabriel', 'henry', 'ian',
    'jake', 'joel', 'julian', 'karl', 'lane', 'leo', 'liam', 'logan', 'lucas', 'mason',
    'max', 'miles', 'neil', 'noah', 'oliver', 'pete', 'ray', 'reid', 'ross', 'sean',
    'seth', 'todd', 'troy', 'wade', 'will', 'calvin', 'claude', 'felix', 'floyd', 'glen',
    'grant', 'hank', 'herb', 'homer', 'horace', 'ivan', 'jerome', 'lance', 'lloyd', 'marshall',
    // female
    'mary', 'patricia', 'jennifer', 'linda', 'barbara', 'elizabeth', 'susan', 'jessica', 'sarah', 'karen',
    'lisa', 'nancy', 'betty', 'margaret', 'sandra', 'ashley', 'emily', 'kimberly', 'donna', 'carol',
    'michelle', 'dorothy', 'amanda', 'melissa', 'deborah', 'stephanie', 'rebecca', 'sharon', 'laura', 'cynthia',
    'kathleen', 'amy', 'angela', 'shirley', 'anna', 'brenda', 'pamela', 'emma', 'nicole', 'helen',
    'samantha', 'katherine', 'christine', 'debra', 'rachel', 'carolyn', 'janet', 'catherine', 'maria', 'heather',
    'sophia', 'olivia', 'ava', 'isabella', 'mia', 'abigail', 'madison', 'chloe', 'ella', 'avery',
    'scarlett', 'grace', 'lily', 'aria', 'riley', 'zoey', 'nora', 'hazel', 'aurora', 'savannah',
    'brooklyn', 'leah', 'zoe', 'stella', 'natalie', 'eva', 'claire', 'ellie', 'maya', 'piper',
    'victoria', 'lucy', 'paisley', 'skylar', 'camila', 'penelope', 'layla', 'hailey', 'luna', 'amber',
    'april', 'beth', 'brooke', 'dana', 'dawn', 'diana', 'fiona', 'gail', 'holly', 'jade',
    'jan', 'joan', 'joyce', 'june', 'kate', 'kay', 'kim', 'leigh', 'lynn', 'molly',
    'paige', 'ruth', 'tara', 'vera', 'wendy', 'abby', 'alice', 'anne', 'bea', 'rose',
  ];

  const lastNames = [
    'smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis', 'wilson', 'taylor',
    'anderson', 'thomas', 'jackson', 'white', 'harris', 'martin', 'thompson', 'young', 'allen', 'king',
    'wright', 'scott', 'torres', 'nguyen', 'hill', 'flores', 'green', 'adams', 'nelson', 'baker',
    'hall', 'rivera', 'campbell', 'mitchell', 'carter', 'roberts', 'gomez', 'phillips', 'evans', 'turner',
    'diaz', 'parker', 'cruz', 'edwards', 'collins', 'reyes', 'stewart', 'morris', 'morales', 'murphy',
    'cook', 'rogers', 'gutierrez', 'ortiz', 'morgan', 'cooper', 'peterson', 'bailey', 'reed', 'kelly',
    'howard', 'ramos', 'kim', 'cox', 'ward', 'richardson', 'watson', 'brooks', 'chavez', 'wood',
    'james', 'bennett', 'gray', 'mendoza', 'ruiz', 'hughes', 'price', 'alvarez', 'castillo', 'sanders',
    'patel', 'myers', 'long', 'ross', 'foster', 'jimenez', 'powell', 'jenkins', 'perry', 'russell',
    'sullivan', 'bell', 'coleman', 'butler', 'henderson', 'barnes', 'gonzalez', 'fisher', 'vasquez', 'simmons',
    'romero', 'jordan', 'patterson', 'alexander', 'hamilton', 'graham', 'reynolds', 'griffin', 'wallace', 'moreno',
    'west', 'cole', 'hayes', 'bryant', 'herrera', 'gibson', 'ellis', 'tran', 'medina', 'aguilar',
    'stevens', 'murray', 'ford', 'castro', 'marshall', 'owens', 'harrison', 'fernandez', 'mcdonald', 'woods',
    'kennedy', 'wells', 'vargas', 'henry', 'chen', 'freeman', 'webb', 'tucker', 'guzman', 'burns',
    'crawford', 'olson', 'simpson', 'porter', 'hunter', 'gordon', 'mendez', 'silva', 'shaw', 'snyder',
    'mason', 'munoz', 'hunt', 'hicks', 'holmes', 'palmer', 'wagner', 'black', 'robertson', 'boyd',
    'stone', 'salazar', 'fox', 'warren', 'mills', 'meyer', 'rice', 'schmidt', 'garza', 'daniels',
    'ferguson', 'nichols', 'stephens', 'soto', 'weaver', 'ryan', 'gardner', 'payne', 'grant', 'dunn',
    'kelley', 'spencer', 'hawkins', 'arnold', 'pierce', 'stevenson', 'lawson', 'bishop', 'byrd', 'christensen',
    'mann', 'carr', 'lee', 'harvey', 'walsh', 'cross', 'lane', 'klein', 'parks', 'sharp',
    'berry', 'morrow', 'powers', 'holt', 'terry', 'bond', 'cannon', 'hart', 'dean', 'day',
    'lowe', 'rios', 'leon', 'malone', 'french', 'hammond', 'moss', 'horton', 'waters', 'rhodes',
    'bass', 'quinn', 'hardy', 'marsh', 'howell', 'barker', 'larson', 'norris', 'dawson', 'fletcher',
    'watts', 'strickland', 'horne', 'burnett', 'pope', 'barber', 'caldwell', 'gilbert', 'patton', 'hutchinson',
    'bowers', 'barton', 'rush', 'love', 'hanson', 'graves', 'alvarado', 'zimmerman', 'mcbride', 'luna',
  ];

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  // 模拟出生年（1960–2005）的两位数后缀，如 84、92、03
  const yearSuffix = (): string => String((Math.floor(Math.random() * 46) + 60) % 100).padStart(2, '0');
  const num2 = (): string => String(Math.floor(Math.random() * 100)).padStart(2, '0');

  const first = pick(firstNames);
  const last = pick(lastNames);
  const f = first[0];

  // 7 种命名模式，随机选取一种
  const patterns: (() => string)[] = [
    () => `${first}.${last}`,              // john.smith
    () => `${first}_${last}`,              // john_smith
    () => `${first}${last}`,               // johnsmith
    () => `${f}.${last}`,                  // j.smith
    () => `${f}${last}`,                   // jsmith
    () => `${first}${num2()}`,             // john84
    () => `${first}.${last}${yearSuffix()}`, // john.smith92
  ];

  return pick(patterns)();
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
