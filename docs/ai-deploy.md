# 1. 目标与部署产物

本文档用于让 AI 助手直接读取并执行部署Github项目：https://github.com/oiov/vmail 。目标是将 vmail 部署到 Cloudflare Workers + D1，并启用以下能力：

- 站点统计增长率（today vs yesterday）
- Turnstile 可选（未配置密钥时自动 bypass）
- 站点密码访问控制（`PASSWORD` 可选）
- API Key 每分钟限速（环境变量可配置，默认 `100`）

部署后关键接口合同：

- `GET /config` 返回：`turnstileEnabled`、`sitePasswordEnabled`、`apiRateLimitPerMinute`、`openApiEnabled`
- `GET /api/stats` 返回：`totals`、`today`、`yesterday`
- `POST /auth/unlock`、`GET /auth/status`、`POST /auth/logout`

# 2. 前置条件与账号准备

在开始前确认：

- 已安装 Node.js 18+ 与 pnpm
- 已安装 Wrangler CLI（`npx wrangler --version` 可运行）
- 已登录 Cloudflare（`npx wrangler login`）
- 已在 Cloudflare 创建 D1 数据库并拿到：
  - `D1_DATABASE_NAME`
  - `D1_DATABASE_ID`
- 准备好站点域名配置 `EMAIL_DOMAIN`（支持逗号分隔多域名）

推荐在仓库根目录执行全部命令。

# 3. 必填与可选环境变量

需要在部署环境中提供以下变量（与 `wrangler.toml` 对齐）：

- `EMAIL_DOMAIN`（必填）
- `COOKIES_SECRET`（必填，建议高强度随机字符串）
- `TURNSTILE_KEY`（可选）
- `TURNSTILE_SECRET`（可选）
- `PASSWORD`（可选；为空时站点默认公开）
- `API_RATE_LIMIT_PER_MINUTE`（可选；非法值或缺省回退到 `100`）
- `ENABLE_OPENAPI`（可选；默认开启，设置为 `false` 时禁用 API Key 创建与 `/api/v1/*`）

行为说明：

- 当 `TURNSTILE_KEY` 和 `TURNSTILE_SECRET` 任一缺失时，前后端都进入“无需人机验证”模式。
- 当 `PASSWORD` 为空时，前端不会出现站点解锁门禁；有值时需要先解锁站点。
- `API_RATE_LIMIT_PER_MINUTE` 作用于 v1 API Key 中间件，按“每个 API Key、每分钟固定窗口”限流。
- 当 `ENABLE_OPENAPI=false` 时，`/api/api-keys` 与 `/api/v1/*` 会统一返回 `403 OPENAPI_DISABLED`，`/api-docs` 页面仅展示提示。

# 4. 数据库迁移与基础初始化

项目 D1 迁移目录为：`worker/drizzle`。

建议顺序：

1. 确保 `wrangler.toml` 的 D1 绑定配置正确。
2. 执行迁移到远端 D1（根据你的 Cloudflare 环境选择对应命令）。
3. 确认新增表存在：
   - `daily_stats`
   - `api_rate_limits`

`api_rate_limits` 采用复合主键：

- `api_key_id`
- `window_start_epoch_sec`

该设计用于支持原子 UPSERT 计数，避免并发下限流计数漂移。

# 5. 构建与部署步骤

按以下顺序执行：

1. 安装依赖：`pnpm install`
2. 本地构建：`pnpm build`
3. 部署 Worker（按你的环境执行 wrangler deploy）
4. 如有自定义域名或路由，完成 Cloudflare 路由绑定

构建成功标准：

- `frontend` 构建完成
- `worker` 打包无阻断错误
- 允许存在体积告警（chunk size warning）但不应有构建失败

# 6. 部署后验收清单（可直接给 AI 执行）

最小验收用例：

1. 配置合同：
   - 请求 `GET /config`
   - 断言返回字段包含：
     - `turnstileEnabled`
     - `sitePasswordEnabled`
     - `apiRateLimitPerMinute`
     - `openApiEnabled`
2. 统计合同：
   - 请求 `GET /api/stats`
   - 断言返回结构含 `totals/today/yesterday`
3. 站点密码：
   - `PASSWORD` 为空时：页面可直接访问
   - `PASSWORD` 有值时：
     - 未解锁访问页面受限
     - `POST /auth/unlock` 成功后可访问
     - `GET /auth/status` 返回 `unlocked: true`
4. Turnstile 可选：
   - 未配置密钥时，创建邮箱地址流程可直接通过
   - 配置密钥后，需有效 token
5. API 限速：
   - 使用同一 API Key 连续请求 v1 API
   - 超过阈值返回 `429`
   - 响应头包含：`X-RateLimit-Limit`、`X-RateLimit-Remaining`、`Retry-After`
   - 若 `ENABLE_OPENAPI=false`：`/api/api-keys` 与 `/api/v1/*` 返回 `403`
6. 前端展示：
   - 首页 SiteStats 卡片显示增长率（today vs yesterday）
   - `/api-docs` 在 `openApiEnabled=false` 时展示禁用提示

# 7. 常见问题与回滚策略

常见问题：

- 迁移失败：优先检查 D1 绑定、数据库 ID、迁移目录是否正确。
- 站点一直锁定：检查 `PASSWORD` 是否设置、浏览器是否保存了解锁 cookie。
- 限速不生效：确认请求走的是 v1 API，并携带 API Key。
- Turnstile 状态异常：确认前后端读取的是同一组环境变量。

回滚策略：

1. 先回滚 Worker 版本（代码回滚）。
2. 若需要回滚数据结构，按 D1 迁移策略执行逆向迁移或恢复备份。
3. 回滚后重复执行“部署后验收清单”中的 1~3 项，确保服务可用。
