import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { accountRequest, useAccount } from "../components/Account";
import { PageTitle, QueryState } from "./Pages";
type Message = {
  id: string;
  created_at: number;
  user_id: string;
  mailbox: string;
  recipient: string;
  channel: string;
  status: string;
  subject: string;
  content: string;
  content_type: string;
  sender_name: string;
};
type History = {
  logs: Message[];
  stats: { status: string; count: number }[];
  nextCursor: string | null;
};
export function OutboundPage({ admin = false }: { admin?: boolean }) {
  const { i18n } = useTranslation(),
    zh = i18n.language.startsWith("zh"),
    { data: account } = useAccount();
  const { id } = useParams(),
    [search, setSearch] = useSearchParams();
  const [filter, setFilter] = useState(search.get("userId") ?? "");
  const base = admin ? "/admin/outbound" : "/outbound",
    route = "/dashboard" + base;
  const allowed = !!account && (!admin || account.role === "admin");
  const query = useQuery({
    queryKey: ["outbound", account?.id, admin, id, search.toString()],
    queryFn: () =>
      accountRequest<History & { message: Message }>(
        base + (id ? "/" + encodeURIComponent(id) : "?" + search.toString()),
      ),
    enabled: allowed,
    retry: false,
    staleTime: 15000,
  });
  const quota = useQuery({
    queryKey: ["sending-quota", account?.id, admin],
    queryFn: () =>
      accountRequest<{ limit: number; remaining: number }>(
        admin ? "/admin/sending" : "/sending",
      ),
    enabled: allowed,
    retry: false,
  });
  const status = (s: string) =>
    ({
      sent: zh ? "已提交服务商" : "Accepted by provider",
      failed: zh ? "发送失败" : "Failed",
      pending: zh ? "处理中 / 结果待确认" : "Pending / unconfirmed",
    })[s] ?? s;
  if (!allowed) return <p>{zh ? "无权访问此页面。" : "Access denied."}</p>;
  const message = query.data?.message;
  return (
    <>
      <PageTitle
        title={
          admin
            ? zh
              ? "发件管理"
              : "Outgoing mail"
            : zh
              ? "发件记录"
              : "Sent mail"
        }
        description={
          zh
            ? "查看发送内容与结果，记录保留 30 天。成功表示服务商已接收，不代表最终送达。"
            : "Review content and results retained for 30 days. Accepted messages are not necessarily delivered."
        }
        action={
          <button
            className="dash-secondary"
            onClick={() => {
              void query.refetch();
              void quota.refetch();
            }}
          >
            {zh ? "刷新" : "Refresh"}
          </button>
        }
      />
      <QueryState loading={query.isLoading} error={query.error} />
      {id ? (
        <>
          <Link className="dash-secondary" to={route + "?" + search.toString()}>
            {zh ? "返回发件列表" : "Back to sent mail"}
          </Link>
          {message && (
            <section className="dash-panel outbound-detail">
              <h2>{message.subject}</h2>
              <dl>
                <dt>{zh ? "发件人" : "Sender"}</dt>
                <dd>
                  {message.sender_name} &lt;{message.mailbox}&gt;
                </dd>
                <dt>{zh ? "收件人" : "Recipient"}</dt>
                <dd>{message.recipient}</dd>
                <dt>{zh ? "用户" : "User"}</dt>
                <dd>
                  {admin ? (
                    <Link to={"/dashboard/admin/users/" + message.user_id}>
                      {message.user_id}
                    </Link>
                  ) : (
                    message.user_id
                  )}
                </dd>
                <dt>{zh ? "时间 / 结果" : "Time / result"}</dt>
                <dd>
                  {new Date(message.created_at).toLocaleString()} ·{" "}
                  {status(message.status)}
                </dd>
              </dl>
              {message.content_type === "text/html" ? (
                <iframe
                  title={zh ? "邮件正文" : "Email body"}
                  sandbox=""
                  referrerPolicy="no-referrer"
                  srcDoc={
                    "<!doctype html><meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src 'unsafe-inline'; img-src data:; form-action 'none'; base-uri 'none'\"><style>body{font:15px/1.6 system-ui;padding:16px;overflow-wrap:anywhere}img{max-width:100%}</style>" +
                    message.content
                  }
                />
              ) : (
                <pre>{message.content}</pre>
              )}
            </section>
          )}
        </>
      ) : (
        <>
          <div className="metric-grid">
            {["sent", "failed", "pending"].map((s) => (
              <section className="dash-panel metric" key={s}>
                <span>{status(s)}</span>
                <p className="metric-value">
                  {query.data?.stats.find((x) => x.status === s)?.count ?? 0}
                </p>
                <p className="metric-note">
                  {zh ? "最近 30 天" : "Last 30 days"}
                </p>
              </section>
            ))}
            {
              <section className="dash-panel metric">
                <span>
                  {admin
                    ? zh
                      ? "全站今日剩余额度"
                      : "Site quota remaining"
                    : zh
                      ? "今日剩余额度"
                      : "Remaining today"}
                </span>
                <p className="metric-value">
                  {quota.data?.remaining ?? "—"}
                  <small> / {quota.data?.limit ?? "—"}</small>
                </p>
                <p className="metric-note">
                  {zh
                    ? "UTC 零点重置，失败尝试也计入"
                    : "Resets at 00:00 UTC; failed attempts count"}
                </p>
              </section>
            }
          </div>
          {admin && (
            <form
              className="outbound-filter"
              onSubmit={(e) => {
                e.preventDefault();
                setSearch(filter ? { userId: filter } : {});
              }}
            >
              <label>
                {zh ? "按用户 ID 筛选" : "Filter by user ID"}
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder={
                    zh ? "留空查看全部用户" : "Leave empty for all users"
                  }
                />
              </label>
              <button className="dash-secondary">
                {zh ? "筛选" : "Filter"}
              </button>
            </form>
          )}
          <div className="dash-panel dash-table-wrap">
            <table className="dash-table">
              <thead>
                <tr>
                  {(zh
                    ? ["主题 / 发件邮箱", "收件人", "结果", "时间", ""]
                    : ["Subject / mailbox", "Recipient", "Result", "Time", ""]
                  ).map((x, i) => (
                    <th key={i}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.data?.logs.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.subject}</strong>
                      <br />
                      <span>{m.mailbox}</span>
                      {admin && (
                        <>
                          <br />
                          <Link to={"/dashboard/admin/users/" + m.user_id}>
                            {m.user_id}
                          </Link>
                        </>
                      )}
                    </td>
                    <td>{m.recipient}</td>
                    <td>{status(m.status)}</td>
                    <td>{new Date(m.created_at).toLocaleString()}</td>
                    <td>
                      <Link
                        className="dash-secondary"
                        to={route + "/" + m.id + "?" + search.toString()}
                      >
                        {zh ? "查看" : "View"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {query.data && !query.data.logs.length && (
              <p className="empty-state">
                {zh ? "暂无发件记录" : "No outgoing messages yet"}
              </p>
            )}
          </div>
          <div className="outbound-pagination">
            {search.has("cursor") && (
              <button
                className="dash-secondary"
                onClick={() => {
                  const p = new URLSearchParams(search);
                  p.delete("cursor");
                  setSearch(p);
                }}
              >
                {zh ? "返回首页" : "First page"}
              </button>
            )}
            {query.data?.nextCursor && (
              <button
                className="dash-secondary"
                onClick={() => {
                  const p = new URLSearchParams(search);
                  p.set("cursor", query.data!.nextCursor!);
                  setSearch(p);
                }}
              >
                {zh ? "下一页" : "Next page"}
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
