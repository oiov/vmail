import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useConfig } from "../hooks/useConfig";
export interface Account {
  id: string;
  name: string;
  email: string;
  role: string;
}
export async function accountRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch("/api/account" + path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error?.message ?? data.message ?? "Request failed");
  return data as T;
}
export function useAccount() {
  const config = useConfig();
  return useQuery({
    queryKey: ["account"],
    enabled: config.authEnabled,
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch("/api/account/me");
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Unable to load account");
      return (await res.json()).user as Account;
    },
  });
}
export function LoginDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { i18n } = useTranslation(),
    zh = i18n.language.startsWith("zh");
  const config = useConfig(),
    dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  const signIn = async (provider: "github" | "google") => {
    setBusy(provider);
    setError("");
    try {
      const response = await fetch("/api/auth/sign-in/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          callbackURL: "/api-docs",
          errorCallbackURL: "/api-docs?login=failed",
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.url)
        throw new Error(
          data.message ??
            (zh
              ? "暂时无法登录，请重试。"
              : "Unable to sign in. Please retry."),
        );
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setBusy("");
    }
  };
  return (
    <dialog
      ref={dialog}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
      className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-0 text-white shadow-2xl backdrop:bg-black/70"
      aria-labelledby="login-title"
    >
      <div className="p-7 sm:p-9">
        <button
          type="button"
          onClick={onClose}
          aria-label={zh ? "关闭登录弹框" : "Close sign-in dialog"}
          className="absolute right-4 top-3 rounded p-2 text-zinc-400 hover:text-white"
        >
          ✕
        </button>
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-xl text-cyan-300">
          @
        </div>
        <h2 id="login-title" className="text-2xl font-semibold">
          {zh ? "登录 Vmail" : "Sign in to Vmail"}
        </h2>
        <p className="mb-7 mt-3 text-sm leading-6 text-zinc-400">
          {zh
            ? "免费创建 API Key，让邮件接入你的应用。每个账号最多 3 个 Key，共享使用额度。"
            : "Create free API keys and connect email to your app. Up to 3 keys per account, with shared usage limits."}
        </p>
        <div className="space-y-3">
          {(["github", "google"] as const).map((provider) => (
            <button
              type="button"
              key={provider}
              disabled={!!busy || !config.authEnabled}
              onClick={() => void signIn(provider)}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-3.5 font-medium hover:border-zinc-400 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <img
                src={
                  provider === "github"
                    ? "/brand/github.svg"
                    : "/brand/google.png"
                }
                alt=""
                aria-hidden="true"
                className="h-5 w-5 shrink-0 object-contain"
              />
              {busy === provider
                ? zh
                  ? "正在跳转…"
                  : "Redirecting…"
                : (zh ? "使用 " : "Continue with ") +
                  (provider === "github" ? "GitHub" : "Google") +
                  (zh ? " 登录" : "")}
            </button>
          ))}
        </div>
        {!config.authEnabled && (
          <p role="status" className="mt-4 text-sm text-amber-300">
            {zh
              ? "登录服务正在配置中，请稍后再试。"
              : "Sign-in is being configured. Please check back soon."}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {error}
          </p>
        )}
        <p className="mt-6 text-xs leading-5 text-zinc-500">
          {zh
            ? "无需信用卡。为保证服务可用，API 设有每日额度。"
            : "No credit card required. Daily quotas keep the service available."}
        </p>
      </div>
    </dialog>
  );
}
export function AccountButton() {
  const { data: account } = useAccount(),
    client = useQueryClient();
  const [open, setOpen] = useState(false),
    [error, setError] = useState("");
  const { i18n } = useTranslation(),
    zh = i18n.language.startsWith("zh");
  const signOut = async () => {
    const res = await fetch("/api/auth/sign-out", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    if (res.ok) {
      client.setQueryData(["account"], null);
      client.removeQueries({ queryKey: ["api-keys"] });
      client.removeQueries({ queryKey: ["admin"] });
    } else setError(zh ? "退出失败，请重试" : "Unable to sign out");
  };
  return (
    <>
      <div className="ml-3 flex items-center gap-3 text-sm">
        {account ? (
          <>
            <Link
              to="/api-docs"
              className="hidden max-w-28 truncate text-zinc-300 sm:block"
            >
              {account.name}
            </Link>
            {account.role === "admin" && (
              <Link to="/admin" className="text-cyan-300">
                {zh ? "管理" : "Admin"}
              </Link>
            )}
            <button
              type="button"
              onClick={() => void signOut()}
              className="text-zinc-400 hover:text-white"
            >
              {zh ? "退出" : "Sign out"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-zinc-600 px-3 py-2 hover:border-cyan-400"
          >
            {zh ? "登录" : "Sign in"}
          </button>
        )}
      </div>
      {error && <span role="alert">{error}</span>}
      <LoginDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
