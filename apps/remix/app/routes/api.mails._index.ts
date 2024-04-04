import { LoaderFunction } from "@remix-run/node";
import { getEmailsByMessageTo } from "database/dao";
import { getWebTursoDB } from "database/db";
import { userMailboxCookie } from "../cookies.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userMailbox =
    ((await userMailboxCookie.parse(
      request.headers.get("Cookie"),
    )) as string) || undefined;
  if (!userMailbox) {
    return [];
  }
  const db = getWebTursoDB(
    process.env.TURSO_DB_URL as string,
    process.env.TURSO_DB_RO_AUTH_TOKEN as string,
  );
  const mails = await getEmailsByMessageTo(db, userMailbox);
  return mails;
};
