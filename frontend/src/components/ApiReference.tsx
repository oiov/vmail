import { CopyButton } from "./CopyButton";

type Row = [string, string, string];
function Code({ text }: { text: string }) {
  return (
    <div className="relative min-w-0 rounded-lg border border-zinc-800 bg-black/30 p-4">
      <div className="absolute right-2 top-2">
        <CopyButton text={text} />
      </div>
      <pre className="overflow-x-auto pr-8 text-xs leading-6 text-zinc-300">
        <code>{text}</code>
      </pre>
    </div>
  );
}
function Fields({ rows, zh }: { rows: Row[]; zh: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-900 text-zinc-400">
          <tr>
            <th className="p-3">{zh ? "字段" : "Field"}</th>
            <th className="p-3">{zh ? "类型" : "Type"}</th>
            <th className="p-3">{zh ? "说明" : "Description"}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, type, description]) => (
            <tr key={name} className="border-t border-zinc-800">
              <td className="p-3 font-mono text-xs text-cyan-200">{name}</td>
              <td className="p-3 text-xs text-zinc-400">{type}</td>
              <td className="min-w-48 p-3 leading-6 text-zinc-400">
                {description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ApiReference({ zh, domain }: { zh: boolean; domain: string }) {
  const t = (cn: string, en: string) => (zh ? cn : en);
  const base = window.location.origin + "/api/v1";
  const box = {
    id: "mailbox_id",
    address: "my-app@" + domain,
    domain,
    expiresAt: "2026-10-19T00:00:00.000Z",
    createdAt: "2026-10-18T00:00:00.000Z",
  };
  const summary = {
    id: "message_id",
    from: { address: "sender@example.com", name: "Sender" },
    subject: "Hello",
    receivedAt: "2026-10-18T00:05:00.000Z",
    preview: "Example email content",
  };
  const json = (value: unknown) => JSON.stringify(value, null, 2);
  const curl = (method: string, path: string, body?: unknown) =>
    [
      "curl -X " + method + ' "' + base + path + '"',
      '  -H "Authorization: Bearer YOUR_API_KEY"',
      ...(body
        ? [
            '  -H "Content-Type: application/json"',
            "  -d '" + JSON.stringify(body) + "'",
          ]
        : []),
    ].join(" \\\n");
  const endpoints = [
    {
      id: "create-mailbox",
      method: "POST",
      path: "/mailboxes",
      title: t("创建邮箱", "Create a mailbox"),
      description: t(
        "创建属于当前账号的临时邮箱。省略 localPart 时随机生成地址；保存返回的 id，后续查询使用该 id。地址一旦被占用不可重新分配，过期后请创建新地址。",
        "Create a temporary mailbox owned by your account. Omit localPart to generate a random address. Save the returned id for subsequent requests. Reserved addresses cannot be reassigned; create a new address after expiry.",
      ),
      parameters: [
        [
          "localPart",
          "string",
          t(
            "可选。1–64 个字符，以小写字母或数字开头，其余可含小写字母、数字、点、下划线和连字符。",
            "Optional. 1–64 characters. Starts with a lowercase letter or digit; remaining characters may also include dots, underscores and hyphens.",
          ),
        ],
        [
          "domain",
          "string",
          t(
            "可选。必须为当前实例支持的域名，省略时使用第一个域名。支持域名见本页连接信息。",
            "Optional. Must be a domain supported by this instance; defaults to its first domain. See connection details on this page.",
          ),
        ],
        [
          "expiresIn",
          "integer",
          t(
            "可选。有效期，单位秒；60–86400，默认 86400（24 小时）。",
            "Optional. Lifetime in seconds, from 60 to 86400. Defaults to 86400 (24 hours).",
          ),
        ],
      ] as Row[],
      request: curl("POST", "/mailboxes", {
        localPart: "my-app",
        domain,
        expiresIn: 86400,
      }),
      status: "201 Created",
      response: json({ data: box }),
    },
    {
      id: "get-mailbox",
      method: "GET",
      path: "/mailboxes/:id",
      title: t("查询邮箱信息", "Get mailbox information"),
      description: t(
        "查询邮箱地址、域名、创建时间和过期时间。仅允许访问当前账号创建且尚未过期的邮箱；不存在、已过期或属于其他账号时返回 404。",
        "Get the address, domain, creation time and expiration time. The mailbox must belong to your account and be active; missing, expired or inaccessible mailboxes return 404.",
      ),
      parameters: [
        [
          "id",
          "string",
          t(
            "必填，路径参数。创建邮箱时返回的 data.id，并非邮箱地址。",
            "Required path parameter. The data.id returned on creation, not the email address.",
          ),
        ],
      ] as Row[],
      request: curl("GET", "/mailboxes/mailbox_id"),
      status: "200 OK",
      response: json({ data: box }),
    },
    {
      id: "list-messages",
      method: "GET",
      path: "/mailboxes/:id/messages",
      title: t("查询邮件列表", "List messages"),
      description: t(
        "按接收时间从新到旧返回邮件摘要，接收时间相同时按邮件 id 倒序。摘要不含正文，使用邮件详情接口读取 text 和 html。",
        "Return message summaries in descending receipt order, with id as the tie-breaker. Summaries do not include the full body; retrieve text and html from the message endpoint.",
      ),
      parameters: [
        [
          "id",
          "string",
          t(
            "必填，路径参数。邮箱 id。",
            "Required path parameter. Mailbox id.",
          ),
        ],
        [
          "limit",
          "integer",
          t(
            "可选，查询参数。每页 1–50 封，默认 20；大于 50 按 50 处理。",
            "Optional query parameter. Page size 1–50, default 20; larger values are capped at 50.",
          ),
        ],
        [
          "cursor",
          "string",
          t(
            "可选，查询参数。第一屏不传；下一页原样传 pagination.nextCursor，并进行 URL 编码。",
            "Optional query parameter. Omit for the first page; URL-encode and pass pagination.nextCursor unchanged for the next page.",
          ),
        ],
      ] as Row[],
      request: curl("GET", "/mailboxes/mailbox_id/messages?limit=20"),
      status: "200 OK",
      response: json({
        data: [summary],
        pagination: { limit: 20, nextCursor: null },
      }),
    },
    {
      id: "get-message",
      method: "GET",
      path: "/mailboxes/:id/messages/:messageId",
      title: t("读取邮件详情", "Get a message"),
      description: t(
        "读取指定邮件的纯文本、HTML、发件人、收件人及邮件头等信息。messageId 使用列表中返回的 id，不是邮件头中的 Message-ID。正文或可选字段可能为 null；渲染 HTML 前请进行清理或隔离。",
        "Read the plain text, HTML, addresses and headers of a message. Use the id from the list as messageId, not its Message-ID header. Body and optional fields may be null; sanitize or isolate HTML before rendering.",
      ),
      parameters: [
        [
          "id",
          "string",
          t(
            "必填，路径参数。邮箱 id。",
            "Required path parameter. Mailbox id.",
          ),
        ],
        [
          "messageId",
          "string",
          t(
            "必填，路径参数。列表 data[].id。",
            "Required path parameter. The list item data[].id.",
          ),
        ],
      ] as Row[],
      request: curl("GET", "/mailboxes/mailbox_id/messages/message_id"),
      status: "200 OK",
      response: json({
        data: {
          id: "message_id",
          messageFrom: "sender@example.com",
          messageTo: box.address,
          from: summary.from,
          to: [{ address: box.address, name: "" }],
          subject: "Hello",
          text: "Example email content",
          html: "<p>Example email content</p>",
          headers: [],
          messageId: "<original-id@example.com>",
          createdAt: summary.receivedAt,
          updatedAt: summary.receivedAt,
        },
      }),
    },
    {
      id: "delete-message",
      method: "DELETE",
      path: "/mailboxes/:id/messages/:messageId",
      title: t("删除邮件", "Delete a message"),
      description: t(
        "删除当前账号邮箱中的指定邮件。成功返回 success: true；重复删除已不存在的邮件也返回成功。删除后无法通过 API 恢复。",
        "Delete a message from a mailbox owned by your account. Returns success: true, including when the message has already been deleted. Deleted messages cannot be restored through the API.",
      ),
      parameters: [
        [
          "id",
          "string",
          t(
            "必填，路径参数。邮箱 id。",
            "Required path parameter. Mailbox id.",
          ),
        ],
        [
          "messageId",
          "string",
          t(
            "必填，路径参数。邮件 id。",
            "Required path parameter. Message id.",
          ),
        ],
      ] as Row[],
      request: curl("DELETE", "/mailboxes/mailbox_id/messages/message_id"),
      status: "200 OK",
      response: json({ success: true }),
    },
  ];
  return (
    <section className="mt-12 space-y-10" aria-labelledby="reference-title">
      <div>
        <h2 id="reference-title" className="text-2xl font-semibold">
          {t("接口参考", "API reference")}
        </h2>
        <p className="mt-3 text-sm leading-7 text-zinc-400">
          {t(
            "以下接口均需要 API Key，无需在 API 请求中携带浏览器登录 Cookie。邮箱属于账号，同一账号的所有有效 Key 均可访问。时间字段使用 ISO 8601 格式。",
            "All endpoints require an API key; browser session cookies are not needed for API requests. Mailboxes belong to your account and can be accessed with any of its active keys. Timestamps use ISO 8601.",
          )}
        </p>
        <nav
          aria-label={t("接口目录", "Endpoint navigation")}
          className="mt-5 flex flex-wrap gap-3"
        >
          {endpoints.map((e) => (
            <a
              key={e.id}
              href={"#" + e.id}
              className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-cyan-300 hover:bg-zinc-800"
            >
              {e.title}
            </a>
          ))}
          <a
            href="#api-errors"
            className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-cyan-300"
          >
            {t("错误处理", "Error handling")}
          </a>
        </nav>
      </div>
      {endpoints.map((e) => (
        <article
          id={e.id}
          key={e.id}
          className="scroll-mt-24 space-y-5 border-t border-zinc-800 pt-8"
        >
          <h3 className="text-xl font-semibold">{e.title}</h3>
          <p className="break-all font-mono text-sm">
            <span className="mr-3 rounded bg-cyan-950 px-2 py-1 text-cyan-300">
              {e.method}
            </span>
            /api/v1{e.path}
          </p>
          <p className="text-sm leading-7 text-zinc-400">{e.description}</p>
          <h4 className="text-sm font-medium">
            {e.method === "POST"
              ? t("请求体 · JSON", "Request body · JSON")
              : t("路径与查询参数", "Path and query parameters")}
          </h4>
          <Fields rows={e.parameters} zh={zh} />
          <h4 className="text-sm font-medium">
            {t("请求示例", "Request example")}
          </h4>
          <Code text={e.request} />
          <h4 className="text-sm font-medium">
            {t("响应示例", "Response example")} · {e.status}
          </h4>
          <Code text={e.response} />
          {e.id === "list-messages" && (
            <>
              <p className="text-sm leading-7 text-zinc-400">
                {t(
                  "pagination.nextCursor 为 null 表示没有下一页。非空时用下面的方式请求下一页。游标是不透明字符串，不应自行生成或修改。轮询新邮件时从不带 cursor 的第一页开始。v3 不再提供 page、total、totalPages 或实时 messageCount。",
                  "A null pagination.nextCursor means there is no next page. Otherwise, request the next page as shown below. Cursors are opaque; do not generate or modify them. Poll for new messages from the first page without a cursor. v3 does not return page, total, totalPages or a live messageCount.",
                )}
              </p>
              <Code
                text={
                  'curl -G "' +
                  base +
                  '/mailboxes/mailbox_id/messages" \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  --data-urlencode "limit=20" \\\n  --data-urlencode "cursor=NEXT_CURSOR"'
                }
              />
              <Fields
                zh={zh}
                rows={[
                  [
                    "data[].id",
                    "string",
                    t(
                      "邮件内部 id，用于读取和删除。",
                      "Internal message id for reading and deletion.",
                    ),
                  ],
                  [
                    "data[].from",
                    "object",
                    t(
                      "发件人，包含 address 和 name。",
                      "Sender with address and name.",
                    ),
                  ],
                  [
                    "data[].subject",
                    "string | null",
                    t("邮件主题。", "Message subject."),
                  ],
                  [
                    "data[].receivedAt",
                    "string",
                    t("接收时间。", "Receipt timestamp."),
                  ],
                  [
                    "data[].preview",
                    "string | null",
                    t(
                      "纯文本前 100 个字符，可能为空。",
                      "First 100 text characters; may be empty.",
                    ),
                  ],
                  [
                    "pagination.nextCursor",
                    "string | null",
                    t(
                      "下一页游标，没有下一页时为 null。",
                      "Next-page cursor, or null at the end.",
                    ),
                  ],
                ]}
              />
            </>
          )}
        </article>
      ))}
      <section
        id="api-errors"
        className="scroll-mt-24 space-y-5 border-t border-zinc-800 pt-8"
      >
        <h3 className="text-xl font-semibold">
          {t("错误处理与重试", "Errors and retries")}
        </h3>
        <Code
          text={json({
            error: {
              code: "QUOTA_EXCEEDED",
              message: "Shared user quota exceeded",
            },
            message: "Shared user quota exceeded",
          })}
        />
        <p className="text-sm leading-7 text-zinc-400">
          {t(
            "客户端应根据 HTTP 状态码和 error.code 判断错误，error.message 用于说明。部分错误没有顶层 message。",
            "Use the HTTP status and error.code for error handling; error.message describes the issue. Some errors omit the top-level message.",
          )}
        </p>
        <Fields
          zh={zh}
          rows={[
            [
              "400",
              "VALIDATION_ERROR",
              t(
                "JSON、邮箱参数或 cursor 无效。修正请求后再试。",
                "Invalid JSON, mailbox fields or cursor. Correct the request before retrying.",
              ),
            ],
            [
              "401",
              "UNAUTHORIZED",
              t(
                "Key 缺失、无效、过期或已撤销。检查请求头或重新创建 Key。",
                "Missing, invalid, expired or revoked key. Check the header or create a new key.",
              ),
            ],
            [
              "403",
              "OPENAPI_DISABLED",
              t(
                "当前实例关闭了 API。",
                "API access is disabled on this instance.",
              ),
            ],
            [
              "404",
              "NOT_FOUND",
              t(
                "邮箱或邮件不存在、邮箱过期或不属于当前账号。",
                "Mailbox/message missing, expired or inaccessible to your account.",
              ),
            ],
            [
              "409",
              "CONFLICT",
              t(
                "邮箱地址已被占用。使用其他 localPart 或随机地址。",
                "Address already reserved. Choose another localPart or omit it.",
              ),
            ],
            [
              "413",
              "Request too large",
              t("请求体超过 128 KiB。", "Request body exceeds 128 KiB."),
            ],
            [
              "429",
              "RATE_LIMITED / QUOTA_EXCEEDED / MAILBOX_LIMIT / GLOBAL_QUOTA_EXCEEDED",
              t(
                "达到 IP、Key、账号或全站限制。遵守 Retry-After（秒）并退避；有效邮箱数量达到上限时需等待邮箱过期。",
                "IP, key, account or global limit reached. Respect Retry-After in seconds and back off. At the active-mailbox limit, wait for expiry.",
              ),
            ],
            [
              "503",
              "SERVICE_PAUSED",
              t(
                "服务暂时暂停，稍后退避重试。",
                "Service temporarily paused. Retry with backoff.",
              ),
            ],
          ]}
        />
        <p className="text-sm leading-7 text-zinc-400">
          {t(
            "X-RateLimit-Remaining 表示本次请求涉及的账号额度中最小的剩余值。失败请求可能消耗额度；删除或重建 Key 不重置额度。建议从每 60 秒轮询开始，空闲时延长间隔。创建请求未收到响应时不要无限重试：API 不提供幂等键，随机地址重试可能创建多个邮箱。",
            "X-RateLimit-Remaining reports the smallest remaining account quota applicable to the request. Failed requests may consume quota; rotating keys does not reset it. Start polling every 60 seconds and increase the interval when idle. Do not retry mailbox creation indefinitely after a lost response: the API has no idempotency keys and random-address retries can create multiple mailboxes.",
          )}
        </p>
      </section>
    </section>
  );
}
