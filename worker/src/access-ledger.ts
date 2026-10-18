import { DurableObject } from "cloudflare:workers";
import type { Env } from "./index";
import type { Rule, Decision } from "./limits";
import { MAX_API_KEYS } from "./limits";
type KeyRecord = { id: string; digest: string; expiresAt: number };
/** One object per user, mailbox, or global-budget shard. No D1 on this path. */
export class AccessLedger extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS usage (date TEXT NOT NULL, key_id TEXT NOT NULL, api_calls INTEGER NOT NULL DEFAULT 0, mailboxes_created INTEGER NOT NULL DEFAULT 0, emails_received INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(date, key_id))",
    );
    this.ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS counters (key TEXT PRIMARY KEY, window INTEGER NOT NULL, count INTEGER NOT NULL)",
    );
  }
  consume(rules: Rule[]): Decision {
    return this.ctx.storage.transactionSync(() => {
      const now = Math.floor(Date.now() / 1000);
      let remaining = Number.MAX_SAFE_INTEGER;
      const updates: Array<{ key: string; window: number; count: number }> = [];
      for (const rule of rules) {
        const window = Math.floor(now / rule.seconds) * rule.seconds;
        const row = this.ctx.storage.sql
          .exec<{
            window: number;
            count: number;
          }>("SELECT window, count FROM counters WHERE key = ?", rule.key)
          .toArray()[0];
        const count = row?.window === window ? row.count : 0;
        if (count >= rule.max)
          return {
            allowed: false,
            remaining: 0,
            retryAfter: window + rule.seconds - now,
          };
        remaining = Math.min(remaining, rule.max - count - 1);
        updates.push({ key: rule.key, window, count: count + 1 });
      }
      for (const row of updates)
        this.ctx.storage.sql.exec(
          "INSERT INTO counters VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET window=excluded.window, count=excluded.count",
          row.key,
          row.window,
          row.count,
        );
      return { allowed: true, remaining, retryAfter: 0 };
    });
  }
  registerKey(record: KeyRecord): boolean {
    return this.ctx.storage.transactionSync(() => {
      const keys = (this.ctx.storage.kv.get<KeyRecord[]>("keys") ?? []).filter(
        (k) => k.expiresAt > Date.now(),
      );
      if (keys.some((k) => k.id === record.id)) return true;
      if (keys.length >= MAX_API_KEYS) return false;
      this.ctx.storage.kv.put("keys", [...keys, record]);
      return true;
    });
  }
  revokeKey(id: string) {
    const keys = this.ctx.storage.kv.get<KeyRecord[]>("keys") ?? [];
    this.ctx.storage.kv.put(
      "keys",
      keys.filter((k) => k.id !== id),
    );
  }
  async authorize(digest: string, rules: Rule[], owner: string) {
    const keys = this.ctx.storage.kv.get<KeyRecord[]>("keys") ?? [];
    const key = keys.find(
      (k) => k.digest === digest && k.expiresAt > Date.now(),
    );
    if (!key)
      return {
        valid: false,
        id: "",
        allowed: false,
        remaining: 0,
        retryAfter: 0,
      };
    const decision = this.consume(rules);
    if (decision.allowed) await this.record(owner, key.id, "api_calls");
    return { valid: true, id: key.id, ...decision };
  }
  reserveMailbox(address: string, expiresAt: number, max: number): boolean {
    return this.ctx.storage.transactionSync(() => {
      const boxes = (
        this.ctx.storage.kv.get<Array<{ address: string; expiresAt: number }>>(
          "activeMailboxes",
        ) ?? []
      ).filter((box) => box.expiresAt > Date.now());
      const existing = boxes.find((box) => box.address === address);
      if (existing) {
        existing.expiresAt = expiresAt;
        this.ctx.storage.kv.put("activeMailboxes", boxes);
        return true;
      }
      if (boxes.length >= max) return false;
      this.ctx.storage.kv.put("activeMailboxes", [
        ...boxes,
        { address, expiresAt },
      ]);
      return true;
    });
  }
  releaseMailbox(address: string) {
    const boxes =
      this.ctx.storage.kv.get<Array<{ address: string; expiresAt: number }>>(
        "activeMailboxes",
      ) ?? [];
    this.ctx.storage.kv.put(
      "activeMailboxes",
      boxes.filter((box) => box.address !== address),
    );
  }
  activateMailbox(expiresAt: number, renew = false, owner = ""): boolean {
    const current = this.ctx.storage.kv.get<number>("mailboxExpiry");
    if (current && !renew) return false;
    if (renew && (!current || current <= Date.now())) return false;
    this.ctx.storage.kv.put("mailboxExpiry", expiresAt);
    if (owner) this.ctx.storage.kv.put("owner", owner);
    return true;
  }
  mailboxActive(): boolean {
    return (this.ctx.storage.kv.get<number>("mailboxExpiry") ?? 0) > Date.now();
  }
  mailboxOwner(): string {
    return this.ctx.storage.kv.get<string>("owner") ?? "";
  }
  async record(
    owner: string,
    keyId: string,
    field: "api_calls" | "mailboxes_created" | "emails_received",
  ) {
    this.ctx.storage.kv.put("usageOwner", owner);
    this.ctx.storage.kv.put(
      "usageVersion",
      (this.ctx.storage.kv.get<number>("usageVersion") ?? 0) + 1,
    );
    const day = new Date().toISOString().slice(0, 10);
    this.ctx.storage.sql.exec(
      "INSERT INTO usage (date, key_id, " +
        field +
        ") VALUES (?, ?, 1) ON CONFLICT(date, key_id) DO UPDATE SET " +
        field +
        "=" +
        field +
        "+1",
      day,
      keyId,
    );
    if ((await this.ctx.storage.getAlarm()) === null)
      await this.ctx.storage.setAlarm(Date.now() + 300_000);
  }
  async alarm() {
    const owner = this.ctx.storage.kv.get<string>("usageOwner");
    if (!owner) return;
    const version = this.ctx.storage.kv.get<number>("usageVersion") ?? 0;
    const day = new Date().toISOString().slice(0, 10);
    const rows = this.ctx.storage.sql
      .exec<{
        date: string;
        key_id: string;
        api_calls: number;
        mailboxes_created: number;
        emails_received: number;
      }>("SELECT * FROM usage")
      .toArray();
    for (let i = 0; i < rows.length; i += 50) {
      await this.env.DB.batch(
        rows
          .slice(i, i + 50)
          .map((row) =>
            this.env.DB.prepare(
              "INSERT INTO usage_daily VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(date, owner_id, key_id) DO UPDATE SET api_calls=excluded.api_calls, mailboxes_created=excluded.mailboxes_created, emails_received=excluded.emails_received, updated_at=excluded.updated_at",
            ).bind(
              row.date,
              owner,
              row.key_id,
              row.api_calls,
              row.mailboxes_created,
              row.emails_received,
              Date.now(),
            ),
          ),
      );
    }
    // Preserve writes arriving while awaiting D1, including midnight transitions.
    if ((this.ctx.storage.kv.get<number>("usageVersion") ?? 0) === version) {
      this.ctx.storage.sql.exec("DELETE FROM usage WHERE date < ?", day);
    } else {
      await this.ctx.storage.setAlarm(Date.now() + 300_000);
    }
  }
  acceptMail(max: number): boolean {
    return (
      this.mailboxActive() &&
      this.consume([{ key: "inbound", max, seconds: 86400 }]).allowed
    );
  }
}
