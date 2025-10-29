# GitHub Action 自动部署教程

本项目已包含一个预先配置好的 GitHub Action 工作流文件 (`.github/workflows/deploy.yml`)，可以帮助您自动将 Vmail 应用部署到 Cloudflare Workers。

## 准备工作

在开始之前，请确保您已经完成了 [接收邮件部署教程](/docs/receive-tutorial.md) 中的所有步骤，特别是 Cloudflare 和 Turso 的配置。

## 配置 GitHub Secrets

为了让 GitHub Actions 能够安全地访问您的 Cloudflare 和数据库账户，您需要将以下敏感信息配置为 GitHub 仓库的 Secrets。

前往您的 GitHub 仓库页面，点击 `Settings` -> `Secrets and variables` -> `Actions`，然后添加以下 `Repository secrets`：

| Secret Name        | 说明                                                                                               | 示例值                                 |
| :----------------- | :------------------------------------------------------------------------------------------------- | :------------------------------------- |
| `CF_API_TOKEN`     | Cloudflare API Token，用于授权 Wrangler 操作。请确保该 Token 具有编辑 Workers 和 D1 数据库的权限。 | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`     |
| `CF_ACCOUNT_ID`    | 您的 Cloudflare 账户 ID，可以在 Cloudflare 控制台主页的右侧找到。                                  | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`     |
| `D1_DATABASE_ID`   | 您的 D1 数据库 ID。                                                                                | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `D1_DATABASE_NAME` | 您的 D1 数据库名称。                                                                               | `vmail`                                |
| `EMAIL_DOMAIN`     | 您的邮箱域名，如果多个域名请用逗号隔开。                                                           | `vmail.dev,example.com`                |
| `COOKIES_SECRET`   | 用于加密 Cookie 的密钥，请设置为一个随机且足够复杂的字符串。                                       | `a-very-strong-and-random-secret`      |
| `TURNSTILE_KEY`    | Cloudflare Turnstile 网站密钥 (Site Key)。                                                         | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`       |
| `TURNSTILE_SECRET` | Cloudflare Turnstile 密钥 (Secret Key)。                                                           | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`       |

## 触发自动部署

配置好以上 Secrets 后，每当您向 `main` 分支推送（push）代码时，GitHub Action 都会自动触发，执行以下步骤：

1.  **检查凭据**：确认 `CF_API_TOKEN` 和 `CF_ACCOUNT_ID` 是否已设置。
2.  **安装与构建**：安装 pnpm 依赖并构建前端和 Worker 应用。
3.  **数据库迁移**：自动应用 `worker/drizzle` 目录下的数据库迁移脚本到您的 D1 数据库。
4.  **部署应用**：将构建好的应用部署到 Cloudflare。

您也可以在 GitHub 仓库的 `Actions` 标签页手动触发部署。

## 注意事项

- 工作流文件 (`.github/workflows/deploy.yml`) 会自动从您的 Secrets 中读取配置并应用到 `wrangler.toml` 文件中，**请勿**直接将敏感信息写入 `wrangler.toml` 文件。
- 如果您的数据库结构有变更（例如，修改了 `worker/src/database/schema.ts`），请记得生成新的迁移文件并提交到代码库中，GitHub Action 会自动帮您应用更新。