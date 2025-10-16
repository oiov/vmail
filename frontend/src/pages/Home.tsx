import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Turnstile } from '@marsidev/react-turnstile';
import randomName from "@scaleway/random-name";
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { Toaster, toast } from 'react-hot-toast';

import { MailList } from '../components/MailList.tsx';
import { CopyButton } from '../components/CopyButton.tsx';
import { getEmails, deleteEmails } from '../services/api.ts';
import { useConfig } from '../hooks/useConfig.ts';
import { getRandomCharacter } from '../lib/utlis.ts';

// 图标导入
import ShieldCheck from "../components/icons/ShieldCheck.tsx";
import Cloudflare from "../components/icons/Cloudflare.tsx";
import Clock from "../components/icons/Clock.tsx";
import Info from "../components/icons/Info.tsx";

// 假设 Email 类型定义在 'database' 包中
import type { Email } from 'database';

export function Home() {
  const config = useConfig();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // 状态管理
  const [address, setAddress] = useState<string | undefined>(Cookies.get('userMailbox'));
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 从 cookie 中更新地址
  useEffect(() => {
    setAddress(Cookies.get('userMailbox'));
  }, []);

  // 使用 React Query 获取邮件列表
  const { data: emails = [], isLoading, refetch } = useQuery<Email[]>({
    queryKey: ['emails', address],
    queryFn: () => getEmails(address!, turnstileToken),
    enabled: !!address && !!turnstileToken, // 只有当地址和人机验证token都存在时才执行
    refetchInterval: 20000, // 每20秒自动刷新
  });

  // 创建新邮箱地址的处理函数
  const handleCreateAddress = () => {
    if (!turnstileToken) {
      toast.error(t('No captcha response'));
      return;
    }
    const mailbox = `${randomName("", getRandomCharacter())}@${config.emailDomain}`;
    Cookies.set('userMailbox', mailbox, { expires: 1 }); // cookie 有效期1天
    setAddress(mailbox);
  };

  // 停止使用当前邮箱地址
  const handleStopAddress = () => {
    Cookies.remove('userMailbox');
    setAddress(undefined);
  };

  // 删除邮件的 useMutation hook
  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteEmails(ids, turnstileToken),
    onSuccess: () => {
      toast.success('邮件已删除');
      setSelectedIds([]); // 清空选择
      queryClient.invalidateQueries({ queryKey: ['emails', address] });
    },
    onError: () => {
      toast.error('删除失败');
    }
  });

  // feat: 定义 handleDeleteEmails 函数
  // 修复了点击删除邮件时由于函数未定义而导致的白屏问题。
  const handleDeleteEmails = (ids: string[]) => {
    if (ids.length === 0) {
      toast.error('请选择要删除的邮件');
      return;
    }
    deleteMutation.mutate(ids);
  };

  return (
    <div className="h-full flex flex-col gap-4 md:flex-row justify-center items-start mt-24 mx-6 md:mx-10">
      <Toaster position="top-center" />
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
              <CopyButton text={address} />
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
          </div>
        )}
      </div>

      {/* 右侧邮件列表 */}
      <div className="w-full flex-1 overflow-hidden">
        {address ? (
          <MailList 
            emails={emails} 
            isLoading={isLoading} 
            onDelete={handleDeleteEmails}
            isDeleting={deleteMutation.isPending}
            onRefresh={refetch}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
          />
        ) : (
          <div className="text-center p-8 text-white">
            请先创建一个临时邮箱地址
          </div>
        )}
      </div>
    </div>
  );
}
