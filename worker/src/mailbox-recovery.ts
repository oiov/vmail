import type { Env } from "./index";
import {
  DEFAULT_MAX_ACTIVE_MAILBOXES,
  MAILBOX_LIFETIME_MS,
  positive,
} from "./limits";
import { isAllowedMailboxAddress } from "./sender";

type Box = {
  id: string;
  address: string;
  user_id: string | null;
  expires_at: number | null;
};
type RecoveryInput = {
  userId: string;
  actorId: string;
  address: string;
  reason: string;
  allowClaim: boolean;
  dryRun?: boolean;
};
export type RecoveryResult = {
  address: string;
  code: string;
  id?: string;
  expiresAt?: number;
  active?: boolean;
};

export async function recoverMailbox(
  env: Env,
  input: RecoveryInput,
): Promise<RecoveryResult> {
  const { address, userId, actorId, reason, allowClaim, dryRun } = input;
  const result = (code: string): RecoveryResult => ({ address, code });
  if (env.SUSPEND_DATABASE_ACCESS === "true") return result("SERVICE_PAUSED");
  if (
    !/^[a-z0-9][a-z0-9._-]{0,63}@[^@\s]+$/.test(address) ||
    !isAllowedMailboxAddress(address, env.EMAIL_DOMAIN)
  )
    return result("INVALID_ADDRESS");
  const user = await env.DB.prepare(
    "SELECT email_verified,banned FROM auth_user WHERE id=?",
  )
    .bind(userId)
    .first<{ email_verified: number; banned: number }>();
  if (!user || !user.email_verified) return result("ACCOUNT_NOT_VERIFIED");
  const userLedger = env.ACCESS.getByName("user:" + userId);
  if (user.banned || (await userLedger.accessState()).banned)
    return result("ACCOUNT_BANNED");
  const matches = await env.DB.prepare(
    "SELECT id,address,user_id,expires_at FROM mailboxes WHERE address=? COLLATE NOCASE LIMIT 2",
  )
    .bind(address)
    .all<Box>();
  const box = matches.results[0];
  if (matches.results.length > 1 || (box && box.address !== address))
    return result("ADDRESS_CASE_CONFLICT");
  if (
    (box?.user_id && box.user_id !== userId) ||
    (!allowClaim && box?.user_id !== userId)
  )
    return result("OWNERSHIP_CONFLICT");
  const ledger = env.ACCESS.getByName("mailbox:" + address);
  const state = await ledger.mailboxState();
  if (
    (state.owner && state.owner !== userId) ||
    (!state.owner && (!allowClaim || state.expiresAt > Date.now()))
  )
    return result("OWNERSHIP_CONFLICT");
  if (state.recovering) return result("RECOVERY_BUSY");
  if (dryRun)
    return {
      address,
      code: "READY",
      id: box?.id,
      expiresAt: state.expiresAt,
      active:
        box?.user_id === userId &&
        state.owner === userId &&
        (box.expires_at ?? 0) * 1000 > Date.now() &&
        state.expiresAt > Date.now(),
    };

  const pending = await ledger.beginMailboxRecovery(userId, allowClaim);
  if (pending.code !== "READY") return result(pending.code);
  const now = Date.now();
  // Retrying an already-active recovery does not extend its lifetime indefinitely.
  const expiresAt =
    Math.floor(
      (pending.expiresAt > now
        ? pending.expiresAt
        : now + MAILBOX_LIFETIME_MS) / 1000,
    ) * 1000;
  const id = box?.id ?? crypto.randomUUID();
  let auditStarted = false;
  try {
    await env.DB.prepare(
      "INSERT INTO mailbox_recovery_logs (id,actor_id,user_id,address,action,reason,previous_user_id,previous_expires_at,expires_at,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,'pending',?,?)",
    )
      .bind(
        pending.operationId,
        actorId,
        userId,
        address,
        allowClaim ? "admin_import" : "reactivate",
        reason,
        box?.user_id ?? null,
        box?.expires_at ?? null,
        expiresAt,
        now,
        now,
      )
      .run();
    auditStarted = true;
    if (
      !(await userLedger.reserveMailbox(
        address,
        expiresAt,
        positive(env.MAX_ACTIVE_MAILBOXES, DEFAULT_MAX_ACTIVE_MAILBOXES),
        pending.operationId,
      ))
    ) {
      await env.DB.prepare(
        "UPDATE mailbox_recovery_logs SET status='capacity_rejected',updated_at=? WHERE id=?",
      )
        .bind(Date.now(), pending.operationId)
        .run();
      return result("MAILBOX_LIMIT");
    }
    // Conditional upsert is the final ownership check, even if another request raced the inspection.
    const saved = await env.DB.prepare(
      "INSERT INTO mailboxes (id,address,domain,api_key_id,user_id,expires_at,created_at,updated_at) VALUES (?,?,?,'recovery',?,?,?,?) " +
        "ON CONFLICT(address) DO UPDATE SET user_id=excluded.user_id,expires_at=excluded.expires_at,updated_at=excluded.updated_at " +
        "WHERE mailboxes.user_id=excluded.user_id OR (?=1 AND (mailboxes.user_id IS NULL OR mailboxes.user_id='')) RETURNING id,expires_at",
    )
      .bind(
        id,
        address,
        address.split("@")[1],
        userId,
        expiresAt / 1000,
        Math.floor(now / 1000),
        Math.floor(now / 1000),
        Number(allowClaim),
      )
      .first<{ id: string; expires_at: number }>();
    if (!saved) {
      await env.DB.prepare(
        "UPDATE mailbox_recovery_logs SET status='ownership_conflict',updated_at=? WHERE id=?",
      )
        .bind(Date.now(), pending.operationId)
        .run();
      return result("OWNERSHIP_CONFLICT");
    }
    if (
      !(await ledger.finishMailboxRecovery(
        pending.operationId,
        saved.expires_at * 1000,
      ))
    )
      throw new Error("Recovery lease expired");
    await env.DB.prepare(
      "UPDATE mailbox_recovery_logs SET status='completed',expires_at=?,updated_at=? WHERE id=?",
    )
      .bind(saved.expires_at * 1000, Date.now(), pending.operationId)
      .run();
    return {
      address,
      code: "RECOVERED",
      id: saved.id,
      expiresAt: saved.expires_at * 1000,
    };
  } catch {
    // D1 and DO do not share a transaction. Keep quota reservations on uncertain outcomes;
    // a retry for the same address repairs state without consuming another active slot.
    if (auditStarted)
      await env.DB.prepare(
        "UPDATE mailbox_recovery_logs SET status='retry_required',updated_at=? WHERE id=?",
      )
        .bind(Date.now(), pending.operationId)
        .run();
    return result("RETRY_REQUIRED");
  } finally {
    await ledger.cancelMailboxRecovery(pending.operationId);
  }
}
