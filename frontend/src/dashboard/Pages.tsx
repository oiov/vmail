import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { accountRequest, useAccount } from "../components/Account";
import { useConfig } from "../hooks/useConfig";
import { Icon } from "./Icon";
type Box = {
  id: string;
  address: string;
  created_at: number;
  expires_at: number;
};
type Overview = {
  sending: { attempts: number; sent: number };
  days: {
    date: string;
    api_calls: number;
    mailboxes_created: number;
    emails_received: number;
  }[];
  today: string;
  providers: { provider_id: string }[];
  createdAt: number;
};
const useZh = () => useTranslation().i18n.language.startsWith("zh");
function useOverview() {
  const { data: a } = useAccount();
  return useQuery({
    queryKey: ["overview", a?.id],
    queryFn: () => accountRequest<Overview>("/overview"),
    enabled: !!a,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
function useBoxes(cursor = "") {
  const { data: a } = useAccount();
  return useQuery({
    queryKey: ["mailboxes", a?.id, cursor],
    queryFn: () =>
      accountRequest<{ mailboxes: Box[]; nextCursor: string | null }>(
        "/mailboxes?cursor=" + encodeURIComponent(cursor),
      ),
    enabled: !!a,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action}
    </div>
  );
}
export function QueryState({
  loading,
  error,
}: {
  loading?: boolean;
  error?: Error | null;
}) {
  const zh = useZh();
  return error ? (
    <p role="alert" className="dash-error">
      {error.message}
    </p>
  ) : loading ? (
    <p className="page-description" role="status">
      {zh ? "正在加载…" : "Loading…"}
    </p>
  ) : null;
}
function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <Icon name="inbox" size={30} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
function BoxTable({ boxes }: { boxes: Box[] }) {
  const zh = useZh();
  return (
    <div className="dash-table-wrap">
      <table className="dash-table">
        <thead>
          <tr>
            {(zh
              ? ["邮箱地址", "创建时间", "状态", ""]
              : ["Email address", "Created", "Status", ""]
            ).map((s, i) => (
              <th key={i}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {boxes.map((b) => (
            <tr key={b.id}>
              <td>{b.address}</td>
              <td>{new Date(b.created_at * 1000).toLocaleDateString()}</td>
              <td>
                <span
                  className={
                    "status-badge " +
                    (b.expires_at * 1000 < Date.now() ? "expired" : "")
                  }
                >
                  {b.expires_at * 1000 > Date.now()
                    ? zh
                      ? "有效"
                      : "Active"
                    : zh
                      ? "已过期"
                      : "Expired"}
                </span>
              </td>
              <td>
                {b.expires_at * 1000 > Date.now() && (
                  <Link
                    to={
                      "/dashboard/messages?mailbox=" + encodeURIComponent(b.id)
                    }
                  >
                    {zh ? "查看邮件" : "Open inbox"} →
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function OverviewPage() {
  const zh = useZh(),
    { data: a } = useAccount(),
    q = useOverview(),
    boxes = useBoxes(),
    config = useConfig();
  const keys = useQuery({
    queryKey: ["api-keys", a?.id],
    queryFn: () => accountRequest<{ keys: unknown[] }>("/keys"),
    enabled: !!a,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const today = q.data?.days.find((d) => d.date === q.data?.today);
  const series = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 86400000)
      .toISOString()
      .slice(0, 10);
    return {
      date,
      value: q.data?.days.find((d) => d.date === date)?.api_calls ?? 0,
    };
  });
  const max = Math.max(1, ...series.map((x) => x.value));
  return (
    <>
      <PageTitle
        title={zh ? "工作空间概览" : "Workspace overview"}
        description={
          zh
            ? "查看 API 使用情况，管理你的邮箱与访问密钥。"
            : "Monitor API usage and manage your mailboxes and access keys."
        }
        action={
          <Link className="dash-primary" to="/dashboard/keys">
            <Icon name="key" size={16} />
            {zh ? "管理 API Key" : "Manage API keys"}
          </Link>
        }
      />
      <QueryState loading={q.isLoading} error={q.error || keys.error} />
      <div className="metric-grid">
        {[
          [
            zh ? "今日 API 调用" : "API calls today",
            q.data ? (today?.api_calls ?? 0) : "—",
            (zh ? "每日额度 " : "Daily limit ") + config.apiDailyLimit,
            "log",
          ],
          [
            zh ? "有效 API Key" : "Active API keys",
            keys.data?.keys.length ?? "—",
            (zh ? "最多 " : "Up to ") + config.maxApiKeys + " keys",
            "key",
          ],
          [
            zh ? "今日创建邮箱" : "Mailboxes today",
            q.data ? (today?.mailboxes_created ?? 0) : "—",
            (zh ? "每日额度 " : "Daily limit ") + config.mailboxDailyLimit,
            "inbox",
          ],
          [
            zh ? "今日接收邮件" : "Messages today",
            q.data ? (today?.emails_received ?? 0) : "—",
            zh ? "按 UTC 日期统计" : "Reported by UTC date",
            "mail",
          ],
        ].map(([label, value, note, icon]) => (
          <section className="dash-panel metric" key={label}>
            <div className="metric-top">
              <span>{label}</span>
              <span className="metric-icon">
                <Icon name={String(icon)} size={17} />
              </span>
            </div>
            <p className="metric-value">{value}</p>
            <p className="metric-note">{note}</p>
          </section>
        ))}
      </div>
      <section className="dash-panel outbound-overview">
        <div>
          <strong>
            {zh ? "今日发件" : "Outgoing today"}:{" "}
            {q.data?.sending.attempts ?? 0}
          </strong>
          <p className="metric-note">
            {zh ? "服务商已接收" : "Accepted by provider"}:{" "}
            {q.data?.sending.sent ?? 0}
          </p>
        </div>
        <Link className="dash-secondary" to="/dashboard/outbound">
          {zh ? "查看发件记录与额度" : "View history and quota"}
        </Link>
      </section>
      <div className="overview-grid">
        <section className="dash-panel">
          <div className="panel-heading">
            <h2>{zh ? "API 调用趋势" : "API activity"}</h2>
            <span className="status-badge">
              {zh ? "最近 7 天" : "Last 7 days"}
            </span>
          </div>
          <div
            className="usage-chart"
            role="img"
            aria-label={series.map((s) => s.date + ": " + s.value).join(", ")}
          >
            {series.map((s) => (
              <div
                className="chart-column"
                key={s.date}
                title={s.date + ": " + s.value}
              >
                <span className="chart-value">{s.value}</span>
                <div
                  className="chart-bar"
                  style={{ height: (s.value / max) * 100 + "%" }}
                />
                <small>{s.date.slice(5)}</small>
              </div>
            ))}
          </div>
          <p className="metric-note">
            {zh
              ? "统计约有 5 分钟延迟，按账号共享额度计算。"
              : "Statistics may lag by 5 minutes. Quotas are shared across your account."}
          </p>
        </section>
        <section className="dash-panel">
          <div className="panel-heading">
            <h2>{zh ? "开始接入" : "Start building"}</h2>
            <Icon name="arrow" size={17} />
          </div>
          <div className="quick-links">
            {[
              [
                "key",
                "/dashboard/keys",
                zh ? "创建访问密钥" : "Create an API key",
                zh
                  ? "每个账号最多 3 个有效 Key"
                  : "Up to 3 active keys per account",
              ],
              [
                "book",
                "/api-docs",
                zh ? "阅读 API 文档" : "Read the documentation",
                zh
                  ? "接口参数、响应与代码示例"
                  : "Endpoints, responses and examples",
              ],
              [
                "inbox",
                "/dashboard/mailboxes",
                zh ? "管理临时邮箱" : "Manage your mailboxes",
                zh
                  ? "查看登录后创建的邮箱"
                  : "Access mailboxes created while signed in",
              ],
            ].map(([icon, to, title, desc]) => (
              <Link to={to} key={to}>
                <Icon name={icon} />
                <span>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </span>
                <Icon name="chevron" size={14} />
              </Link>
            ))}
          </div>
        </section>
      </div>
      <section className="dash-panel mt-6">
        <div className="panel-heading">
          <h2>{zh ? "我的邮箱" : "My mailboxes"}</h2>
          <Link to="/dashboard/mailboxes">
            {zh ? "查看全部" : "View all"} →
          </Link>
        </div>
        <QueryState loading={boxes.isLoading} error={boxes.error} />
        {boxes.data?.mailboxes.length ? (
          <BoxTable boxes={boxes.data.mailboxes.slice(0, 5)} />
        ) : (
          boxes.data && (
            <Empty
              title={zh ? "还没有邮箱" : "No mailboxes yet"}
              description={
                zh
                  ? "登录后创建的邮箱会显示在这里。"
                  : "Mailboxes created while signed in appear here."
              }
              action={
                <Link className="dash-secondary" to="/dashboard/mailboxes">
                  {zh ? "创建邮箱" : "Create mailbox"}
                </Link>
              }
            />
          )
        )}
      </section>
    </>
  );
}
export function AccountPage() {
  const zh = useZh(),
    { data: a } = useAccount(),
    q = useOverview();
  return (
    <>
      <PageTitle
        title={zh ? "账户信息" : "Account"}
        description={
          zh
            ? "查看你的个人资料、登录方式和账号权限。"
            : "Your profile, sign-in methods and account permissions."
        }
      />
      <QueryState loading={q.isLoading} error={q.error} />
      <div className="account-grid">
        <section className="dash-panel">
          <div className="account-profile">
            <span className="dash-avatar">
              {a?.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <h2>{a?.name}</h2>
              <p className="metric-note">{a?.email}</p>
            </div>
          </div>
          <dl className="account-fields">
            {[
              [zh ? "显示名称" : "Name", a?.name],
              [zh ? "电子邮箱" : "Email", a?.email],
              [zh ? "账号 ID" : "Account ID", a?.id],
              [
                zh ? "角色" : "Role",
                a?.role === "admin"
                  ? zh
                    ? "管理员"
                    : "Administrator"
                  : zh
                    ? "普通用户"
                    : "User",
              ],
              [
                zh ? "注册时间" : "Joined",
                q.data ? new Date(q.data.createdAt).toLocaleString() : "—",
              ],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="dash-panel">
          <h2>{zh ? "登录方式" : "Sign-in methods"}</h2>
          <p className="page-description">
            {zh
              ? "已关联到当前账号的身份提供商。"
              : "Identity providers linked to your account."}
          </p>
          {q.data?.providers.map((p) => (
            <div className="provider-row" key={p.provider_id}>
              <img
                width="22"
                height="22"
                src={
                  p.provider_id === "github"
                    ? "/brand/github.svg"
                    : "/brand/google.png"
                }
                className={p.provider_id === "github" ? "invert" : ""}
                alt=""
              />
              <strong>
                {p.provider_id === "github"
                  ? "GitHub"
                  : p.provider_id === "google"
                    ? "Google"
                    : p.provider_id}
              </strong>
              <span className="status-badge">
                {zh ? "已关联" : "Connected"}
              </span>
            </div>
          ))}
          <p className="page-description">
            {zh
              ? "API Key 与网页登录会话独立管理，可在 API Key 页面单独撤销。"
              : "API keys are managed separately from your browser session. Revoke them on the API keys page."}
          </p>
        </section>
      </div>
    </>
  );
}
export function MailboxesPage() {
  const zh = useZh(),
    [cursor, setCursor] = useState(""),
    q = useBoxes(cursor),
    config = useConfig(),
    client = useQueryClient();
  const [creating, setCreating] = useState(false),
    [domain, setDomain] = useState(config.emailDomain[0] ?? ""),
    [token, setToken] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const captcha = useRef<TurnstileInstance>(null);
  async function create() {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain, token }),
      });
      const d = await r.json();
      if (!r.ok || !d.success)
        throw new Error(
          d.error?.message ?? d.message ?? "Unable to create mailbox",
        );
      setCursor("");
      setCreating(false);
      await client.invalidateQueries({ queryKey: ["mailboxes"] });
      await client.invalidateQueries({ queryKey: ["overview"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
      setToken("");
      captcha.current?.reset();
    }
  }
  return (
    <>
      <PageTitle
        title={zh ? "我的邮箱" : "Mailboxes"}
        description={
          zh
            ? "管理通过当前账号或 API Key 创建的临时邮箱。匿名创建的邮箱不会自动归入账号。"
            : "Mailboxes created with your account or API keys. Anonymous mailboxes are not automatically linked."
        }
        action={
          <button
            className="dash-primary"
            onClick={() => setCreating(!creating)}
          >
            + {zh ? "创建邮箱" : "Create mailbox"}
          </button>
        }
      />
      {creating && (
        <section className="dash-panel mb-6">
          <h2>{zh ? "创建临时邮箱" : "Create a temporary mailbox"}</h2>
          <p className="page-description">
            {zh
              ? "系统随机生成地址，与账号共享每日创建额度。"
              : "A random address is generated and counts toward your daily mailbox quota."}
          </p>
          <div className="mail-toolbar">
            <label htmlFor="mail-domain">{zh ? "域名" : "Domain"}</label>
            <select
              id="mail-domain"
              className="dash-select"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            >
              {config.emailDomain.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
            <button
              className="dash-primary"
              disabled={busy || !domain || (config.turnstileEnabled && !token)}
              onClick={() => void create()}
            >
              {busy
                ? zh
                  ? "创建中…"
                  : "Creating…"
                : zh
                  ? "确认创建"
                  : "Create"}
            </button>
          </div>
          {config.turnstileEnabled && (
            <Turnstile
              ref={captcha}
              siteKey={config.turnstileKey}
              onSuccess={setToken}
              onExpire={() => setToken("")}
              onError={() => setToken("")}
              options={{ theme: "light" }}
            />
          )}
          {error && (
            <p role="alert" className="dash-error">
              {error}
            </p>
          )}
        </section>
      )}
      <section className="dash-panel">
        <QueryState loading={q.isLoading} error={q.error} />
        {q.data?.mailboxes.length ? (
          <BoxTable boxes={q.data.mailboxes} />
        ) : (
          q.data && (
            <Empty
              title={zh ? "还没有邮箱" : "No mailboxes yet"}
              description={
                zh
                  ? "创建一个邮箱，即可在控制台接收和查看邮件。"
                  : "Create a mailbox to receive and read messages in your dashboard."
              }
            />
          )
        )}
        <div className="dash-pagination">
          {cursor && (
            <button onClick={() => setCursor("")}>
              {zh ? "返回首页" : "First page"}
            </button>
          )}
          {q.data?.nextCursor && (
            <button onClick={() => setCursor(q.data!.nextCursor!)}>
              {zh ? "下一页" : "Next page"} →
            </button>
          )}
        </div>
      </section>
    </>
  );
}
type Summary = {
  id: string;
  from: { name?: string; address?: string };
  subject: string;
  receivedAt: string;
  preview: string;
};
export function MessagesPage() {
  const zh = useZh(),
    [search, setSearch] = useSearchParams(),
    box = search.get("mailbox") ?? "",
    cursor = search.get("cursor") ?? "",
    boxes = useBoxes();
  const { data: a } = useAccount();
  const q = useQuery({
    queryKey: ["messages", a?.id, box, cursor],
    enabled: !!box,
    queryFn: () =>
      accountRequest<{
        data: Summary[];
        pagination: { nextCursor: string | null };
      }>(
        "/mailboxes/" +
          encodeURIComponent(box) +
          "/messages?cursor=" +
          encodeURIComponent(cursor),
      ),
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  return (
    <>
      <PageTitle
        title={zh ? "邮件" : "Messages"}
        description={
          zh
            ? "按邮箱查看收到的邮件，选择一封邮件查看完整内容。"
            : "Browse received messages by mailbox and open a message to read it."
        }
      />
      <div className="mail-toolbar">
        <label htmlFor="inbox-select">{zh ? "邮箱" : "Mailbox"}</label>
        <select
          id="inbox-select"
          className="dash-select"
          value={box}
          onChange={(e) =>
            setSearch(e.target.value ? { mailbox: e.target.value } : {})
          }
        >
          <option value="">{zh ? "选择邮箱" : "Select a mailbox"}</option>
          {box && !boxes.data?.mailboxes.some((b) => b.id === box) && (
            <option value={box}>{box}</option>
          )}
          {boxes.data?.mailboxes
            .filter((b) => b.expires_at * 1000 > Date.now())
            .map((b) => (
              <option value={b.id} key={b.id}>
                {b.address}
              </option>
            ))}
        </select>
        <Link className="text-action" to="/dashboard/mailboxes">
          {zh ? "所有邮箱" : "All mailboxes"} →
        </Link>
        {box && (
          <button
            className="dash-secondary"
            disabled={q.isFetching}
            onClick={() => void q.refetch()}
          >
            {zh ? "刷新" : "Refresh"}
          </button>
        )}
      </div>
      <QueryState error={boxes.error} />
      <section className="dash-panel">
        {!box ? (
          <Empty
            title={zh ? "选择一个邮箱" : "Select a mailbox"}
            description={
              zh
                ? "从上方选择邮箱，或在“我的邮箱”中打开收件箱。"
                : "Choose a mailbox above or open an inbox from Mailboxes."
            }
          />
        ) : (
          <>
            <QueryState loading={q.isLoading} error={q.error} />
            {q.data?.data.length ? (
              <div className="dash-table-wrap">
                <table className="dash-table">
                  <thead>
                    <tr>
                      {(zh
                        ? ["发件人", "主题", "收到时间"]
                        : ["From", "Subject", "Received"]
                      ).map((s) => (
                        <th key={s}>{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {q.data.data.map((m) => (
                      <tr key={m.id}>
                        <td>{m.from?.name || m.from?.address}</td>
                        <td>
                          <Link
                            to={
                              "/dashboard/messages/" +
                              encodeURIComponent(box) +
                              "/" +
                              encodeURIComponent(m.id)
                            }
                          >
                            {m.subject || (zh ? "无主题" : "No subject")}
                          </Link>
                          <p className="message-preview">{m.preview}</p>
                        </td>
                        <td className="whitespace-nowrap">
                          {new Date(m.receivedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              q.data && (
                <Empty
                  title={zh ? "暂无邮件" : "No messages yet"}
                  description={
                    zh
                      ? "收到的新邮件会显示在这里。"
                      : "New messages will appear here when they arrive."
                  }
                />
              )
            )}
            <div className="dash-pagination">
              {cursor && (
                <button onClick={() => setSearch({ mailbox: box })}>
                  {zh ? "返回首页" : "First page"}
                </button>
              )}
              {q.data?.pagination.nextCursor && (
                <button
                  onClick={() =>
                    setSearch({
                      mailbox: box,
                      cursor: q.data!.pagination.nextCursor!,
                    })
                  }
                >
                  {zh ? "下一页" : "Next page"} →
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </>
  );
}
export function MessagePage() {
  const zh = useZh(),
    { mailboxId = "", messageId = "" } = useParams(),
    navigate = useNavigate(),
    client = useQueryClient(),
    { data: a } = useAccount();
  const path =
    "/mailboxes/" +
    encodeURIComponent(mailboxId) +
    "/messages/" +
    encodeURIComponent(messageId);
  const [html, setHtml] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["message", a?.id, mailboxId, messageId],
    queryFn: () =>
      accountRequest<{
        data: {
          subject: string;
          from: { address: string; name?: string };
          text: string;
          html: string;
          createdAt: string;
        };
      }>(path),
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  async function remove() {
    setBusy(true);
    try {
      await accountRequest(path, { method: "DELETE" });
      client.removeQueries({
        queryKey: ["message", a?.id, mailboxId, messageId],
      });
      await client.invalidateQueries({ queryKey: ["messages"] });
      navigate("/dashboard/messages?mailbox=" + encodeURIComponent(mailboxId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link
        className="text-action"
        to={"/dashboard/messages?mailbox=" + encodeURIComponent(mailboxId)}
      >
        ← {zh ? "返回收件箱" : "Back to inbox"}
      </Link>
      <div className="mt-6">
        <PageTitle
          title={q.data?.data.subject || (zh ? "邮件详情" : "Message")}
          description={
            q.data
              ? (q.data.data.from?.address ?? "") +
                " · " +
                new Date(q.data.data.createdAt).toLocaleString()
              : ""
          }
          action={
            q.data && (
              <button
                className="dash-secondary"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      zh
                        ? "永久删除这封邮件？"
                        : "Permanently delete this message?",
                    )
                  )
                    void remove();
                }}
              >
                {zh ? "删除邮件" : "Delete message"}
              </button>
            )
          }
        />
      </div>
      <QueryState loading={q.isLoading} error={q.error} />
      {error && (
        <p role="alert" className="dash-error">
          {error}
        </p>
      )}
      {q.data && (
        <section className="dash-panel">
          <div className="mail-toolbar">
            <button
              className={!html ? "dash-primary" : "dash-secondary"}
              onClick={() => setHtml(false)}
            >
              {zh ? "纯文本" : "Plain text"}
            </button>
            {q.data.data.html && (
              <button
                className={html ? "dash-primary" : "dash-secondary"}
                onClick={() => setHtml(true)}
              >
                HTML
              </button>
            )}
          </div>
          {html ? (
            <iframe
              className="mail-frame"
              title={zh ? "邮件内容" : "Message content"}
              sandbox=""
              referrerPolicy="no-referrer"
              srcDoc={
                '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; img-src data:; font-src data:">' +
                q.data.data.html
              }
            />
          ) : (
            <div className="mail-body">
              {q.data.data.text ||
                (zh
                  ? "此邮件没有纯文本内容，可切换到 HTML 查看。"
                  : "No plain text content. Switch to HTML to view this message.")}
            </div>
          )}
        </section>
      )}
    </>
  );
}
