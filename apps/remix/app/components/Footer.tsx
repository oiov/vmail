import { Link } from "@remix-run/react";
import Twitter from "./icons/Twitter";
import Github from "./icons/GitHub";
import { MailIcon } from "icons";
import WrdoLogo from "./icons/Wrdo";
// import Coffee from "./icons/Coffee";

export default function Footer() {
  return (
    <div className="text-white w-full mt-auto flex flex-col items-center justify-between px-5 pt-16 mb-10 md:px-10 mx-auto sm:flex-row">
      <Link to="/" className="text-xl font-black leading-none select-none logo">
        VMAIL.DEV
      </Link>{" "}
      <p className="mt-4 text-sm text-gray-400 sm:ml-4 sm:pl-4 sm:border-l sm:border-gray-200 sm:mt-0">
        © 2024 Products of{" "}
        <Link
          className="font-semibold underline hover:text-gray-600"
          to="https://www.oiov.dev"
          target="_blank">
          oiov
        </Link>
        .
      </p>
      <div className="inline-flex justify-center mt-4 space-x-5 sm:ml-auto sm:mt-0 sm:justify-start">
        <Link
          to="https://wr.do"
          target="_blank"
          title="WR.DO"
          className="text-gray-400 hover:text-gray-500  scale-[1.2]">
          <WrdoLogo className="w-6 h-6" />
        </Link>
        <Link
          to="mailto:hi@oiov.dev"
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
          to="https://github.com/oiov/vmail"
          target="_blank"
          title="Github"
          className="text-gray-400 hover:text-gray-500">
          <Github />
        </Link>
        {/* <Link
          to="https://www.buymeacoffee.com/yesmore"
          target="_blank"
          title="Buy me a coffee">
          <Coffee className="w-6 h-6" />
        </Link> */}
      </div>
    </div>
  );
}
