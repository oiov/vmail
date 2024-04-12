/**
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
