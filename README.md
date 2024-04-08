<div align="center">
  <h1>𝐕𝐌𝐀𝐈𝐋.𝐃𝐄𝐕</h1>
  <p><a href="https://discord.gg/d68kWCBDEs">Discord</a> · <a href="https://github.com/oiov/vmail/blob/main/README_en.md">English</a> | 简体中文</p>
  <p>使用 Cloudflare email worker 实现的临时电子邮件服务</p>
  <img src="https://img.inke.app/file/beb0212f96c6cd37eaeb8.jpg"/>
</div>

## 🌈 特点

- 🎯 隐私友好，无需注册，开箱即用
- ✈️ 支持邮件收发
- ✨ 更好的 UI 设计，更加简洁
- 🚀 快速部署，无需服务器

收件原理：

- Email worker 接收电子邮件
- 前端显示电子邮件（remix）
- 邮件存储（sqlite）

发件原理：

- 手打中...

## 👋 自部署教程

### 准备工作

- [Cloudflare](https://dash.cloudflare.com/) 账户与托管在 Cloudflare 上的域名
- [turso](https://turso.tech) sqlite 数据库（个人免费计划足够）
- [Vercel](https://vercel.com) 或 [fly.io](https://fly.io) 账号部署前端用户界面

### 接收邮件教程

查看 [receive-tutorial.md](/docs/receive-tutorial.md)

### 发送邮件教程

查看 [send-tutorial.md](/docs/send-tutorial.md)

## 🔨 本地运行调试

复制 `apps/remix/.env.example` 到 `apps/remix/.env` 并填写必要的环境变量。

```bash
cd path-to/vmail/ # 根路径
pnpm install

# 运行 localhost:3000
pnpm run remix:dev
```

## ❤️ 交流群

- 加微信 `yesmore_cc` 拉讨论群 (**备注你的职业**)
- Discord: https://discord.gg/d68kWCBDEs

## 🎨 Inspired By

Please check out these previous works that helped inspire the creation of vmail. 🙏

- [akazwz/smail](https://github.com/akazwz/smail)
- [email.ml](email.ml)

## 📝 License

GNU General Public License v3.0

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=oiov/vmail&type=Date)](https://star-history.com/#oiov/vmail&Date)
