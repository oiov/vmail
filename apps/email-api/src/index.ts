import { getEmailsByMessageTo } from "database/dao";
import { getWebTursoDB } from "database/db";
import { Context, Hono, Next } from "hono";
import { cors } from "hono/cors";
import * as jose from "jose";
// @ts-ignore
import randomName from "@scaleway/random-name";

type Bindings = {
  TURSO_DB_URL: string;
  TURSO_DB_RO_AUTH_TOKEN: string;
  JWT_SECRET: string;
  TURNSTILE_SECRET: string;
  EMAIL_DOMAIN: string;
};

type Variables = {
  mailbox: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", cors());

async function withMailbox(c: Context, next: Next) {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "Missing Authorization header" }, 401);
    }
    const token = authHeader.split(" ")[1];
    const { payload } = await jose.jwtVerify(token, c.env.JWT_SECRET);
    c.set("mailbox", payload.mailbox);
    return next();
  } catch (e) {
    return c.json({ error: "Failed to verify" }, 400);
  }
}

async function withTurnstile(c: Context, next: Next) {
  try {
    let token: string | undefined;
    switch (c.req.header("content-type")) {
      case "application/x-www-form-urlencoded":
      case "multipart/form-data":
        token =
          (await c.req.formData()).get("cf-turnstile-response") || undefined;
      case "application/json":
        token = (await c.req.json())["cf-turnstile-response"] || undefined;
      default:
        token = c.req.query("cf-turnstile-response");
    }
    if (!token || typeof token !== "string") {
      return c.json({ error: "Missing cf-turnstile-response" }, 400);
    }
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: `secret=${encodeURIComponent(
          c.env.TURNSTILE_SECRET
        )}&response=${encodeURIComponent(token)}`,
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      }
    );
    if (!res.ok) {
      return c.json({ error: "Failed to verify" }, 400);
    }
    const json = (await res.json()) as { success: boolean };
    if (!json.success) {
      return c.json({ error: "Failed to verify" }, 400);
    }
    return next();
  } catch (e) {
    return c.json({ error: "Failed to verify" }, 400);
  }
}

app.post("/mailbox", withTurnstile, async (c) => {
  const jwtSecret = new TextEncoder().encode(c.env.JWT_SECRET);
  const name = randomName("", ".");
  const domain = c.env.EMAIL_DOMAIN || "";
  const mailbox = `${name}@${domain}`;
  const token = await new jose.SignJWT({ mailbox })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2h")
    .sign(jwtSecret);
  return c.json({ mailbox, token });
});

app.get("/mails", withMailbox, async (c) => {
  const mailbox = c.get("mailbox");
  const db = getWebTursoDB(c.env.TURSO_DB_URL, c.env.TURSO_DB_RO_AUTH_TOKEN);
  const mails = await getEmailsByMessageTo(db, mailbox);
  return c.json(mails);
});

export default app;
