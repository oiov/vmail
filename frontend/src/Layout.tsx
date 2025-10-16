import { Outlet } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Toaster } from 'react-hot-toast';

/**
 * 主布局组件，包含页眉、内容区域和页脚
 * 这是一个通用的页面框架
 */
export function Layout() {
  return (
    // 使用与原始Remix应用相同的背景和布局结构
    <div className="mx-auto min-h-screen flex flex-col bg-[#1f2023]">
      <Header />
      {/* Outlet 用于渲染当前路由匹配的子组件 */}
      <Outlet />
      <Footer />
      {/* 用于显示通知的组件 */}
      <Toaster />
    </div>
  );
}
