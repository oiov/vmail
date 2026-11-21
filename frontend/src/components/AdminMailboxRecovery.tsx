import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { accountRequest } from "./Account";

type Result = { address: string; code: string; expiresAt?: number };
export function AdminMailboxRecovery({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const zh = useTranslation().i18n.language.startsWith("zh");
  const client = useQueryClient();
  const [addresses, setAddresses] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [preview, setPreview] = useState(false);
  const values = [
    ...new Set(
      addresses
        .split(/[\s,;]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  function edited() {
    setPreview(false);
    setResults([]);
    setError("");
  }
  async function submit(dryRun: boolean) {
    setBusy(true);
    setError("");
    setPreview(false);
    const collected: Result[] = [];
    try {
      for (let i = 0; i < values.length; i += 10) {
        const data = await accountRequest<{ results: Result[] }>(
          "/admin/users/" + encodeURIComponent(userId) + "/mailboxes/recover",
          {
            method: "POST",
            body: JSON.stringify({
              addresses: values.slice(i, i + 10),
              reason,
              ownershipConfirmed: confirmed,
              dryRun,
            }),
          },
        );
        collected.push(...data.results);
        setResults([...collected]);
      }
      setPreview(
        dryRun &&
          collected.length === values.length &&
          collected.every((r) => r.code === "READY"),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Recovery failed");
    } finally {
      if (!dryRun) await client.invalidateQueries({ queryKey: ["admin"] });
      setBusy(false);
    }
  }
  const valid =
    values.length > 0 &&
    values.length <= 100 &&
    reason.trim().length >= 10 &&
    reason.trim().length <= 500 &&
    confirmed;
  return (
    <section
      className="dash-panel mb-7"
      aria-label={zh ? "旧邮箱补绑" : "Legacy mailbox recovery"}
    >
      <h3>{zh ? "旧邮箱补绑" : "Legacy mailbox recovery"}</h3>
      <p className="page-description">
        {zh
          ? `目标账户：${email}。仅在人工核验归属后操作。拒绝覆盖其他账号或仍有效的匿名邮箱；恢复后启用 24 小时，不恢复已删除邮件。`
          : `Target account: ${email}. Verify ownership manually first. Other owners and active anonymous mailboxes cannot be overwritten. Recovery enables receiving for 24 hours, not deleted messages.`}
      </p>
      <label className="block mb-3">
        {zh
          ? "邮箱地址（每行一个，最多 100 个）"
          : "Email addresses (one per line, up to 100)"}
        <textarea
          className="dash-input w-full mt-2"
          rows={5}
          value={addresses}
          disabled={busy}
          onChange={(e) => {
            setAddresses(e.target.value);
            edited();
          }}
        />
      </label>
      <label className="block mb-3">
        {zh
          ? "审核原因／工单编号（至少 10 个字符）"
          : "Review reason / support reference (at least 10 characters)"}
        <input
          className="dash-input w-full mt-2"
          value={reason}
          maxLength={500}
          disabled={busy}
          onChange={(e) => {
            setReason(e.target.value);
            edited();
          }}
        />
      </label>
      <label className="flex gap-2 mb-4">
        <input
          type="checkbox"
          checked={confirmed}
          disabled={busy}
          onChange={(e) => {
            setConfirmed(e.target.checked);
            edited();
          }}
        />
        {zh
          ? "我已人工确认这些地址属于上述账户"
          : "I have manually verified that these addresses belong to this account"}
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          className="dash-secondary"
          disabled={busy || !valid}
          onClick={() => void submit(true)}
        >
          {zh ? "检查归属（不补绑）" : "Check ownership (no import)"}
        </button>
        <button
          className="dash-primary"
          disabled={busy || !valid || !preview}
          onClick={() => void submit(false)}
        >
          {busy
            ? zh
              ? "处理中…"
              : "Processing…"
            : zh
              ? "确认补绑并启用"
              : "Confirm import and activate"}
        </button>
      </div>
      {error && (
        <p role="alert" className="dash-error">
          {error}
        </p>
      )}
      {!!results.length && (
        <div role="status" className="mt-4">
          <p>
            {zh ? "已处理" : "Processed"}: {results.length} / {values.length}
          </p>
          <ul className="max-h-64 overflow-auto text-sm">
            {results.map((r) => (
              <li key={r.address} className="break-all py-1">
                {r.address} — {r.code}
                {r.expiresAt
                  ? " · " + new Date(r.expiresAt).toLocaleString()
                  : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
