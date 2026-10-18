import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useConfig } from "../hooks/useConfig";
import { ApiReference } from "../components/ApiReference";
import { CopyButton } from "../components/CopyButton";
import { LoginDialog, useAccount, accountRequest } from "../components/Account";
type Key = {
  id: string;
  name: string;
  start: string;
  createdAt: string;
  expiresAt: string;
};
export function ApiDocs() {
  const config = useConfig(),
    { data: account, error: accountError } = useAccount(),
    client = useQueryClient();
  const { i18n } = useTranslation(),
    zh = i18n.language.startsWith("zh");
  const [login, setLogin] = useState(false),
    [name, setName] = useState(""),
    [token, setToken] = useState("");
  const [secret, setSecret] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const captcha = useRef<TurnstileInstance>(null);
  const { data, error: keysError } = useQuery({
    queryKey: ["api-keys", account?.id],
    enabled: !!account,
    retry: false,
    queryFn: () => accountRequest<{ keys: Key[] }>("/keys"),
  });
  const create = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await accountRequest<{ key: string }>("/keys", {
        method: "POST",
        body: JSON.stringify({ name, token }),
      });
      setSecret(result.key);
      setName("");
      await client.invalidateQueries({ queryKey: ["api-keys"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
      setToken("");
      captcha.current?.reset();
    }
  };
  const revoke = async (id: string) => {
    setBusy(true);
    setError("");
    try {
      await accountRequest("/keys/" + encodeURIComponent(id), {
        method: "DELETE",
      });
      setSecret("");
      await client.invalidateQueries({ queryKey: ["api-keys"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };
  const sample =
    'curl -X POST "' +
    window.location.origin +
    '/api/v1/mailboxes" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d \'{}\'';
  const endpoints = [
    [
      "POST",
      "/mailboxes",
      zh
        ? "创建邮箱，默认有效期 24 小时"
        : "Create a mailbox; expires after 24 hours by default",
    ],
    ["GET", "/mailboxes/:id", zh ? "读取邮箱信息" : "Get mailbox information"],
    [
      "GET",
      "/mailboxes/:id/messages?limit=20&cursor=…",
      zh
        ? "读取邮件摘要，游标分页"
        : "List message summaries with cursor pagination",
    ],
    [
      "GET",
      "/mailboxes/:id/messages/:messageId",
      zh ? "读取邮件正文" : "Read the full message",
    ],
    [
      "DELETE",
      "/mailboxes/:id/messages/:messageId",
      zh ? "删除邮件" : "Delete a message",
    ],
  ];
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-20 pt-28 text-white md:px-10">
      <div className="mb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cyan-400">
          VMAIL / DEVELOPERS
        </p>
        <h1 className="text-4xl font-semibold">
          {zh ? "API 文档" : "API documentation"}
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
          {zh
            ? "通过 REST API 创建临时邮箱、查询邮件列表、读取和删除邮件。登录后可免费创建 API Key。"
            : "Create temporary mailboxes, list messages, and read or delete email through the REST API. Sign in to create a free API key."}
        </p>
      </div>
      <section
        className="mb-10 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-950/30 to-zinc-900 p-6 sm:p-8"
        aria-labelledby="keys-title"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 id="keys-title" className="text-xl font-semibold">
              {account
                ? zh
                  ? "我的 API Key"
                  : "My API keys"
                : zh
                  ? "登录后免费创建 API Key"
                  : "Sign in to create free API keys"}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {zh
                ? "每人最多 3 个有效 Key，所有 Key 共享账号额度。"
                : "Up to 3 active keys per account. All keys share your account quota."}
            </p>
          </div>
          <span className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs text-cyan-300">
            {zh ? "免费使用" : "Free access"}
          </span>
        </div>
        <div className="my-6 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          {[
            [
              config.apiRateLimitPerMinute || 30,
              zh ? "次请求 / 分钟" : "requests / minute",
            ],
            [
              config.apiDailyLimit || 1000,
              zh ? "次请求 / 天" : "requests / day",
            ],
            [
              config.mailboxDailyLimit || 20,
              zh ? "个邮箱 / 天" : "mailboxes / day",
            ],
          ].map(([n, label]) => (
            <div
              key={label}
              className="rounded-lg border border-white/5 bg-black/20 p-4"
            >
              <strong className="mr-2 text-2xl font-medium">{n}</strong>
              <span className="text-zinc-400">{label}</span>
            </div>
          ))}
        </div>
        {!config.openApiEnabled && (
          <p className="mb-5 text-sm text-amber-300" role="status">
            {zh
              ? "API 暂未开放。登录及已有 Key 管理仍可使用，开放后即可创建新 Key。"
              : "API access is currently paused. Sign-in and existing key management remain available."}
          </p>
        )}
        {account ? (
          <>
            <p className="mb-4 text-sm text-zinc-400">
              {account.email}
              {account.role === "admin" && (
                <Link to="/admin" className="ml-4 text-cyan-300">
                  {zh ? "打开管理后台 →" : "Open admin →"}
                </Link>
              )}
            </p>
            {secret && (
              <div
                role="status"
                className="mb-5 rounded-lg border border-emerald-700 bg-emerald-950/40 p-4"
              >
                <p className="mb-2 text-sm text-emerald-300">
                  {zh
                    ? "请立即保存，此密钥仅显示一次。"
                    : "Save this key now. It is only shown once."}
                </p>
                <div className="flex items-center gap-3">
                  <code className="min-w-0 flex-1 break-all text-xs">
                    {secret}
                  </code>
                  <CopyButton text={secret} />
                </div>
                <button
                  className="mt-3 text-xs text-zinc-400"
                  onClick={() => setSecret("")}
                >
                  {zh ? "已保存，隐藏" : "Saved, hide key"}
                </button>
              </div>
            )}
            <div className="mb-5 space-y-2">
              {data?.keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-zinc-700/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{key.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {key.start}… · {zh ? "到期 " : "Expires "}
                      {new Date(key.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    disabled={busy}
                    onClick={() => void revoke(key.id)}
                    className="shrink-0 text-sm text-red-300 hover:text-red-200 disabled:opacity-40"
                  >
                    {zh ? "撤销" : "Revoke"}
                  </button>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void create();
              }}
              className="space-y-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  aria-label={zh ? "Key 名称" : "Key name"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={64}
                  placeholder={
                    zh
                      ? "Key 名称，例如：我的应用"
                      : "Key name, e.g. My application"
                  }
                  className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-950/50 px-4 py-3 text-sm outline-none focus:border-cyan-400"
                />
                <button
                  disabled={
                    busy ||
                    !config.openApiEnabled ||
                    !data ||
                    data.keys.length >= 3 ||
                    (config.turnstileEnabled && !token)
                  }
                  className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy
                    ? zh
                      ? "处理中…"
                      : "Working…"
                    : zh
                      ? "免费创建 API Key"
                      : "Create free API key"}
                </button>
              </div>
              {config.turnstileEnabled && (
                <Turnstile
                  ref={captcha}
                  siteKey={config.turnstileKey}
                  onSuccess={setToken}
                  onExpire={() => setToken("")}
                  options={{ theme: "dark" }}
                />
              )}
              <p className="text-xs text-zinc-500">
                {data?.keys.length ?? 0} / 3 ·{" "}
                {zh
                  ? "Key 有效期 90 天。重新创建不会重置额度。每日额度于 UTC 00:00 重置。"
                  : "Keys expire after 90 days. Recreating a key does not reset quotas. Daily quotas reset at 00:00 UTC."}
              </p>
            </form>
          </>
        ) : (
          <button
            onClick={() => setLogin(true)}
            className="rounded-lg bg-cyan-400 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-300"
          >
            {zh ? "登录并获取免费 API Key →" : "Sign in for free API keys →"}
          </button>
        )}
        {(error || keysError || accountError) && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {error || keysError?.message || accountError?.message}
          </p>
        )}
        {new URLSearchParams(window.location.search).get("login") ===
          "failed" && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {zh
              ? "登录未完成，请重试。"
              : "Sign-in was not completed. Please try again."}
          </p>
        )}
      </section>
      <section className="space-y-6">
        <div className="rounded-xl border border-zinc-700 p-5 text-sm leading-7 text-zinc-400">
          <p>
            Base URL:{" "}
            <code className="break-all text-cyan-200">
              {window.location.origin}/api/v1
            </code>
          </p>
          <p>
            {zh ? "可用邮箱域名：" : "Available email domains: "}
            {config.emailDomain?.join(", ")}
          </p>
          <p>Content-Type: application/json</p>
        </div>
        <h2 className="text-2xl font-semibold">
          {zh ? "快速开始" : "Quick start"}
        </h2>
        <p className="text-sm leading-6 text-zinc-400">
          {zh
            ? "通过 Authorization: Bearer 或 X-API-Key 请求头传入密钥。密钥只能在服务端使用，请勿放入公开的前端代码。"
            : "Pass your key in the Authorization: Bearer or X-API-Key header. Keep it on your server; never expose it in public frontend code."}
        </p>
        <div className="relative rounded-xl border border-zinc-700 bg-black/30 p-5">
          <div className="absolute right-3 top-3">
            <CopyButton text={sample} />
          </div>
          <pre className="overflow-x-auto pr-7 text-xs leading-7 text-cyan-100">
            <code>{sample}</code>
          </pre>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800 text-zinc-400">
              <tr>
                <th className="p-4">Method</th>
                <th className="p-4">Endpoint</th>
                <th className="p-4">{zh ? "说明" : "Description"}</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map(([method, path, description]) => (
                <tr key={method + path} className="border-t border-zinc-800">
                  <td className="p-4 font-mono text-xs text-cyan-300">
                    {method}
                  </td>
                  <td className="p-4 font-mono text-xs">{path}</td>
                  <td className="p-4 text-zinc-400">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-7 text-zinc-400">
          {zh
            ? "创建请求支持 localPart、domain、expiresIn（60–86400 秒）。邮箱属于账号，3 个 Key 均可访问。列表最多返回 50 封摘要，使用 pagination.nextCursor 获取下一页，不提供总数和页码。"
            : "Creation accepts localPart, domain and expiresIn (60–86400 seconds). Mailboxes belong to your account and are accessible with any of your 3 keys. Lists return up to 50 summaries; pass pagination.nextCursor for the next page. Total counts and page numbers are not returned."}
        </p>
        <div className="rounded-xl border border-zinc-700 p-5 text-sm leading-7 text-zinc-400">
          <h3 className="mb-2 font-medium text-white">
            {zh ? "额度与轮询" : "Quotas and polling"}
          </h3>
          {zh
            ? "收到 429 时遵守 Retry-After，收到 503 时暂停并退避。建议从每 60 秒轮询开始，空闲时逐步放慢。失败请求也可能占用额度，全站达到每日容量后会暂时暂停服务。每个邮箱每日最多接收 100 封、单封不超过 256 KiB。"
            : "Respect Retry-After on 429 and back off on 503. Start polling every 60 seconds and slow down when idle. Failed requests may consume quota. Service pauses when global daily capacity is reached. Each mailbox accepts up to 100 messages per day, at most 256 KiB each."}
        </div>
      </section>
      <ApiReference zh={zh} domain={config.emailDomain?.[0] || "example.com"} />
      <LoginDialog open={login} onClose={() => setLogin(false)} />
    </main>
  );
}
