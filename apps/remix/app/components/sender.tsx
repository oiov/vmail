import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import Modal from "./modal";
import { Form, useNavigation } from "@remix-run/react";

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

  return (
    <Modal showModal={showSenderModal} setShowModal={setShowSenderModal}>
      <div className="w-full overflow-hidden bg-white shadow-xl p-4 md:max-w-3xl md:rounded-2xl md:border md:border-gray-200">
        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 px-4 py-5 pt-8 text-center md:px-16">
          <h3 className="font-display text-2xl font-bold">Send email</h3>
          <p className="text-gray-500">Forward only, no storage</p>
          <p className="text-sm text-gray-500">
            ⚠️Please do not send illegal content such as politics, pornography,
            etc
          </p>
        </div>
        <Form method="POST" className="flex flex-col mt-4 space-y-4">
          <div className="w-full flex gap-4 md:flex-row px-4">
            <input
              value={senderEmail}
              type="email"
              name="senderEmail"
              placeholder="发件人邮箱*"
              required
              disabled
              className="rounded-md border border-slate-200 px-3 py-2 shadow-inner w-full"
            />
            <input
              type="text"
              name="senderName"
              placeholder="发件人昵称*"
              required
              className="rounded-md border border-slate-200 px-3 py-2 shadow-inner w-full"
            />
          </div>

          <div className="w-full px-4">
            <input
              type="email"
              name="receiverEmail"
              placeholder="收件人邮箱*"
              required
              className="rounded-md border border-slate-200 px-3 py-2 shadow-inner w-full"
            />
          </div>
          <div className="w-full px-4">
            <input
              type="text"
              name="subject"
              placeholder="邮件主题*"
              required
              className="rounded-md border border-slate-200 px-3 py-2 shadow-inner w-full"
            />
          </div>
          <div className="w-full px-4">
            <select
              name="type"
              className="rounded-md border border-slate-200 px-3 py-2 shadow-inner w-full">
              <option value="text/html">HTML</option>
              <option value="text/plain" selected>
                Plain
              </option>
            </select>
          </div>
          <div className="w-full px-4">
            <textarea
              name="content"
              placeholder="邮件内容*"
              required
              className="h-24 p-2 border border-slate-200 shadow-inner rounded-md w-full"></textarea>
          </div>
          <div className="w-full">
            <button
              type="submit"
              value="send"
              name="_action"
              className="py-2.5 text-white rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500">
              {navigation.state === "submitting" ? "Sending..." : "Send"}
            </button>
          </div>
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
