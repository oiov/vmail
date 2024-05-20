## 接收邮件部署教程

**1.注册一个 [turso](https://turso.tech) 账户，创建数据库，并创建一个`emails`表**

注册后，系统会提示您创建一个数据库。在这里我将其命名为 `vmail`，

![](https://img.inke.app/file/3773b481c78c9087140b1.png) 

然后，创建一个名为 `emails` 的表。

选择您的数据库，您会看到“编辑表”按钮，点击并进入，继续点击左上角的 `SQL runner` 按钮，将[sql脚本](https://github.com/oiov/vmail/blob/main/packages/database/drizzle/0000_sturdy_arclight.sql)复制到终端运行:

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

<details>
<summary>手动创建表（旧版方法）</summary>
Cli 文档：https://docs.turso.tech/cli/introduction 

Linux (或 mac/windows) 终端执行：

# 安装（安装后记得重启终端生效）
curl -sSfL https://get.tur.so/install.sh | bash
# 登录账户
turso auth login
# 连接到您的Turso数据库
turso db shell <database-name>
</details>

**2.部署 email worker**

需要准备 Node 环境（推荐 18.x 及以上），并且需要安装 wrangler cli 并在本地登录，参考 https://developers.cloudflare.com/workers/wrangler/install-and-update (登录时建议开启VPN)

```bash
# 安装 pnpm 
npm install -g pnpm
```

```bash
git clone https://github.com/oiov/vmail

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

pnpm run deploy
```

**3.配置电子邮件路由规则**

设置“Catch-all”操作为发送到 email worker：

![](https://img.inke.app/file/fa39163411cd35fad0a7f.png) 

**4.在 Vercel 或 fly.io 上部署 Remix 应用程序**

确保在部署时准备并填写以下环境变量（`.env.example`）：

| 变量名                 | 说明                                  | 示例                        |
| ---------------------- | ------------------------------------- | --------------------------- |
| COOKIES_SECRET         | 必填，cookie加密密钥，随机字符串      | `12345abcde`                |
| TURSO_DB_RO_AUTH_TOKEN | 必填，turso数据库只读凭据             | `my-turso-db-ro-auth-token` |
| TURSO_DB_URL           | 必填，turso数据库URL                  | `libsql://db-name.turso.io` |
| EMAIL_DOMAIN           | 必填，域名后缀，支持多个              | `vmail.dev,meetu.dev`       |
| EXPIRY_TIME            | 可选，邮箱过期时间，单位秒，默认86400 | `86400`                     |
| TURNSTILE_KEY          | 可选，网站验证所需的 Turnstile Key    | `my-turnstile-key`          |
| TURNSTILE_SECRET       | 可选，网站验证所需的 Turnstile Secret | `my-turnstile-secret`       |

获取 `TURNSTILE_KEY`、`TURNSTILE_SECRET` 请前往 cloudflare 控制台 https://dash.cloudflare.com/?to=/:account/turnstile

**Vercel:** 

推荐使用一键部署按钮（此操作会在你的github账户中自动创建vmail仓库并关联部署到vercel）：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Foiov%2Fvmail&env=COOKIES_SECRET&env=TURNSTILE_KEY&env=TURNSTILE_SECRET&env=TURSO_DB_RO_AUTH_TOKEN&env=TURSO_DB_URL&env=EMAIL_DOMAIN&project-name=vmail&repository-name=vmail)

或手动将代码推送到你的 Github 仓库，并在 Vercel 面板中创建项目。选择 `New project`，然后导入对应的 Github 仓库，填写环境变量，选择 `Remix` 框架，点击 `Deploy`，等待部署完成。

部署完后继续点击 Countinu to Dashboard，进入 Settings -> General，修改下面设置：

![](https://img.inke.app/file/573f842ccbefdf8daf319.png)

注意一定要修改目录为 `apps/remix`，否则部署后访问网站会出现`404`错误：

![](https://img.inke.app/file/36c1566d8c27735bb097d.png)

**然后进入 Deployments 重新部署一次，或向 github 推送代码重新触发部署**。

**fly.io:** 

```bash
cd vmail/apps/remix 
fly launch
```
  
**5.部署成功后在 cloudflare 添加域名解析(A记录)到对应平台**

vercel 演示如何解析：

![](https://img.inke.app/file/245b71636cd16afcf93c7.png)

![](https://img.inke.app/file/e10af19334fd6a13b7d2e.png)

**6.在CF域名控制台修改加密模式为完全（或严格）**

> 若不修改，访问网站会出现`重定向次数过多`错误

![](https://img.vmail.dev/api/img/KK8Qwp)

以上，完成！
