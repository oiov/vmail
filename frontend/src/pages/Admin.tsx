import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { accountRequest, LoginDialog, useAccount } from "../components/Account";
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: number;
};
type Usage = {
  date: string;
  key_id: string;
  api_calls: number;
  mailboxes_created: number;
  emails_received: number;
};
type Detail = {
  user: User;
  keys: { id: string; name: string; start: string; enabled: number }[];
  usage: Usage[];
  mailboxes: {
    id: string;
    address: string;
    created_at: number;
    expires_at: number;
  }[];
  nextCursor: string | null;
};
export function Admin() {
  const client = useQueryClient();
  const [roleError, setRoleError] = useState(""),
    [roleBusy, setRoleBusy] = useState(false);
  const { data: account, isLoading } = useAccount(),
    { i18n } = useTranslation(),
    zh = i18n.language.startsWith("zh");
  const [login, setLogin] = useState(false),
    [cursor, setCursor] = useState(""),
    [selected, setSelected] = useState(""),
    [mailCursor, setMailCursor] = useState("");
  const users = useQuery({
    queryKey: ["admin", "users", cursor],
    enabled: account?.role === "admin",
    retry: false,
    queryFn: () =>
      accountRequest<{ users: User[]; nextCursor: string | null }>(
        "/admin/users?cursor=" + encodeURIComponent(cursor),
      ),
  });
  const details = useQuery({
    queryKey: ["admin", "user", selected, mailCursor],
    enabled: account?.role === "admin" && !!selected,
    retry: false,
    queryFn: () =>
      accountRequest<Detail>(
        "/admin/users/" +
          encodeURIComponent(selected) +
          "?cursor=" +
          encodeURIComponent(mailCursor),
      ),
  });
  const changeRole = async () => {
    if (!details.data) return;
    setRoleBusy(true);
    setRoleError("");
    try {
      await accountRequest(
        "/admin/users/" + encodeURIComponent(selected) + "/role",
        {
          method: "PATCH",
          body: JSON.stringify({
            role: details.data.user.role === "admin" ? "user" : "admin",
          }),
        },
      );
      await client.invalidateQueries({ queryKey: ["admin"] });
    } catch (e) {
      setRoleError(e instanceof Error ? e.message : "Role update failed");
    } finally {
      setRoleBusy(false);
    }
  };
  const totals = details.data?.usage.reduce(
    (sum, row) => ({
      calls: sum.calls + row.api_calls,
      boxes: sum.boxes + row.mailboxes_created,
      received: sum.received + row.emails_received,
    }),
    { calls: 0, boxes: 0, received: 0 },
  );
  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-20 pt-28 text-white md:px-10">
      <p className="mb-3 text-xs tracking-widest text-cyan-400">
        VMAIL / ADMIN
      </p>
      <h1 className="text-3xl font-semibold">
        {zh ? "用户与 API 使用情况" : "Users and API usage"}
      </h1>
      <p className="mt-3 text-sm text-zinc-400">
        {zh
          ? "查看所有注册用户、API Key 和最近 30 天的使用情况。统计约有 5 分钟延迟。"
          : "Browse registered users, API keys and the last 30 days of usage. Statistics may lag by about 5 minutes."}
      </p>
      {isLoading ? (
        <p className="mt-8">Loading…</p>
      ) : !account ? (
        <button
          className="mt-8 rounded-lg bg-cyan-400 px-5 py-3 text-zinc-950"
          onClick={() => setLogin(true)}
        >
          {zh ? "登录管理员账号" : "Sign in as administrator"}
        </button>
      ) : account.role !== "admin" ? (
        <p role="alert" className="mt-8 text-amber-300">
          {zh ? "此页面仅限管理员访问。" : "Administrator access is required."}
        </p>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <section className="rounded-xl border border-zinc-700 p-4">
            <h2 className="mb-4 font-medium">
              {zh ? "注册用户" : "Registered users"}
            </h2>
            <div className="space-y-2">
              {users.data?.users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    setSelected(user.id);
                    setMailCursor("");
                  }}
                  className={
                    "w-full rounded-lg border p-3 text-left " +
                    (selected === user.id
                      ? "border-cyan-500 bg-cyan-950/30"
                      : "border-zinc-800 hover:bg-zinc-800")
                  }
                >
                  <p className="truncate text-sm">
                    {user.name}{" "}
                    <span className="text-xs text-cyan-300">
                      {user.role === "admin" ? "Admin" : ""}
                    </span>
                  </p>
                  <p className="mt-1 truncate text-xs text-zinc-400">
                    {user.email}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
            {users.data?.users.length === 0 && (
              <p className="text-sm text-zinc-500">
                {zh ? "暂无用户" : "No users yet"}
              </p>
            )}
            <div className="mt-4 flex gap-4 text-sm text-cyan-300">
              {cursor && (
                <button onClick={() => setCursor("")}>
                  {zh ? "首页" : "First page"}
                </button>
              )}
              {users.data?.nextCursor && (
                <button onClick={() => setCursor(users.data!.nextCursor!)}>
                  {zh ? "下一页 →" : "Next page →"}
                </button>
              )}
            </div>
          </section>
          <section className="min-w-0 rounded-xl border border-zinc-700 p-5">
            {details.data ? (
              <>
                <h2 className="text-lg font-semibold">
                  {details.data.user?.name}
                </h2>
                <p className="mb-5 mt-1 text-sm text-zinc-400">
                  {details.data.user?.email}
                </p>
                <div className="mb-7 grid grid-cols-3 gap-3">
                  {[
                    [totals?.calls, zh ? "API 调用" : "API calls"],
                    [totals?.boxes, zh ? "创建邮箱" : "Mailboxes"],
                    [totals?.received, zh ? "接收邮件" : "Received"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-lg bg-zinc-800 p-3">
                      <p className="text-xl font-semibold">
                        {value?.toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">{label}</p>
                    </div>
                  ))}
                </div>
                {details.data.user?.id !== account.id && (
                  <button
                    disabled={roleBusy}
                    onClick={() => void changeRole()}
                    className="mb-5 rounded-lg border border-zinc-600 px-4 py-2 text-sm hover:border-cyan-400 disabled:opacity-40"
                  >
                    {details.data.user?.role === "admin"
                      ? zh
                        ? "取消管理员角色"
                        : "Remove administrator role"
                      : zh
                        ? "设为管理员"
                        : "Make administrator"}
                  </button>
                )}
                {roleError && (
                  <p role="alert" className="mb-4 text-sm text-red-300">
                    {roleError}
                  </p>
                )}
                <h3 className="mb-3 font-medium">API Keys</h3>
                <div className="mb-7 space-y-2">
                  {details.data.keys.map((key) => (
                    <div
                      key={key.id}
                      className="flex justify-between gap-3 rounded-lg bg-zinc-800/60 p-3 text-sm"
                    >
                      <div>
                        <p>{key.name}</p>
                        <p className="text-xs text-zinc-500">{key.start}…</p>
                      </div>
                      <span className="text-cyan-300">
                        {details.data.usage
                          .filter((r) => r.key_id === key.id)
                          .reduce((n, r) => n + r.api_calls, 0)
                          .toLocaleString()}{" "}
                        {zh ? "次" : "calls"}
                      </span>
                    </div>
                  ))}
                </div>
                <h3 className="mb-3 font-medium">
                  {zh
                    ? "每日明细（包含已撤销 Key）"
                    : "Daily usage (including revoked keys)"}
                </h3>
                <div className="mb-7 max-h-64 overflow-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="text-zinc-500">
                      <tr>
                        {["Date", "Key", "API", "Mailboxes", "Received"].map(
                          (x) => (
                            <th className="p-2" key={x}>
                              {x}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {details.data.usage.map((row) => (
                        <tr
                          key={row.date + row.key_id}
                          className="border-t border-zinc-800"
                        >
                          <td className="p-2 whitespace-nowrap">{row.date}</td>
                          <td className="p-2" title={row.key_id}>
                            {row.key_id.slice(0, 8) || "Account"}
                          </td>
                          <td className="p-2">{row.api_calls}</td>
                          <td className="p-2">{row.mailboxes_created}</td>
                          <td className="p-2">{row.emails_received}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <h3 className="mb-3 font-medium">
                  {zh ? "创建的邮箱" : "Created mailboxes"}
                </h3>
                <div className="space-y-2">
                  {details.data.mailboxes.map((box) => (
                    <div
                      key={box.id}
                      className="break-all rounded-lg bg-zinc-800/50 p-3 text-sm"
                    >
                      <p>{box.address}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {new Date(box.created_at * 1000).toLocaleString()} ·{" "}
                        {box.expires_at * 1000 > Date.now()
                          ? zh
                            ? "有效"
                            : "Active"
                          : zh
                            ? "已过期"
                            : "Expired"}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-4 text-sm text-cyan-300">
                  {mailCursor && (
                    <button onClick={() => setMailCursor("")}>
                      {zh ? "首页" : "First page"}
                    </button>
                  )}
                  {details.data.nextCursor && (
                    <button
                      onClick={() => setMailCursor(details.data!.nextCursor!)}
                    >
                      {zh ? "更多邮箱 →" : "More mailboxes →"}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-400">
                {selected
                  ? zh
                    ? "正在加载…"
                    : "Loading…"
                  : zh
                    ? "选择用户查看详细情况。"
                    : "Select a user to inspect their activity."}
              </p>
            )}
          </section>
        </div>
      )}
      {(users.error || details.error) && (
        <p role="alert" className="mt-5 text-sm text-red-300">
          {users.error?.message || details.error?.message}
        </p>
      )}
      <LoginDialog open={login} onClose={() => setLogin(false)} />
    </main>
  );
}
