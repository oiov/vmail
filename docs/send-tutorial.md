## 发送邮件部署教程

### 准备工作

- 继续使用收件教程中托管到 cf 的域名
- DKIM（可选）

### 1. 创建发件 worker

这里使用手动创建的方式：

- 进入 Cloudflare 控制台 `https://dash.cloudflare.com/`，点击侧边栏 `Workers 和 Pages`
- 点击`创建应用程序` -> `创建 worker` -> 名称随意，比如 `sender` -> 点击 `部署`
- 进入到该 worker，点击 `编辑代码`，将以下[代码](/docs/send-worker.js)粘贴进去：

<details>
<summary>查看sender worker代码</summary>
<pre ><code>/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
async function readRequestBody(request, env) {
  const { headers } = request;
  const contentType = headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return JSON.stringify(await request.json());
  } else if (contentType.includes("form")) {
    const formData = await request.formData();
    const body = {};
    for (const entry of formData.entries()) {
      body[entry[0]] = entry[1];
    }
    let data = JSON.parse(JSON.stringify(body));
    let combine = `{"personalizations":[{"to":[{"email":"${data.to}","name":"${data.ton}"}],"dkim_domain":"${env.DKIM_DOMAIN}","dkim_selector":"${env.DKIM_SELECTOR}","dkim_private_key":"${env.DKIM_PRIVATE_KEY}"}],"from":{"email":"${data.from}","name":"${data.fromn}"},"reply_to":{"email":"${data.rep}","name":"${data.repn}"},"subject":"${data.sbj}","content":[{"type":"${data.type}","value":"${data.body}"}]}`;
    return combine;
  } else {
    return '{"success":false}';
  }
}
async function handleRequest(request, env) {
  let start = Date.now();
  let reqBody = await readRequestBody(request, env);
  let send_request = new Request("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: reqBody,
  });
  let resp = await fetch(send_request);
  let respText = await resp.text();
  let end = Date.now();
  let total = end - start;
  return new Response(respText, {
    headers: {
      "X-MC-Status": resp.status,
      "X-Response-Time": total,
    },
  });
}
const htmlForm = `<!DOCTYPE html>
<html>
<head>
<meta content="width=device-width,initial-scale=1" name="viewport">
<title>Submit your email</title>
<body>
(*) is required
<form action="/" method="POST" autocomplete="on">
<input name="from" type="email" placeholder="sender@example.com *" required><br>
<input name="fromn" type="text" placeholder="Sender Name"><br>
<input name="to" type="email" placeholder="receiver@example.com *" required><br>
<input name="ton" type="text" placeholder="Receiver Name"><br>
<input name="rep" type="email" placeholder="reply-to@example.com"><br>
<input name="repn" type="text" placeholder="Replier Name"><br>
<select name="type">
<option value="text/html; charset=utf-8">HTML</option>
<option value="text/plain; charset=utf-8" selected>Plain</option>
</select><br>
<input name="sbj" type="text" placeholder="Email Subject *" required><br>
<textarea name="body" rows="7" cols="23" placeholder="Email Body *" required></textarea><br>
<input type="submit" value="submit">
</form>
</body>
</html>`;
export default {
  async fetch(request, env, ctx) {
    const { url } = request;
    if (url.includes("submit")) {
      return new Response(htmlForm, {
        headers: { "Content-Type": "text/html" },
      });
    }
    if (request.method === "POST") {
      return handleRequest(request, env);
    } else if (request.method === "GET") {
      return new Response(`The request was a GET`);
    }
  },
};
</code></pre>
</details>

继续保存并部署

- 在 worker 的 `设置` -> `变量` 中添加以下变量：

| 变量名           | 说明                        | 示例                  |
| ---------------- | --------------------------- | --------------------- |
| DKIM_DOMAIN      | 必填，域名后缀              | `vmail.dev`           |
| DKIM_PRIVATE_KEY | 必填，DKIM 私钥             | `MIIEpQIBAAKCAQEA...` |
| DKIM_SELECTOR    | 必填，固定值 `mailchannels` | `mailchannels`        |

`DKIM_PRIVATE_KEY` 后续会提到如何获取。

记住 worker 分配的地址，即 `https://<worker-name>.<your-name>.workers.dev`，后面会用到。

### 2. 准备 DKIM 私钥（可选）

> DKIM 是一种电子邮件认证技术，可以验证邮件的发送者身份。

在终端执行下面的命令，生成 DKIM 私钥，参考 [Adding-a-DKIM-Signature](https://support.mailchannels.com/hc/en-us/articles/7122849237389-Adding-a-DKIM-Signature)：

```bash
openssl genrsa 2048 | tee private_key.pem | openssl rsa -outform der | openssl base64 -A > private_key.txt

echo -n "v=DKIM1;p=" > dkim_record.txt && openssl rsa -in private_key.pem -pubout -outform der | openssl base64 -A >> dkim_record.txt
```

这两条命令会生成3个文件：

- `private_key.pem`：私钥文件
- `private_key.txt`：私钥文件，base64 编码
- `dkim_record.txt`：DKIM 记录
  
其中 `private_key.txt` 文件中的内容就是上一步 `DKIM_PRIVATE_KEY` 变量的值。

### 3. 配置 DNS

进入 Cloudflare 托管域名控制台，选择你的域名 -> 点击 `DNS`，接下来，需要**添加3条TXT记录**并**修改1条TXT记录**。

新增的如下：

| 类型 | 名称                      | 值                                                                                   | 备注                                |
| ---- | ------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------- |
| TXT  | `_dmarc`                  | `v=DMARC1; p=reject; adkim=s; aspf=s; rua=mailto:YYY; ruf=mailto:YYY pct=100; fo=1;` | 固定值                              |
| TXT  | `mailchannels._domainkey` | `v=DKIM1;p=MIIEpQIBAAKCAQEA...`                                                      | 值为 `dkim_record.txt` 文件的内容   |
| TXT  | `_mailchannels`           | `v=mc1 cfid=yesmore.workers.dev`                                                     | 将其中的 yesmore 修改为你的账号名称 |

需要修改的如下（TXT记录值为 `example.com` 即你的域名的那条）：

| 类型 | 名称          | 值                                                                          | 备注                     |
| ---- | ------------- | --------------------------------------------------------------------------- | ------------------------ |
| TXT  | `example.com` | `v=spf1 include:_spf.mx.cloudflare.net include:relay.mailchannels.net ~all` | 把值替换为这个，其他不动 |

最后一共4条TXT记录：

![](https://img.inke.app/file/b7422917c667de620ae95.png)

在 [dkim-record-checker](https://dmarcly.com/tools/dkim-record-checker) 验证 DKIM 记录是否配置成功。

### 4. 验证发送

方法一：打开网页 `https://<sender-name>.<your-name>.workers.dev/submit` 验证是否可以正常发送

方法二：使用 API 发送

- 请求地址 `https://<sender-name>.<your-name>.workers.dev`
- 请求方法 `POST`
- 请求体：

```json
{
  "from": {
      "email": "sender@vmail.dev",
      "name": "发送者"
  },
  "personalizations": [
    {
      "to": [
        {
          "email": "example@gmail.com",
          "name": "接收者"
        }
      ]
    }
  ],
  "subject": "邮件标题",
  "content": [
    {
      "type": "text/plain",
      "value": "邮件内容"
    }
  ]
}
```

示例：

![](https://img.inke.app/file/1f6f3ab53aff9a1855475.png)


### 5. 添加环境变量

此项目使用第4步中的方法二通过 API 发送邮件。

在 Vercel 项目控制台中，进入 `Settings` -> `Environment Variables`，添加以下变量：

- SEND_WORKER_URL：值为 `https://<sender-name>.<your-name>.workers.dev`

添加后重新触发部署一次即可。