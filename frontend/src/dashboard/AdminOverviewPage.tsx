import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { accountRequest, useAccount } from "../components/Account";
import { PageTitle, QueryState } from "./Pages";
import { Icon } from "./Icon";
import type {
  AdminOverview,
  ServiceDay,
  ServiceUsage,
} from "../../../shared/admin";

const format = (value: number) => value.toLocaleString();

export function AdminOverviewPage() {
  const zh = useTranslation().i18n.language.startsWith("zh");
  const { data: account, isLoading } = useAccount();
  const query = useQuery({
    queryKey: ["admin", "overview", account?.id],
    queryFn: () => accountRequest<AdminOverview>("/admin/overview"),
    enabled: account?.role === "admin",
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const [period, setPeriod] = useState(7);
  const [metric, setMetric] =
    useState<keyof Omit<ServiceDay, "date">>("apiCalls");
  if (isLoading) return <QueryState loading />;
  if (account?.role !== "admin")
    return (
      <p role="alert" className="dash-error">
        {zh ? "此页面仅限管理员访问。" : "Administrator access is required."}
      </p>
    );
  const data = query.data;
  const metrics: [keyof ServiceUsage, string][] = [
    ["apiCalls", zh ? "API 调用" : "API calls"],
    ["mailboxesCreated", zh ? "创建邮箱" : "Mailboxes created"],
    ["emailsReceived", zh ? "接收邮件" : "Mail received"],
    ["keysCreated", zh ? "创建 API Key" : "API keys created"],
  ];
  const chartMetrics: [keyof Omit<ServiceDay, "date">, string][] = [
    ...metrics,
    ["registrations", zh ? "新增用户" : "Registrations"],
    ["sent", zh ? "发件已接收" : "Outgoing accepted"],
    ["failed", zh ? "发件失败" : "Outgoing failed"],
  ];
  const series = data?.days.slice(-period) ?? [];
  const maximum = Math.max(1, ...series.map((day) => day[metric]));
  const sum = (key: keyof ServiceUsage, days: number) =>
    data!.days.slice(-days).reduce((total, day) => total + day[key], 0);
  const recoveryCount = (action: string, statuses: string[]) =>
    data!.recoveries
      .filter((row) => row.action === action && statuses.includes(row.status))
      .reduce((total, row) => total + row.count, 0);
  return (
    <>
      <PageTitle
        title={zh ? "管理概览" : "Admin overview"}
        description={
          zh
            ? "全站数据 · UTC 日期，近 7 / 30 天含今日。用量统计约有 5 分钟延迟。"
            : "Site-wide data · UTC dates, including today. Usage statistics may lag by 5 minutes."
        }
        action={
          <button
            className="dash-secondary"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {query.isFetching
              ? zh
                ? "正在刷新…"
                : "Refreshing…"
              : zh
                ? "刷新"
                : "Refresh"}
          </button>
        }
      />
      <QueryState loading={query.isLoading} error={query.error} />
      {data && (
        <>
          <div className="metric-grid">
            {[
              {
                label: zh ? "注册用户" : "Registered users",
                value: data.users.total,
                note: zh
                  ? `今日新增 ${format(data.users.registeredToday)} · 近 30 天 ${format(data.users.registered30Days)}`
                  : `${format(data.users.registeredToday)} new today · ${format(data.users.registered30Days)} in 30 days`,
                icon: "users",
              },
              {
                label: zh ? "未过期邮箱" : "Unexpired mailboxes",
                value: data.mailboxes.active,
                note: zh
                  ? `账号邮箱 ${format(data.mailboxes.activeOwned)} · 匿名 ${format(data.mailboxes.activeAnonymous)}`
                  : `${format(data.mailboxes.activeOwned)} owned · ${format(data.mailboxes.activeAnonymous)} anonymous`,
                icon: "inbox",
              },
              {
                label: zh ? "有效 API Key" : "Active API keys",
                value: data.keys.active,
                note: zh
                  ? "已启用、未过期且账户未封禁"
                  : "Enabled, unexpired, with an unbanned owner",
                icon: "key",
              },
              {
                label: zh ? "当前留存邮件" : "Retained messages",
                value: data.retainedEmails,
                note: zh
                  ? "24 小时有效期内，尚未删除的邮件"
                  : "Undeleted messages within 24-hour retention",
                icon: "mail",
              },
            ].map((card) => (
              <section key={card.icon} className="dash-panel metric">
                <div className="metric-top">
                  <span>{card.label}</span>
                  <span className="metric-icon">
                    <Icon name={card.icon} size={17} />
                  </span>
                </div>
                <p className="metric-value">{format(card.value)}</p>
                <p className="metric-note">{card.note}</p>
              </section>
            ))}
          </div>
          <div className="admin-overview-grid">
            <section className="dash-panel">
              <div className="panel-heading">
                <h2>{zh ? "服务用量" : "Service usage"}</h2>
              </div>
              <div className="dash-table-wrap">
                <table className="dash-table overview-data-table">
                  <thead>
                    <tr>
                      {(zh
                        ? ["指标", "今日", "近 7 天", "近 30 天", "累计"]
                        : ["Metric", "Today", "7 days", "30 days", "All time"]
                      ).map((label) => (
                        <th key={label}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.map(([key, label]) => (
                      <tr key={key}>
                        <td>{label}</td>
                        <td>{format(sum(key, 1))}</td>
                        <td>{format(sum(key, 7))}</td>
                        <td>{format(sum(key, 30))}</td>
                        <td>{format(data.totals[key])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="metric-note">
                {zh
                  ? "含匿名邮箱活动。API 调用指已通过 Key 校验并消耗账号额度的调用；累计从现有计数器读取。"
                  : "Includes anonymous mailbox activity. API calls passed key validation and consumed account quota. All-time values use stored counters."}
              </p>
            </section>
            <section className="dash-panel">
              <div className="panel-heading admin-chart-heading">
                <h2>{zh ? "每日趋势" : "Daily activity"}</h2>
                <div className="list-options">
                  <select
                    aria-label={zh ? "趋势指标" : "Trend metric"}
                    value={metric}
                    onChange={(event) =>
                      setMetric(event.target.value as typeof metric)
                    }
                  >
                    {chartMetrics.map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={zh ? "趋势时间范围" : "Trend period"}
                    value={period}
                    onChange={(event) => setPeriod(Number(event.target.value))}
                  >
                    <option value={7}>{zh ? "近 7 天" : "7 days"}</option>
                    <option value={30}>{zh ? "近 30 天" : "30 days"}</option>
                  </select>
                </div>
              </div>
              <div
                className="admin-usage-chart"
                role="img"
                aria-label={series
                  .map((day) => `${day.date}: ${day[metric]}`)
                  .join(", ")}
              >
                {series.map((day, index) => (
                  <div
                    key={day.date}
                    className="admin-chart-column"
                    title={`${day.date}: ${format(day[metric])}`}
                  >
                    {period === 7 && <span>{format(day[metric])}</span>}
                    <div
                      className="admin-chart-bar"
                      style={{ height: `${(day[metric] / maximum) * 100}%` }}
                    />
                    {(period === 7 ||
                      index % 5 === 0 ||
                      index === series.length - 1) && (
                      <small>{day.date.slice(5)}</small>
                    )}
                  </div>
                ))}
              </div>
              <p className="metric-note">
                {zh ? "所选期间合计" : "Selected period total"}:{" "}
                {format(series.reduce((total, day) => total + day[metric], 0))}
              </p>
            </section>
            <section className="dash-panel">
              <div className="panel-heading">
                <h2>{zh ? "近 30 天发件" : "Outgoing · 30 days"}</h2>
                <Link to="/dashboard/admin/outbound">
                  {zh ? "查看记录 →" : "View messages →"}
                </Link>
              </div>
              <dl className="admin-stat-list">
                {[
                  [zh ? "发件尝试" : "Attempts", data.outgoing.total],
                  [
                    zh ? "服务商已接收" : "Accepted by provider",
                    data.outgoing.sent,
                  ],
                  [zh ? "发送失败" : "Failed", data.outgoing.failed],
                  [
                    zh ? "处理中 / 待确认" : "Pending / unconfirmed",
                    data.outgoing.pending,
                  ],
                  [zh ? "发件用户数" : "Sending users", data.outgoing.senders],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{format(Number(value))}</dd>
                  </div>
                ))}
              </dl>
              {data.outgoing.channels.length > 0 && (
                <div className="dash-table-wrap">
                  <table className="dash-table overview-data-table">
                    <thead>
                      <tr>
                        {(zh
                          ? ["渠道", "已接收", "失败", "待确认"]
                          : ["Channel", "Accepted", "Failed", "Pending"]
                        ).map((label) => (
                          <th key={label}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.outgoing.channels.map((row) => (
                        <tr key={row.channel}>
                          <td>{row.channel}</td>
                          <td>{format(row.sent)}</td>
                          <td>{format(row.failed)}</td>
                          <td>{format(row.pending)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="metric-note">
                {zh
                  ? "记录保留 30 天；服务商接收不代表最终送达。"
                  : "Records are retained for 30 days. Provider acceptance does not confirm delivery."}
              </p>
            </section>
            <section className="dash-panel">
              <div className="panel-heading">
                <h2>{zh ? "近 7 天 API 日志" : "API logs · 7 days"}</h2>
                <Link to="/dashboard/admin/logs">
                  {zh ? "查看日志 →" : "View logs →"}
                </Link>
              </div>
              <dl className="admin-stat-list">
                {[
                  [
                    zh ? "已记录请求" : "Recorded requests",
                    format(data.apiLogs.total),
                  ],
                  [
                    zh ? "成功 / 重定向" : "Success / redirects",
                    format(data.apiLogs.successful),
                  ],
                  [
                    zh ? "客户端错误（4xx）" : "Client errors (4xx)",
                    format(data.apiLogs.clientErrors),
                  ],
                  [
                    zh ? "服务端错误（5xx）" : "Server errors (5xx)",
                    format(data.apiLogs.serverErrors),
                  ],
                  [
                    zh ? "平均处理耗时" : "Mean processing time",
                    data.apiLogs.averageDurationMs === null
                      ? "—"
                      : `${Math.round(data.apiLogs.averageDurationMs)} ms`,
                  ],
                  [
                    zh ? "调用用户数" : "Requesting users",
                    format(data.apiLogs.users),
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="metric-note">
                {zh
                  ? "日志约延迟 1 分钟，保留 7 天；不含鉴权及额度校验拦截，不代表全站请求成功率。"
                  : "Logs may lag by 1 minute and are retained for 7 days. Authentication and quota rejections are excluded; this is not a site-wide success rate."}
              </p>
              {data.apiLogs.routes.length > 0 && (
                <details className="admin-details">
                  <summary>
                    {zh ? "请求最多的接口" : "Most requested routes"}
                  </summary>
                  <div className="dash-table-wrap">
                    <table className="dash-table overview-data-table">
                      <thead>
                        <tr>
                          <th>{zh ? "接口" : "Route"}</th>
                          <th>{zh ? "请求" : "Requests"}</th>
                          <th>{zh ? "错误" : "Errors"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.apiLogs.routes.map((row) => (
                          <tr key={row.method + row.route}>
                            <td>
                              <code>
                                {row.method} {row.route}
                              </code>
                            </td>
                            <td>{format(row.total)}</td>
                            <td>{format(row.errors)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )}
            </section>
            <section className="dash-panel">
              <div className="panel-heading">
                <h2>{zh ? "邮箱域名分布" : "Mailbox domains"}</h2>
                <span className="metric-note">Top 20</span>
              </div>
              {data.domains.length ? (
                <div className="dash-table-wrap">
                  <table className="dash-table overview-data-table">
                    <thead>
                      <tr>
                        {(zh
                          ? ["域名", "保存的邮箱", "未过期"]
                          : ["Domain", "Stored mailboxes", "Unexpired"]
                        ).map((label) => (
                          <th key={label}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.domains.map((row) => (
                        <tr key={row.domain}>
                          <td>{row.domain}</td>
                          <td>{format(row.total)}</td>
                          <td>{format(row.active)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">
                  {zh ? "暂无邮箱" : "No mailboxes yet"}
                </p>
              )}
              <p className="metric-note">
                {zh
                  ? `保存 ${format(data.mailboxes.total)} 个邮箱，其中 ${format(data.mailboxes.expired)} 个已过期或未启用。`
                  : `${format(data.mailboxes.total)} stored mailboxes, including ${format(data.mailboxes.expired)} expired or inactive.`}
              </p>
            </section>
            <section className="dash-panel">
              <div className="panel-heading">
                <h2>{zh ? "今日全站额度" : "Site quotas today"}</h2>
                <span className="metric-note">
                  {zh ? "UTC 零点重置" : "Resets at 00:00 UTC"}
                </span>
              </div>
              <div className="admin-quota-list">
                {(
                  [
                    ["http", zh ? "接口请求预算" : "HTTP request budget"],
                    ["inbound", zh ? "入站邮件预算" : "Inbound mail budget"],
                    [
                      "outbound",
                      zh ? "发件尝试预算" : "Outgoing attempt budget",
                    ],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <div>
                      <span>{label}</span>
                      <strong>
                        {format(data.quotas[key].used)} /{" "}
                        {format(data.quotas[key].limit)}
                      </strong>
                    </div>
                    <progress
                      aria-label={label}
                      value={Math.min(
                        data.quotas[key].used,
                        data.quotas[key].limit,
                      )}
                      max={data.quotas[key].limit}
                    />
                    <small>
                      {zh ? "剩余" : "Remaining"}{" "}
                      {format(data.quotas[key].remaining)}
                    </small>
                  </div>
                ))}
              </div>
              <p className="metric-note">
                {zh
                  ? "接口预算含网页及后台接口；预算消耗不等于业务成功量。HTTP 与入站预算按分片执行，单个分片可能先耗尽。"
                  : "HTTP includes browser and admin endpoints. Budget usage is not a success count. HTTP and inbound budgets are sharded; a shard can exhaust before the total."}
              </p>
            </section>
            <section className="dash-panel admin-span-full">
              <div className="panel-heading">
                <h2>{zh ? "近 30 天用户用量" : "User activity · 30 days"}</h2>
                <span className="metric-note">
                  {zh ? "按 API 调用排序 · Top 10" : "By API calls · Top 10"}
                </span>
              </div>
              {data.topUsers.length ? (
                <div className="dash-table-wrap">
                  <table className="dash-table overview-data-table">
                    <thead>
                      <tr>
                        {(zh
                          ? ["用户", "API 调用", "创建邮箱", "接收邮件"]
                          : [
                              "User",
                              "API calls",
                              "Mailboxes created",
                              "Mail received",
                            ]
                        ).map((label) => (
                          <th key={label}>{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.topUsers.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <Link
                              to={
                                "/dashboard/admin/users/" +
                                encodeURIComponent(row.id)
                              }
                            >
                              {row.name || row.email}
                            </Link>
                          </td>
                          <td>{format(row.apiCalls)}</td>
                          <td>{format(row.mailboxesCreated)}</td>
                          <td>{format(row.emailsReceived)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="empty-state">
                  {zh ? "暂无用户用量" : "No user activity yet"}
                </p>
              )}
            </section>
            <section className="dash-panel">
              <div className="panel-heading">
                <h2>{zh ? "账号与凭证" : "Accounts and credentials"}</h2>
                <Link to="/dashboard/admin/users">
                  {zh ? "管理用户 →" : "Manage users →"}
                </Link>
              </div>
              <dl className="admin-stat-list">
                {[
                  [zh ? "管理员" : "Administrators", data.users.admins],
                  [zh ? "已封禁用户" : "Banned users", data.users.banned],
                  [
                    zh ? "已验证邮箱用户" : "Email-verified users",
                    data.users.verified,
                  ],
                  [
                    zh ? "近 7 天新增用户" : "Registrations · 7 days",
                    data.users.registered7Days,
                  ],
                  [
                    zh
                      ? "近 30 天有使用记录的用户"
                      : "Users with activity · 30 days",
                    data.users.active30Days,
                  ],
                  [zh ? "保存的 API Key" : "Stored API keys", data.keys.total],
                  [zh ? "已禁用 Key" : "Disabled keys", data.keys.disabled],
                  [zh ? "已过期 Key" : "Expired keys", data.keys.expired],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{format(Number(value))}</dd>
                  </div>
                ))}
              </dl>
              <p className="metric-note">
                {zh
                  ? "Key 可同时处于禁用和过期状态；已撤销删除的 Key 不计入当前库存。"
                  : "Keys can be both disabled and expired. Deleted keys are excluded from inventory."}
              </p>
            </section>
            <section className="dash-panel">
              <div className="panel-heading">
                <h2>
                  {zh ? "近 30 天邮箱恢复" : "Mailbox recovery · 30 days"}
                </h2>
              </div>
              <div className="dash-table-wrap">
                <table className="dash-table overview-data-table">
                  <thead>
                    <tr>
                      {(zh
                        ? ["操作", "已完成", "待处理 / 重试", "被拒绝"]
                        : ["Action", "Completed", "Pending / retry", "Rejected"]
                      ).map((label) => (
                        <th key={label}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        ["admin_import", zh ? "管理员补绑" : "Admin import"],
                        [
                          "reactivate",
                          zh ? "用户重新启用" : "User reactivation",
                        ],
                      ] as const
                    ).map(([action, label]) => (
                      <tr key={action}>
                        <td>{label}</td>
                        <td>{format(recoveryCount(action, ["completed"]))}</td>
                        <td>
                          {format(
                            recoveryCount(action, [
                              "pending",
                              "retry_required",
                            ]),
                          )}
                        </td>
                        <td>
                          {format(
                            recoveryCount(action, [
                              "capacity_rejected",
                              "ownership_conflict",
                            ]),
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="metric-note">
                {zh
                  ? "按已写入审计日志的操作统计，不含预检查及写入前被拒绝的请求。"
                  : "Counts audited operations, excluding previews and requests rejected before audit logging."}
              </p>
            </section>
          </div>
          <div className="admin-service-summary">
            <span>Vmail v{data.services.version}</span>
            <span>
              OpenAPI ·{" "}
              {data.services.openApi
                ? zh
                  ? "已开启"
                  : "Enabled"
                : zh
                  ? "已关闭"
                  : "Disabled"}
            </span>
            <span>
              {zh ? "发件" : "Sending"} ·{" "}
              {data.services.outbound
                ? data.services.sendChannel
                : zh
                  ? "未启用"
                  : "Disabled"}
            </span>
            <span>
              Turnstile ·{" "}
              {data.services.turnstile
                ? zh
                  ? "已开启"
                  : "Enabled"
                : zh
                  ? "已关闭"
                  : "Disabled"}
            </span>
            <Link to="/dashboard/admin/settings">
              {zh ? "部署配置 →" : "Deployment →"}
            </Link>
            <span>
              {zh ? "更新于" : "Updated"}{" "}
              {new Date(data.generatedAt).toLocaleTimeString()}
            </span>
          </div>
        </>
      )}
    </>
  );
}
