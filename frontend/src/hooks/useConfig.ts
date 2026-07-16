import { createContext, useContext } from "react";

// 定义配置的类型
export interface AppConfig {
  emailDomain: string[]; // 修改为字符串数组
  turnstileKey: string;
  turnstileEnabled: boolean;
  sitePasswordEnabled: boolean;
  apiRateLimitPerMinute: number;
  openApiEnabled: boolean;
  // feat: 添加 cookiesSecret 到配置中，以便前端加密时使用
  cookiesSecret: string;
  // feat: 控制是否展示推广弹框和常驻链接
  showAff: boolean;
  // 可用的邮件发送渠道列表，如 ['resend', 'mailchannels']
  enabledSenders: Array<"resend" | "mailchannels" | "cloudflare">;
  // 当前启用的发件渠道，由 SEND_CHANNEL 环境变量决定
  sendChannel: "" | "resend" | "mailchannels" | "cloudflare";
  // 后端配置的、发件渠道允许或已验证的发件邮箱
  senderEmail: string;
}

// 创建 React Context
export const ConfigContext = createContext<AppConfig | null>(null);

// 创建一个自定义 Hook 以方便地使用配置
export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig 必须在 ConfigProvider 内部使用");
  }
  return context;
};
