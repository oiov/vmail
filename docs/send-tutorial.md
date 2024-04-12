## 发送邮件部署教程

### 准备工作

- 继续使用收件教程中托管到 cf 的域名
- DKIM（可选）

### 1. 创建发件 worker

这里使用手动创建的方式：

- 进入 Cloudflare 控制台 `https://dash.cloudflare.com/`，点击侧边栏 `Workers 和 Pages`
- 点击`创建应用程序` -> `创建 worker` -> 名称随意，比如 `sender` -> 点击 `部署`
- 进入到该 worker，点击 `编辑代码`，将代码 [send-worker.js](/docs/send-worker.js) 粘贴进去并保存部署
- 在 worker 的 `设置` -> `变量` 中添加以下变量：

| 变量名           | 说明                        | 示例                  |
| ---------------- | --------------------------- | --------------------- |
| DKIM_DOMAIN      | 可选，域名后缀              | `vmail.dev`           |
| DKIM_PRIVATE_KEY | 可选，DKIM 私钥             | `MIIEpQIBAAKCAQEA...` |
| DKIM_SELECTOR    | 可选，固定值 `mailchannels` | `mailchannels`        |

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