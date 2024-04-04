import { Link } from "@remix-run/react";
import Twitter from "./icons/Twitter";
import Github from "./icons/GitHub";
import { MailIcon } from "icons";
import Coffee from "./icons/Coffee";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <div className="text-white w-full mt-auto flex flex-col items-center justify-between px-5 pt-16 mb-10 md:px-10 mx-auto sm:flex-row">
      <Link to="/" className="text-xl font-black leading-none select-none logo">
        VMAIL.DEV
      </Link>
      <Link
        className="mt-4 text-sm text-gray-400 sm:ml-4 sm:pl-4 sm:border-l sm:border-gray-200 sm:mt-0"
        to="https://vmail.dev"
        target="_blank">
        {" "}
        © 2024 Products of Yesmore
      </Link>
      <div className="flex items-center gap-3 mt-3 md:hidden text-sm text-gray-300">
        <Link to="/about">{t("About")}</Link>
        <Link to="/privacy">{t("Privacy")}</Link>
      </div>
      <div className="inline-flex justify-center mt-4 space-x-5 sm:ml-auto sm:mt-0 sm:justify-start">
        <Link
          to="https://huawei.com.tw"
          target="_blank"
          title="Google Earth"
          className="text-gray-400 hover:text-gray-500  scale-[1.2]">
          🌍
        </Link>
        <Link
          to="mailto:team@inke.app"
          title="Email"
          className="text-gray-400 hover:text-gray-500">
          <MailIcon className="w-6 h-6" />
        </Link>
        <Link
          to="https://twitter.com/yesmoree"
          target="_blank"
          title="Twitter"
          className="text-gray-400 hover:text-gray-500">
          <Twitter />
        </Link>
        <Link
          to="https://github.com/yesmore/vmail"
          target="_blank"
          title="Github"
          className="text-gray-400 hover:text-gray-500">
          <Github />
        </Link>
        <Link
          to="https://www.buymeacoffee.com/yesmore"
          target="_blank"
          title="Buy me a coffee">
          <Coffee className="w-6 h-6" />
        </Link>
      </div>
    </div>
  );
}
