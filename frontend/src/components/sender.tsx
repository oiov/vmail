import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { accountRequest, LoginDialog, useAccount } from "./Account";
import { Modal } from "./modal";
import { useTranslation } from "react-i18next";
import Close from "./icons/Close";
import SendIcon from "./icons/SendIcon";
import toast from "react-hot-toast";
import { useConfig } from "../hooks/useConfig";

export default function SenderModal({
  senderEmail,
  mailboxToken,
  showSenderModal,
  setShowSenderModal,
}: {
  senderEmail: string;
  mailboxToken: string;
  showSenderModal: boolean;
  setShowSenderModal: Dispatch<SetStateAction<boolean>>;
}) {
  const { t } = useTranslation();
  const config = useConfig();
  const [isSending, setIsSending] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { data: account, isLoading: accountLoading } = useAccount();
  const client = useQueryClient();
  const quota = useQuery({
    queryKey: ["sending-quota", account?.id],
    queryFn: () =>
      accountRequest<{
        limit: number;
        remaining: number;
        used: number;
        resetsAt: number;
      }>("/sending"),
    enabled: showSenderModal && !!account,
    retry: false,
    staleTime: 0,
  });

  const hasSender = Boolean(
    config.sendChannel && config.senderEmail && mailboxToken,
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSending || !account || !quota.data?.remaining) return;
    setIsSending(true);
    const form = e.currentTarget;

    const formData = new FormData(form);
    const payload = {
      senderName: formData.get("senderName") as string,
      receiverEmail: formData.get("receiverEmail") as string,
      subject: formData.get("subject") as string,
      content: formData.get("content") as string,
      type: (formData.get("type") as string) || "text/plain",
    };

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mailboxToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as {
        code?: string;
        error?: { code?: string };
        message?: string;
      };

      if (!res.ok) {
        throw new Error(
          data.code || data.error?.code
            ? t((data.code || data.error?.code)!)
            : data.message || t("Failed to send email"),
        );
      }

      form.reset();
      setShowSenderModal(false);
      toast.success(t("Message sent"), {
        style: {
          borderRadius: "8px",
          background: "#383838",
          color: "#ffffff",
        },
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("Failed to send email"),
        {
          style: {
            borderRadius: "8px",
            background: "#383838",
            color: "#ffffff",
          },
        },
      );
    } finally {
      setIsSending(false);
      void client.invalidateQueries({ queryKey: ["sending-quota"] });
      void client.invalidateQueries({ queryKey: ["outbound"] });
    }
  };

  if (showSenderModal && !account && !accountLoading)
    return (
      <>
        <Modal
          showModal={!loginOpen}
          setShowModal={setShowSenderModal}
          theme="dark"
        >
          <section
            className="sender-dialog sender-login"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sender-login-title"
          >
            <button
              className="sender-close"
              onClick={() => setShowSenderModal(false)}
              aria-label={t("Close")}
            >
              <Close />
            </button>
            <span className="sender-icon">
              <SendIcon />
            </span>
            <h2 id="sender-login-title">{t("Sign in to send email")}</h2>
            <p>
              {t("Sending requires an account and is subject to daily quotas.")}
            </p>
            <button
              className="sender-submit"
              onClick={() => setLoginOpen(true)}
            >
              {t("Sign in")}
            </button>
          </section>
        </Modal>
        <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    );
  return (
    <Modal
      showModal={showSenderModal}
      setShowModal={setShowSenderModal}
      theme="dark"
    >
      <section
        className="sender-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sender-title"
      >
        <header className="sender-header">
          <span className="sender-icon">
            <SendIcon aria-hidden="true" />
          </span>
          <div>
            <h2 id="sender-title">{t("Compose email")}</h2>
            <p>{t("Send from this mailbox. Replies arrive in your inbox.")}</p>
          </div>
          <button
            type="button"
            className="sender-close"
            aria-label={t("Close")}
            onClick={() => setShowSenderModal(false)}
          >
            <Close aria-hidden="true" />
          </button>
        </header>
        <form onSubmit={handleSubmit} className="sender-form">
          <div className="sender-address">
            <span>{t("From")}</span>
            <strong>{config.senderEmail}</strong>
            <span>{t("Reply-To:")}</span>
            <span>{senderEmail}</span>
          </div>
          <div className="sender-fields">
            <label>
              {t("Sending name")}
              <input
                type="text"
                name="senderName"
                maxLength={100}
                placeholder={t("Optional")}
                autoComplete="nickname"
              />
            </label>
            <label>
              {t("Recipient email *")}
              <input
                type="email"
                name="receiverEmail"
                required
                maxLength={254}
                placeholder="name@example.com"
                autoComplete="off"
              />
            </label>
          </div>
          <label>
            {t("Email subject *")}
            <input
              type="text"
              name="subject"
              required
              maxLength={200}
              placeholder={t("Email subject *")}
            />
          </label>
          <label className="sender-format">
            {t("Message format")}
            <select name="type">
              <option value="text/plain">{t("Plain text")}</option>
              <option value="text/html">HTML</option>
            </select>
          </label>
          <label>
            {t("Email content *")}
            <textarea
              name="content"
              required
              maxLength={100000}
              placeholder={t("Write your message…")}
              rows={5}
            />
          </label>
          <div className="sender-quota" role="status">
            {quota.data
              ? t("Today: {{remaining}} / {{limit}} sends remaining", {
                  remaining: quota.data.remaining,
                  limit: quota.data.limit,
                })
              : t("Loading sending quota…")}
            <span>
              {t("Resets at 00:00 UTC. Failed attempts count toward quota.")}
            </span>
          </div>
          {quota.error && (
            <p className="sender-note" role="alert">
              {t("Unable to load sending quota")}
            </p>
          )}
          <p className="sender-note">
            <Link to="/dashboard/outbound">{t("Sending history")}</Link>
          </p>
          <button
            type="submit"
            disabled={
              isSending || !hasSender || !account || !quota.data?.remaining
            }
            className="sender-submit"
          >
            <SendIcon aria-hidden="true" />
            {isSending ? t("Sending...") : t("Send")}
          </button>
          {!hasSender && (
            <p className="sender-note">{t("No sending service configured")}</p>
          )}
        </form>
      </section>
    </Modal>
  );
}

export function useSenderModal(senderEmail: string, mailboxToken: string) {
  const [showSenderModal, setShowSenderModal] = useState(false);

  const SenderModalCallback = useCallback(() => {
    return (
      <SenderModal
        senderEmail={senderEmail}
        mailboxToken={mailboxToken}
        showSenderModal={showSenderModal}
        setShowSenderModal={setShowSenderModal}
      />
    );
  }, [mailboxToken, senderEmail, showSenderModal]);

  return useMemo(
    () => ({ setShowSenderModal, SenderModal: SenderModalCallback }),
    [setShowSenderModal, SenderModalCallback],
  );
}
