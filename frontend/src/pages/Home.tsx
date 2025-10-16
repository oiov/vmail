import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Turnstile } from '@marsidev/react-turnstile';

import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MailList } from '../components/MailList';
import { CopyButton } from '../components/CopyButton'; // 引入 CopyButton
import { getEmails, deleteEmails } from '../services/api';
import { useConfig } from '../hooks/useConfig.ts';
import { RefreshIcon } from '../components/icons/Refresh'; // 引入图标

export function Home() {
  const config = useConfig();
  const queryClient = useQueryClient();

  const [address, setAddress] = useState('your-default-address@' + config.emailDomain);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const { data: emails, isLoading, isError, refetch } = useQuery({
    queryKey: ['emails', address],
    queryFn: () => getEmails(address, turnstileToken!),
    enabled: !!turnstileToken,
    refetchInterval: 10000, // 调整为 10 秒
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteEmails(ids, turnstileToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails', address] });
    },
  });

  const handleDeleteEmails = (ids: string[]) => {
    if (turnstileToken) {
      deleteMutation.mutate(ids);
    } else {
      alert('请先完成人机验证');
    }
  };
  
  const handleNewAddress = () => {
      const randomName = Math.random().toString(36).substring(2, 10);
      setAddress(`${randomName}@${config.emailDomain}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4">
        {/* 地址操作区域 */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex items-center border rounded-md">
            <input type="text" value={address} readOnly className="p-2 w-full bg-gray-50 border-none rounded-l-md"/>
            <CopyButton text={address} />
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <button onClick={handleNewAddress} className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 flex-grow">
              新建地址
            </button>
            <button onClick={() => refetch()} disabled={isLoading} className="bg-gray-500 text-white p-2 rounded-md hover:bg-gray-600 disabled:bg-gray-300">
              <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Turnstile 人机验证组件 */}
        {!turnstileToken && (
          <div className="flex justify-center my-4">
            <Turnstile
              siteKey={config.turnstileKey}
              onSuccess={setTurnstileToken}
              options={{ theme: 'light' }}
            />
          </div>
        )}

        {/* 邮件列表 */}
        {isLoading && <div className="text-center p-4">加载邮件中...</div>}
        {isError && <div className="text-center p-4 text-red-500">加载失败，请重试。</div>}
        {turnstileToken && emails && (
          <MailList
            emails={emails}
            onDelete={handleDeleteEmails}
            isDeleting={deleteMutation.isPending}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}