# Changelog

## v3.2.3 — 2026-11-21

- 恢复被旧版本部署覆盖的账户邮箱重新启用按钮、管理员旧邮箱补绑及操作审计。
- 恢复每账户同时启用 100 个邮箱的配置；保留每日新建 20 个及收件后 24 小时清理邮件的规则。

## v3.2.2 — 2026-10-20

- 登录用户可在「我的邮箱」重新启用自己已过期的地址，恢复收件 24 小时；不恢复已清理邮件。
- 管理员用户详情页新增旧邮箱补绑：人工归属确认、预检查、逐地址结果与审计记录；拒绝覆盖其他账户或有效匿名邮箱。
- 同时有效邮箱默认上限从 20 调整为 100；每日新建额度仍为 20。恢复不消耗新建额度，受独立限频与有效邮箱上限约束。
- 补绑同步 D1 与 Durable Object；发生部分失败可重试。恢复后的邮箱要求账户授权，旧匿名凭证不能单独读取邮件。
- Apply migration `0007_mailbox_recovery.sql` before deployment. Preserve signing secrets and explicitly update existing `MAX_ACTIVE_MAILBOXES=20` overrides to `100`.

## v3.2.1 — 2026-10-18

### 发件权限与管理

- 网页发件要求登录、未封禁账户和有效邮箱凭证；拒绝使用其他用户拥有的邮箱。
- 新增每用户/全站发件日额度，默认 10 / 100 次，跨邮箱共享用户额度；保留用户、邮箱、IP 分钟限制。失败尝试计入，UTC 零点重置。
- 新增用户发件记录、管理员全站发件管理、用户筛选和正文详情；概览纳入发件统计。
- 保存主题、正文、收发地址和结果 30 天；HTML 隔离预览，不加载远程资源。成功仅表示服务商已接收。

### 界面与文档

- 首页在宽屏/高屏下充分利用空间，左右区域等高；统计卡片移至收件箱下方，空状态展示动画。
- 修复单封邮件行被拉高导致的垂直居中；邮件列表保持顶部对齐。
- 恢复 GitHub Star 按钮并修正导航下拉箭头对齐。
- 发件弹框统一深绿配色，显示额度，修复手机滚动及字段对比度。
- README 加入真实本地演示截图；中英文配置、OAuth 回调、Actions 变量映射、本地开发及升级文档与代码同步。

### 升级

部署前应用 0006_outbound_logs.sql（pnpm deploy 自动执行）。新增 SEND_USER_DAILY_LIMIT=10、SEND_GLOBAL_DAILY_LIMIT=100；Actions 中在 Repository Variables 配置。完整步骤见 [中文升级指南](docs/UPGRADE.md) / [English upgrade guide](docs/UPGRADE.en.md)。保留既有数据库和签名密钥；现有 API Key 继续有效。未配置 OAuth 的实例仍可匿名收件，但无法发件。

### English

- Require sign-in for sending, enforce shared per-user and site daily quotas, and block banned users and cross-account mailbox use.
- Add personal sent history, administrator content review, filtering and send statistics; retain outgoing content/results for 30 days with sandboxed HTML previews.
- Fix homepage height, inbox top alignment, navigation controls and the dark/mobile compose dialog.
- Refresh bilingual configuration, OAuth, Actions, local development and upgrade documentation, with demo screenshots.
- Upgrade requires migration 0006 and introduces SEND_USER_DAILY_LIMIT / SEND_GLOBAL_DAILY_LIMIT (10 / 100 by default). Preserve existing signing secrets and API keys.
