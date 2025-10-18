import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n.ts'; // 导入 i18n 配置以进行初始化

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* 使用 React.Suspense 包裹 App 组件。
      这是为了在 i18next 异步加载语言文件时，提供一个优雅的回退 UI（例如“加载中...”）。
    */}
    <React.Suspense fallback="loading...">
      <App />
    </React.Suspense>
  </React.StrictMode>,
);
