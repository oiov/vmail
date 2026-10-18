import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConfig } from "../hooks/useConfig";
import { ApiReference } from "../components/ApiReference";
import { CopyButton } from "../components/CopyButton";
import { LoginDialog, useAccount } from "../components/Account";
export function ApiDocs() {
  const config = useConfig(),
    { i18n } = useTranslation(),
    zh = i18n.language.startsWith("zh");
  const { data: account } = useAccount();
  const [login, setLogin] = useState(false);
  const sample =
    'curl -X POST "' +
    window.location.origin +
    '/api/v1/mailboxes" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d \'{}\'';
  const endpoints = [
    [
      "POST",
      "/mailboxes",
      zh
        ? "创建邮箱，默认有效期 24 小时"
        : "Create a mailbox; expires after 24 hours by default",
    ],
    ["GET", "/mailboxes/:id", zh ? "读取邮箱信息" : "Get mailbox information"],
    [
      "GET",
      "/mailboxes/:id/messages?limit=20&cursor=…",
      zh
        ? "读取邮件摘要，游标分页"
        : "List message summaries with cursor pagination",
    ],
    [
      "GET",
      "/mailboxes/:id/messages/:messageId",
      zh ? "读取邮件正文" : "Read the full message",
    ],
    [
      "DELETE",
      "/mailboxes/:id/messages/:messageId",
      zh ? "删除邮件" : "Delete a message",
    ],
  ];
  return (
    <main className="public-docs mx-auto w-full max-w-5xl px-5 pb-20 pt-28 text-white md:px-10">
      <div className="mb-10">
        <h1 className="text-4xl font-semibold">
          {zh ? "API 文档" : "API documentation"}
        </h1>
        <p className="my-4 text-zinc-400">
          {zh
            ? "通过 REST API 创建临时邮箱、查询邮件列表、读取和删除邮件。"
            : "Create mailboxes, list messages, and read or delete email through the REST API."}
        </p>
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-700 p-5">
          <p className="flex-1 text-sm text-zinc-400">
            {zh
              ? "登录后可免费创建 API Key，每个账号最多 3 个。"
              : "Sign in to create up to 3 free API keys."}
          </p>
          {account ? (
            <Link
              to="/dashboard/keys"
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950"
            >
              {zh ? "管理 API Key" : "Manage API keys"}
            </Link>
          ) : (
            <button
              onClick={() => setLogin(true)}
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-zinc-950"
            >
              {zh ? "登录获取 API Key" : "Sign in for API keys"}
            </button>
          )}
        </div>
      </div>{" "}
      <section className="space-y-6">
        <div className="rounded-xl border border-zinc-700 p-5 text-sm leading-7 text-zinc-400">
          <p>
            Base URL:{" "}
            <code className="break-all text-cyan-200">
              {window.location.origin}/api/v1
            </code>
          </p>
          <p>
            {zh ? "可用邮箱域名：" : "Available email domains: "}
            {config.emailDomain?.join(", ")}
          </p>
          <p>Content-Type: application/json</p>
        </div>
        <h2 className="text-2xl font-semibold">
          {zh ? "快速开始" : "Quick start"}
        </h2>
        <p className="text-sm leading-6 text-zinc-400">
          {zh
            ? "通过 Authorization: Bearer 或 X-API-Key 请求头传入密钥。密钥只能在服务端使用，请勿放入公开的前端代码。"
            : "Pass your key in the Authorization: Bearer or X-API-Key header. Keep it on your server; never expose it in public frontend code."}
        </p>
        <div className="relative rounded-xl border border-zinc-700 bg-black/30 p-5">
          <div className="absolute right-3 top-3">
            <CopyButton text={sample} />
          </div>
          <pre className="overflow-x-auto pr-7 text-xs leading-7 text-cyan-100">
            <code>{sample}</code>
          </pre>
        </div>
        <div className="overflow-x-auto rounded-xl border border-zinc-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800 text-zinc-400">
              <tr>
                <th className="p-4">Method</th>
                <th className="p-4">Endpoint</th>
                <th className="p-4">{zh ? "说明" : "Description"}</th>
              </tr>
            </thead>
            <tbody>
              {endpoints.map(([method, path, description]) => (
                <tr key={method + path} className="border-t border-zinc-800">
                  <td className="p-4 font-mono text-xs text-cyan-300">
                    {method}
                  </td>
                  <td className="p-4 font-mono text-xs">{path}</td>
                  <td className="p-4 text-zinc-400">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm leading-7 text-zinc-400">
          {zh
            ? "创建请求支持 localPart、domain、expiresIn（60–86400 秒）。邮箱属于账号，3 个 Key 均可访问。列表最多返回 50 封摘要，使用 pagination.nextCursor 获取下一页，不提供总数和页码。"
            : "Creation accepts localPart, domain and expiresIn (60–86400 seconds). Mailboxes belong to your account and are accessible with any of your 3 keys. Lists return up to 50 summaries; pass pagination.nextCursor for the next page. Total counts and page numbers are not returned."}
        </p>
        <div className="rounded-xl border border-zinc-700 p-5 text-sm leading-7 text-zinc-400">
          <h3 className="mb-2 font-medium text-white">
            {zh ? "额度与轮询" : "Quotas and polling"}
          </h3>
          {zh
            ? "收到 429 时遵守 Retry-After，收到 503 时暂停并退避。建议从每 60 秒轮询开始，空闲时逐步放慢。失败请求也可能占用额度，全站达到每日容量后会暂时暂停服务。每个邮箱每日最多接收 100 封、单封不超过 256 KiB。"
            : "Respect Retry-After on 429 and back off on 503. Start polling every 60 seconds and slow down when idle. Failed requests may consume quota. Service pauses when global daily capacity is reached. Each mailbox accepts up to 100 messages per day, at most 256 KiB each."}
        </div>
      </section>
      <ApiReference zh={zh} domain={config.emailDomain?.[0] || "example.com"} />
      <LoginDialog open={login} onClose={() => setLogin(false)} />
    </main>
  );
}
