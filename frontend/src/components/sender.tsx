import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Modal } from "./modal";
import { useTranslation } from "react-i18next";
import Close from "./icons/Close";
import toast from "react-hot-toast";
import { useConfig } from "../hooks/useConfig";

const SENDER_LABELS: Record<string, string> = {
  resend: "Resend",
  mailchannels: "MailChannels",
};

export default function SenderModal({
  senderEmail,
  showSenderModal,
  setShowSenderModal,
}: {
  senderEmail: string;
  showSenderModal: boolean;
  setShowSenderModal: Dispatch<SetStateAction<boolean>>;
}) {
  const { t } = useTranslation();
  const config = useConfig();
  const [isSending, setIsSending] = useState(false);

  const enabledSenders = config.enabledSenders || [];
  const defaultSender = enabledSenders.length > 0 ? enabledSenders[0] : "";
  const [senderMethod, setSenderMethod] = useState(defaultSender);

  const apiEndpoint =
    senderMethod === "mailchannels" ? "/api/send-mailchannels" : "/api/send";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      senderEmail: senderEmail,
      senderName: formData.get("senderName") as string,
      receiverEmail: formData.get("receiverEmail") as string,
      subject: formData.get("subject") as string,
      content: formData.get("content") as string,
      type: formData.get("type") as string || "text/plain",
    };

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "发送失败");
      }

      setShowSenderModal(false);
      toast(t("Message sent"), {
        style: {
          borderRadius: "8px",
          background: "#383838",
          color: "#ffffff",
        },
      });
    } catch (error: any) {
      toast.error(error.message || t("Failed to send email"), {
        style: {
          borderRadius: "8px",
          background: "#383838",
          color: "#ffffff",
        },
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal showModal={showSenderModal} setShowModal={setShowSenderModal}>
      <div className="w-full overflow-hidden bg-white/95 backdrop-blur-xl shadow-xl p-4 md:max-w-3xl md:rounded-2xl md:border md:border-gray-200">
        <Close
          className="absolute top-4 right-4 h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer"
          onClick={() => setShowSenderModal(false)}
        />

        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 px-4 py-5 text-center md:px-16">
          <h3 className="font-display text-2xl font-bold">Vmail Sender</h3>
          <p className="text-gray-500">{t("Forward only, no storage")}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col mt-4 space-y-4 px-4">
          <div className="w-full flex flex-col gap-4 md:flex-row">
            <input
              value={config.senderEmail || senderEmail}
              type="email"
              name="senderEmail"
              placeholder={t("Sending email *")}
              required
              readOnly
              className="rounded-md border border-slate-200 px-3 py-2 shadow-inner w-full bg-gray-100 cursor-not-allowed"
            />
            <input
              type="text"
              name="senderName"
              placeholder={t("Sending name")}
              className="rounded-md border border-slate-200 px-3 py-2 shadow-inner w-full"
            />
          </div>

          <div className="w-full flex flex-col gap-4 md:flex-row">
            <input
              type="email"
              name="receiverEmail"
              placeholder={t("Recipient email *")}
              required
              className="rounded-md border border-slate-200 px-3 py-2 shadow-inner w-full"
            />
            <input
              type="text"
              name="subject"
              placeholder={t("Email subject *")}
              required
              className="rounded-md border border-slate-200 px-3 py-2 shadow-inner w-full"
            />
          </div>

          {enabledSenders.length > 1 && (
            <div className="w-full">
              <select
                value={senderMethod}
                onChange={(e) => setSenderMethod(e.target.value)}
                className="rounded-md border border-slate-200 px-3 py-2 shadow-inner w-full">
                {enabledSenders.map((s) => (
                  <option key={s} value={s}>
                    {SENDER_LABELS[s] || s}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="w-full">
            <select
              name="type"
              className="rounded-md border border-slate-200 px-3 py-2 shadow-inner w-full">
              <option value="text/html">HTML</option>
              <option value="text/plain">Plain</option>
            </select>
          </div>
          <div className="w-full">
            <textarea
              name="content"
              placeholder={t("Email content *")}
              required
              className="min-h-24 p-2 border border-slate-200 shadow-inner rounded-md w-full"></textarea>
          </div>

          <button
            type="submit"
            disabled={isSending || enabledSenders.length === 0}
            className="py-2.5 text-white rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500">
            {enabledSenders.length === 0
              ? t("No sending service configured")
              : isSending
                ? t("Sending...")
                : t("Send")}
          </button>
          <p className="text-sm text-gray-500 mt-4">
            🚫
            {t(
              "Please do not send illegal content such as politics, pornography, etc"
            )}
            .
          </p>
        </form>
      </div>
    </Modal>
  );
}

export function useSenderModal(senderEmail: string) {
  const [showSenderModal, setShowSenderModal] = useState(false);

  const SenderModalCallback = useCallback(() => {
    return (
      <SenderModal
        senderEmail={senderEmail}
        showSenderModal={showSenderModal}
        setShowSenderModal={setShowSenderModal}
      />
    );
  }, [showSenderModal, setShowSenderModal]);

  return useMemo(
    () => ({ setShowSenderModal, SenderModal: SenderModalCallback }),
    [setShowSenderModal, SenderModalCallback]
  );
}
