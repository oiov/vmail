import { unsign } from "@/crypto";
import { emails, getWebTursoDB, orm } from "database";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function getMailbox() {
  const cookie = cookies().get("mailbox");
  if (!cookie) {
    return undefined;
  }
  const secret = process.env.COOKIES_SECRET as string;
  const mailbox = await unsign(cookie.value, secret);
  if (!mailbox) {
    return undefined;
  }
  return mailbox;
}

export async function fetchEmails(mailbox: string | undefined) {
  try {
    if (!mailbox) {
      return [];
    }
    const url = process.env.TURSO_DB_URL as string;
    const roAuthToken = process.env.TURSO_DB_RO_AUTH_TOKEN as string;
    const db = getWebTursoDB(url, roAuthToken);
    const mails = await db
      .select()
      .from(emails)
      .where(orm.and(orm.eq(emails.messageTo, mailbox)))
      .orderBy(orm.desc(emails.createdAt))
      .execute();
    return mails;
  } catch (e) {
    console.log(e);
    return [];
  }
}

export async function GET() {
  const mailbox = await getMailbox();
  const mails = await fetchEmails(mailbox);
  return NextResponse.json(mails);
}
