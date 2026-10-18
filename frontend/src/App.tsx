import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Home } from "./pages/Home.tsx";
const DashboardLayout = lazy(() =>
  import("./dashboard/DashboardLayout").then((m) => ({
    default: m.DashboardLayout,
  })),
);
const OverviewPage = lazy(() =>
  import("./dashboard/Pages").then((m) => ({ default: m.OverviewPage })),
);
const AccountPage = lazy(() =>
  import("./dashboard/Pages").then((m) => ({ default: m.AccountPage })),
);
const MailboxesPage = lazy(() =>
  import("./dashboard/Pages").then((m) => ({ default: m.MailboxesPage })),
);
const MessagesPage = lazy(() =>
  import("./dashboard/Pages").then((m) => ({ default: m.MessagesPage })),
);
const MessagePage = lazy(() =>
  import("./dashboard/Pages").then((m) => ({ default: m.MessagePage })),
);
const AdminSettingsPage = lazy(() =>
  import("./dashboard/AdminSettingsPage").then((m) => ({
    default: m.AdminSettingsPage,
  })),
);
const OutboundPage = lazy(() =>
  import("./dashboard/OutboundPage").then((m) => ({ default: m.OutboundPage })),
);
const AdminLogsPage = lazy(() =>
  import("./dashboard/AdminLogsPage").then((m) => ({
    default: m.AdminLogsPage,
  })),
);
const ApiKeys = lazy(() =>
  import("./pages/ApiKeys").then((m) => ({ default: m.ApiKeys })),
);
const Admin = lazy(() =>
  import("./pages/Admin").then((m) => ({ default: m.Admin })),
);
import { ApiDocs } from "./pages/ApiDocs.tsx";
// MailDetail 组件不再作为独立页面，因此移除其路由
// import { MailDetail } from './pages/MailDetail.tsx';
// import { About } from './pages/About.tsx';  // 移除
// import { Privacy } from './pages/Privacy.tsx'; // 移除
// import { Terms } from './pages/Terms.tsx'; // 移除
import { ConfigContext, AppConfig } from "./hooks/useConfig.ts";
import { getUnlockStatus, unlockSite } from "./services/api.ts";
import { SiteUnlock } from "./components/SiteUnlock.tsx";
import { Layout } from "./Layout.tsx";

// 创建一个新的 QueryClient 实例，用于TanStack Query的数据缓存和管理
const queryClient = new QueryClient();

function App() {
  // AppConfig 状态，可以为 AppConfig 类型或 null
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    // 组件挂载后，从后端 /config 接口获取前端配置
    axios.get<AppConfig>("/config").then((res) => {
      setConfig(res.data);
    });
  }, []); // 空依赖数组确保此 effect 只运行一次

  useEffect(() => {
    if (!config) {
      return;
    }

    if (!config.sitePasswordEnabled) {
      setIsUnlocked(true);
      return;
    }

    getUnlockStatus()
      .then((status) => {
        setIsUnlocked(status.unlocked || !status.sitePasswordEnabled);
      })
      .catch(() => {
        setIsUnlocked(false);
      });
  }, [config]);

  const handleUnlock = async (password: string) => {
    setIsUnlocking(true);
    setUnlockError(null);
    try {
      await unlockSite(password);
      setIsUnlocked(true);
    } catch (err: any) {
      setUnlockError(err?.message || "Invalid password");
    } finally {
      setIsUnlocking(false);
    }
  };

  // 在配置加载完成前，显示加载中状态
  if (!config) {
    return (
      <div className="bg-[#1f2023] text-white w-screen h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (config.setupRequired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900 p-6 text-white">
        <div className="max-w-lg rounded-xl border border-amber-700/50 p-8">
          <h1 className="mb-4 text-xl font-semibold">
            Vmail setup required / 需要完成升级配置
          </h1>
          <p className="mb-3 text-sm leading-7 text-zinc-300">
            The site operator needs to configure MAILBOX_TOKEN_SECRET.
            站点管理员需要配置邮箱签名密钥才能启用邮箱服务。
          </p>
          <a
            className="text-sm text-cyan-300 underline"
            href="https://github.com/oiov/vmail/blob/main/docs/UPGRADE.md"
          >
            Upgrade instructions / 升级指南
          </a>
        </div>
      </div>
    );
  }
  if (!isUnlocked) {
    return (
      <SiteUnlock
        onUnlock={handleUnlock}
        isUnlocking={isUnlocking}
        error={unlockError}
      />
    );
  }

  return (
    <ConfigContext.Provider value={config}>
      {/* 使用 QueryClientProvider 为应用提供 React Query 功能 */}
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="min-h-screen bg-[#1d2120] p-10 text-zinc-300">
                Loading…
              </div>
            }
          >
            <Routes>
              {/* 使用 Layout 组件作为所有页面的布局框架 */}
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/api-docs" element={<ApiDocs />} />
                <Route
                  path="/admin"
                  element={<Navigate to="/dashboard/admin/users" replace />}
                />
                {/* 移除 /mails/:id, /about, /privacy, /terms 路由 */}
              </Route>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<OverviewPage />} />
                <Route path="keys" element={<ApiKeys />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="mailboxes" element={<MailboxesPage />} />
                <Route path="messages" element={<MessagesPage />} />
                <Route path="outbound" element={<OutboundPage />} />
                <Route path="outbound/:id" element={<OutboundPage />} />
                <Route path="admin/outbound" element={<OutboundPage admin />} />
                <Route
                  path="admin/outbound/:id"
                  element={<OutboundPage admin />}
                />
                <Route
                  path="messages/:mailboxId/:messageId"
                  element={<MessagePage />}
                />
                <Route path="admin/users" element={<Admin />} />
                <Route path="admin/users/:id" element={<Admin />} />
                <Route path="admin/logs" element={<AdminLogsPage />} />
                <Route path="admin/settings" element={<AdminSettingsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigContext.Provider>
  );
}

export default App;
