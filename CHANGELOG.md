# Changelog

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
