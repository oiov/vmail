import { Link } from "@remix-run/react";
import { VmailLogo } from "./icons/vmail";
import { useTranslation } from "react-i18next";
import GithubPlat from "./icons/GitHubPlat";

export default function Header() {
  const { t } = useTranslation();
  return (
    <div className="fixed top-0 z-20 h-20 w-full px-5 backdrop-blur-xl md:px-10 text-white flex items-center justify-between first-letter:shadow-sm">
      <Link to="/" className="font-bold flex items-center justify-center gap-3">
        <VmailLogo />
        <button className="cool-btn">
          <span>VMAIL.DEV</span>
        </button>
      </Link>
      <Link
        to="https://wr.do"
        target="_blank"
        className="ml-auto text-sm md:text-base hidden md:block">
        {t("Pro")}
      </Link>
      <Link
        to="/about"
        className="ml-3 md:ml-8 text-sm md:text-base hidden md:block">
        {t("About")}
      </Link>
      <Link
        to="/privacy"
        className="ml-3 md:ml-8 text-sm md:text-base hidden md:block">
        {t("Privacy")}
      </Link>
      <Link
        to="/terms"
        className="ml-3 md:ml-8 text-sm md:text-base hidden md:block">
        {t("Terms")}
      </Link>
      <Link
        className="ml-3 md:ml-8"
        target="_blank"
        to="https://github.com/oiov/vmail">
        <button className="whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-background hover:bg-accent hover:text-accent-foreground text-md flex h-[32px] w-[85px] cursor-pointer items-center justify-center rounded-md border-2 p-2 font-semibold hover:opacity-50">
          <GithubPlat />
          <div className="ml-1.5 text-sm">Star</div>
        </button>
      </Link>
    </div>
  );
}
