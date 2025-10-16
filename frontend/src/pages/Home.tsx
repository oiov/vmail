import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Turnstile } from '@marsidev/react-turnstile';
import randomName from "@scaleway/random-name";
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { Toaster, toast } from 'react-hot-toast';

import { MailList } from '../components/MailList.tsx';
import { CopyButton } from '../components/CopyButton.tsx';
// feat: 导入 loginByPassword
import { getEmails, deleteEmails, loginByPassword, verifyTurnstile } from '../services/api.ts';
import { useConfig } from '../hooks/useConfig.ts';
import { getRandomCharacter } from '../lib/utlis.ts';

// feat: 导入密码模态框和相关 hook
import { usePasswordModal } from '../components/password.tsx';
import PasswordIcon from '../components/icons/Password.tsx'; 

// 图标导入
import ShieldCheck from "../components/icons/ShieldCheck.tsx";
import Cloudflare from "../components/icons/Cloudflare.tsx";
import Clock from "../components/icons/Clock.tsx";
import Info from "../components/icons/Info.tsx";

// refactor: 将导入从 'database' 包更改为本地的类型定义文件
import type { Email } from '../database_types.ts';

export function Home() {
  const config = useConfig();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // 状态管理
  // fix: 简化 address state 的初始化
  const [address, setAddress] = useState<string | undefined>(() => Cookies.get('userMailbox'));
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // fix: 新增状态，跟踪人机验证是否已通过
  const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);

  // feat: 初始化密码模态框
  const { PasswordModal, setShowPasswordModal } = usePasswordModal();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // feat: 新增状态来跟踪密码通知是否已显示
  const [passwordNotificationShown, setPasswordNotificationShown] = useState(false);
  // feat: 新增状态来控制“查看密码”按钮的显示
  const [showViewPasswordButton, setShowViewPasswordButton] = useState(false);

  // 使用 React Query 获取邮件列表
  const { data: emails = [], isLoading, isFetching, refetch } = useQuery<Email[]>({
    queryKey: ['emails', address],
    queryFn: () => getEmails(address!),
    // fix: 关键修复：现在查询只依赖于 `address` 是否存在。
    // 移除了对 `turnstileToken` 的依赖，解决了页面刷新后无法加载邮件的问题。
    enabled: !!address,
    // fix: 恢复20秒自动刷新
    refetchInterval: 20000,
    // 当查询出错时，自动刷新会停止，这里添加错误提示方便调试
    onError: (err: Error) => {
      // 当发生错误时，给出提示
      // fix: 修复硬编码文本问题，使用 t() 函数
      toast.error(`${t("Failed to get emails")}: ${err.message}`, { duration: 5000 });
    },
    // 失败后不自动重试
    retry: false,
  });

  // feat(fix): 将密码提示封装成一个函数，并用 useCallback 包裹以优化性能。
  // 此函数现在只负责显示密码提示，不再控制“查看密码”按钮的显示与隐藏。
  const showPasswordToast = useCallback((password: string) => {
    toast.custom(
      (toastInstance) => (
        <div
          className={`max-w-md w-full bg-slate-800 text-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 transition-all duration-300 ${
            toastInstance.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <PasswordIcon className="h-8 w-8 text-cyan-400" />
              </div>
              <div className="ml-3 flex-1">
                {/* feat: 将标题文本更改为更合适的描述 */}
                <p className="text-sm font-medium text-gray-100">
                  {t('Save your password and continue using this email in 1 day')}
                </p>
                <div className="mt-1 flex items-center text-sm text-gray-300 bg-slate-700 px-2 py-1 rounded">
                  <span className="truncate flex-1 font-mono">{password}</span>
                  <CopyButton text={password} className="p-1" />
                </div>
                <p className="mt-2 text-xs text-yellow-400">
                  {t("Remember your password, otherwise your email will expire and cannot be retrieved")}
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-700">
            <button
              onClick={() => {
                toast.dismiss(toastInstance.id);
              }}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-cyan-400 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {t("Close")}
            </button>
          </div>
        </div>
      ),
      {
        id: 'password-notification', // 防止重复通知
        duration: 5000, // feat: 5秒后自动关闭
        position: 'top-center', // feat: 移动到上方显示
      }
    );
  }, [t]);

  // feat(fix): 使用useEffect来检测新邮件、显示密码通知，并控制“查看密码”按钮的可见性
  const prevEmailsLength = useRef(emails.length);
  useEffect(() => {
    // 检查邮箱列表是否从空变为非空，且密码通知未曾显示
    if (prevEmailsLength.current === 0 && emails.length > 0 && !passwordNotificationShown && address) {
      // 邮件按时间倒序排列，所以第一封邮件是数组的最后一项
      const firstEmail = emails[emails.length - 1];
      const password = firstEmail.id;

      showPasswordToast(password);
      setPasswordNotificationShown(true);
    }

    // feat(fix): 核心修改：只要收到邮件（emails.length > 0），就一直显示“查看密码”按钮
    if (emails.length > 0 && address) {
        setShowViewPasswordButton(true);
    }

    // 当用户停止使用邮箱时，重置状态并关闭通知和按钮
    if (!address) {
      setPasswordNotificationShown(false);
      setShowViewPasswordButton(false);
      toast.dismiss('password-notification');
    }

    // 更新上一次的邮件数量，用于下一次渲染时比较
    prevEmailsLength.current = emails.length;
  }, [emails, address, passwordNotificationShown, showPasswordToast]);

  // 创建新邮箱地址的处理函数
  const handleCreateAddress = async () => {
    if (!turnstileToken) {
      toast.error(t('No captcha response'));
      return;
    }
    // fix: 在创建地址前，先调用后端进行人机验证
    try {
      await verifyTurnstile(turnstileToken);
      setIsTurnstileVerified(true); // 验证通过
      const mailbox = `${randomName("", getRandomCharacter())}@${config.emailDomain}`;
      Cookies.set('userMailbox', mailbox, { expires: 1 }); // cookie 有效期1天
      setAddress(mailbox);
    } catch (error) {
      toast.error(t('Failed to verify captcha'));
      console.error("Turnstile verification failed:", error);
    }
  };

  // 停止使用当前邮箱地址
  const handleStopAddress = () => {
    Cookies.remove('userMailbox');
    setAddress(undefined);
    setShowViewPasswordButton(false); // 停止时也隐藏按钮
    // 清理相关的查询缓存
    queryClient.invalidateQueries({ queryKey: ['emails'] });
  };

  // 删除邮件的 useMutation hook
  const deleteMutation = useMutation({
    // fix: 删除邮件不再需要 turnstile token
    mutationFn: (ids: string[]) => deleteEmails(ids),
    onSuccess: () => {
      // fix: 修复硬编码文本问题，使用 t() 函数
      toast.success(t('Emails deleted'));
      setSelectedIds([]); // 清空选择
      // 使邮件列表的查询失效，触发一次刷新
      queryClient.invalidateQueries({ queryKey: ['emails', address] });
    },
    onError: () => {
      // fix: 修复硬编码文本问题，使用 t() 函数
      toast.error(t('Deletion failed'));
    }
  });

  // 定义 handleDeleteEmails 函数
  const handleDeleteEmails = (ids: string[]) => {
    if (ids.length === 0) {
      // fix: 修复硬编码文本问题，使用 t() 函数
      toast.error(t('Please select emails to delete'));
      return;
    }
    deleteMutation.mutate(ids);
  };

  // feat: 处理密码登录的函数
  const handleLogin = async (password: string) => {
    if (!turnstileToken) {
      toast.error(t('No captcha response'));
      return;
    }
    setIsLoggingIn(true);
    try {
      // fix: 登录时也需要传递 turnstile token
      const data = await loginByPassword(password, turnstileToken);
      Cookies.set('userMailbox', data.address, { expires: 1 });
      setAddress(data.address);
      setShowPasswordModal(false); // 关闭模态框
      toast.success(t("Login successful"));
    } catch (error: any) {
      toast.error(`${t("Login failed")}: ${error.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // feat: 获取密码（第一封邮件的ID）
  const getPassword = () => {
    if (emails && emails.length > 0) {
      // 邮件是倒序的，所以第一封邮件是最后一项
      return emails[emails.length - 1].id;
    }
    return null;
  }

  return (
    <div className="h-full flex flex-col gap-4 md:flex-row justify-center items-start mt-24 mx-6 md:mx-10">
      <Toaster position="top-center" />
      {/* feat: 渲染密码模态框 */}
      <PasswordModal onLogin={handleLogin} isLoggingIn={isLoggingIn} />
      <div className="flex flex-col text-white items-start w-full md:w-[350px] mx-auto gap-2">
        {/* 左侧信息面板 */}
        <div className="w-full mb-4 md:max-w-[350px] shrink-0 group group-hover:before:duration-500 group-hover:after:duration-500 after:duration-500 hover:border-cyan-600 hover:before:[box-shadow:_20px_20px_20px_30px_#a21caf] duration-500 before:duration-500 hover:duration-500 hover:after:-right-8 hover:before:right-12 hover:before:-bottom-8 hover:before:blur origin-left hover:decoration-2 relative bg-neutral-800 h-full border text-left p-4 rounded-lg overflow-hidden border-cyan-50/20 before:absolute before:w-12 before:h-12 before:content[''] before:right-1 before:top-1 before:z-10 before:bg-violet-500 before:rounded-full before:blur-lg  after:absolute after:z-10 after:w-20 after:h-20 after:content['']  after:bg-rose-300 after:right-8 after:top-3 after:rounded-full after:blur-lg">
          <h1 className="text-gray-50 text-xl font-bold mb-7 group-hover:text-cyan-500 duration-500">
            {t("Virtual Temporary Email")}
          </h1>
          <div className="flex flex-col gap-4 text-sm text-gray-200">
            <div className="flex items-center gap-1.5"><ShieldCheck /> {t("Privacy friendly")}</div>
            <div className="flex items-center gap-1.5"><Clock />{t("Valid for 1 Day")}</div>
            <div className="flex items-center gap-1.5"><Info />{t("AD friendly")}</div>
            <div className="flex items-center gap-2"><Cloudflare />{t("100% Run on Cloudflare")}</div>
          </div>
        </div>

        {/* 根据是否存在邮箱地址显示不同内容 */}
        {address ? (
          <div className="w-full md:max-w-[350px] mb-4">
            <div className="mb-4 font-semibold text-sm">{t("Email address")}</div>
            <div className="flex items-center mb-6 text-zinc-100 bg-white/10 backdrop-blur-xl shadow-inner px-4 py-4 rounded-md w-full">
              <span className="truncate">{address}</span>
              <CopyButton text={address} className="p-1 rounded-md ml-auto" />
            </div>
            <button
              onClick={handleStopAddress}
              className="py-2.5 rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500">
              {t("Stop")}
            </button>
          </div>
        ) : (
          <div className="w-full md:max-w-[350px]">
            <div className="text-sm relative mb-4">
              <div className="mb-3 font-semibold">{t("Validater")}</div>
              <div className="[&_iframe]:!w-full h-[65px] max-w-[300px] bg-gray-700">
                <Turnstile siteKey={config.turnstileKey} onSuccess={setTurnstileToken} options={{ theme: "dark" }} />
              </div>
            </div>
            <button
              onClick={handleCreateAddress}
              disabled={!turnstileToken}
              className="py-2.5 rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500">
              {t("Create temporary email")}
            </button>
            {/* feat: 添加登录按钮 */}
            <p
              className="mt-4 text-sm text-cyan-500 cursor-pointer"
              onClick={() => setShowPasswordModal(true)}>
              <PasswordIcon className="inline-block w-4 h-4 mr-2" />
              {t("Have a password? Login.")}
            </p>
          </div>
        )}
      </div>

      {/* 右侧邮件列表 */}
      <div className="w-full flex-1 overflow-hidden">
        <MailList
          isAddressCreated={!!address}
          emails={emails}
          // fix: 传递正确的加载状态
          isLoading={isLoading}
          isFetching={isFetching}
          onDelete={handleDeleteEmails}
          isDeleting={deleteMutation.isPending}
          onRefresh={refetch}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          // feat: 传递新状态和回调函数
          showViewPasswordButton={showViewPasswordButton}
          onShowPassword={() => {
            const password = getPassword();
            if (password) {
                showPasswordToast(password);
            }
          }}
        />
      </div>
    </div>
  );
}

