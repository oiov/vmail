import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home.tsx';
import { MailDetail } from './pages/MailDetail.tsx';
import { About } from './pages/About.tsx';
import { Privacy } from './pages/Privacy.tsx';
import { Terms } from './pages/Terms.tsx';
import { ConfigContext, AppConfig } from './hooks/useConfig.ts';
import { Layout } from './Layout.tsx';

// 创建一个新的 QueryClient 实例，用于TanStack Query的数据缓存和管理
const queryClient = new QueryClient();

function App() {
  // AppConfig 状态，可以为 AppConfig 类型或 null
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    // 组件挂载后，从后端 /config 接口获取前端配置
    axios.get<AppConfig>('/config').then((res) => {
      setConfig(res.data);
    });
  }, []); // 空依赖数组确保此 effect 只运行一次

  // 在配置加载完成前，显示加载中状态
  if (!config) {
    return <div className="bg-[#1f2023] text-white text-center p-8">加载中...</div>;
  }

  return (
    // 使用 ConfigContext.Provider 将配置信息提供给所有子组件
    <ConfigContext.Provider value={config}>
      {/* 使用 QueryClientProvider 为应用提供 React Query 功能 */}
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* 使用 Layout 组件作为所有页面的布局框架 */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/mails/:id" element={<MailDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigContext.Provider>
  );
}

export default App;
