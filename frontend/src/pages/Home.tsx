import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Turnstile } from '@marsidev/react-turnstile'; // 需要安装 @marsidev/react-turnstile

import { Header } from '../components/Header'; // 导入您的组件
import { Footer } from '../components/Footer'; // 导入您的组件
import { MailList } from '../components/MailList'; // 导入您的组件
import { getEmails, deleteEmails } from '../services/api';
import { useConfig } from '../hooks/useConfig';

export function Home() {
  const config = useConfig(); // 从全局 context 获取配置
  const queryClient = useQueryClient(); // 获取 query 客户端实例

  // 使用 state 管理当前的邮箱地址和 Turnstile token
  const [address, setAddress] = useState('your-default-address@' + config.emailDomain);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // 使用 useQuery 获取邮件数据
  const { data: emails, isLoading, isError, refetch } = useQuery({
    queryKey: ['emails', address], // 查询的唯一键
    queryFn: () => getEmails(address, turnstileToken!), // 获取数据的函数
    enabled: !!turnstileToken, // 只有在获取到 token 后才执行查询
    refetchInterval: 5000, // 每 5 秒自动刷新一次
  });

  // 使用 useMutation 处理删除操作
  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteEmails(ids, turnstileToken!),
    onSuccess: () => {
      // 删除成功后，使缓存中的'emails'查询失效，从而触发重新获取
      queryClient.invalidateQueries({ queryKey: ['emails', address] });
    },
  });

  // 处理删除按钮点击事件
  const handleDeleteEmails = (ids: string[]) => {
    if (turnstileToken) {
      deleteMutation.mutate(ids);
    } else {
      alert('请先完成人机验证');
    }
  };
  
  // 生成新邮箱地址的函数
  const handleNewAddress = () => {
      const randomName = Math.random().toString(36).substring(2, 10);
      setAddress(`${randomName}@${config.emailDomain}`);
  };

  return (
    <div>
      <Header />
      <main className="container mx-auto p-4">
        {/* 地址操作区域 */}
        <div className="flex items-center space-x-2 mb-4">
          <input type="text" value={address} readOnly className="border p-2 w-full" />
          <button onClick={handleNewAddress} className="bg-blue-500 text-white p-2">
            新建
          </button>
          <button onClick={() => refetch()} className="bg-gray-500 text-white p-2">
            刷新
          </button>
        </div>

        {/* Turnstile 人机验证组件 */}
        <Turnstile
            siteKey={config.turnstileKey}
            onSuccess={setTurnstileToken}
            options={{ theme: 'light' }}
         />

        {/* 邮件列表 */}
        {isLoading && <div>加载邮件中...</div>}
        {isError && <div>加载失败，请重试。</div>}
        {emails && (
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