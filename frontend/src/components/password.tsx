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

export default function PasswordModal({
  password,
  showPasswordModal,
  setShowPasswordModal,
}: {
  password: string;
  showPasswordModal: boolean;
  setShowPasswordModal: Dispatch<SetStateAction<boolean>>;
}) {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (showPasswordModal && navigation.state === "submitting") {
      setIsSubmitted(true);
    }
    if (showPasswordModal && navigation.state === "idle" && isSubmitted) {
      setShowPasswordModal(false);
    }
  }, [navigation.state, showPasswordModal]);

  return (
    <Modal showModal={showPasswordModal} setShowModal={setShowPasswordModal}>
      <div className="w-full overflow-hidden bg-white/95 backdrop-blur-xl shadow-xl p-4 md:max-w-3xl md:rounded-2xl md:border md:border-gray-200">
        <Close
          className="absolute top-4 right-4 h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer"
          onClick={() => setShowPasswordModal(false)}
        />

        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 px-4 py-5 text-center md:px-16">
          <h3 className="font-display text-2xl font-bold">
            {t("Save password")}
          </h3>
          <p className="text-gray-500">
            {t("Save your password and continue using this email in 1 day")}
          </p>
        </div>
        <Form method="POST" className="flex flex-col mt-4 space-y-4 px-4">
          <input
            value={password}
            type="text"
            name="password"
            placeholder={t("Enter your password *")}
            required
            className="rounded-md border border-slate-200 px-3 py-2 shadow-inner w-full"
          />
          <p className="text-sm">
            {t(
              "How to get a password? Click to create a temporary email and receive at least one email to generate a password"
            )}
            .
          </p>

          <p className="text-sm text-yellow-600">
            {t(
              "Remember your password, otherwise your email will expire and cannot be retrieved"
            )}
            .
          </p>

          {password && password.length > 0 ? (
            <button
              type="submit"
              name="_action"
              value="stop"
              className="py-2.5 text-white rounded-md w-full bg-red-500 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500">
              {t("Log out")}
            </button>
          ) : (
            <button
              type="submit"
              value="login"
              name="_action"
              disabled={navigation.state != "idle"}
              className="py-2.5 text-white rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500">
              {navigation.state === "submitting"
                ? t("Submitting...")
                : t("Login")}
            </button>
          )}
        </Form>
      </div>
    </Modal>
  );
}

export function usePasswordModal(password: string) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const SenderModalCallback = useCallback(() => {
    return (
      <PasswordModal
        password={password}
        showPasswordModal={showPasswordModal}
        setShowPasswordModal={setShowPasswordModal}
      />
    );
  }, [showPasswordModal, setShowPasswordModal]);

  return useMemo(
    () => ({ setShowPasswordModal, PasswordModal: SenderModalCallback }),
    [setShowPasswordModal, SenderModalCallback]
  );
}
