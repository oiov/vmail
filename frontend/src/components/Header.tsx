import { Link } from "react-router-dom";
import { VmailLogo } from "./icons/vmail.tsx";
import { useTranslation } from "react-i18next";
import GithubPlat from "./icons/GitHubPlat.tsx";
import { useState, useRef, useEffect } from "react";
import { InfoModal } from "./InfoModal.tsx";
import { About } from "../pages/About.tsx";
import { Privacy } from "../pages/Privacy.tsx";
import { Terms } from "../pages/Terms.tsx";

// 支持的语言列表
const languages = [
  { code: "zh", name: "简体中文", flag: "🇨🇳" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "zh-TW", name: "繁體中文", flag: "🇹🇼" },
];

export function Header() {
  const { t, i18n } = useTranslation();
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // 获取当前语言信息（处理可能的语言代码变体，如 zh-CN -> zh）
  const getCurrentLang = () => {
    const lang = i18n.language;
    // 精确匹配
    const exact = languages.find((l) => l.code === lang);
    if (exact) return exact;
    // 前缀匹配（如 zh-CN 匹配 zh，但 zh-TW 优先精确匹配）
    const prefix = languages.find((l) => lang.startsWith(l.code + "-") || l.code.startsWith(lang + "-"));
    if (prefix) return prefix;
    // 基础语言匹配（如 zh-CN -> zh）
    const baseLang = lang.split("-")[0];
    const base = languages.find((l) => l.code === baseLang);
    return base || languages[0];
  };
  const currentLang = getCurrentLang();

  // 切换语言
  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setShowLangDropdown(false);
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="fixed top-0 z-20 h-20 w-full px-5 backdrop-blur-xl md:px-10 text-white flex items-center justify-between shadow-sm">
        <Link
          to="/"
          className="font-bold flex items-center justify-center gap-3">
          <VmailLogo />
          <button className="cool-btn">
            <span>VMAIL.DEV</span>
          </button>
        </Link>
        <nav className="flex items-center">
          {/* 导航链接 */}
          <a
            className="ml-3 md:ml-8"
            target="_blank"
            rel="noopener noreferrer"
            href="/api-docs">
            API
          </a>
          <button
            onClick={() => setShowAboutModal(true)}
            className="ml-3 md:ml-8 text-sm md:text-base hidden md:block hover:text-cyan-400">
            {t("About")}
          </button>
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="ml-3 md:ml-8 text-sm md:text-base hidden md:block hover:text-cyan-400">
            {t("Privacy")}
          </button>
          <button
            onClick={() => setShowTermsModal(true)}
            className="ml-3 md:ml-8 text-sm md:text-base hidden md:block hover:text-cyan-400">
            {t("Terms")}
          </button>
          {/* 语言切换下拉菜单 */}
          <div className="relative ml-3 md:ml-8" ref={langDropdownRef}>
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-1 text-sm hover:text-cyan-400 px-2 py-1 rounded border border-transparent hover:border-cyan-400/30">
              <span>{currentLang.flag}</span>
              <span className="hidden md:inline">{currentLang.name}</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showLangDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg py-1 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-700 flex items-center gap-2 ${
                      lang.code === i18n.language ? "text-cyan-400" : "text-white"
                    }`}>
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* GitHub 链接按钮 */}
          <a
            className="ml-3 md:ml-8"
            target="_blank"
            rel="noopener noreferrer"
            href="https://github.com/oiov/vmail">
            <button className="whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-transparent hover:bg-accent hover:text-accent-foreground text-md flex h-[32px] w-[85px] cursor-pointer items-center justify-center rounded-md border-2 p-2 font-semibold hover:opacity-50">
              <GithubPlat />
              <div className="ml-1.5 text-sm">Star</div>
            </button>
          </a>
        </nav>
      </header>

      <InfoModal
        showModal={showAboutModal}
        setShowModal={setShowAboutModal}
        title={t("About")}>
        <About />
      </InfoModal>
      <InfoModal
        showModal={showPrivacyModal}
        setShowModal={setShowPrivacyModal}
        title={t("Privacy")}>
        <Privacy />
      </InfoModal>
      <InfoModal
        showModal={showTermsModal}
        setShowModal={setShowTermsModal}
        title={t("Terms")}>
        <Terms />
      </InfoModal>
    </>
  );
}
