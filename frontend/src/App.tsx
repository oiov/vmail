import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home'; // 假设你的主页组件
import { MailDetail } from './pages/MailDetail'; // 假设你的邮件详情页组件
import { ConfigContext } from './hooks/useConfig';

const queryClient = new QueryClient();

function App() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    // 从 worker 获取前端配置
    axios.get('/config').then((res) => {
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
            {/* 你可以在这里添加更多路由，例如 about, privacy 等 */}
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigContext.Provider>
  );
}

export default App;