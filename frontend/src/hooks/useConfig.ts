import { createContext, useContext } from 'react';

// 定义配置的类型
export interface AppConfig {
  emailDomain: string;
  turnstileKey: string;
}

// 创建 React Context
export const ConfigContext = createContext<AppConfig | null>(null);

// 创建一个自定义 Hook 以方便地使用配置
export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig 必须在 ConfigProvider 内部使用');
  }
  return context;
};