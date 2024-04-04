"use server";

import { getMailbox } from "@/app/api/mails/route";
import { sign } from "@/crypto";
import { cookies } from "next/headers";
// @ts-ignore
import randomName from "@scaleway/random-name";
import { NextRequest, NextResponse } from "next/server";

const verifyEndpoint =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const turnstileSecret = process.env.TURNSTILE_SECRET || "";

export async function fetchMailbox(data: FormData) {
  try {
    const token = data.get("cf-turnstile-response");
    if (!token || typeof token !== "string") {
      return;
    }
    if (await getMailbox()) {
      return;
    }
    const res = await fetch(verifyEndpoint, {
      method: "POST",
      body: `secret=${encodeURIComponent(
        turnstileSecret
      )}&response=${encodeURIComponent(token)}`,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });
    if (!res.ok) {
      return;
    }
    const json = await res.json();
    if (!json.success) {
      return;
    }

    const name = randomName("", ".");
    const domain = "vmail.dev";
    const mailbox = `${name}@${domain}`;

    const secret = process.env.COOKIES_SECRET as string;
    const value = await sign(mailbox, secret);
    cookies().set({
      name: "mailbox",
      value: value,
      httpOnly: true,
    });
  } catch (e) {
    console.log(e);
    return;
  }
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  await fetchMailbox(form);
  return NextResponse.redirect("/");
}
