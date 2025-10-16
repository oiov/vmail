import { Link, NavLink } from 'react-router-dom'; // <--- 关键修正：从 react-router-dom 导入
import { VmailLogo as Vmail } from './icons/vmail.tsx'; // 假设 vmail 图标组件已迁移

// NavLink 的样式函数，用于激活状态
const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
  return `px-3 py-2 rounded-md text-sm font-medium ${
    isActive
      ? 'bg-gray-900 text-white'
      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
  }`;
};

export function Header() {
  return (
    <header className="bg-gray-800 text-white">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <Vmail className="h-8 w-8" />
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {/* 使用 react-router-dom 的 NavLink */}
                <NavLink to="/" className={getNavLinkClass} end>
                  收件箱
                </NavLink>
                <NavLink to="/about" className={getNavLinkClass}>
                  关于
                </NavLink>
                <NavLink to="/privacy" className={getNavLinkClass}>
                  隐私政策
                </NavLink>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            {/* 可以添加其他元素，例如 GitHub 链接 */}
            <a 
              href="https://github.com/oiov/vmail" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white"
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}