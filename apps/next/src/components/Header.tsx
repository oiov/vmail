import { GithubIcon } from "icons";
import Link from "next/link";

export default function Header() {
  return (
    <div className="p-2 flex items-center">
      <Link href="/" className="font-bold text-xl">
        Vmail
      </Link>
      <a
        href="https://github.com/yesmore/vmail"
        target="_blank"
        className="ml-auto">
        <GithubIcon className="size-8" />
      </a>
    </div>
  );
}
