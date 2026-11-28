import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { accountRequest, useAccount } from "../components/Account";
import { PageTitle, QueryState } from "./Pages";
import { Pagination, PageSizeSelect } from "./Pagination";
import type { PageInfo } from "../../../shared/admin";
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
} & (PageInfo | { nextCursor: string | null });
export function OutboundPage({ admin = false }: { admin?: boolean }) {
  const { i18n } = useTranslation(),
    zh = i18n.language.startsWith("zh"),
    { data: account } = useAccount();
  const { id } = useParams(),
    [search, setSearch] = useSearchParams();
  const [filter, setFilter] = useState(search.get("userId") ?? "");
  const userId = search.get("userId") ?? "";
  const requestedPage = Number(search.get("page") ?? 1);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1;
  const requestedSize = Number(search.get("pageSize") ?? 50);
  const pageSize = [20, 50, 100].includes(requestedSize) ? requestedSize : 50;
  const sort = search.get("sort") === "oldest" ? "oldest" : "newest";
  const listQuery = admin
    ? new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sort,
        ...(userId ? { userId } : {}),
      }).toString()
    : search.toString();
  const updateList = (changes: Record<string, string>) =>
    setSearch((previous) => {
      const next = new URLSearchParams(previous);
      next.delete("cursor");
      for (const [key, value] of Object.entries(changes))
        value ? next.set(key, value) : next.delete(key);
      return next;
    });
  useEffect(() => setFilter(userId), [userId]);
  const base = admin ? "/admin/outbound" : "/outbound",
    route = "/dashboard" + base;
  const allowed = !!account && (!admin || account.role === "admin");
  const query = useQuery({
    queryKey: ["outbound", account?.id, admin, id, listQuery],
    queryFn: () =>
      accountRequest<History | { message: Message }>(
        base + (id ? "/" + encodeURIComponent(id) : "?" + listQuery),
      ),
    enabled: allowed,
    retry: false,
    staleTime: 15000,
    placeholderData:
      admin && !id
        ? (previous) =>
            previous && "logs" in previous && "total" in previous
              ? previous
              : undefined
        : undefined,
  });
  const history = query.data && "logs" in query.data ? query.data : undefined;
  const pagination = history && "total" in history ? history : undefined;
  useEffect(() => {
    if (
      !admin ||
      id ||
      !pagination ||
      query.isPlaceholderData ||
      pagination.page === page
    )
      return;
    const currentPage = pagination.page;
    setSearch(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.set("page", String(currentPage));
        return next;
      },
      { replace: true },
    );
  }, [admin, id, pagination, query.isPlaceholderData, page, setSearch]);
  const quota = useQuery({
    queryKey: ["sending-quota", account?.id, admin],
    queryFn: () =>
      accountRequest<{ limit: number; remaining: number }>(
        admin ? "/admin/sending" : "/sending",
      ),
    enabled: allowed && !id,
    retry: false,
  });
  const status = (s: string) =>
    ({
      sent: zh ? "已提交服务商" : "Accepted by provider",
      failed: zh ? "发送失败" : "Failed",
      pending: zh ? "处理中 / 结果待确认" : "Pending / unconfirmed",
    })[s] ?? s;
  if (!allowed) return <p>{zh ? "无权访问此页面。" : "Access denied."}</p>;
  const message =
    query.data && "message" in query.data ? query.data.message : undefined;
  return (
    <>
      <PageTitle
        title={
          id
            ? zh
              ? "发件详情"
              : "Outgoing message"
            : admin
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
            disabled={query.isFetching || quota.isFetching}
            onClick={() => {
              void query.refetch();
              if (!id) void quota.refetch();
            }}
          >
            {zh ? "刷新" : "Refresh"}
          </button>
        }
      />
      <QueryState
        loading={query.isLoading}
        error={query.error || (!id ? quota.error : null)}
      />
      {id ? (
        <>
          <Link className="dash-secondary" to={route + "?" + listQuery}>
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
                  {history
                    ? (
                        history.stats.find((x) => x.status === s)?.count ?? 0
                      ).toLocaleString()
                    : "—"}
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
                updateList({ userId: filter.trim(), page: "1" });
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
              <button className="dash-secondary" disabled={query.isFetching}>
                {zh ? "筛选" : "Filter"}
              </button>
            </form>
          )}
          <div className="dash-panel">
            {admin && (
              <div className="list-toolbar">
                <p role="status">
                  {pagination
                    ? zh
                      ? `共 ${pagination.total.toLocaleString()} 条记录`
                      : `${pagination.total.toLocaleString()} messages`
                    : null}
                </p>
                <div className="list-options">
                  <select
                    aria-label={zh ? "发件排序" : "Outgoing mail sort order"}
                    value={sort}
                    disabled={query.isFetching}
                    onChange={(event) =>
                      updateList({ sort: event.target.value, page: "1" })
                    }
                  >
                    <option value="newest">
                      {zh ? "最新发送" : "Newest first"}
                    </option>
                    <option value="oldest">
                      {zh ? "最早发送" : "Oldest first"}
                    </option>
                  </select>
                  <PageSizeSelect
                    value={pageSize}
                    busy={query.isFetching}
                    onChange={(size) =>
                      updateList({ pageSize: String(size), page: "1" })
                    }
                  />
                </div>
              </div>
            )}
            <div
              className="dash-table-wrap list-table-wrap"
              aria-busy={query.isFetching}
            >
              <table className="dash-table outbound-table">
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
                  {history?.logs.map((m) => (
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
                          to={
                            route +
                            "/" +
                            encodeURIComponent(m.id) +
                            "?" +
                            listQuery
                          }
                        >
                          {zh ? "查看" : "View"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {history && !history.logs.length && (
              <p className="empty-state">
                {zh ? "暂无发件记录" : "No outgoing messages yet"}
              </p>
            )}
            {admin && pagination && (
              <Pagination
                key={sort + userId}
                data={pagination}
                busy={query.isFetching}
                label={zh ? "发件列表分页" : "Outgoing mail pagination"}
                onPageChange={(page) => updateList({ page: String(page) })}
              />
            )}
          </div>
          {!admin && (
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
              {history && "nextCursor" in history && history.nextCursor && (
                <button
                  className="dash-secondary"
                  onClick={() => {
                    const p = new URLSearchParams(search);
                    if (
                      history &&
                      "nextCursor" in history &&
                      history.nextCursor
                    )
                      p.set("cursor", history.nextCursor);
                    setSearch(p);
                  }}
                >
                  {zh ? "下一页" : "Next page"}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}
