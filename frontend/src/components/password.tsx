import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
// fix: 使用具名导入来修复构建错误
import { Modal } from "./modal";
import { useTranslation } from "react-i18next";
import Close from "./icons/Close";
import toast from "react-hot-toast";

// 定义组件的 props 类型
interface PasswordModalProps {
  showPasswordModal: boolean;
  setShowPasswordModal: Dispatch<SetStateAction<boolean>>;
  onLogin: (password: string) => Promise<void>; // feat: 添加 onLogin 回调处理登录逻辑
  isLoggingIn: boolean; // feat: 添加状态以在 UI 中反映登录过程
}

export default function PasswordModal({
  showPasswordModal,
  setShowPasswordModal,
  onLogin,
  isLoggingIn,
}: PasswordModalProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState(""); // 状态：存储输入的密码

  // 提交处理器
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error(t("Password is required"));
      return;
    }
    await onLogin(password);
    // 登录成功或失败的 toast 提示已在 Home.tsx 中处理
  };

  return (
    <Modal showModal={showPasswordModal} setShowModal={setShowPasswordModal}>
      <div className="w-full overflow-hidden bg-white/95 backdrop-blur-xl shadow-xl p-4 md:max-w-3xl md:rounded-2xl md:border md:border-gray-200">
        {/* 修复：添加 onPointerDown 事件来阻止拖动事件与点击事件的冲突 */}
        <Close
          className="absolute top-4 right-4 h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer"
          onClick={() => setShowPasswordModal(false)}
          onPointerDown={(e) => e.stopPropagation()}
        />

        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 px-4 py-5 text-center md:px-16">
          <h3 className="font-display text-2xl font-bold">
            {t("Save password")}
          </h3>
          <p className="text-gray-500">
            {t("Save your password and continue using this email in 1 day")}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col mt-4 space-y-4 px-4">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          <button
            type="submit"
            disabled={isLoggingIn}
            className="py-2.5 text-white rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500">
            {isLoggingIn
              ? t("Submitting...")
              : t("Login")}
          </button>
        </form>
      </div>
    </Modal>
  );
}

// 自定义 Hook，用于管理密码模态框的可见性
export function usePasswordModal() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // 使用 useCallback 优化 PasswordModal 组件的创建
  const PasswordModalCallback = useCallback(
    ({ onLogin, isLoggingIn }: Omit<PasswordModalProps, 'showPasswordModal' | 'setShowPasswordModal'>) => {
      return (
        <PasswordModal
          showPasswordModal={showPasswordModal}
          setShowPasswordModal={setShowPasswordModal}
          onLogin={onLogin}
          isLoggingIn={isLoggingIn}
        />
      );
    },
    [showPasswordModal] // 依赖项
  );

  return useMemo(
    () => ({
      showPasswordModal,
      setShowPasswordModal,
      PasswordModal: PasswordModalCallback
    }),
    [setShowPasswordModal, PasswordModalCallback, showPasswordModal]
  );
}