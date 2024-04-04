import { MetaFunction, type LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData, useRouteError } from "@remix-run/react";
import { getEmail } from "database/dao";
import { getWebTursoDB } from "database/db";
import { format } from "date-fns/format";
import { ArrowUturnLeft, UserCircleIcon } from "icons";
import { useTranslation } from "react-i18next";

export const meta: MetaFunction = () => {
  return [
    { title: "Detail" },
    {
      name: "description",
      content:
        "Virtual temporary Email. Privacy friendly, Valid for 1 day, AD friendly, 100% Run on Cloudflare",
    },
  ];
};

export const loader: LoaderFunction = async ({ params }) => {
  const id = params.id;
  const db = getWebTursoDB(
    process.env.TURSO_DB_URL as string,
    process.env.TURSO_DB_RO_AUTH_TOKEN as string
  );
  if (!id) {
    throw new Error("No mail id provided");
  }
  const mail = await getEmail(db, id);
  if (!mail) {
    throw new Error("No mail found");
  }
  return mail;
};

export default function MailViewer() {
  const { t } = useTranslation();

  const mail = useLoaderData<typeof loader>();
  return (
    <div className="mt-28 mx-6 md:mx-10 flex flex-1 flex-col p-2 gap-10">
      <Link
        to="/"
        className="flex text-white w-fit font-semibold items-center border p-2 rounded-md gap-2">
        <ArrowUturnLeft />
        {t("Back Home")}
      </Link>
      <div className="flex items-start text-white">
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
      <div className="flex-1 flex text-sm bg-[#ffffffd6] backdrop-blur-xl rounded-md p-3 min-h-0 overflow-y-auto">
        <article
          className="prose"
          dangerouslySetInnerHTML={{ __html: mail.html || mail.text || "" }}
        />
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError() as Error;
  return (
    <div className="flex flex-1 flex-col gap-10">
      <Link
        to="/"
        className="flex w-fit font-semibold items-center border p-2 rounded-md gap-2">
        <ArrowUturnLeft />
        Back Home
      </Link>

      <div className="flex items-center justify-center font-semibold text-xl text-red-500">
        {error.message}
      </div>
    </div>
  );
}
