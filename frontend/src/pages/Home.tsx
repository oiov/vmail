import { useEffect, useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Turnstile } from "@marsidev/react-turnstile";
import randomName from "@scaleway/random-name";
import { useTranslation } from "react-i18next";
import Cookies from "js-cookie";
import { Link } from "react-router-dom";
// feat: 导入全局 toast
import { toast } from "react-hot-toast";

import { MailList } from "../components/MailList.tsx";
import { CopyButton } from "../components/CopyButton.tsx";
// feat: 导入 loginByPassword
import {
  getEmails,
  deleteEmails,
  loginByPassword,
  verifyTurnstile,
} from "../services/api.ts";
import { useConfig } from "../hooks/useConfig.ts";
// feat: 导入加密函数
import { getRandomCharacter, encrypt } from "../lib/utlis.ts";

// feat: 导入密码模态框和相关 hook
import { usePasswordModal } from "../components/password.tsx";
import PasswordIcon from "../components/icons/Password.tsx";
import Close from "../components/icons/Close.tsx"; // 导入关闭图标

// 图标导入
import ShieldCheck from "../components/icons/ShieldCheck.tsx";
import CodeBracketIcon from "../components/icons/CodeBracket.tsx";
import ServerIcon from "../components/icons/ServerIcon.tsx";
import ApiIcon from "../components/icons/ApiIcon.tsx";
import GlobeAltIcon from "../components/icons/GlobeAltIcon.tsx";

// refactor: 将导入从 'database' 包更改为本地的类型定义文件
import type { Email } from "../database_types.ts";
import { InfoModal } from "../components/InfoModal.tsx";
import { MailDetail } from "./MailDetail.tsx";
// feat: 导入倒计时组件
import { CountdownTimer } from "../components/CountdownTimer.tsx";

export function Home() {
  const config = useConfig();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // 状态管理
  const [address, setAddress] = useState<string | undefined>(() =>
    Cookies.get("userMailbox"),
  );
  // feat: 新增状态，用于存储邮箱过期时间戳
  const [expiryTimestamp, setExpiryTimestamp] = useState<number | undefined>(
    () => {
      const expiry = Cookies.get("emailExpiry");
      return expiry ? parseInt(expiry, 10) : undefined;
    },
  );
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null); // 新增状态，用于存储当前选中的邮件
  const [selectedDomain, setSelectedDomain] = useState<string>(
    config.emailDomain[0],
  ); // feat: 新增状态，用于存储当前选中的域名
  const [showEmailModal, setShowEmailModal] = useState(false); // feat: 新增状态，用于控制邮件详情模态框的显示

  // feat: 初始化密码模态框
  const { PasswordModal, setShowPasswordModal } = usePasswordModal();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // feat: 新增状态，用于跟踪当前邮箱地址是否曾经收到过邮件
  const [hasReceivedEmail, setHasReceivedEmail] = useState(false);

  // 使用 React Query 获取邮件列表
  const {
    data: emails = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<Email[]>({
    queryKey: ["emails", address],
    queryFn: () => getEmails(address!),
    enabled: !!address, // 只有在 address 存在时才执行查询
    refetchInterval: 20000, // 恢复20秒自动刷新
    onError: (err: Error) => {
      toast.error(`${t("Failed to get emails")}: ${err.message}`, {
        duration: 5000,
      });
    },
    retry: false, // 失败后不自动重试
  });

  // feat: 将密码提示封装成一个函数，并用 useCallback 包裹以优化性能。
  // refactor: 移除自定义的 toast.custom, 使用全局 toast
  const showPasswordToast = useCallback(
    (password: string) => {
      toast(
        (toastInstance) => (
          // 优化：为弹窗添加独立的标题栏和关闭按钮，并调整整体样式
          <div className="w-full max-w-lg p-4 bg-slate-800 text-white rounded-lg shadow-lg border border-slate-700">
            {/* 标题栏：包含图标、标题和关闭按钮 */}
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <PasswordIcon className="h-6 w-6 text-cyan-400" />
                <h3 className="text-lg font-semibold">{t("View password")}</h3>
              </div>
              <button
                onClick={() => toast.dismiss(toastInstance.id)}
                className="p-1 rounded-full text-gray-400 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label="Close">
                <Close className="h-5 w-5" />
              </button>
            </div>

            {/* 内容区域 */}
            <div>
              <p className="text-sm text-gray-300">
                {t("Save your password and continue using this email in 1 day")}
              </p>
              <div className="mt-2 flex items-center text-sm bg-slate-700 px-2 py-1 rounded">
                <span className="flex-1 font-mono break-all text-gray-100">
                  {password}
                </span>
                <CopyButton text={password} className="p-1" />
              </div>
              <p className="mt-3 text-xs text-yellow-400">
                {t(
                  "Remember your password, otherwise your email will expire and cannot be retrieved",
                )}
              </p>
            </div>
          </div>
        ),
        {
          id: "password-notification", // 防止重复通知
          duration: 5000, // 5秒后自动关闭
          position: "top-center",
          // 优化：移除默认样式，让自定义组件完全控制外观
          style: {
            background: "transparent",
            border: "none",
            padding: 0,
            boxShadow: "none",
          },
        },
      );
    },
    [t],
  );

  // feat(fix): 使用useEffect来检测新邮件、显示密码通知，并控制“查看密码”按钮的可见性
  const prevEmailsLength = useRef(emails.length);
  useEffect(() => {
    // 修复：只要邮件列表不为空，就确保 hasReceivedEmail 状态为 true。
    // 这修复了从其他页面导航回来时，因组件重新挂载导致状态重置、图标不显示的问题。
    if (emails.length > 0 && !hasReceivedEmail) {
      setHasReceivedEmail(true);
    }

    // 当用户停止使用邮箱时（地址被清除），重置状态并关闭通知
    if (!address) {
      setHasReceivedEmail(false);
      // feat: 清除过期时间戳状态
      setExpiryTimestamp(undefined);
      toast.dismiss("password-notification");
    } else {
      // feat: 当地址存在时，尝试读取过期时间 cookie
      const expiry = Cookies.get("emailExpiry");
      if (expiry && !expiryTimestamp) {
        setExpiryTimestamp(parseInt(expiry, 10));
      }
    }

    prevEmailsLength.current = emails.length;
    // }, [emails, address, hasReceivedEmail]); // 依赖项包含 emails, address 和 hasReceivedEmail 以响应所有相关变化
    // feat: 添加 expiryTimestamp 到依赖项
  }, [emails, address, hasReceivedEmail, expiryTimestamp]);

  // 创建新邮箱地址的处理函数
  const handleCreateAddress = async () => {
    if (!turnstileToken) {
      toast.error(t("No captcha response"));
      return;
    }
    try {
      await verifyTurnstile(turnstileToken);
      setIsTurnstileVerified(true); // 验证通过
      // feat: 使用选定的域名创建邮箱
      const mailbox = `${randomName("", getRandomCharacter())}@${selectedDomain}`;
      // feat: 计算并存储过期时间戳 (当前时间 + 24小时)
      const now = Date.now();
      const expires = now + 24 * 60 * 60 * 1000;
      Cookies.set("userMailbox", mailbox, { expires: 1 }); // cookie 有效期1天
      Cookies.set("emailExpiry", expires.toString(), { expires: 1 }); // 存储过期时间戳
      setAddress(mailbox);
      setExpiryTimestamp(expires); // 更新状态
      setHasReceivedEmail(false); // 重置接收邮件状态
      toast.success(t("Email created successfully")); // feat: 使用全局 toast 提示
    } catch (error) {
      toast.error(t("Failed to verify captcha"));
      console.error("Turnstile verification failed:", error);
    }
  };

  // 停止使用当前邮箱地址
  const handleStopAddress = () => {
    Cookies.remove("userMailbox");
    // feat: 移除过期时间 cookie
    Cookies.remove("emailExpiry");
    setAddress(undefined);
    setHasReceivedEmail(false); // 重置状态
    setSelectedEmail(null); // 清除选中的邮件
    setExpiryTimestamp(undefined); // 清除过期时间状态
    queryClient.invalidateQueries({ queryKey: ["emails"] }); // 清理缓存
  };

  // feat: 手动刷新邮件
  const handleRefresh = () => {
    refetch();
    toast.success(t("Mailbox refreshed"));
  };

  // 修改：将延长邮箱有效期改为重置邮箱有效期
  const handleResetExpiry = useCallback(() => {
    // feat: 计算新的过期时间戳 (当前时间 + 24小时)
    const newExpiry = Date.now() + 24 * 60 * 60 * 1000;
    // 计算新的 Cookie 过期时间（相对于当前时间1天）
    const cookieExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    Cookies.set("emailExpiry", newExpiry.toString(), {
      expires: cookieExpires,
    }); // 更新 Cookie，有效期设为从现在起1天
    setExpiryTimestamp(newExpiry); // 更新状态
    toast.success(t("Validity reset successfully")); // 修改：显示重置成功提示
  }, [t]); // 依赖项仅包含 t，因为函数内部不再依赖 expiryTimestamp

  // 删除邮件的 useMutation hook
  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteEmails(ids),
    onSuccess: () => {
      toast.success(t("Emails deleted successfully")); // feat: 使用全局 toast 提示
      setSelectedIds([]); // 清空选择
      if (selectedEmail && selectedIds.includes(selectedEmail.id)) {
        setSelectedEmail(null); // 如果删除的邮件是被选中的，则清除
      }
      queryClient.invalidateQueries({ queryKey: ["emails", address] }); // 刷新列表
    },
    onError: () => {
      toast.error(t("Failed to delete emails")); // feat: 使用全局 toast 提示
    },
  });

  // 定义 handleDeleteEmails 函数
  const handleDeleteEmails = (ids: string[]) => {
    if (ids.length === 0) {
      toast.error(t("Please select emails to delete"));
      return;
    }
    deleteMutation.mutate(ids);
  };

  // feat: 处理密码登录的函数
  // fix: 移除登录时的 turnstile token 校验逻辑
  const handleLogin = async (password: string) => {
    setIsLoggingIn(true);
    try {
      // fix: 调用更新后的 loginByPassword 函数，不再传递 token
      const data = await loginByPassword(password);
      // feat: 登录成功后也设置过期时间戳
      const now = Date.now();
      const expires = now + 24 * 60 * 60 * 1000;
      Cookies.set("userMailbox", data.address, { expires: 1 });
      Cookies.set("emailExpiry", expires.toString(), { expires: 1 });
      setAddress(data.address);
      setExpiryTimestamp(expires); // 更新状态
      setShowPasswordModal(false); // 关闭模态框
      toast.success(t("Login successful"));
    } catch (error: any) {
      // fix: 使用 i18n 翻译错误信息
      toast.error(`${t("Login failed")}: ${t(error.message)}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // feat: 获取密码（基于当前邮箱地址和 COOKIES_SECRET 加密）
  const getPassword = useCallback(() => {
    if (address && config.cookiesSecret) {
      return encrypt(address, config.cookiesSecret);
    }
    return null;
  }, [address, config.cookiesSecret]);

  // 新增：处理邮件选择
  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
  };

  // 新增：关闭邮件详情
  const handleCloseDetail = () => {
    setSelectedEmail(null);
  };

  // feat: 新增处理函数，用于在模态框中显示邮件
  const handleExpandEmail = () => {
    setShowEmailModal(true);
  };

  return (
    <div className="h-full flex flex-col gap-4 md:flex-row justify-center items-start mt-24 mx-6 md:mx-10">
      <PasswordModal onLogin={handleLogin} isLoggingIn={isLoggingIn} />
      {selectedEmail && (
        <InfoModal
          showModal={showEmailModal}
          setShowModal={setShowEmailModal}
          title={t("Email Detail")}>
          <MailDetail
            email={selectedEmail}
            onClose={() => setShowEmailModal(false)}
          />
        </InfoModal>
      )}
      <div className="flex flex-col text-white items-start w-full md:w-[350px] mx-auto gap-2">
        {/* 左侧信息面板 */}
        <div className="w-full mb-4 md:max-w-[350px] shrink-0 group group-hover:before:duration-500 group-hover:after:duration-500 after:duration-500 hover:border-cyan-600 hover:before:[box-shadow:_20px_20px_20px_30px_#a21caf] duration-500 before:duration-500 hover:duration-500 hover:after:-right-8 hover:before:right-12 hover:before:-bottom-8 hover:before:blur origin-left hover:decoration-2 relative bg-neutral-800 h-full border text-left p-4 rounded-lg overflow-hidden border-cyan-50/20 before:absolute before:w-12 before:h-12 before:content[''] before:right-1 before:top-1 before:z-10 before:bg-violet-500 before:rounded-full before:blur-lg  after:absolute after:z-10 after:w-20 after:h-20 after:content['']  after:bg-rose-300 after:right-8 after:top-3 after:rounded-full after:blur-lg">
          <h1 className="text-gray-50 text-xl font-bold mb-7 group-hover:text-cyan-500 duration-500">
            {t("Virtual Temporary Email")}
          </h1>
          <div className="flex flex-col gap-4 text-sm text-gray-200">
            <a
              href="https://github.com/oiov/vmail"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center after:content-['↗'] gap-1.5 hover:text-cyan-400 transition-colors cursor-pointer">
              <CodeBracketIcon className="size-5 text-blue-400" />{" "}
              {t("Open Source")}
            </a>
            <div className="flex items-center gap-1.5">
              <ServerIcon className="size-5 text-blue-400" />
              {t("Stable - 1M+ emails processed")}
            </div>
            <Link
              to="/api-docs"
              className="flex items-center after:content-['↗'] gap-1.5 hover:text-cyan-400 transition-colors cursor-pointer">
              <ApiIcon className="size-5 text-blue-400" />
              {t("Open RESTful API")}
            </Link>
            <div className="flex items-center gap-1.5">
              <GlobeAltIcon className="size-5 text-blue-400" />
              {t("Multi-domain configurable")}
            </div>
          </div>
        </div>

        {/* 根据是否存在邮箱地址显示不同内容 */}
        {address ? (
          <div className="w-full md:max-w-[350px] mb-4">
            <div className="mb-4 font-semibold text-sm">
              {t("Email address")}
            </div>
            <div className="flex items-center text-zinc-100 bg-white/10 backdrop-blur-xl shadow-inner px-4 py-4 rounded-md w-full">
              <span className="truncate">{address}</span>
              <CopyButton text={address} className="p-1 rounded-md ml-auto" />
            </div>
            {/* 修改：将 onExtend 更改为 onReset 并传递 handleResetExpiry */}
            {expiryTimestamp && (
              <CountdownTimer
                expiryTimestamp={expiryTimestamp}
                onReset={handleResetExpiry}
              />
            )}
            <button
              onClick={handleStopAddress}
              className="py-2.5 rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500">
              {t("Stop")}
            </button>
          </div>
        ) : (
          <div className="w-full md:max-w-[350px]">
            {/* feat: 添加域名选择下拉框 */}
            <div className="mb-4">
              <div className="mb-3 font-semibold">{t("Domain")}</div>
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full p-2.5 rounded-md bg-white/10 text-white border border-cyan-50/20">
                {config.emailDomain.map((domain) => (
                  <option key={domain} value={domain} className="text-black">
                    @{domain}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm relative mb-4">
              <div className="mb-3 font-semibold">{t("Validater")}</div>
              <div className="[&_iframe]:!w-full h-[65px] max-w-[300px] bg-gray-700">
                <Turnstile
                  siteKey={config.turnstileKey}
                  onSuccess={setTurnstileToken}
                  options={{ theme: "dark" }}
                />
              </div>
            </div>
            <button
              onClick={handleCreateAddress}
              disabled={!turnstileToken}
              className="py-2.5 rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500">
              {t("Create temporary email")}
            </button>
            <p
              className="mt-4 text-sm text-cyan-500 cursor-pointer"
              onClick={() => setShowPasswordModal(true)}>
              <PasswordIcon className="inline-block w-4 h-4 mr-2" />
              {t("Have a password? Login.")}
            </p>
          </div>
        )}
      </div>

      {/* 右侧邮件列表或邮件详情 */}
      {/* refactor: 始终渲染 MailList，并通过 selectedEmail prop 控制其内部显示逻辑 */}
      <div className="w-full flex-1 overflow-hidden">
        <MailList
          isAddressCreated={!!address}
          emails={emails}
          isLoading={isLoading}
          isFetching={isFetching}
          onDelete={handleDeleteEmails}
          isDeleting={deleteMutation.isPending}
          onRefresh={handleRefresh} // feat: 传递新的刷新函数
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          onSelectEmail={handleSelectEmail} // 传递选择邮件的函数
          // feat: 传递新状态和回调函数
          showViewPasswordButton={hasReceivedEmail}
          onShowPassword={() => {
            const password = getPassword();
            if (password) {
              showPasswordToast(password);
            }
          }}
          // feat: 传递当前选中的邮件和关闭详情页的回调
          selectedEmail={selectedEmail}
          onCloseDetail={handleCloseDetail}
          onExpand={handleExpandEmail} // feat: 传递展开邮件的回调
        />
      </div>
    </div>
  );
}
