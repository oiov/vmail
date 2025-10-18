import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Modal from "./modal";
import { Form, useNavigation } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import Close from "./icons/Close";
import toast from "react-hot-toast";

export default function SenderModal({
  senderEmail,
  showSenderModal,
  setShowSenderModal,
}: {
  senderEmail: string;
  showSenderModal: boolean;
  setShowSenderModal: Dispatch<SetStateAction<boolean>>;
}) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (showSenderModal && navigation.state === "submitting") {
      setIsSubmitted(true);
    }
    if (showSenderModal && navigation.state === "idle" && isSubmitted) {
      // setIsSubmitted(false);
      setShowSenderModal(false);
      toast(t("Message sent"), {
        style: {
          borderRadius: "8px",
          background: "#383838",
          color: "#ffffff",
        },
      });
    }
  }, [navigation.state, showSenderModal]);

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
        <Form method="POST" className="flex flex-col mt-4 space-y-4 px-4">
          <div className="w-full flex flex-col gap-4 md:flex-row">
            <input
              value={senderEmail}
              type="email"
              name="senderEmail"
              placeholder={t("Sending email *")}
              required
              disabled
              className="rounded-md border border-slate-200 px-3 py-2 shadow-inner w-full"
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

          <div className="w-full">
            <select
              name="type"
              className="rounded-md border border-slate-200 px-3 py-2 shadow-inner w-full">
              <option value="text/html">HTML</option>
              <option value="text/plain" selected>
                Plain
              </option>
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
            value="send"
            name="_action"
            disabled={navigation.state != "idle"}
            className="py-2.5 text-white rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500">
            {navigation.state === "submitting" ? t("Sending...") : t("Send")}
          </button>
          <p className="text-sm text-gray-500 mt-4">
            🚫
            {t(
              "Please do not send illegal content such as politics, pornography, etc"
            )}
            .
          </p>
        </Form>
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
