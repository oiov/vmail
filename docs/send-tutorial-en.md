## Email Sending Tutorial

### Preparation Work

- Continue to use the domain hosted on cf from the email receiving tutorial.
- DKIM (optional)

### 1. Create a Sending Worker

Here we will manually create it:

- Go to the Cloudflare dashboard at `https://dash.cloudflare.com/`, click on `Workers and Pages` in the sidebar.
- Click `Create an app` -> `Create a worker` -> Name it as you wish, for example, `sender` -> Click `Deploy`.
- Enter the worker and click `Edit code`. Paste the following [code](/docs/send-worker.js)
- In the worker's `Settings` -> `Variables`, add the following variables:

| Variable Name    | Description                          | Example               |
| ---------------- | ------------------------------------ | --------------------- |
| DKIM_DOMAIN      | Optional, domain suffix              | `vmail.dev`           |
| DKIM_PRIVATE_KEY | Optional, DKIM private key           | `MIIEpQIBAAKCAQEA...` |
| DKIM_SELECTOR    | Optional, fixed value `mailchannels` | `mailchannels`        |

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