import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useConfig } from "../hooks/useConfig";
import { CopyButton } from "../components/CopyButton";
import { LoginDialog, useAccount, accountRequest } from "../components/Account";
type Key = {
  id: string;
  name: string;
  start: string;
  createdAt: string;
  expiresAt: string;
};
export function ApiKeys() {
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
  return (
    <div className="dashboard-legacy keys-page">
      <h1>{zh ? "API Key 管理" : "API keys"}</h1>
      <p className="page-description">
        {zh
          ? "创建和管理应用访问密钥。所有 Key 共享账号额度。"
          : "Create and manage access keys. All keys share your account quota."}
      </p>{" "}
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
                <Link
                  to="/dashboard/admin/users"
                  className="ml-4 text-cyan-300"
                >
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
      <LoginDialog open={login} onClose={() => setLogin(false)} />
    </div>
  );
}
