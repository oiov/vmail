import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAccount, accountRequest } from "../components/Account";
import { PageTitle, QueryState } from "./Pages";
type Settings = {
  version: string;
  checkedAt: string;
  maxApiKeys: number;
  sendChannel: string | null;
  features: { name: string; enabled: boolean }[];
  variables: {
    name: string;
    value: string | null;
    configured: boolean;
    secret: boolean;
    effective: number | null;
  }[];
  bindings: { name: string; configured: boolean }[];
};
const names: Record<string, [string, string]> = {
  openApi: ["开放 API", "Open API"],
  authentication: ["账号登录", "Account sign-in"],
  github: ["GitHub 登录", "GitHub OAuth"],
  google: ["Google 登录", "Google OAuth"],
  turnstile: ["人机验证", "Turnstile"],
  sitePassword: ["站点访问密码", "Site password"],
  mailboxSigning: ["邮箱签名验证", "Mailbox signing"],
  outboundEmail: ["邮件发送", "Outbound email"],
  promotion: ["推广展示", "Promotion"],
  databasePaused: ["数据库紧急暂停", "Database emergency pause"],
};
export function AdminSettingsPage() {
  const { data: account } = useAccount(),
    { i18n } = useTranslation(),
    zh = i18n.language.startsWith("zh");
  const q = useQuery({
    queryKey: ["admin", "settings"],
    enabled: account?.role === "admin",
    queryFn: () => accountRequest<Settings>("/admin/settings"),
    retry: false,
    refetchOnWindowFocus: false,
  });
  if (account?.role !== "admin")
    return (
      <p role="alert">
        {zh ? "此页面仅限管理员访问。" : "Administrator access is required."}
      </p>
    );
  return (
    <>
      <PageTitle
        title={zh ? "部署配置" : "Deployment settings"}
        description={
          zh
            ? "查看当前运行版本、功能开关与环境变量。此页面为只读，配置变更通过部署或 Cloudflare 完成。"
            : "Inspect the running version, features and environment variables. Update configuration through your deployment or Cloudflare."
        }
        action={
          <button
            className="dash-secondary"
            disabled={q.isFetching}
            onClick={() => void q.refetch()}
          >
            {zh ? "刷新配置" : "Refresh"}
          </button>
        }
      />
      <QueryState loading={q.isLoading} error={q.error} />
      {q.data && (
        <>
          <div className="deployment-summary dash-panel">
            <div>
              <span className="metric-note">
                {zh ? "运行版本" : "Running version"}
              </span>
              <h2>Vmail v{q.data.version}</h2>
            </div>
            <div>
              <span className="metric-note">
                {zh ? "每人 Key 上限" : "Keys per account"}
              </span>
              <h2>{q.data.maxApiKeys}</h2>
            </div>
            <div>
              <span className="metric-note">
                {zh ? "发送渠道" : "Send channel"}
              </span>
              <h2>{q.data.sendChannel ?? (zh ? "未启用" : "Disabled")}</h2>
            </div>
            <div>
              <span className="metric-note">{zh ? "读取时间" : "Read at"}</span>
              <p>{new Date(q.data.checkedAt).toLocaleString()}</p>
            </div>
          </div>
          <section className="dash-panel mt-6">
            <div className="panel-heading">
              <h2>{zh ? "功能状态" : "Feature status"}</h2>
            </div>
            <div className="feature-grid">
              {q.data.features.map((f) => (
                <div className="feature-row" key={f.name}>
                  <span>{names[f.name]?.[zh ? 0 : 1] ?? f.name}</span>
                  <span
                    className={"status-badge " + (!f.enabled ? "expired" : "")}
                  >
                    {f.enabled
                      ? zh
                        ? "已开启"
                        : "Enabled"
                      : zh
                        ? "未开启"
                        : "Disabled"}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section className="dash-panel mt-6">
            <div className="panel-heading">
              <h2>{zh ? "环境变量" : "Environment variables"}</h2>
            </div>
            <p className="page-description">
              {zh
                ? "仅列出应用使用的配置项。敏感值不会返回浏览器；数值配置同时展示实际生效值，空值或无效值会使用默认值。"
                : "Only application configuration is listed. Secrets are never returned to the browser. Numeric settings show effective values, including defaults for empty or invalid input."}
            </p>
            <div className="dash-table-wrap">
              <table className="dash-table settings-table">
                <thead>
                  <tr>
                    {(zh
                      ? ["变量名", "当前值 / 状态", "生效值"]
                      : ["Variable", "Value / status", "Effective"]
                    ).map((x) => (
                      <th key={x}>{x}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {q.data.variables.map((v) => (
                    <tr key={v.name}>
                      <td>
                        <code>{v.name}</code>
                      </td>
                      <td>
                        {v.secret ? (
                          <span
                            className={
                              "status-badge " + (!v.configured ? "expired" : "")
                            }
                          >
                            {v.configured
                              ? zh
                                ? "已配置 · 值隐藏"
                                : "Configured · hidden"
                              : zh
                                ? "未配置"
                                : "Not configured"}
                          </span>
                        ) : (
                          <code>{v.value || (zh ? "未设置" : "Not set")}</code>
                        )}
                      </td>
                      <td>{v.effective ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="dash-panel mt-6">
            <div className="panel-heading">
              <h2>{zh ? "服务绑定" : "Service bindings"}</h2>
            </div>
            <div className="feature-grid">
              {q.data.bindings.map((b) => (
                <div className="feature-row" key={b.name}>
                  <code>{b.name}</code>
                  <span
                    className={
                      "status-badge " + (!b.configured ? "expired" : "")
                    }
                  >
                    {b.configured
                      ? zh
                        ? "已绑定"
                        : "Bound"
                      : zh
                        ? "未绑定"
                        : "Not bound"}
                  </span>
                </div>
              ))}
            </div>
            <p className="metric-note mt-4">
              {zh
                ? "绑定存在不代表服务健康；此处不执行额外数据库扫描或服务探测。"
                : "Binding presence does not indicate service health. This page performs no additional database scans or service probes."}
            </p>
          </section>
        </>
      )}
    </>
  );
}
