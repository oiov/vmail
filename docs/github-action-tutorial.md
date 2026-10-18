# GitHub Actions 自动部署（v3.2.1）

本项目部署到 Cloudflare Workers + D1 + SQLite Durable Objects，前端静态资源由同一 Worker 提供，不使用 Turso 或 Cloudflare Pages。

## 准备资源

1. Fork 仓库，在 Cloudflare 创建 D1 数据库并记录名称和 ID。
2. 准备 Cloudflare 账户 ID 和 API Token，授权 Workers 部署、D1 迁移及目标资源所需权限。确认计划支持 SQLite Durable Objects。
3. 准备站点域名和邮箱域名。站点 origin 用作 BETTER_AUTH_URL；邮箱域名由 EMAIL_DOMAIN 指定，可不同。
4. 在 GitHub 和 Google 分别创建自己的 OAuth 应用；回调见 [README 的 OAuth 配置](../README.md#oauth-与管理员)。Google 使用 Web application，Testing 时添加测试用户。

## 填写 Actions 配置

仓库 Settings → Secrets and variables → Actions。下面是当前 [.github/workflows/deploy.yml](../.github/workflows/deploy.yml) 的完整映射；默认值与含义见 [README](../README.md#环境变量)。值修改后需重新部署才生效。

### Repository secrets

GitHub 不允许自定义 Secret 名称以 GITHUB_ 开头，因此 GitHub OAuth 使用 GH_OAUTH_CLIENT_ID 和 GH_OAUTH_CLIENT_SECRET，工作流再映射为 Worker 的名称。不要把维护者的 OAuth 凭据用于自己的实例。

| GitHub Secret | 部署脚本 / Worker 名称 |
| --- | --- |
| `CF_API_TOKEN` | `CLOUDFLARE_API_TOKEN` |
| `CF_ACCOUNT_ID` | `CLOUDFLARE_ACCOUNT_ID` |
| `D1_DATABASE_ID` | `D1_DATABASE_ID` |
| `D1_DATABASE_NAME` | `D1_DATABASE_NAME` |
| `EMAIL_DOMAIN` | `EMAIL_DOMAIN` |
| `TURNSTILE_KEY` | `TURNSTILE_KEY` |
| `TURNSTILE_SECRET` | `TURNSTILE_SECRET` |
| `PASSWORD` | `PASSWORD` |
| `API_RATE_LIMIT_PER_MINUTE` | `API_RATE_LIMIT_PER_MINUTE` |
| `SHOW_AFF` | `SHOW_AFF` |
| `ENABLE_OPENAPI` | `ENABLE_OPENAPI` |
| `SEND_CHANNEL` | `SEND_CHANNEL` |
| `SENDER_EMAIL` | `SENDER_EMAIL` |
| `SEND_RATE_LIMIT_PER_MINUTE` | `SEND_RATE_LIMIT_PER_MINUTE` |
| `SEND_IP_RATE_LIMIT_PER_MINUTE` | `SEND_IP_RATE_LIMIT_PER_MINUTE` |
| `RESEND_API_KEY` | `RESEND_API_KEY` |
| `MAILCHANNELS_API_KEY` | `MAILCHANNELS_API_KEY` |
| `MAILBOX_TOKEN_SECRET` | `MAILBOX_TOKEN_SECRET` |
| `BETTER_AUTH_URL` | `BETTER_AUTH_URL` |
| `BETTER_AUTH_SECRET` | `BETTER_AUTH_SECRET` |
| `API_KEY_SECRET` | `API_KEY_SECRET` |
| `GH_OAUTH_CLIENT_ID` | `GITHUB_CLIENT_ID` |
| `GH_OAUTH_CLIENT_SECRET` | `GITHUB_CLIENT_SECRET` |
| `GOOGLE_CLIENT_ID` | `GOOGLE_CLIENT_ID` |
| `GOOGLE_CLIENT_SECRET` | `GOOGLE_CLIENT_SECRET` |
| `ADMIN_EMAILS` | `ADMIN_EMAILS` |
| `API_DAILY_LIMIT` | `API_DAILY_LIMIT` |
| `MAILBOX_DAILY_LIMIT` | `MAILBOX_DAILY_LIMIT` |
| `MAX_ACTIVE_MAILBOXES` | `MAX_ACTIVE_MAILBOXES` |
| `GLOBAL_API_DAILY_LIMIT` | `GLOBAL_API_DAILY_LIMIT` |
| `GLOBAL_INBOUND_DAILY_LIMIT` | `GLOBAL_INBOUND_DAILY_LIMIT` |
| `MAILBOX_INBOUND_DAILY_LIMIT` | `MAILBOX_INBOUND_DAILY_LIMIT` |
| `MAX_EMAIL_BYTES` | `MAX_EMAIL_BYTES` |
| `SUSPEND_DATABASE_ACCESS` | `SUSPEND_DATABASE_ACCESS` |

核心必填项：CF_API_TOKEN、CF_ACCOUNT_ID、D1_DATABASE_NAME、D1_DATABASE_ID、EMAIL_DOMAIN、MAILBOX_TOKEN_SECRET。邮箱签名密钥至少 32 字符；升级保留原值。

开启登录、API Key 或网页发件时还需 BETTER_AUTH_URL、BETTER_AUTH_SECRET、API_KEY_SECRET 和两个 OAuth Provider 的完整凭据。两个签名密钥分别生成，至少 32 字符。首个管理员在 ADMIN_EMAILS 填自己的 OAuth 已验证邮箱；新注册用户默认普通用户。ENABLE_OPENAPI 默认 false，完成验证后再设为 true；它不控制网页发件。

TURNSTILE_KEY 和 TURNSTILE_SECRET 必须一起配置或一起留空。SEND_CHANNEL 留空不启用发件；启用后还需 SENDER_EMAIL 和对应渠道密钥。Cloudflare 通道使用 SEND_EMAIL 绑定，需遵守 Email Routing/发件地址/收件地址限制。

### Repository variables

以下两项在 **Variables** 标签中填写，不是在 Secrets 中；留空使用默认值：

| GitHub Variable | Worker 名称 | 默认值 |
| --- | --- | --- |
| `SEND_USER_DAILY_LIMIT` | `SEND_USER_DAILY_LIMIT` | 10 |
| `SEND_GLOBAL_DAILY_LIMIT` | `SEND_GLOBAL_DAILY_LIMIT` | 100 |

其他额度目前从上表的 Secrets 读取。所有数值必须为正整数。COOKIES_SECRET 属于旧版前端密码机制，当前工作流和部署脚本不再使用。

## 部署与域名

向 main 推送或在 Actions → Deploy to Cloudflare → Run workflow 手动运行。流程依次检查 Cloudflare 凭据、安装 Node.js 22 与 pnpm、校验配置、运行测试/类型检查/构建、应用 D1 全量未执行迁移，再部署 Worker、静态资源与 Durable Objects。

脚本读取配置后生成被 Git 忽略的 wrangler.deploy.toml；不直接覆盖源 wrangler.toml。密钥通过临时文件单独上传，文件随后删除。不要把 .env、.dev.vars 或真实密钥提交到 Git。Cloudflare 控制台改值后，下次 Actions 可能用仓库配置覆盖，因此长期设置应更新仓库配置源。

首次部署后：

1. 绑定站点自定义域名，确认与 BETTER_AUTH_URL、OAuth 回调 origin 一致。
2. 在邮箱域名启用 Email Routing，按向导设置 DNS，Catch-all 选择 Send to a Worker 并指向该 Worker。
3. 打开 /api-docs（匿名可读），验证两个 OAuth 登录。管理员在 /dashboard/admin/settings 查看版本、功能及实际额度，敏感值只显示是否配置。
4. 创建 Key、创建邮箱和读取邮件，验证撤销 Key 后失效。若开启发件，验证登录门槛、额度与 /dashboard/admin/outbound；不要以持续请求或真实群发方式压测生产。
5. 从旧版本升级先阅读 [升级指南](UPGRADE.md)。v3.2.1 需要 0006_outbound_logs.sql，脚本会先迁移再部署。不要删除旧迁移或随意回退 D1/DO。

## 常见问题

- 工作流跳过：检查 CF_API_TOKEN 与 CF_ACCOUNT_ID。
- 配置检查失败：按输出补充变量；ENABLE_OPENAPI=true 时强制要求完整 OAuth。Turnstile 只配一半会被拒绝。
- 登录回调错误：检查应用类型、回调路径、站点 origin、Google 测试用户；自部署需自己的 OAuth 应用。
- 登录后是普通用户：确认 ADMIN_EMAILS 与 Provider 返回的已验证邮箱一致。
- API 关闭：ENABLE_OPENAPI 必须为字符串 true；旧 /api/api-keys 不再签发匿名 Key。
- 发件失败：检查登录、邮箱凭证、用户/全站额度及服务商地址权限。服务商接收不代表最终送达。
- 费用保护：额度降低 D1 与发件调用量，不是 Cloudflare 账单封顶。监测 Workers/DO/D1 使用情况；必要时关闭 API 或使用 SUSPEND_DATABASE_ACCESS 暂停数据路径。
