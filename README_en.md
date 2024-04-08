<div align="center">
  <h1>𝐕𝐌𝐀𝐈𝐋.𝐃𝐄𝐕</h1>
  <p><a href="https://discord.gg/d68kWCBDEs">Discord</a> · English | <a href="/README.md">简体中文</a></p>
  <p>Temporary email service build with email worker.</p>
  <img src="https://img.inke.app/file/beb0212f96c6cd37eaeb8.jpg"/>
</div>

## Features

- 🎯 Privacy-friendly, no registration required, out-of-the-box
- ✈️ Support email sending and receiving
- ✨ Better UI design, more concise
- 🚀 100% open source, quick deployment, no server required

Principles： 

- Receiving emails (email worker)
- Display email (remix)
- Mail Storage (sqlite)

> Worker receives email -> saves to database -> client queries email

## Self-hosted Tutorial

### Requirements

- [Cloudflare](https://dash.cloudflare.com/) account and a domain name hosted on Cloudflare
- [turso](https://turso.tech) sqlite (a free plan available for personal use)
- [Vercel](https://vercel.com) or [fly.io](https://fly.io) to deploy Remix app

### Receiving Emails steps

See [receive-tutorial-en.md](/docs//receive-tutorial-en.md)

### Sending Emails steps

See [send-tutorial-en.md](/docs/send-tutorial-en.md)

## Local development

copy `apps/remix/.env.example` to `apps/remix/.env` and fill in the necessary environment variables.

```bash
cd path-to/vmail/ # root directory
pnpm install

# run on localhost:3000
pnpm run remix:dev
```

## Community Group

- 加微信 `yesmore_cc` 拉讨论群 (**备注你的职业**)
- Discord: https://discord.gg/d68kWCBDEs

## License

GNU General Public License v3.0

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=oiov/vmail&type=Date)](https://star-history.com/#oiov/vmail&Date)

Inspired by smail.pw & email.ml