// frontend/src/hooks/useMailboxSession.ts
// 深 Hook: 邮箱会话（Cookies + Token 生命周期）的唯一真源
// Interface: { address, mailboxToken, expiryTimestamp,
//              create({ selectedDomain, turnstileToken }), stop(), resetExpiry(), login(password), getPassword() }
// Implementation: 内部集中 js-cookie 读写、expiry 时间戳计算、queryClient 失效与 toast
// 之前: Home.tsx 在 3 个 handler 中重复 Cookies.set/remove + expiry 计算，无独立测试面
// 之后: Home 只负责视图，身份不变量由 Hook 集中
import { useCallback, useState } from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { AppConfig } from "./useConfig";
import { encrypt } from "../lib/utlis";
import {
  verifyTurnstile,
  loginByPassword,
  refreshMailboxToken,
} from "../services/api";

export const COOKIE_KEYS = {
  mailbox: "userMailbox",
  token: "mailboxToken",
  expiry: "emailExpiry",
} as const;

export const MAILBOX_TTL_MS = 24 * 60 * 60 * 1000;

// 会话 cookie 的安全属性: 仅 HTTPS 传输且禁止跨站携带 (纵深防御)
export const COOKIE_SECURITY_OPTIONS = {
  secure: true,
  sameSite: "strict",
} as const;

export function readMailboxSessionFromCookies(): {
  address?: string;
  mailboxToken: string;
  expiryTimestamp?: number;
} {
  const address = Cookies.get(COOKIE_KEYS.mailbox);
  const mailboxToken = Cookies.get(COOKIE_KEYS.token) || "";
  const expiryRaw = Cookies.get(COOKIE_KEYS.expiry);
  const expiryTimestamp = expiryRaw ? parseInt(expiryRaw, 10) : undefined;
  return { address, mailboxToken, expiryTimestamp };
}

export function writeMailboxSessionCookies(
  mailbox: string,
  mailboxToken: string | undefined,
  expires: number,
) {
  Cookies.set(COOKIE_KEYS.mailbox, mailbox, {
    expires: 1,
    ...COOKIE_SECURITY_OPTIONS,
  });
  Cookies.set(COOKIE_KEYS.expiry, String(expires), {
    expires: 1,
    ...COOKIE_SECURITY_OPTIONS,
  });
  if (mailboxToken)
    Cookies.set(COOKIE_KEYS.token, mailboxToken, {
      expires: 1,
      ...COOKIE_SECURITY_OPTIONS,
    });
  else Cookies.remove(COOKIE_KEYS.token);
}

export function clearMailboxSessionCookies() {
  Cookies.remove(COOKIE_KEYS.mailbox);
  Cookies.remove(COOKIE_KEYS.token);
  Cookies.remove(COOKIE_KEYS.expiry);
}

export function useMailboxSession(config: AppConfig) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [address, setAddress] = useState<string | undefined>(() =>
    Cookies.get(COOKIE_KEYS.mailbox),
  );
  const [mailboxToken, setMailboxToken] = useState<string>(
    () => Cookies.get(COOKIE_KEYS.token) || "",
  );
  const [expiryTimestamp, setExpiryTimestamp] = useState<number | undefined>(
    () => {
      const v = Cookies.get(COOKIE_KEYS.expiry);
      return v ? parseInt(v, 10) : undefined;
    },
  );
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const create = useCallback(
    async (selectedDomain: string, turnstileToken: string) => {
      if (config.turnstileEnabled && !turnstileToken) {
        toast.error(t("No captcha response"));
        return;
      }
      try {
        const authorization = await verifyTurnstile(
          selectedDomain,
          config.turnstileEnabled ? turnstileToken : undefined,
        );
        const now = Date.now();
        const expires = now + MAILBOX_TTL_MS;
        writeMailboxSessionCookies(
          authorization.mailbox,
          authorization.mailboxToken,
          expires,
        );
        setAddress(authorization.mailbox);
        setMailboxToken(authorization.mailboxToken || "");
        setExpiryTimestamp(expires);
        toast.success(t("Email created successfully"));
      } catch (error) {
        toast.error(t("Failed to verify captcha"));
        console.error("Turnstile verification failed:", error);
      }
    },
    [config.turnstileEnabled, t],
  );

  const stop = useCallback(() => {
    clearMailboxSessionCookies();
    setAddress(undefined);
    setMailboxToken("");
    setExpiryTimestamp(undefined);
    queryClient.invalidateQueries({ queryKey: ["emails"] });
  }, [queryClient]);

  const resetExpiry = useCallback(async () => {
    if (mailboxToken) {
      try {
        const refreshed = await refreshMailboxToken(mailboxToken);
        Cookies.set(COOKIE_KEYS.token, refreshed, {
          expires: 1,
          ...COOKIE_SECURITY_OPTIONS,
        });
        setMailboxToken(refreshed);
      } catch {
        toast.error(t("SEND_UNAUTHORIZED"));
        return;
      }
    }
    const newExpiry = Date.now() + MAILBOX_TTL_MS;
    const cookieExpires = new Date(Date.now() + MAILBOX_TTL_MS);
    Cookies.set(COOKIE_KEYS.expiry, String(newExpiry), {
      expires: cookieExpires,
      ...COOKIE_SECURITY_OPTIONS,
    });
    setExpiryTimestamp(newExpiry);
    toast.success(t("Validity reset successfully"));
  }, [mailboxToken, t]);

  const login = useCallback(
    async (password: string): Promise<boolean> => {
      setIsLoggingIn(true);
      try {
        const data = await loginByPassword(password);
        const now = Date.now();
        const expires = now + MAILBOX_TTL_MS;
        writeMailboxSessionCookies(data.address, data.mailboxToken, expires);
        setAddress(data.address);
        setMailboxToken(data.mailboxToken || "");
        setExpiryTimestamp(expires);
        toast.success(t("Login successful"));
        return true;
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : String(error ?? "");
        toast.error(`${t("Login failed")}: ${t(msg)}`);
        return false;
      } finally {
        setIsLoggingIn(false);
      }
    },
    [t],
  );

  const getPassword = useCallback((): string | null => {
    if (address && config.cookiesSecret)
      return encrypt(address, config.cookiesSecret);
    return null;
  }, [address, config.cookiesSecret]);

  return {
    address,
    mailboxToken,
    expiryTimestamp,
    isLoggingIn,
    create,
    stop,
    resetExpiry,
    login,
    getPassword,
  };
}
