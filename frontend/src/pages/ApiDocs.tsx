import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { toast } from "react-hot-toast";
import { useConfig } from "../hooks/useConfig";
import { CopyButton } from "../components/CopyButton";

interface ApiKeyResponse {
  data: {
    id: string;
    key: string;
    keyPrefix: string;
    name: string | null;
    createdAt: string;
  };
  message: string;
}

export function ApiDocs() {
  const { t } = useTranslation();
  const config = useConfig();
  const contentRef = useRef<HTMLDivElement>(null);

  // API Key 创建相关状态
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");

  // 添加代码高亮样式
  useEffect(() => {
    if (contentRef.current) {
      const codeBlocks = contentRef.current.querySelectorAll("pre code");
      codeBlocks.forEach((block) => {
        block.classList.add("language-json");
      });
    }
  }, []);

  // 创建 API Key
  const handleCreateApiKey = async () => {
    if (!turnstileToken) {
      toast.error(t("Please complete the verification first"));
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: turnstileToken,
          name: keyName || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create API Key");
      }

      const result: ApiKeyResponse = await response.json();
      setCreatedApiKey(result.data.key);
      toast.success(t("API Key created successfully"));
    } catch (error: any) {
      toast.error(error.message || t("Failed to create API Key"));
    } finally {
      setIsCreating(false);
    }
  };

  // 重置状态，允许创建新的 API Key
  const handleCreateAnother = () => {
    setCreatedApiKey(null);
    setTurnstileToken("");
    setKeyName("");
  };

  return (
    <div className="min-h-screen bg-[#1f2023] text-white py-8 px-4 md:px-8 mt-16">
      <div className="max-w-4xl mx-auto" ref={contentRef}>
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gray-700">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">
            {t("API Documentation")}
          </h1>
          <p className="text-gray-400">
            {t(
              "RESTful API for programmatic access to temporary email services",
            )}
          </p>
        </div>

        {/* Get API Key Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-cyan-300 mb-4">
            {t("Get API Key")}
          </h2>
          <div className="bg-gray-800 rounded-lg p-4">
            {createdApiKey ? (
              // 显示创建的 API Key
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {t("Created")}
                  </span>
                </div>
                <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-yellow-200 font-semibold text-sm">
                        {t("Important: Save your API Key now!")}
                      </p>
                      <p className="text-yellow-300/80 text-xs mt-1">
                        {t("This is the only time you will see the full API Key. It cannot be retrieved later.")}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-green-400 text-sm break-all flex-1">
                      {createdApiKey}
                    </code>
                    <CopyButton text={createdApiKey} className="flex-shrink-0" />
                  </div>
                </div>
                <button
                  onClick={handleCreateAnother}
                  className="text-cyan-400 hover:text-cyan-300 text-sm underline"
                >
                  {t("Create another API Key")}
                </button>
              </div>
            ) : (
              // 创建 API Key 表单
              <div>
                <p className="text-gray-300 mb-4">
                  {t("Create a free API Key to access the API. Each key has a rate limit of 100 requests per minute.")}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {t("Key Name")} ({t("optional")})
                    </label>
                    <input
                      type="text"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      placeholder={t("e.g., My Project")}
                      className="w-full md:w-1/2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      {t("Verification")}
                    </label>
                    <div className="[&_iframe]:!w-full h-[65px] max-w-[300px] bg-gray-700 rounded">
                      <Turnstile
                        siteKey={config.turnstileKey}
                        onSuccess={setTurnstileToken}
                        options={{ theme: "dark" }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleCreateApiKey}
                    disabled={!turnstileToken || isCreating}
                    className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                  >
                    {isCreating ? t("Creating...") : t("Create API Key")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Authentication */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-cyan-300 mb-4">
            {t("Authentication")}
          </h2>
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <p className="text-gray-300 mb-3">
              {t(
                "All API requests require an API Key. Include it in the request header:",
              )}
            </p>
            <pre className="bg-gray-900 p-3 rounded overflow-x-auto">
              <code className="text-green-400">X-API-Key: your-api-key</code>
            </pre>
            <p className="text-gray-400 text-sm mt-2">
              {t("Or use Authorization header:")}
            </p>
            <pre className="bg-gray-900 p-3 rounded overflow-x-auto mt-2">
              <code className="text-green-400">
                Authorization: Bearer your-api-key
              </code>
            </pre>
          </div>
        </section>

        {/* Base URL */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-cyan-300 mb-4">
            Base URL
          </h2>
          <div className="bg-gray-800 rounded-lg p-4">
            <pre className="bg-gray-900 p-3 rounded overflow-x-auto">
              <code className="text-yellow-400">https://vmail.dev/api/v1</code>
            </pre>
          </div>
        </section>

        {/* Endpoints */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-cyan-300 mb-4">
            {t("Endpoints")}
          </h2>

          {/* POST /mailboxes */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-green-600 text-white px-2 py-1 rounded text-sm font-mono">
                POST
              </span>
              <code className="text-white font-mono">/mailboxes</code>
            </div>
            <p className="text-gray-300 mb-4">
              {t("Create a new temporary mailbox")}
            </p>

            <h4 className="text-cyan-200 font-semibold mb-2">
              {t("Request Body")} (optional)
            </h4>
            <pre className="bg-gray-900 p-3 rounded overflow-x-auto mb-4 text-sm">
              <code className="text-gray-300">{`{
  "localPart": "mytest",     // Optional: custom local part
  "domain": "example.com",   // Optional: email domain
  "expiresIn": 86400         // Optional: expiry in seconds (default: 24h)
}`}</code>
            </pre>

            <h4 className="text-cyan-200 font-semibold mb-2">
              {t("Response")}{" "}
              <span className="text-green-400">201 Created</span>
            </h4>
            <pre className="bg-gray-900 p-3 rounded overflow-x-auto text-sm">
              <code className="text-gray-300">{`{
  "data": {
    "id": "abc123xyz",
    "address": "mytest@example.com",
    "domain": "example.com",
    "expiresAt": "2024-02-12T12:00:00.000Z",
    "createdAt": "2024-02-11T12:00:00.000Z"
  }
}`}</code>
            </pre>
          </div>

          {/* GET /mailboxes/:id */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">
                GET
              </span>
              <code className="text-white font-mono">/mailboxes/:id</code>
            </div>
            <p className="text-gray-300 mb-4">{t("Get mailbox information")}</p>

            <h4 className="text-cyan-200 font-semibold mb-2">
              {t("Response")} <span className="text-green-400">200 OK</span>
            </h4>
            <pre className="bg-gray-900 p-3 rounded overflow-x-auto text-sm">
              <code className="text-gray-300">{`{
  "data": {
    "id": "abc123xyz",
    "address": "mytest@example.com",
    "domain": "example.com",
    "expiresAt": "2024-02-12T12:00:00.000Z",
    "createdAt": "2024-02-11T12:00:00.000Z",
    "messageCount": 5
  }
}`}</code>
            </pre>
          </div>

          {/* GET /mailboxes/:id/messages */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">
                GET
              </span>
              <code className="text-white font-mono">
                /mailboxes/:id/messages
              </code>
            </div>
            <p className="text-gray-300 mb-4">
              {t("Get inbox messages with pagination")}
            </p>

            <h4 className="text-cyan-200 font-semibold mb-2">
              {t("Query Parameters")}
            </h4>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-2 pr-4">{t("Parameter")}</th>
                    <th className="pb-2 pr-4">{t("Type")}</th>
                    <th className="pb-2 pr-4">{t("Default")}</th>
                    <th className="pb-2">{t("Description")}</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 pr-4 font-mono text-yellow-400">
                      page
                    </td>
                    <td className="py-2 pr-4">number</td>
                    <td className="py-2 pr-4">1</td>
                    <td className="py-2">{t("Page number")}</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 pr-4 font-mono text-yellow-400">
                      limit
                    </td>
                    <td className="py-2 pr-4">number</td>
                    <td className="py-2 pr-4">20</td>
                    <td className="py-2">{t("Items per page (max 100)")}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-yellow-400">
                      sort
                    </td>
                    <td className="py-2 pr-4">string</td>
                    <td className="py-2 pr-4">desc</td>
                    <td className="py-2">{t("Sort order (asc/desc)")}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-cyan-200 font-semibold mb-2">
              {t("Response")} <span className="text-green-400">200 OK</span>
            </h4>
            <pre className="bg-gray-900 p-3 rounded overflow-x-auto text-sm">
              <code className="text-gray-300">{`{
  "data": [
    {
      "id": "msg_001",
      "from": { "address": "sender@example.com", "name": "Sender" },
      "subject": "Hello World",
      "preview": "This is a preview...",
      "receivedAt": "2024-02-11T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "hasMore": true
  }
}`}</code>
            </pre>
          </div>

          {/* GET /mailboxes/:id/messages/:messageId */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-mono">
                GET
              </span>
              <code className="text-white font-mono">
                /mailboxes/:id/messages/:messageId
              </code>
            </div>
            <p className="text-gray-300 mb-4">
              {t("Get full message details")}
            </p>

            <h4 className="text-cyan-200 font-semibold mb-2">
              {t("Response")} <span className="text-green-400">200 OK</span>
            </h4>
            <pre className="bg-gray-900 p-3 rounded overflow-x-auto text-sm">
              <code className="text-gray-300">{`{
  "data": {
    "id": "msg_001",
    "messageId": "<unique-id@sender.com>",
    "from": { "address": "sender@example.com", "name": "Sender" },
    "to": [{ "address": "mytest@example.com", "name": "" }],
    "cc": [],
    "bcc": [],
    "replyTo": [],
    "subject": "Hello World",
    "text": "Plain text content...",
    "html": "<html>...</html>",
    "headers": [{ "name": "X-Custom", "value": "value" }],
    "receivedAt": "2024-02-11T10:30:00.000Z"
  }
}`}</code>
            </pre>
          </div>

          {/* DELETE /mailboxes/:id/messages/:messageId */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-red-600 text-white px-2 py-1 rounded text-sm font-mono">
                DELETE
              </span>
              <code className="text-white font-mono">
                /mailboxes/:id/messages/:messageId
              </code>
            </div>
            <p className="text-gray-300 mb-4">
              {t("Delete a specific message")}
            </p>

            <h4 className="text-cyan-200 font-semibold mb-2">
              {t("Response")} <span className="text-green-400">200 OK</span>
            </h4>
            <pre className="bg-gray-900 p-3 rounded overflow-x-auto text-sm">
              <code className="text-gray-300">{`{
  "data": {
    "deleted": true,
    "id": "msg_001"
  }
}`}</code>
            </pre>
          </div>
        </section>

        {/* Error Responses */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-cyan-300 mb-4">
            {t("Error Responses")}
          </h2>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-300 mb-4">
              {t("All errors follow a consistent format:")}
            </p>
            <pre className="bg-gray-900 p-3 rounded overflow-x-auto text-sm mb-4">
              <code className="text-gray-300">{`{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}`}</code>
            </pre>

            <h4 className="text-cyan-200 font-semibold mb-2">
              {t("Error Codes")}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-gray-700">
                    <th className="pb-2 pr-4">Code</th>
                    <th className="pb-2 pr-4">HTTP Status</th>
                    <th className="pb-2">{t("Description")}</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 pr-4 font-mono text-red-400">
                      UNAUTHORIZED
                    </td>
                    <td className="py-2 pr-4">401</td>
                    <td className="py-2">{t("Missing or invalid API Key")}</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 pr-4 font-mono text-red-400">
                      FORBIDDEN
                    </td>
                    <td className="py-2 pr-4">403</td>
                    <td className="py-2">
                      {t("API Key disabled/expired or no access")}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 pr-4 font-mono text-red-400">
                      NOT_FOUND
                    </td>
                    <td className="py-2 pr-4">404</td>
                    <td className="py-2">{t("Resource not found")}</td>
                  </tr>
                  <tr className="border-b border-gray-700/50">
                    <td className="py-2 pr-4 font-mono text-red-400">
                      VALIDATION_ERROR
                    </td>
                    <td className="py-2 pr-4">400</td>
                    <td className="py-2">{t("Invalid request parameters")}</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-mono text-red-400">
                      CONFLICT
                    </td>
                    <td className="py-2 pr-4">409</td>
                    <td className="py-2">{t("Resource already exists")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Example Usage */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-cyan-300 mb-4">
            {t("Example Usage")}
          </h2>
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-cyan-200 font-semibold mb-2">
              {t("Create mailbox and check for messages")}
            </h4>
            <pre className="bg-gray-900 p-3 rounded overflow-x-auto text-sm">
              <code className="text-gray-300">{`# Create a new mailbox
curl -X POST https://vmail.dev/api/v1/mailboxes \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "example.com"}'

# Response: { "data": { "id": "abc123", "address": "...", ... } }

# Check inbox
curl https://vmail.dev/api/v1/mailboxes/abc123/messages \\
  -H "X-API-Key: your-api-key"

# Get specific message
curl https://vmail.dev/api/v1/mailboxes/abc123/messages/msg_001 \\
  -H "X-API-Key: your-api-key"`}</code>
            </pre>
          </div>
        </section>

        {/* Rate Limits */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-cyan-300 mb-4">
            {t("Rate Limits")}
          </h2>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-300">
              {t(
                "API requests are rate limited based on your API Key configuration. Default limit is 100 requests per minute.",
              )}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
