import { Link } from "@remix-run/react";
import { VmailLogo } from "./icons/vmail";
import { useTranslation } from "react-i18next";
import Follow from "./icons/Follow";

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
        to="/about"
        className="ml-auto text-sm md:text-base hidden md:block">
        {t("About")}
      </Link>
      <Link
        to="/privacy"
        className="ml-3 md:ml-8 text-sm md:text-base hidden md:block">
        {t("Privacy")}
      </Link>
      <Link
        className="ml-3 md:ml-8"
        target="_blank"
        to="https://github.com/oiov/vmail">
        <button className="whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-background hover:bg-accent hover:text-accent-foreground text-md flex h-[32px] w-[85px] cursor-pointer items-center justify-center rounded-md border-2 p-2 font-semibold hover:opacity-50">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="mb-[1px]">
            <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5"></path>
          </svg>
          <div className="ml-1.5 text-sm">Star</div>
        </button>
      </Link>
    </div>
  );
}
