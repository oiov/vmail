import { getMailbox } from "@/app/api/mails/route";
import { emails, getWebTursoDB, orm } from "database";
import { format } from "date-fns/format";
import { ArrowUturnLeft, UserCircleIcon } from "icons";
import Link from "next/link";

async function fetchMail(id: string) {
  const mailbox = await getMailbox();
  if (!mailbox) {
    return null;
  }
  const url = process.env.TURSO_DB_URL as string;
  const roAuthToken = process.env.TURSO_DB_RO_AUTH_TOKEN as string;
  const db = getWebTursoDB(url, roAuthToken);
  const mails = await db
    .select()
    .from(emails)
    .where(orm.and(orm.eq(emails.id, id)))
    .limit(1)
    .execute();
  if (mails.length === 0) {
    return null;
  }
  const email = mails[0];
  if (email.messageTo !== mailbox) {
    return null;
  }
  return email;
}

export default async function MailViewer({
  params,
}: {
  params: { id: string };
}) {
  const mail = await fetchMail(params.id);

  if (!mail) {
    return (
      <div className="flex flex-1 flex-col gap-10">
        <Link
          href="/"
          className="flex w-fit font-semibold items-center border p-2 rounded-md gap-2"
        >
          <ArrowUturnLeft />
          Back Home
        </Link>

        <div className="flex items-center justify-center font-semibold text-xl">
          No mail found
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-2 gap-10">
      <Link
        href="/"
        className="flex w-fit font-semibold items-center border p-2 rounded-md gap-2"
      >
        <ArrowUturnLeft />
        Back Home
      </Link>
      <div className="flex items-start">
        <div className="flex items-start gap-4 text-sm">
          <div>
            <UserCircleIcon />
          </div>
          <div className="grid gap-1">
            <div className="font-semibold">{mail.from.name}</div>
            <div className="line-clamp-1 text-xs">{mail.subject}</div>
            <div className="line-clamp-1 text-xs">
              <span className="font-medium">Reply-To:</span> {mail.from.address}
            </div>
          </div>
        </div>
        {mail.date && (
          <div className="ml-auto text-xs text-muted-foreground">
            {format(new Date(mail.date), "PPpp")}
          </div>
        )}
      </div>
      <div className="flex-1 flex text-sm min-h-0 overflow-y-auto">
        <article
          className="prose"
          dangerouslySetInnerHTML={{ __html: mail.html || "" }}
        />
      </div>
    </div>
  );
}
