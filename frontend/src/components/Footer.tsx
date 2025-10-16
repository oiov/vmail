import { Link } from 'react-router-dom'; // <--- 关键修正
import Cloudflare from './icons/Cloudflare'; // <--- 关键修正：修复了导入方式
import GitHubPlat from './icons/GitHubPlat';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-white mt-8">
      <div className="container mx-auto px-4 py-6 text-center">
        <div className="flex justify-center items-center space-x-4 mb-4">
          <a
            href="https://github.com/oiov/vmail"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400"
          >
            <GitHubPlat className="w-6 h-6" />
          </a>
          <a
            href="https://www.cloudflare.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-400"
          >
            <Cloudflare className="w-6 h-6" />
          </a>
        </div>
        <p className="text-sm">
          &copy; {year} vMail. All rights reserved.
        </p>
        <div className="text-sm mt-2 space-x-4">
          {/* 使用 react-router-dom 的 Link */}
          <Link to="/about" className="hover:underline">
            关于
          </Link>
          <Link to="/privacy" className="hover:underline">
            隐私政策
          </Link>
        </div>
      </div>
    </footer>
  );
}