import { Hono } from "hono";
import { z } from "zod";
import type { Env } from "../../../index";
import { getD1DB } from "../../../database/db";
import { mailboxes } from "../../../database/schema";
import {
  findMailboxById,
  findMailboxMessage,
  deleteMailboxMessage,
  getMailboxMessages,
} from "../../../database/dao";
import { failure } from "../../../guard";
import { positive } from "../../../limits";
type Variables = { apiKey: { id: string; userId: string; rateLimit: number } };
const router = new Hono<{ Bindings: Env; Variables: Variables }>();
const input = z.object({
  localPart: z
    .string()
    .regex(/^[a-z0-9][a-z0-9._-]{0,63}$/)
    .optional(),
  domain: z.string().optional(),
  expiresIn: z.number().int().min(60).max(86400).default(86400),
});
router.post("/", async (c) => {
  const raw = await c.req.text();
  let value: unknown;
  try {
    value = raw ? JSON.parse(raw) : {};
  } catch {
    return failure("VALIDATION_ERROR", "Invalid JSON body", 400);
  }
  const parsed = input.safeParse(value);
  if (!parsed.success)
    return failure(
      "VALIDATION_ERROR",
      "Invalid mailbox fields; lifetime must be 60–86400 seconds",
      400,
    );
  const body = parsed.data,
    actor = c.get("apiKey");
  const domains = c.env.EMAIL_DOMAIN.split(",").map((d) =>
    d.trim().toLowerCase(),
  );
  const domain = body.domain ?? domains[0];
  if (!domain || !domains.includes(domain))
    return failure("VALIDATION_ERROR", "Invalid domain", 400);
  const address =
    (body.localPart ?? crypto.randomUUID().replaceAll("-", "").slice(0, 16)) +
    "@" +
    domain;
  const now = new Date(),
    expiresAt = new Date(now.getTime() + body.expiresIn * 1000);
  const ledger = c.env.ACCESS.getByName("mailbox:" + address);
  const userLedger = c.env.ACCESS.getByName("user:" + actor.userId);
  if (
    !(await userLedger.reserveMailbox(
      address,
      expiresAt.getTime(),
      positive(c.env.MAX_ACTIVE_MAILBOXES, 20),
    ))
  )
    return failure("MAILBOX_LIMIT", "Active mailbox limit reached", 429);
  if (
    !(await ledger.activateMailbox(expiresAt.getTime(), false, actor.userId))
  ) {
    await userLedger.releaseMailbox(address);
    return failure("CONFLICT", "Address is already reserved", 409);
  }
  const db = getD1DB(c.env.DB);
  const mailbox = {
    id: crypto.randomUUID(),
    address,
    domain,
    expiresAt,
    apiKeyId: actor.id,
    userId: actor.userId,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(mailboxes).values(mailbox);
  await c.env.ACCESS.getByName("user:" + actor.userId).record(
    actor.userId,
    actor.id,
    "mailboxes_created",
  );
  return c.json(
    { data: { id: mailbox.id, address, domain, expiresAt, createdAt: now } },
    201,
  );
});
// All queries use the authenticated user, so rotating keys preserves mailbox access.
router.get("/:id", async (c) => {
  const box = await findMailboxById(getD1DB(c.env.DB), c.req.param("id"));
  if (
    !box ||
    box.userId !== c.get("apiKey").userId ||
    !box.expiresAt ||
    box.expiresAt <= new Date()
  )
    return failure("NOT_FOUND", "Mailbox not found or expired", 404);
  return c.json({
    data: {
      id: box.id,
      address: box.address,
      domain: box.domain,
      expiresAt: box.expiresAt,
      createdAt: box.createdAt,
    },
  });
});
router.get("/:id/messages", async (c) => {
  const db = getD1DB(c.env.DB),
    box = await findMailboxById(db, c.req.param("id"));
  if (
    !box ||
    box.userId !== c.get("apiKey").userId ||
    !box.expiresAt ||
    box.expiresAt <= new Date()
  )
    return failure("NOT_FOUND", "Mailbox not found or expired", 404);
  if (c.req.query("page") && c.req.query("page") !== "1")
    return failure("VALIDATION_ERROR", "Use cursor pagination", 400);
  const limit = Math.min(50, positive(c.req.query("limit"), 20));
  try {
    return c.json(
      await getMailboxMessages(db, box.address, {
        limit,
        cursor: c.req.query("cursor"),
      }),
    );
  } catch {
    return failure("VALIDATION_ERROR", "Invalid cursor", 400);
  }
});
router.get("/:id/messages/:messageId", async (c) => {
  const db = getD1DB(c.env.DB),
    box = await findMailboxById(db, c.req.param("id"));
  if (
    !box ||
    box.userId !== c.get("apiKey").userId ||
    !box.expiresAt ||
    box.expiresAt <= new Date()
  )
    return failure("NOT_FOUND", "Mailbox not found or expired", 404);
  const message = await findMailboxMessage(
    db,
    box.address,
    c.req.param("messageId"),
  );
  return message
    ? c.json({ data: message })
    : failure("NOT_FOUND", "Message not found", 404);
});
router.delete("/:id/messages/:messageId", async (c) => {
  const db = getD1DB(c.env.DB),
    box = await findMailboxById(db, c.req.param("id"));
  if (
    !box ||
    box.userId !== c.get("apiKey").userId ||
    !box.expiresAt ||
    box.expiresAt <= new Date()
  )
    return failure("NOT_FOUND", "Mailbox not found or expired", 404);
  await deleteMailboxMessage(db, box.address, c.req.param("messageId"));
  return c.json({ success: true });
});
export default router;
