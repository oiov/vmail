import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAccount } from "../components/Account";
import { AdminApiLogs } from "../components/AdminApiLogs";
import { PageTitle } from "./Pages";
export function AdminLogsPage() {
  const { data: a } = useAccount(),
    { i18n } = useTranslation(),
    zh = i18n.language.startsWith("zh"),
    navigate = useNavigate(),
    [search] = useSearchParams();
  if (a?.role !== "admin")
    return (
      <p role="alert">
        {zh ? "此页面仅限管理员访问。" : "Administrator access is required."}
      </p>
    );
  return (
    <>
      <PageTitle
        title={zh ? "调用日志" : "Request logs"}
        description={
          zh
            ? "查看全站 API 请求记录，按用户定位调用情况。"
            : "Inspect API requests across the site and view individual user activity."
        }
      />
      <div className="dashboard-legacy">
        <AdminApiLogs
          key={search.get("user") ?? ""}
          zh={zh}
          selected={search.get("user") ?? ""}
          onSelect={(id) =>
            navigate("/dashboard/admin/users/" + encodeURIComponent(id))
          }
        />
      </div>
    </>
  );
}
