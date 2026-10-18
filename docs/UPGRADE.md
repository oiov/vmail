# 升级到 v3.0：登录、API 配额和管理员后台

## v3.2：独立控制台与双主题

管理员可在 /dashboard/admin/settings 查看当前版本、功能与环境变量；敏感项仅显示是否配置。首页与文档统一为绿色主题。

从 v3.1 升级不需要新增环境变量或数据库迁移。API 开关、OAuth、管理员配置和现有 Key 保持有效。

- 公开文档继续位于 /api-docs，匿名可访问。
- 登录后进入 /dashboard；Key、邮箱、邮件、账户分别位于独立页面。
- 管理员使用 /dashboard/admin/users 和 /dashboard/admin/logs；旧 /admin 地址自动跳转。
- 控制台默认深色，右上角可切换浅色，选择保存在当前浏览器。
- 邮箱列表只展示属于当前账号的邮箱；匿名创建的历史邮箱不会自动归入账号。


这是一次带有访问凭证变更的升级。建议先部署测试实例，保存 D1 导出/Time Travel 恢复点，再切换正式实例。

## 升级后发生什么

- 网页创建邮箱仍可匿名使用，但所有邮件读取、删除和恢复都需要服务端签发的邮箱凭证。MAILBOX_TOKEN_SECRET 现在必填，即使不启用发信。保留已有密钥，不要无意中轮换。
- 旧的前端加密“邮箱密码”不能证明邮箱所有权，不会转换成新凭证。历史邮箱没有新版激活记录，需重新创建；前端显示升级提示。
- 0004_authenticated_api.sql 停用旧匿名 API Key。用户需使用 GitHub 或 Google 登录重新创建。旧邮件不会被迁移脚本删除，仍按保留期限清理；旧邮箱不会自动认领给新账号。
- 注册用户默认普通用户（user），不限制注册总数。每人最多 3 个有效 Key，共享分钟/每日额度；删除、重建 Key 不重置额度。Key 有效期 90 天。
- API 邮件列表改为游标分页：limit 最大 50，下一页传 pagination.nextCursor。不再提供 page、total、totalPages，邮箱详情不再提供实时 messageCount。正文通过邮件详情接口读取。
- 新邮箱最长有效期 24 小时。默认每邮箱每日最多接收 100 封、每封 256 KiB（均可配置）。入站邮件只写入已激活且未过期的邮箱；直接向任意未创建地址投递不再受支持。
- 使用 SQLite Durable Objects 保存额度和 Key 授权，账号、Key 管理记录、邮件及聚合统计保存在 D1。需 Cloudflare 支持这些资源的计划。限流不是 Cloudflare 总账单硬封顶，Worker/DO 请求、存储与日志仍会计费。

## 1. 准备配置

复制 .env.example 为不提交 Git 的 .env，保留原 D1 ID、名称和邮件域名。不要在公共 wrangler.toml 或前端填写密钥。

网页模式必填：D1_DATABASE_ID、D1_DATABASE_NAME、EMAIL_DOMAIN、MAILBOX_TOKEN_SECRET。用密码管理器或 openssl rand -base64 48 生成独立随机密钥。升级时保留已存在的 MAILBOX_TOKEN_SECRET。

需要登录及 API 时填写：

| 配置 | 说明 |
| --- | --- |
| BETTER_AUTH_URL | 自己的 HTTPS 站点 origin，例如 https://mail.example.com，不含路径 |
| BETTER_AUTH_SECRET | 独立随机密钥，至少 32 字符，签名登录会话 |
| API_KEY_SECRET | 另一独立随机密钥，至少 32 字符；轮换使已签发 API Key 失效 |
| GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET | 自己的 GitHub OAuth 应用 |
| GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET | 自己的 Google OAuth Web 应用 |
| ADMIN_EMAILS | 首个管理员的 OAuth 已验证邮箱，多个用英文逗号分隔 |
| ENABLE_OPENAPI | 配置及测试完成后设为 true，默认 false |

GitHub callback：https://mail.example.com/api/auth/callback/github。
Google authorized redirect URI：https://mail.example.com/api/auth/callback/google；authorized JavaScript origin 为站点 origin。Google 应用处于 Testing 时需添加测试用户；对外开放前按 Google 要求发布应用。不要为不可信 Provider 开启自动关联。

OAuth 可以暂不配置：保留 ENABLE_OPENAPI=false，网页邮箱仍可使用，登录弹框会提示尚未配置。缺少邮箱签名密钥时部署检查失败，页面也显示配置提示。不要使用仓库维护者的 OAuth 凭据部署自己的实例。

## 2. 设置管理员

第一次将自己的已验证 OAuth 邮箱写入 ADMIN_EMAILS（Worker Secret 或部署环境变量），然后登录。顶部会出现“管理”入口，后台路径 /admin。首次注册用户不会自动成为管理员。

已有管理员可在用户详情中授予或取消其他用户的管理员角色。不能修改自己的角色；ADMIN_EMAILS 指定的管理员需先从该配置移除才能撤销。后台授权逐次读取角色，不能通过修改浏览器数据或登录请求中的 role 提权。

管理员可分页浏览所有注册用户、用户的 Key、邮箱及最近 30 天每日调用/创建/收件统计。历史匿名流量不能归属到新用户，统计从升级后开始。API 调用表示通过 Key 校验并消耗用户额度的请求，包含随后发生的业务错误或全站额度拒绝。无效 Key 或用户额度拦截的请求不计入该数。统计约 5 分钟延迟；后台不显示完整 Key 或邮件正文。

## 3. 部署

依次运行：

    pnpm install --frozen-lockfile
    pnpm setup:check
    pnpm run deploy

部署脚本校验配置、执行测试/类型检查/构建、应用 D1 迁移、上传 Secrets，最后部署 Worker 和 Durable Object migration。生成的 wrangler.deploy.toml 不含 Secrets，被 Git 忽略。Cloudflare 授权使用 CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID，兼容原 CF_API_TOKEN / CF_ACCOUNT_ID。

GitHub Actions 部署者：在仓库 Actions Secrets 中补齐上述配置，特别是 MAILBOX_TOKEN_SECRET；工作流使用同一脚本。先以 ENABLE_OPENAPI=false 完成升级并验证，再设为 true 重新部署。配置未通过检查时，迁移和部署不会开始。原有 Secret 应从现有部署配置保留，不要重新生成。

迁移会停用旧 Key。回滚旧 Worker 不会自动恢复旧 Key，也不能删除新建 DO class 或回退数据库表。优先保持新版 Worker，设置 ENABLE_OPENAPI=false 排查。数据恢复需使用预先保存的恢复点，并评估 D1 与 DO 授权记录的一致性。

## 4. 验证和费用防护

1. /api-docs 显示登录弹框，GitHub、Google 均能回到自己的站点。
2. 普通用户可创建 3 个 Key，第 4 个被拒；撤销后旧 Key 立即失效，新 Key 共享原额度。
3. 无凭证调用 /api/emails 返回 401，普通用户调用管理员接口返回 403。
4. 验证邮箱创建、收件、正文读取、删除、凭证恢复，以及管理员入口。
5. 监测 Workers/DO 请求量、D1 rows_read / rows_written 和 CPU；配置告警及套餐支持的 WAF 规则。关闭不需要的预览入口，防止绕过域名 WAF。

默认每用户 30 请求/分钟、1,000 请求/天、20 邮箱/天、20 有效邮箱。匿名网页另有 IP/邮箱额度。GLOBAL_API_DAILY_LIMIT=100000 覆盖 HTTP 数据库路径（含网页、认证）；GLOBAL_INBOUND_DAILY_LIMIT=100000 单独覆盖入站邮件。全站额度拆分到 16 个固定分片，额度之和不超过配置值，但繁忙分片可能提前耗尽。各日额度 UTC 00:00 重置。

ENABLE_OPENAPI=false 仅暂停公开 API 和创建 Key。SUSPEND_DATABASE_ACCESS=true 暂停 HTTP 数据库入口、入站邮件和定期邮件清理；已排队的统计汇总可能仍完成少量写入。Worker/DO 拒绝请求本身仍计费，不能用这些开关保证零费用。

本地开发：复制 .dev.vars.example 为 .dev.vars，使用独立的测试密钥和 localhost OAuth 应用。运行 pnpm exec wrangler d1 migrations apply DB --local 后 pnpm dev。禁止把生产凭据注入测试代码。

GitHub Actions Secrets: use GH_OAUTH_CLIENT_ID and GH_OAUTH_CLIENT_SECRET (GitHub reserves the GITHUB_ prefix). The workflow maps these to Worker GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET.

## v3.1 管理员操作与调用日志

应用 0005_admin_moderation_logs.sql 后，/admin 新增全站 API 调用日志、按用户筛选及游标分页；不需要新增环境变量。日志只记录通过 Key 和额度校验后的请求（包含业务错误），记录接口模板、HTTP 状态和业务处理耗时，不保存完整 Key、请求参数、IP 或邮件正文。日志通常延迟约 1 分钟，管理员只可查询最近 7 天，过期记录每小时分批清理（每批最多 5,000 条，积压时物理删除会延后）。每用户待写缓存最多 2,000 条，异常积压时可能丢弃新日志。批量写入仍按 D1 写入行计费，日志不是零成本或完整审计保证。

“禁用全部 Key”使现有 Key 立即失效，用户仍可创建新 Key，账号额度不重置。“封禁用户”同时禁用 Key、撤销登录会话、拒绝新登录和账号所属邮箱的读写与收件；解封不恢复旧 Key。不能封禁自己或现有管理员，需先撤销目标管理员角色；ADMIN_EMAILS 管理员需先调整配置。已通过鉴权的在途请求可能完成。匿名网页继续按 IP 限制使用，账号封禁不等于封禁这个人的全部匿名访问。
