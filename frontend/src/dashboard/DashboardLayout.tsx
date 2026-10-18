import { useState, useEffect } from "react";
import {
  NavLink,
  Link,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LoginDialog, useAccount } from "../components/Account";
import { Icon } from "./Icon";
import "./dashboard.css";
export function DashboardLayout() {
  const { data: account, isLoading, error } = useAccount(),
    { i18n } = useTranslation(),
    zh = i18n.language.startsWith("zh");
  const [open, setOpen] = useState(false),
    [login, setLogin] = useState(false),
    [signoutError, setSignoutError] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      return localStorage.getItem("vmail-dashboard-theme") === "light"
        ? "light"
        : "dark";
    } catch {
      return "dark";
    }
  });
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("vmail-dashboard-theme", next);
    } catch {}
  };
  const location = useLocation(),
    navigate = useNavigate(),
    client = useQueryClient();
  useEffect(() => setOpen(false), [location.pathname]);
  const workspace = [
    ["/dashboard", "grid", "概览", "Overview"],
    ["/dashboard/keys", "key", "API Key", "API keys"],
    ["/dashboard/mailboxes", "inbox", "我的邮箱", "Mailboxes"],
    ["/dashboard/messages", "mail", "邮件", "Messages"],
    ["/dashboard/account", "user", "账户信息", "Account"],
  ];
  const admin = [
    ["/dashboard/admin/users", "users", "用户管理", "Users"],
    ["/dashboard/admin/logs", "log", "调用日志", "Request logs"],
  ];
  const active =
    [...workspace, ...admin].find((x) => x[0] === location.pathname)?.[
      zh ? 2 : 3
    ] ??
    (location.pathname.startsWith("/dashboard/messages/")
      ? zh
        ? "邮件详情"
        : "Message"
      : zh
        ? "用户详情"
        : "User details");
  const signOut = async () => {
    try {
      const r = await fetch("/api/auth/sign-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      if (r.ok) {
        client.clear();
        navigate("/");
      } else setSignoutError(zh ? "退出失败，请重试" : "Sign out failed");
    } catch {
      setSignoutError(zh ? "退出失败，请重试" : "Sign out failed");
    }
  };
  const links = (items: string[][]) =>
    items.map(([to, icon, cn, en]) => (
      <NavLink
        key={to}
        to={to}
        end={to === "/dashboard"}
        className={({ isActive }) => "dash-link " + (isActive ? "active" : "")}
      >
        <Icon name={icon} />
        <span>{zh ? cn : en}</span>
        {to === "/dashboard/keys" && <span className="nav-hint">API</span>}
      </NavLink>
    ));
  if (isLoading)
    return (
      <div className="dashboard-app dashboard-gate" data-theme={theme}>
        {zh ? "正在加载控制台…" : "Loading dashboard…"}
      </div>
    );
  if (!account)
    return (
      <div className="dashboard-app dashboard-gate" data-theme={theme}>
        <Link className="dash-brand" to="/">
          <span className="brand-mark">
            <Icon name="mail" />
          </span>
          Vmail
        </Link>
        <h1>{zh ? "登录控制台" : "Sign in to your dashboard"}</h1>
        <p>
          {error
            ? error.message
            : zh
              ? "管理 API Key、邮箱和账户信息。"
              : "Manage your API keys, mailboxes and account."}
        </p>
        <button className="dash-primary" onClick={() => setLogin(true)}>
          {zh ? "登录 / 注册" : "Sign in / Register"}
        </button>
        <Link to="/api-docs">
          {zh ? "查看 API 文档" : "Read the API documentation"}
        </Link>
        <LoginDialog open={login} onClose={() => setLogin(false)} />
      </div>
    );
  return (
    <div className="dashboard-app" data-theme={theme}>
      {open && (
        <button
          aria-label={zh ? "关闭导航" : "Close navigation"}
          className="dash-overlay"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={"dash-sidebar " + (open ? "is-open" : "")}>
        <Link to="/dashboard" className="dash-brand">
          <span className="brand-mark">
            <Icon name="mail" />
          </span>
          <span>
            Vmail<span className="brand-caption">WORKSPACE</span>
          </span>
        </Link>
        <button
          className="mobile-close dash-icon-button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <Icon name="close" />
        </button>
        <p className="nav-label">{zh ? "工作空间" : "WORKSPACE"}</p>
        <nav aria-label={zh ? "工作空间导航" : "Workspace navigation"}>
          {links(workspace)}
        </nav>
        {account.role === "admin" && (
          <>
            <p className="nav-label">{zh ? "管理" : "ADMINISTRATION"}</p>
            <nav aria-label={zh ? "管理导航" : "Administration navigation"}>
              {links(admin)}
            </nav>
          </>
        )}
        <div className="sidebar-bottom">
          <Link className="dash-link" to="/api-docs">
            <Icon name="book" />
            {zh ? "API 文档" : "API documentation"}
            <Icon name="arrow" size={16} />
          </Link>
          <Link className="dash-link" to="/">
            <Icon name="inbox" />
            {zh ? "临时邮箱" : "Temporary inbox"}
          </Link>
          <Link to="/dashboard/account" className="sidebar-profile">
            <span className="dash-avatar">
              {account.name.slice(0, 1).toUpperCase()}
            </span>
            <span>
              <strong>{account.name}</strong>
              <small>{account.email}</small>
            </span>
            <Icon name="chevron" size={15} />
          </Link>
        </div>
      </aside>
      <div className="dash-main">
        <header className="dash-topbar">
          <div className="dash-breadcrumb">
            <button
              className="dash-icon-button mobile-toggle"
              onClick={() => setOpen(true)}
              aria-label={zh ? "打开导航" : "Open navigation"}
            >
              <Icon name="menu" />
            </button>
            <span className="breadcrumb-root">
              {zh ? "控制台" : "Dashboard"}
            </span>
            <Icon name="chevron" size={14} />
            <strong>{active}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="dash-icon-button"
              onClick={toggleTheme}
              aria-label={
                theme === "dark"
                  ? zh
                    ? "切换浅色主题"
                    : "Switch to light theme"
                  : zh
                    ? "切换深色主题"
                    : "Switch to dark theme"
              }
              title={
                theme === "dark"
                  ? zh
                    ? "切换浅色主题"
                    : "Switch to light theme"
                  : zh
                    ? "切换深色主题"
                    : "Switch to dark theme"
              }
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
            </button>
            <span className="service-status">
              <i />
              {zh ? "免费计划" : "Free plan"}
            </span>
            <button
              className="dash-icon-button"
              onClick={() => void i18n.changeLanguage(zh ? "en" : "zh")}
            >
              {zh ? "EN" : "中"}
            </button>
            <button
              className="dash-icon-button"
              onClick={() => void signOut()}
              aria-label={zh ? "退出登录" : "Sign out"}
              title={zh ? "退出登录" : "Sign out"}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </header>
        <main className="dash-content">
          {signoutError && <p role="alert">{signoutError}</p>}
          <Outlet />
        </main>
        <footer className="dash-footer">
          <span>
            Vmail · {zh ? "开源临时邮件服务" : "Open-source temporary email"}
          </span>
          <a
            href="https://github.com/oiov/vmail"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </footer>
      </div>
    </div>
  );
}
