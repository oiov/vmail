import { Link, NavLink } from 'react-router-dom';
import { VmailLogo } from './icons/vmail.tsx';
import { useTranslation } from "react-i18next";
import GithubPlat from "./icons/GitHubPlat.tsx";

export function Header() {
  const { t } = useTranslation();
  return (
    <header className="fixed top-0 z-20 h-20 w-full px-5 backdrop-blur-xl md:px-10 text-white flex items-center justify-between shadow-sm">
      <Link to="/" className="font-bold flex items-center justify-center gap-3">
        <VmailLogo />
        <button className="cool-btn">
          <span>VMAIL.DEV</span>
        </button>
      </Link>
      <nav className="flex items-center">
        {/* 导航链接 */}
        <NavLink
          to="/about"
          className="ml-3 md:ml-8 text-sm md:text-base hidden md:block hover:text-cyan-400"
        >
          {t("About")}
        </NavLink>
        <NavLink
          to="/privacy"
          className="ml-3 md:ml-8 text-sm md:text-base hidden md:block hover:text-cyan-400"
        >
          {t("Privacy")}
        </NavLink>
        <NavLink
          to="/terms"
          className="ml-3 md:ml-8 text-sm md:text-base hidden md:block hover:text-cyan-400"
        >
          {t("Terms")}
        </NavLink>
        {/* GitHub 链接按钮 */}
        <a
          className="ml-3 md:ml-8"
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/oiov/vmail"
        >
          <button className="whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-transparent hover:bg-accent hover:text-accent-foreground text-md flex h-[32px] w-[85px] cursor-pointer items-center justify-center rounded-md border-2 p-2 font-semibold hover:opacity-50">
            <GithubPlat />
            <div className="ml-1.5 text-sm">Star</div>
          </button>
        </a>
      </nav>
    </header>
  );
}
