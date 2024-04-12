## Email Sending Tutorial

### Preparation Work

- Continue to use the domain hosted on cf from the email receiving tutorial.
- DKIM (optional)

### 1. Create a Sending Worker

Here we will manually create it:

- Go to the Cloudflare dashboard at `https://dash.cloudflare.com/`, click on `Workers and Pages` in the sidebar.
- Click `Create an app` -> `Create a worker` -> Name it as you wish, for example, `sender` -> Click `Deploy`.
- Enter the worker and click `Edit code`. Paste the following [code](/docs/send-worker.js):

<details>
<summary>View sender worker code</summary>
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
  let send_request = new Request("https://api.mailchannels.net/tx/v1/send",  {
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
</head>
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

Continue to save and deploy.

- In the worker's `Settings` -> `Variables`, add the following variables:

| Variable Name    | Description                          | Example               |
| ---------------- | ------------------------------------ | --------------------- |
| DKIM_DOMAIN      | Required, domain suffix              | `vmail.dev`           |
| DKIM_PRIVATE_KEY | Required, DKIM private key           | `MIIEpQIBAAKCAQEA...` |
| DKIM_SELECTOR    | Required, fixed value `mailchannels` | `mailchannels`        |

The `DKIM_PRIVATE_KEY` will be explained later on how to obtain it.

Remember the address assigned to the worker, i.e., `https://<worker-name>.<your-name>.workers.dev`, which will be used later.

### 2. Prepare DKIM Private Key (optional)

> DKIM is an email authentication technology that can verify the identity of the email sender.

Execute the following command in the terminal to generate a DKIM private key, refer to [Adding a DKIM Signature](https://support.mailchannels.com/hc/en-us/articles/7122849237389-Adding-a-DKIM-Signature):

```bash
openssl genrsa 2048 | tee private_key.pem | openssl rsa -outform der | openssl base64 -A > private_key.txt

echo -n "v=DKIM1;p=" > dkim_record.txt && openssl rsa -in private_key.pem -pubout -outform der | openssl base64 -A >> dkim_record.txt
```

These two commands will generate 3 files:

- `private_key.pem`: Private key file.
- `private_key.txt`: Private key file in base64 encoding.
- `dkim_record.txt`: DKIM record.

The content of the `private_key.txt` file is the value for the `DKIM_PRIVATE_KEY` variable in the previous step.

### 3. Configure DNS

Enter the Cloudflare domain control console, select your domain -> Click `DNS`, next, you need to **add 3 TXT records** and **modify 1 TXT record**.

The new ones are as follows:

| Type | Name                      | Value                                                                                | Remarks                                                |
| ---- | ------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| TXT  | `_dmarc`                  | `v=DMARC1; p=reject; adkim=s; aspf=s; rua=mailto:YYY; ruf=mailto:YYY pct=100; fo=1;` | Fixed value                                            |
| TXT  | `mailchannels._domainkey` | `v=DKIM1;p=MIIEpQIBAAKCAQEA...`                                                      | The value is the content of the `dkim_record.txt` file |
| TXT  | `_mailchannels`           | `v=mc1 cfid=yesmore.workers.dev`                                                     | Replace yesmore with your account name                 |

The one that needs modification (the TXT record value is `example.com`, i.e., your domain name):

| Type | Name          | Value                                                                       | Remarks                                               |
| ---- | ------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- |
| TXT  | `example.com` | `v=spf1 include:_spf.mx.cloudflare.net include:relay.mailchannels.net ~all` | Replace the value with this, leave the rest unchanged |

In the end, there will be a total of 4 TXT records:

![](https://img.inke.app/file/b7422917c667de620ae95.png)

Verify if the DKIM record is configured successfully at [dkim-record-checker](https://dmarcly.com/tools/dkim-record-checker).

### 4. Verify Sending

Method one: Open the webpage `https://<sender-name>.<your-name>.workers.dev/submit` to verify if sending is normal.

Method two: Send via API

- Request URL `https://<sender-name>.<your-name>.workers.dev`
- Request Method `POST`
- Request Body:

```json
{
  "from": {
      "email": "sender@vmail.dev",
      "name": "Sender"
  },
  "personalizations": [
    {
      "to": [
        {
          "email": "example@gmail.com",
          "name": "Recipient"
        }
      ]
    }
  ],
  "subject": "Email Subject",
  "content": [
    {
      "type": "text/plain",
      "value": "Email Content"
    }
  ]
}
```

Example:

![](https://img.inke.app/file/1f6f3ab53aff9a1855475.png)

### 5. Add Environment Variables

This project uses the method two from step four to send emails via API.

In the Vercel project console, go to `Settings` -> `Environment Variables`, and add the following variable:

- SEND_WORKER_URL: The value should be `https://<sender-name>.<your-name>.workers.dev`

After adding, trigger a redeployment.