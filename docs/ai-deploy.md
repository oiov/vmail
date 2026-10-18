# AI 辅助部署 Vmail v3.2.1

本文供部署执行者阅读，以当前仓库代码为准。项目为 Cloudflare Workers + D1 + SQLite Durable Objects，前端由 Worker 提供静态资源。

## 配置来源

- [README 环境变量](../README.md#环境变量)：完整必填项、OAuth 回调与额度默认值。
- [.env.example](../.env.example)：手动部署配置模板。
- [.dev.vars.example](../.dev.vars.example)：本地模拟模板；不要注入生产凭据。
- [Actions 教程](github-action-tutorial.md)：GitHub Secrets/Variables 的准确映射。
- [升级指南](UPGRADE.md)：旧 Key、邮箱凭证、数据库迁移与版本差异。

不要向用户请求已提供的配置，不要输出密钥值。缺失的部署配置无法从占位符推导；先准备可验证的配置清单，再由部署者填入。此文档不授予发送真实邮件、删除数据或改动无关资源的权限。

## 执行顺序

1. 检查 Node.js >=22、pnpm 和仓库中的 Wrangler。使用已有 D1 时保留名称和 ID；新部署创建数据库。确认账户计划支持 SQLite Durable Objects。
2. 复制 .env.example 到未提交的 .env，配置 D1、EMAIL_DOMAIN、MAILBOX_TOKEN_SECRET（至少 32 字符）。选择是否开启登录/API/发件，按 README 补齐两种 OAuth 和独立签名密钥。将 ADMIN_EMAILS 设为首个管理员的已验证邮箱。
3. Cloudflare 授权使用 CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID（兼容 CF_API_TOKEN / CF_ACCOUNT_ID），或已有 Wrangler 登录。不要把凭据写入命令输出或提交文件。
4. 执行 pnpm install --frozen-lockfile、pnpm setup:check、pnpm deploy。部署脚本生成 wrangler.deploy.toml，执行测试、类型检查、构建与所有未应用的 D1 迁移，再部署。不要绕过迁移直接发布 Worker。
5. 设置自定义域名与 OAuth origin 一致；邮箱域名启用 Email Routing，Catch-all → Send to a Worker。

## 当前访问合同

- /api-docs 始终公开可读。登录后在 /dashboard/keys 创建 Key；每人最多 3 个有效 Key，分钟/日额度按用户共享，默认 30/分钟、1000/天。
- /api/api-keys 已退役，不签发匿名 Key，返回 401。ENABLE_OPENAPI=false 时 /api/v1/* 返回 403，创建新 Key 也关闭。
- 网页可匿名创建/接收邮件，但读写需要邮箱签名凭证，并受 IP/邮箱限额约束。旧前端密码不是新版授权。
- /api/send 需要同源 Origin、登录会话及有效邮箱凭证，用户不得被封禁，不得使用其他用户拥有的邮箱。发件不使用 API Key；现有公开 v1 API 不含发件接口。
- 发件默认每用户每天 10 次、全站每天 100 次；每用户/邮箱每分钟 3 次、IP 每分钟 10 次。服务商失败也占额度，UTC 零点重置。管理页保留 30 天邮件内容和结果。
- 限额与 Key 授权在 SQLite Durable Objects 中执行，不能用旧 api_rate_limits D1 表判断当前限流是否生效。数据与统计保存在 D1。
- Turnstile 两个配置必须同时存在或同时为空，部署脚本拒绝半配置。站点 PASSWORD 不能替代 OAuth/邮箱授权。

## 验收

1. GET /config：检查 openApiEnabled、authEnabled、turnstileEnabled、sendChannel；不得含密钥。
2. 首页创建邮箱、恢复有效凭证、读取收件箱；/api-docs 匿名可读。
3. GitHub 和 Google 登录回到本站。普通用户无管理员权限，ADMIN_EMAILS 用户可打开 /dashboard/admin/settings 查看版本和实际额度。
4. Key 创建、撤销、邮箱 API 操作；额度隔离/并发边界使用 pnpm test 的本地测试，不持续请求生产数据库。
5. 开启发件时，检查匿名拒绝、额度显示、用户发件记录和管理员正文预览。真实发件需部署者明确安排测试收件人；否则使用本地模拟服务商测试。
6. 检查 Actions 成功、域名响应、关键页面无异常，并报告配置与运行验证的范围。

## 升级与恢复

先保存 D1 恢复点，保留签名密钥与原数据库。v3.2.1 需应用 0006_outbound_logs.sql。遇到问题优先暂停受影响功能；ENABLE_OPENAPI=false 只暂停公开 API，SUSPEND_DATABASE_ACCESS=true 暂停数据路径。不要自动执行逆向迁移、删除 DO class 或用旧代码覆盖新授权状态。回滚需同时评估 D1 与 DO 一致性。
