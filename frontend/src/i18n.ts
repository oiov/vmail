import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    debug: true,
    fallbackLng: "en",
    ns: ["common"],
    defaultNS: "common",
    supportedLngs: ["en", "zh", "fr", "ja", "hi", "de", "ko", "zh-TW", "it", "pt", "pt-BR", "tr", "ru"],
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    detection: {
      order: ["cookie", "localStorage", "htmlTag", "path", "subdomain"],
      caches: ["cookie", "localStorage"],
    },
  });

export default i18n;
