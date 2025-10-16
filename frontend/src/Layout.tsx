import { Outlet } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
// feat: 导入 Toaster 组件
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
      {/* feat: 添加全局 Toast 组件，并设置统一样式 */}
      <Toaster
        position="bottom-right" // 设置位置为右下角
        toastOptions={{
          // 设置默认样式
          style: {
            background: '#333',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}
