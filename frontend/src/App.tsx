import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
// 修正导入路径，添加 .tsx 扩展名
import { Home } from './pages/Home.tsx'; 
import { MailDetail } from './pages/MailDetail.tsx'; 
import { ConfigContext, AppConfig } from './hooks/useConfig.ts'; // 也修正这个

const queryClient = new QueryClient();

function App() {
  // 明确 config 的状态类型
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    // 从 worker 获取前端配置
    axios.get<AppConfig>('/config').then((res) => {
      setConfig(res.data);
    });
  }, []);

  if (!config) {
    return <div>加载中...</div>;
  }

  return (
    <ConfigContext.Provider value={config}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/mails/:id" element={<MailDetail />} />
            {/* 你可以在这里添加更多路由 */}
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigContext.Provider>
  );
}

export default App;