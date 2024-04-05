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
          <p className="text-sm text-gray-500">⚠️ Please enter your email,</p>
        </div>
        <Form method="POST">
          <input
            value={senderEmail}
            type="email"
            name="senderEmail"
            placeholder="发件人邮箱"
            required
            disabled
          />
          <input
            type="text"
            name="senderName"
            placeholder="发件人昵称"
            required
          />
          <input
            type="email"
            name="receiverEmail"
            placeholder="收件人邮箱"
            required
          />
          <input type="text" name="subject" placeholder="邮件主题" required />
          <select name="type">
            <option value="text/html">HTML</option>
            <option value="text/plain" selected>
              Plain
            </option>
          </select>
          <textarea
            className="w-full h-32 mt-4 p-2 border rounded-md"
            name="content"
            placeholder="邮件内容"
            required
          />

          <button
            className="w-full py-3 text-center text-white bg-blue-600 rounded-md"
            type="submit"
            value="send"
            name="_action">
            {navigation.state === "submitting" ? "Sending..." : "Send"}
          </button>
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
