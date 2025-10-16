import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";

// 这是一个 i18next 的配置文件
i18n
  // 使用 i18next-http-backend 插件，它允许从服务器或公共文件夹加载翻译文件
  .use(Backend)
  // 使用 i18next-browser-languagedetector 插件自动检测用户浏览器语言
  .use(LanguageDetector)
  // 将 i18n 实例传递给 react-i18next，使其可以在 React 组件中使用
  .use(initReactI18next)
  // 初始化 i18next
  .init({
    // 调试模式，将在控制台输出 i18n 相关信息
    debug: true,
    // 如果检测到的语言不受支持，则回退到该语言
    fallbackLng: "en",
    // 默认的命名空间
    defaultNS: "common",
    // 支持的语言列表
    supportedLngs: ["en", "zh", "fr", "ja", "hi", "de", "ko", "zh-TW", "it", "pt", "tr", "ru"],
    // 后端插件的配置
    backend: {
      // 翻译文件的加载路径, e.g., /locales/en/common.json
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    // 语言检测器的配置
    detection: {
      // 检测语言的顺序
      order: ["cookie", "localStorage", "htmlTag", "path", "subdomain"],
      // 缓存检测到的语言到这些位置
      caches: ["cookie", "localStorage"],
    },
  });

export default i18n;
