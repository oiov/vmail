import { useEffect, useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Turnstile } from '@marsidev/react-turnstile';
import randomName from "@scaleway/random-name";
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
// feat: 导入全局 toast
import { toast } from 'react-hot-toast';

import { MailList } from '../components/MailList.tsx';
import { CopyButton } from '../components/CopyButton.tsx';
// feat: 导入 loginByPassword
import { getEmails, deleteEmails, loginByPassword, verifyTurnstile } from '../services/api.ts';
import { useConfig } from '../hooks/useConfig.ts';
// feat: 导入加密函数
import { getRandomCharacter, encrypt } from '../lib/utlis.ts';

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
  const [address, setAddress] = useState<string | undefined>(() => Cookies.get('userMailbox'));
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isTurnstileVerified, setIsTurnstileVerified] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null); // 新增状态，用于存储当前选中的邮件
  const [selectedDomain, setSelectedDomain] = useState<string>(config.emailDomain[0]); // feat: 新增状态，用于存储当前选中的域名

  // feat: 初始化密码模态框
  const { PasswordModal, setShowPasswordModal } = usePasswordModal();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // feat: 新增状态，用于跟踪当前邮箱地址是否曾经收到过邮件
  const [hasReceivedEmail, setHasReceivedEmail] = useState(false);

  // 使用 React Query 获取邮件列表
  const { data: emails = [], isLoading, isFetching, refetch } = useQuery<Email[]>({
    queryKey: ['emails', address],
    queryFn: () => getEmails(address!),
    enabled: !!address, // 只有在 address 存在时才执行查询
    refetchInterval: 20000, // 恢复20秒自动刷新
    onError: (err: Error) => {
      toast.error(`${t("Failed to get emails")}: ${err.message}`, { duration: 5000 });
    },
    retry: false, // 失败后不自动重试
  });

  // feat: 将密码提示封装成一个函数，并用 useCallback 包裹以优化性能。
  // refactor: 移除自定义的 toast.custom, 使用全局 toast
  const showPasswordToast = useCallback((password: string) => {
    toast(
      (toastInstance) => (
        <div className="flex-1 w-0 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PasswordIcon className="h-8 w-8 text-cyan-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-100">
                  {t('Save your password and continue using this email in 1 day')}
                </p>
                <div className="mt-1 flex items-center text-sm text-gray-300 bg-slate-700 px-2 py-1 rounded">
                  <span className="flex-1 font-mono break-all">{password}</span>
                  <CopyButton text={password} className="p-1" />
                </div>
                <p className="mt-2 text-xs text-yellow-400">
                  {t("Remember your password, otherwise your email will expire and cannot be retrieved")}
                </p>
              </div>
            </div>
          </div>
      ),
      {
        id: 'password-notification', // 防止重复通知
        duration: 5000, // 5秒后自动关闭
        position: 'top-center',
      }
    );
  }, [t]);

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
      toast.dismiss('password-notification');
    }

    prevEmailsLength.current = emails.length;
  }, [emails, address, hasReceivedEmail]); // 依赖项包含 emails, address 和 hasReceivedEmail 以响应所有相关变化


  // 创建新邮箱地址的处理函数
  const handleCreateAddress = async () => {
    if (!turnstileToken) {
      toast.error(t('No captcha response'));
      return;
    }
    try {
      await verifyTurnstile(turnstileToken);
      setIsTurnstileVerified(true); // 验证通过
      // feat: 使用选定的域名创建邮箱
      const mailbox = `${randomName("", getRandomCharacter())}@${selectedDomain}`;
      Cookies.set('userMailbox', mailbox, { expires: 1 }); // cookie 有效期1天
      setAddress(mailbox);
      setHasReceivedEmail(false); // 重置接收邮件状态
      toast.success(t('Email created successfully')); // feat: 使用全局 toast 提示
    } catch (error) {
      toast.error(t('Failed to verify captcha'));
      console.error("Turnstile verification failed:", error);
    }
  };

  // 停止使用当前邮箱地址
  const handleStopAddress = () => {
    Cookies.remove('userMailbox');
    setAddress(undefined);
    setHasReceivedEmail(false); // 重置状态
    setSelectedEmail(null); // 清除选中的邮件
    queryClient.invalidateQueries({ queryKey: ['emails'] }); // 清理缓存
  };

  // feat: 手动刷新邮件
  const handleRefresh = () => {
    refetch();
    toast.success(t('Mailbox refreshed'));
  };

  // 删除邮件的 useMutation hook
  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteEmails(ids),
    onSuccess: () => {
      toast.success(t('Emails deleted successfully')); // feat: 使用全局 toast 提示
      setSelectedIds([]); // 清空选择
      if (selectedEmail && selectedIds.includes(selectedEmail.id)) {
        setSelectedEmail(null); // 如果删除的邮件是被选中的，则清除
      }
      queryClient.invalidateQueries({ queryKey: ['emails', address] }); // 刷新列表
    },
    onError: () => {
      toast.error(t('Failed to delete emails')); // feat: 使用全局 toast 提示
    }
  });

  // 定义 handleDeleteEmails 函数
  const handleDeleteEmails = (ids: string[]) => {
    if (ids.length === 0) {
      toast.error(t('Please select emails to delete'));
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

  return (
    <div className="h-full flex flex-col gap-4 md:flex-row justify-center items-start mt-24 mx-6 md:mx-10">
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
             {/* feat: 添加域名选择下拉框 */}
             <div className="mb-4">
                <div className="mb-3 font-semibold">{t("Domain")}</div>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full p-2.5 rounded-md bg-white/10 text-white border border-cyan-50/20"
                >
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
                <Turnstile siteKey={config.turnstileKey} onSuccess={setTurnstileToken} options={{ theme: "dark" }} />
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
        />
      </div>
    </div>
  );
}