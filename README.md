<div align="center">
  <h1>𝐕𝐌𝐀𝐈𝐋.𝐃𝐄𝐕</h1>
  <p><a href="https://github.com/yesmore/vmail/blob/main/README_en.md">English</a> | 简体中文</p>
  <p>使用 Cloudflare email worker 实现的临时电子邮件服务</p>
  <img src="https://img.inke.app/file/beb0212f96c6cd37eaeb8.jpg"/>
</div>

## 🌈 特点

- 🎯 隐私友好，无需注册，开箱即用
- ✨ 更好的 UI 设计，更加简洁
- 🚀 快速部署，无需服务器

原理：

- Email worker 接收电子邮件
- 前端显示电子邮件（remix）
- 邮件存储（sqlite）

> worker接收电子邮件 -> 保存到数据库 -> 客户端查询电子邮件

## 👋 自部署教程

### 准备工作

- [Cloudflare](https://dash.cloudflare.com/) 账户与托管在 Cloudflare 上的域名
- [turso](https://turso.tech) sqlite 数据库（个人免费计划足够）
- [Vercel](https://vercel.com) 或 [fly.io](https://fly.io) 账号部署前端用户界面

### 步骤

**1.注册一个 [turso](https://turso.tech) 账户，创建数据库，并创建一个`emails`表**

注册后，系统会提示您创建一个数据库。在这里我将其命名为 `vmail`，

![](https://img.inke.app/file/3773b481c78c9087140b1.png) 

然后，创建一个名为 `emails` 的表。

选择您的数据库，您会看到“编辑表”按钮，点击并进入:

![](https://img.inke.app/file/d49086f9b450edd5a2cef.png) 

> ⚠️ 注意：**左上角有一个加号按钮，我尝试点击它没有任何提示或效果，所以我使用了 turso 提供的 cli 来初始化表。**

Cli 文档：https://docs.turso.tech/cli/introduction 

Linux (或 mac/windows) 终端执行：

```bash
# 安装（安装后记得重启终端生效）
curl -sSfL https://get.tur.so/install.sh | bash

# 登录账户
turso auth login

# 连接到您的Turso数据库
turso db shell <database-name>
```

将sql脚本复制到终端运行（packages/database/drizzle/0000_sturdy_arclight.sql）

<details>
<summary>查看脚本内容</summary>
<pre ><code>CREATE TABLE `emails` (
 `id` text PRIMARY KEY NOT NULL,
 `message_from` text NOT NULL,
 `message_to` text NOT NULL,
 `headers` text NOT NULL,
 `from` text NOT NULL,
 `sender` text,
 `reply_to` text,
 `delivered_to` text,
 `return_path` text,
 `to` text,
 `cc` text,
 `bcc` text,
 `subject` text,
 `message_id` text NOT NULL,
 `in_reply_to` text,
 `references` text,
 `date` text,
 `html` text,
 `text` text,
 `created_at` integer NOT NULL,
 `updated_at` integer NOT NULL
);
</code></pre>
</details>

**2.部署 email worker**

```bash
git clone https://github.com/yesmore/vmail

cd vmail

# 安装依赖
pnpm install
```

在 `vmail/apps/email-worker/wrangler.toml` 文件中填写必要的环境变量。

- TURSO_DB_AUTH_TOKEN（第1步中的turso表信息，点击“Generate Token”）
- TURSO_DB_URL（例如 libsql://db-name.turso.io）
- EMAIL_DOMAIN (域名，如 vmail.dev)
  
> 如果您不执行此步骤，可以在Cloudflare的 worker settings 中添加环境变量

然后运行命令：

```bash
cd apps/email-worker

# 需要 Node 环境，并且需要安装 wrangler cli 并在本地登录，参考 https://developers.cloudflare.com/workers/wrangler/install-and-update
pnpm run deploy
```

**3.配置电子邮件路由规则**

设置“Catch-all”操作为发送到 email worker：

![](https://img.inke.app/file/fa39163411cd35fad0a7f.png) 

**4.在 Vercel 或 fly.io 上部署 Remix 应用程序**

确保在部署期间准备并填写以下环境变量（`.env.example`）：

| 变量名                 | 说明                                 | 示例                        |
| ---------------------- | ------------------------------------ | --------------------------- |
| COOKIES_SECRET         | 必填，cookie加密密钥                 | `my-secret-key`             |
| TURNSTILE_KEY          | 必填，网站验证所需的Turnstile Key    | `my-turnstile-key`          |
| TURNSTILE_SECRET       | 必填，网站验证所需的Turnstile Secret | `my-turnstile-secret`       |
| TURSO_DB_RO_AUTH_TOKEN | 必填，turso数据库只读凭据            | `my-turso-db-ro-auth-token` |
| TURSO_DB_URL           | 必填，turso数据库URL                 | `libsql://db-name.turso.io` |
| EMAIL_DOMAIN           | 必填，域名后缀                       | `vmail.dev`                 |
| EXPIRY_TIME            | 可选，过期时间，单位秒，默认86400    | `86400`                     |

**Vercel:** 

推荐使用一键部署按钮（一步 `fork + deploy` 此仓库）：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyesmore%2Fvmail&env=COOKIES_SECRET&env=TURNSTILE_KEY&env=TURNSTILE_SECRET&env=TURSO_DB_RO_AUTH_TOKEN&env=TURSO_DB_URL&env=EMAIL_DOMAIN&project-name=vmail&repository-name=vmail)

或手动将代码推送到你的 Github 仓库，并在 Vercel 面板中创建项目。选择 `New project`，然后导入对应的 Github 仓库，填写环境变量，选择 `Remix` 框架，点击 `Deploy`，等待部署完成。

部署完后继续点击 Countinu to Dashboard，进入 Settings -> General，修改下面设置：

![](https://img.inke.app/file/573f842ccbefdf8daf319.png)
![](https://img.inke.app/file/36c1566d8c27735bb097d.png)

**然后进入 Deployments 重新部署一次，或向 github 推送代码重新触发部署**。

**fly.io:** 

```bash
cd vmail/apps/remix 
fly launch
```
  
**5.部署成功后在 cloudflare 添加域名解析(A记录)到对应平台，就可以愉快的玩耍了**

vercel 演示如何解析：

![](https://img.inke.app/file/245b71636cd16afcf93c7.png)

![](https://img.inke.app/file/e10af19334fd6a13b7d2e.png)

以上，完成！

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

[![Star History Chart](https://api.star-history.com/svg?repos=yesmore/vmail&type=Date)](https://star-history.com/#yesmore/vmail&Date)
