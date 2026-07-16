<div align="center">
  <a href="https://trendshift.io/repositories/8681" target="_blank"><img src="https://trendshift.io/api/badge/repositories/8681" alt="yesmore%2Fvmail | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
  <h1>𝐕𝐌𝐀𝐈𝐋.𝐃𝐄𝐕</h1>
  <p><a href="/docs/github-action-tutorial.md">部署教程</a>  ·  <a href="/docs/ai-deploy.md">AI帮你部署</a>  ·
  <a href="https://vmail.dev/api-docs" target="_blank">API 文档</a> · <a href="https://github.com/oiov/vmail/blob/main/README_en.md">English</a> | 简体中文</p>
  <p>使用 Cloudflare Email Worker 实现的临时电子邮件服务</p>
</div>

<a href="https://nbility.ai/auth/register?aff=Dptp"><img align="center" width="50%" alt="og-banner" src="https://github.com/user-attachments/assets/b338bfca-71ed-447a-bde5-18e5677cb8dc" /></a>

> 🌟 推荐 **Claude Code** 稳定 API 渠道：[nbility.ai](https://nbility.ai/auth/register?aff=Dptp) ，支持 claude-opus-4-6 等主流 AI Coding 大模型🥳

## 🌈 特点

- 🎯 隐私友好，无需注册，开箱即用
- ✈️ 支持邮件收发
- ✨ 支持保存密码，找回邮箱
- 😄 支持多域名后缀
- 🔌 **开放 RESTful API**，支持程序化调用
- 🚀 快速部署，纯 Cloudflare 方案，无需服务器

原理：

- Email worker 接收电子邮件
- 前端 (Vite + React) 显示电子邮件
- 邮件存储 (Cloudflare D1)
- 发信使用 Resend API、MailChannels API 或 Cloudflare 原生发件

## 👋 自部署教程

本项目基于 Cloudflare Workers 和 Cloudflare D1 构建。您只需要一个托管在 Cloudflare 上的域名即可。

### 准备工作

- [Cloudflare](https://dash.cloudflare.com/) 账户与托管在 Cloudflare 上的域名
- 本地安装 [Node.js](https://nodejs.org) 环境（版本 >= 22.x）和 [pnpm](https://pnpm.io/installation)

### 自动部署 (推荐)

本项目已包含一个预先配置好的 GitHub Action 工作流，可以帮助您自动将 Vmail 应用部署到 Cloudflare。

详细步骤请参考 [GitHub Action 自动部署教程](/docs/github-action-tutorial.md)。

### 手动部署步骤

1.  **克隆项目到本地**
    ```bash
    git clone https://github.com/oiov/vmail
    cd vmail
    pnpm install
    ```

2.  **创建 Cloudflare D1 数据库**
    在 Cloudflare 控制台或使用 Wrangler CLI 创建一个 D1 数据库。

3.  **配置 `wrangler.toml`**
    将根目录下的 `wrangler.toml` 文件中的 `${...}` 占位符替换为您的 Cloudflare 和 D1 配置信息。您也可以通过 Cloudflare Pages 的环境变量来设置这些值。

4.  **构建和部署**
    ```bash
    # 构建前端应用
    pnpm run build

    # 部署到 Cloudflare
    pnpm run deploy
    ```
    Wrangler 将会自动处理前端静态资源和 Worker 的部署，并根据配置应用数据库迁移。

5.  **配置电子邮件路由**
    在您的 Cloudflare 域名管理界面，进入 `Email` -> `Email Routing` -> `Routes`，设置一个 `Catch-all` 规则，将所有发送到您域名的邮件 `Send to a Worker`，选择您刚刚部署的 Worker。

### 环境变量

通过 GitHub Actions 部署到 Cloudflare Workers 时，您需要配置以下环境变量：

-   `D1_DATABASE_NAME`: 您的 D1 数据库名称。
-   `D1_DATABASE_ID`: 您的 D1 数据库 ID。
-   `COOKIES_SECRET`: 用于签名 Cookie 的密钥。
-   `EMAIL_DOMAIN`: 您的邮箱域名，例如 `example.com,example.net`。
-   `TURNSTILE_KEY`: 您的 Turnstile 站点密钥，可选。
-   `TURNSTILE_SECRET`: 您的 Turnstile 密钥，可选。
-   `PASSWORD`: 站点访问密码（可选）。
-   `API_RATE_LIMIT_PER_MINUTE`: API 每分钟请求限制（可选，默认 100）。
-   `SEND_CHANNEL`: 发件渠道，可选 `resend`、`mailchannels`、`cloudflare`；不配置时隐藏发信功能。旧值 `send_email` 仍兼容，但已弃用。
-   `SENDER_EMAIL`: 固定的发件地址，必须是服务商允许或已验证的地址；临时邮箱仅作为 `Reply-To`。
-   `MAILBOX_TOKEN_SECRET`: 邮箱发信授权令牌的签名密钥，启用发信时必填，并应通过 Wrangler secret 配置。
-   `RESEND_API_KEY`: Resend API 密钥，仅 `SEND_CHANNEL=resend` 时需要，通过 Wrangler secret 配置。
-   `MAILCHANNELS_API_KEY`: MailChannels API 密钥，仅 `SEND_CHANNEL=mailchannels` 时需要，通过 Wrangler secret 配置。
-   `SEND_RATE_LIMIT_PER_MINUTE`: 每个邮箱每分钟最大发信数（可选，默认 3）。
-   `SEND_IP_RATE_LIMIT_PER_MINUTE`: 每个 IP 每分钟最大发信数（可选，默认 10）。
-   `SHOW_AFF`: 是否显示推广弹窗和链接（可选，设置为 `true` 开启）。
-   `ENABLE_OPENAPI`: 是否开启 OpenAPI 调用功能（可选，默认 `false`；只有显式设置为 `true` 时才允许创建 API Key 和访问 `/api/v1/*`）。

发信密钥不要写入 `wrangler.toml`，请使用：

```bash
pnpm exec wrangler secret put MAILBOX_TOKEN_SECRET
pnpm exec wrangler secret put RESEND_API_KEY       # Resend 时
pnpm exec wrangler secret put MAILCHANNELS_API_KEY # MailChannels 时
```

使用 Cloudflare Worker 原生发信时，将 `SEND_CHANNEL` 设置为 `cloudflare`，并配置 `SENDER_EMAIL` 和 `MAILBOX_TOKEN_SECRET`；不需要 `RESEND_API_KEY` 或 `MAILCHANNELS_API_KEY`。此外，需要在该域名上启用 Cloudflare Email Routing。`wrangler.toml` 中名为 `SEND_EMAIL` 的 `[[send_email]]` 绑定是 Cloudflare 固定配置，无需改名。

## 🔨 本地运行调试

1.  **复制环境变量文件**
    ```bash
    # 此命令会创建一个本地环境变量文件，wrangler dev 会自动加载
    cp .env.example .env
    ```

2.  **填写本地环境变量**
    在 `.env` 文件中填写必要的环境变量，特别是 `D1_DATABASE_ID` 等。您需要先在 Cloudflare 创建一个 D1 数据库用于本地开发。

3.  **启动开发服务器**
    ```bash
    pnpm run dev
    ```
    该命令会同时启动前端 Vite 开发服务器和本地的 Wrangler Worker 环境。

## 📖 API 文档

Vmail 提供完整的 RESTful API，支持通过程序化方式创建临时邮箱、查询收件箱。

### 获取 API Key

访问 [API 文档页面](https://vmail.dev/api-docs) 创建免费的 API Key。

### API 端点

| 方法     | 端点                                        | 说明                   |
| -------- | ------------------------------------------- | ---------------------- |
| `POST`   | `/api/v1/mailboxes`                         | 创建临时邮箱           |
| `GET`    | `/api/v1/mailboxes/:id`                     | 获取邮箱信息           |
| `GET`    | `/api/v1/mailboxes/:id/messages`            | 获取收件箱（支持分页） |
| `GET`    | `/api/v1/mailboxes/:id/messages/:messageId` | 获取邮件详情           |
| `DELETE` | `/api/v1/mailboxes/:id/messages/:messageId` | 删除邮件               |

### 快速开始

```bash
# 1. 创建临时邮箱
curl -X POST https://vmail.dev/api/v1/mailboxes \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json"

# 响应: { "data": { "id": "abc123", "address": "random@domain.com", ... } }

# 2. 查询收件箱
curl https://vmail.dev/api/v1/mailboxes/abc123/messages \
  -H "X-API-Key: your-api-key"

# 3. 获取邮件详情
curl https://vmail.dev/api/v1/mailboxes/abc123/messages/msg_001 \
  -H "X-API-Key: your-api-key"
```

完整文档请访问：[https://vmail.dev/api-docs](https://vmail.dev/api-docs)

## 📝 License

GNU General Public License v3.0

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=oiov/vmail&type=Date)](https://star-history.com/#oiov/vmail&Date)
