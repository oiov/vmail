import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { accountRequest } from "./Account";
type Log = {
  id: string;
  created_at: number;
  user_id: string;
  key_id: string;
  method: string;
  route: string;
  status: number;
  duration_ms: number;
  user: { name: string; email: string } | null;
};
export function AdminApiLogs({
  zh,
  selected,
  onSelect,
}: {
  zh: boolean;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const [cursor, setCursor] = useState(""),
    [owner, setOwner] = useState("");
  const logs = useQuery({
    queryKey: ["admin", "logs", owner, cursor],
    retry: false,
    queryFn: () =>
      accountRequest<{ logs: Log[]; nextCursor: string | null }>(
        "/admin/logs?userId=" +
          encodeURIComponent(owner) +
          "&cursor=" +
          encodeURIComponent(cursor),
      ),
  });
  return (
    <section
      className="mt-8 min-w-0 rounded-xl border border-zinc-700 p-5"
      aria-labelledby="api-logs-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="api-logs-title" className="text-xl font-semibold">
          {zh ? "全站 API 调用日志" : "Site-wide API request logs"}
        </h2>
        <button
          disabled={logs.isFetching}
          onClick={() => void logs.refetch()}
          className="rounded-lg border border-zinc-600 px-3 py-2 text-sm disabled:opacity-40"
        >
          {zh ? "刷新" : "Refresh"}
        </button>
      </div>
      <p className="my-3 text-sm leading-6 text-zinc-400">
        {zh
          ? "保留最近 7 天，通常延迟约 1 分钟。记录通过 Key 鉴权和额度检查后的请求，包含业务错误；无效 Key、封禁和限流拦截不逐条记录。异常积压时日志可能丢失。"
          : "Retained for 7 days, typically delayed by about 1 minute. Includes requests passing key and quota checks, including business errors. Invalid keys, bans and quota rejections are not logged individually. Logs may be dropped during prolonged backlogs."}
      </p>
      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <button
          onClick={() => {
            setOwner("");
            setCursor("");
          }}
          className={owner ? "text-zinc-400" : "text-cyan-300"}
        >
          {zh ? "全部用户" : "All users"}
        </button>
        <button
          disabled={!selected}
          onClick={() => {
            setOwner(selected);
            setCursor("");
          }}
          className="text-cyan-300 disabled:opacity-30"
        >
          {zh ? "仅当前选中用户" : "Selected user only"}
        </button>
        {owner && (
          <span className="break-all text-xs text-zinc-500">{owner}</span>
        )}
      </div>
      {logs.error && (
        <p role="alert" className="mb-3 text-red-300">
          {logs.error.message}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-zinc-400">
            <tr>
              {(zh
                ? ["时间", "用户", "Key ID", "接口", "状态码", "耗时"]
                : ["Time", "User", "Key ID", "Endpoint", "Status", "Duration"]
              ).map((x) => (
                <th key={x} className="p-3">
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.data?.logs.map((row) => (
              <tr key={row.id} className="border-t border-zinc-800">
                <td className="whitespace-nowrap p-3">
                  {new Date(row.created_at).toLocaleString()}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => onSelect(row.user_id)}
                    className="text-left text-cyan-300"
                  >
                    <span className="block">
                      {row.user?.name ?? row.user_id}
                    </span>
                    <span className="text-zinc-400">{row.user?.email}</span>
                  </button>
                </td>
                <td className="p-3 font-mono" title={row.key_id}>
                  {row.key_id.slice(0, 10)}…
                </td>
                <td className="whitespace-nowrap p-3 font-mono">
                  {row.method} {row.route}
                </td>
                <td
                  className={
                    "p-3 " +
                    (row.status >= 400 ? "text-amber-300" : "text-emerald-300")
                  }
                >
                  {row.status}
                </td>
                <td className="whitespace-nowrap p-3">{row.duration_ms} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {logs.isLoading ? (
        <p className="py-5 text-zinc-400">{zh ? "正在加载…" : "Loading…"}</p>
      ) : (
        logs.data?.logs.length === 0 && (
          <p className="py-5 text-zinc-400">
            {zh
              ? "暂无符合条件的日志，新请求稍后显示。"
              : "No matching logs. New requests will appear shortly."}
          </p>
        )
      )}
      <div className="mt-4 flex gap-4 text-sm text-cyan-300">
        {cursor && (
          <button onClick={() => setCursor("")}>
            {zh ? "最新记录" : "Latest"}
          </button>
        )}
        {logs.data?.nextCursor && (
          <button onClick={() => setCursor(logs.data!.nextCursor!)}>
            {zh ? "下一页 →" : "Next page →"}
          </button>
        )}
      </div>
    </section>
  );
}
