import { Hono } from "hono";
import type { Env } from "../../../env.ts";
import { getD1DB } from "../../../database/db.ts";
import { nanoid } from "nanoid/non-secure";
import {
  insertMailbox,
  findMailboxById,
  findMailboxByAddress,
  getMailboxMessages,
  findMailboxMessage,
  deleteMailboxMessage,
  getMailboxMessageCount,
  record,
} from "../../../database/dao.ts";

import { isValidLocalPart, normalizeLocalPart } from "../localPart.ts";
import { generateUniqueLocalPart } from "../randomLocalPart.ts";

const mailboxesRouter = new Hono<{
  Bindings: Env;
  Variables: { apiKey: { id: string; rateLimit: number } };
}>();

// POST /api/v1/mailboxes - 创建邮箱
mailboxesRouter.post("/", async (c) => {
  const db = getD1DB(c.env.DB);
  const apiKey = c.get("apiKey") as { id: string; rateLimit: number };

  let body: { localPart?: string; domain?: string; expiresIn?: number } = {};
  try {
    // review-F2: 合法 JSON null 体归一为空对象，避免 body.domain 抛 TypeError 致裸 500
    const parsedBody = await c.req.json();
    if (parsedBody && typeof parsedBody === "object") body = parsedBody;
  } catch {
    // 允许空请求体
  }

  // 获取可用域名
  // CodeRabbit PR#42 CR-3: 与用户输入/身份层同款小写归一化，
  // 否则配置含大写域名时 includes 检查误判合法请求为 400
  const availableDomains = c.env.EMAIL_DOMAIN
    ? c.env.EMAIL_DOMAIN.split(",").map((d) => d.trim().toLowerCase())
    : [];
  if (availableDomains.length === 0) {
    return c.json(
      {
        error: {
          code: "CONFIGURATION_ERROR",
          message: "No email domains configured",
        },
      },
      500,
    );
  }

  // 验证域名（review-F3: 与身份/白名单层一致，统一小写归一化）
  const domain = (body.domain || availableDomains[0]).toLowerCase();
  if (!availableDomains.includes(domain)) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: `Invalid domain. Available domains: ${availableDomains.join(", ")}`,
          details: { field: "domain", allowed: availableDomains },
        },
      },
      400,
    );
  }

  // 生成邮箱地址
  // PR#42 CR-2: 随机分支走 CSPRNG 后缀 + 冲突重试; 用户指定分支保持原样(冲突如实 409)
  // CodeRabbit PR#42 CR-2(本轮): 生成调用移入 try — LOCAL_PART_EXHAUSTED 走 409 CONFLICT 信封而非裸 500
  let localPart: string;
  try {
    localPart =
      typeof body.localPart === "string" && body.localPart
        ? normalizeLocalPart(body.localPart)
        : await generateUniqueLocalPart(async (candidate) => {
            const found = await findMailboxByAddress(
              db,
              candidate + "@" + domain,
            );
            return found !== null;
          });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("LOCAL_PART_EXHAUSTED")) {
      return c.json(
        {
          error: {
            code: "CONFLICT",
            message:
              "Could not generate a unique mailbox address, please try again",
          },
        },
        409,
      );
    }
    throw e;
  }
  if (!isValidLocalPart(localPart)) {
    return c.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message:
            "Invalid localPart. Use 2-32 chars: letters, digits, dot, hyphen, underscore; must start and end with letter or digit",
          details: { field: "localPart" },
        },
      },
      400,
    );
  }
  const address = `${localPart}@${domain}`;

  // 计算过期时间
  // review-F1: 校验 expiresIn 为正有限数且不超过 30 天上限，
  // 负值/NaN/Infinity/超大值一律回退默认 24 小时——
  // 杜绝"出生即过期"邮箱与 Invalid time value 序列化 500
  const DEFAULT_EXPIRES_IN = 24 * 60 * 60;
  const rawExpiresIn = body.expiresIn;
  const expiresIn =
    typeof rawExpiresIn === "number" &&
    Number.isFinite(rawExpiresIn) &&
    rawExpiresIn > 0 &&
    rawExpiresIn <= DEFAULT_EXPIRES_IN * 30
      ? Math.floor(rawExpiresIn)
      : DEFAULT_EXPIRES_IN;
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
    // 增加邮箱地址创建计数（review-E1: 接线 record 统一双写入口，daily 图表不再漏计 v1 建箱）
    await record(db, "addressCreated");
    return c.json(
      {
        data: {
          id: mailbox.id,
          address: mailbox.address,
          domain: mailbox.domain,
          expiresAt: mailbox.expiresAt.toISOString(),
          createdAt: mailbox.createdAt.toISOString(),
        },
      },
      201,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("UNIQUE constraint failed")) {
      return c.json(
        {
          error: {
            code: "CONFLICT",
            message: "Email address already exists",
          },
        },
        409,
      );
    }
    console.error("Create mailbox error:", e);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create mailbox",
        },
      },
      500,
    );
  }
});

// GET /api/v1/mailboxes/:id - 获取邮箱信息
mailboxesRouter.get("/:id", async (c) => {
  const db = getD1DB(c.env.DB);
  const apiKey = c.get("apiKey") as { id: string; rateLimit: number };
  const { id } = c.req.param();

  const mailbox = await findMailboxById(db, id);
  if (!mailbox) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Mailbox not found",
        },
      },
      404,
    );
  }

  // 验证所属关系
  if (mailbox.apiKeyId !== apiKey.id) {
    return c.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "You do not have access to this mailbox",
        },
      },
      403,
    );
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
    },
  });
});

// GET /api/v1/mailboxes/:id/messages - 获取收件箱
mailboxesRouter.get("/:id/messages", async (c) => {
  const db = getD1DB(c.env.DB);
  const apiKey = c.get("apiKey") as { id: string; rateLimit: number };
  const { id } = c.req.param();

  const mailbox = await findMailboxById(db, id);
  if (!mailbox) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Mailbox not found",
        },
      },
      404,
    );
  }

  // 验证所属关系
  if (mailbox.apiKeyId !== apiKey.id) {
    return c.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "You do not have access to this mailbox",
        },
      },
      403,
    );
  }

  // 解析分页参数
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(c.req.query("limit") || "20", 10)),
  );
  const sort = c.req.query("sort") === "asc" ? "asc" : "desc";

  const { messages, total, totalPages } = await getMailboxMessages(
    db,
    mailbox.address,
    { page, limit, sort },
  );

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
    },
  });
});

// GET /api/v1/mailboxes/:id/messages/:messageId - 获取邮件详情
mailboxesRouter.get("/:id/messages/:messageId", async (c) => {
  const db = getD1DB(c.env.DB);
  const apiKey = c.get("apiKey") as { id: string; rateLimit: number };
  const { id, messageId } = c.req.param();

  const mailbox = await findMailboxById(db, id);
  if (!mailbox) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Mailbox not found",
        },
      },
      404,
    );
  }

  // 验证所属关系
  if (mailbox.apiKeyId !== apiKey.id) {
    return c.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "You do not have access to this mailbox",
        },
      },
      403,
    );
  }

  const message = await findMailboxMessage(db, mailbox.address, messageId);
  if (!message) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Message not found",
        },
      },
      404,
    );
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
    },
  });
});

// DELETE /api/v1/mailboxes/:id/messages/:messageId - 删除邮件
mailboxesRouter.delete("/:id/messages/:messageId", async (c) => {
  const db = getD1DB(c.env.DB);
  const apiKey = c.get("apiKey") as { id: string; rateLimit: number };
  const { id, messageId } = c.req.param();

  const mailbox = await findMailboxById(db, id);
  if (!mailbox) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Mailbox not found",
        },
      },
      404,
    );
  }

  // 验证所属关系
  if (mailbox.apiKeyId !== apiKey.id) {
    return c.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "You do not have access to this mailbox",
        },
      },
      403,
    );
  }

  const deleted = await deleteMailboxMessage(db, mailbox.address, messageId);
  if (!deleted) {
    return c.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Message not found",
        },
      },
      404,
    );
  }

  return c.json({
    data: {
      deleted: true,
      id: messageId,
    },
  });
});

export default mailboxesRouter;
