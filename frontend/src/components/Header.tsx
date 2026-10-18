import { AccountButton } from "./Account";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { InfoModal } from "./InfoModal";
import { About } from "../pages/About";
import { Privacy } from "../pages/Privacy";
import { Terms } from "../pages/Terms";
import { Icon } from "../dashboard/Icon";
import "./header.css";
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
  const { t, i18n } = useTranslation(),
    zh = i18n.language.startsWith("zh"),
    [about, setAbout] = useState(false),
    [privacy, setPrivacy] = useState(false),
    [terms, setTerms] = useState(false);
  return (
    <>
      <header className="public-header">
        <div className="public-header-inner">
          <Link to="/" className="public-brand">
            <span>
              <Icon name="mail" size={20} />
            </span>
            Vmail
          </Link>
          <nav
            className="public-nav"
            aria-label={zh ? "主导航" : "Main navigation"}
          >
            <NavLink to="/" end>
              {zh ? "临时邮箱" : "Inbox"}
            </NavLink>
            <NavLink to="/api-docs">{zh ? "API 文档" : "API docs"}</NavLink>
            <details className="public-resources">
              <summary>
                {zh ? "资源" : "Resources"}
                <svg
                  className="resources-chevron"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </summary>
              <div>
                <button onClick={() => setAbout(true)}>{t("About")}</button>
                <button onClick={() => setPrivacy(true)}>{t("Privacy")}</button>
                <button onClick={() => setTerms(true)}>{t("Terms")}</button>
                <a
                  href="https://github.com/oiov/vmail"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub ↗
                </a>
              </div>
            </details>
          </nav>
          <div className="public-actions">
            <select
              aria-label={zh ? "选择语言" : "Language"}
              value={
                languages.some((l) => l.code === i18n.language)
                  ? i18n.language
                  : i18n.language.split("-")[0]
              }
              onChange={(e) => void i18n.changeLanguage(e.target.value)}
            >
              {languages.map((l) => (
                <option value={l.code} key={l.code}>
                  {l.name}
                </option>
              ))}
            </select>
            <AccountButton />
            <a
              className="public-github-star"
              href="https://github.com/oiov/vmail"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={
                zh ? "在 GitHub 上为 Vmail 点 Star" : "Star Vmail on GitHub"
              }
              title="Star on GitHub"
            >
              <img src="/brand/github.svg" width="18" height="18" alt="" />
              <span>Star</span>
            </a>
          </div>
        </div>
      </header>
      <InfoModal showModal={about} setShowModal={setAbout} title={t("About")}>
        <About />
      </InfoModal>
      <InfoModal
        showModal={privacy}
        setShowModal={setPrivacy}
        title={t("Privacy")}
      >
        <Privacy />
      </InfoModal>
      <InfoModal showModal={terms} setShowModal={setTerms} title={t("Terms")}>
        <Terms />
      </InfoModal>
    </>
  );
}
