import { Turnstile } from "@marsidev/react-turnstile";
import {
  LoaderFunction,
  redirect,
  type ActionFunction,
  type MetaFunction,
} from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import randomName from "@scaleway/random-name";
import { getEmailsByMessageTo } from "database/dao";
import { getWebTursoDB } from "database/db";

import CopyButton from "../components/CopyButton";
import MailListWithQuery from "../components/MailList";
import { userMailboxCookie } from "../cookies.server";
import ShieldCheck from "~/components/icons/ShieldCheck";
import Cloudflare from "~/components/icons/Cloudflare";
import Clock from "~/components/icons/Clock";
import Info from "~/components/icons/Info";

import { useTranslation } from "react-i18next";

export const meta: MetaFunction = () => {
  return [
    { title: "Vmail - Virtual Temporary Email" },
    {
      name: "description",
      content:
        "Virtual temporary Email. Privacy friendly, Valid for 1 day, AD friendly, 100% Run on Cloudflare",
    },
  ];
};

export const loader: LoaderFunction = async ({ request }) => {
  const siteKey = process.env.TURNSTILE_KEY || "1x00000000000000000000AA";
  const userMailbox =
    ((await userMailboxCookie.parse(
      request.headers.get("Cookie")
    )) as string) || undefined;
  if (!userMailbox) {
    return {
      userMailbox: undefined,
      mails: [],
      siteKey,
    };
  }
  const db = getWebTursoDB(
    process.env.TURSO_DB_URL as string,
    process.env.TURSO_DB_RO_AUTH_TOKEN as string
  );
  const mails = await getEmailsByMessageTo(db, userMailbox);
  return {
    userMailbox,
    mails,
    siteKey,
  };
};

export const action: ActionFunction = async ({ request }) => {
  const IuserMailbox =
    ((await userMailboxCookie.parse(
      request.headers.get("Cookie")
    )) as string) || undefined;

  if (IuserMailbox) {
    return redirect("/", {
      headers: {
        "Set-Cookie": await userMailboxCookie.serialize("", {
          maxAge: 1,
        }),
      },
    });
  }

  const response = (await request.formData()).get("cf-turnstile-response");
  if (!response) {
    return {
      error: "No captcha response",
    };
  }
  const verifyEndpoint =
    "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const secret =
    process.env.TURNSTILE_SECRET || "1x0000000000000000000000000000000AA";
  const resp = await fetch(verifyEndpoint, {
    method: "POST",
    body: JSON.stringify({
      secret,
      response,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const data = await resp.json();
  if (!data.success) {
    return {
      error: "Failed to verify captcha",
    };
  }

  const domain = process.env.EMAIL_DOMAIN || "";
  if (!domain) {
    return {
      error: "Email domain not set in .env",
    };
  }

  const mailbox = `${randomName("", ".")}@${domain}`;
  const userMailbox = await userMailboxCookie.serialize(mailbox);
  return redirect("/", {
    headers: {
      "Set-Cookie": userMailbox,
    },
  });
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const navigation = useNavigation();

  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col gap-4 md:flex-row justify-center items-start mt-28 mx-6 md:mx-10">
      <div className="flex flex-col text-white items-start w-full md:w-[350px] mx-auto gap-2">
        <div className="w-full mb-6 md:max-w-[350px] shrink-0 group group-hover:before:duration-500 group-hover:after:duration-500 after:duration-500 hover:border-cyan-600 hover:before:[box-shadow:_20px_20px_20px_30px_#a21caf] duration-500 before:duration-500 hover:duration-500 hover:after:-right-8 hover:before:right-12 hover:before:-bottom-8 hover:before:blur origin-left hover:decoration-2 relative bg-neutral-800 h-full border text-left p-4 rounded-lg overflow-hidden border-cyan-50/20 before:absolute before:w-12 before:h-12 before:content[''] before:right-1 before:top-1 before:z-10 before:bg-violet-500 before:rounded-full before:blur-lg  after:absolute after:z-10 after:w-20 after:h-20 after:content['']  after:bg-rose-300 after:right-8 after:top-3 after:rounded-full after:blur-lg">
          <h1 className="text-gray-50 text-xl font-bold mb-7 group-hover:text-cyan-500 duration-500">
            {t("Virtual Temporary Email")}
          </h1>
          <div className="flex flex-col gap-4 text-sm text-gray-200">
            <div className="flex items-center gap-1.5">
              <ShieldCheck /> {t("Privacy friendly")}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock />
              {t("Valid for 1 Day")}
            </div>
            <div className="flex items-center gap-1.5">
              <Info />
              {t("AD friendly")}
            </div>
            <div className="flex items-center gap-2">
              <Cloudflare />
              {t("100% Run on Cloudflare")}
            </div>
          </div>
        </div>

        {loaderData?.userMailbox && (
          <Form method="POST" className="w-full md:max-w-[350px] mb-4">
            <div className="mb-4 font-semibold text-sm">
              {t("Email address")}
            </div>
            <div className="flex items-center mb-6 text-zinc-100 bg-white/10 backdrop-blur-xl shadow-inner px-4 py-4 rounded-md w-full">
              <span className="truncate">{loaderData.userMailbox}</span>
              <CopyButton
                content={loaderData.userMailbox}
                className="p-1 rounded-md ml-auto transition-all duration-200"
              />
            </div>
            <button
              type="submit"
              className="py-2.5 rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500">
              {t("Stop")}
            </button>
          </Form>
        )}

        {!loaderData?.userMailbox && (
          <Form method="POST" className="w-full md:max-w-[350px]">
            <div className="text-sm relative mb-6">
              <div className="mb-4 font-semibold">{t("Validater")}</div>
              <div className="[&amp;_iframe]:!w-full h-[65px] max-w-[300px] bg-gray-700">
                <Turnstile
                  className="z-10 border-none"
                  siteKey={loaderData.siteKey}
                  options={{
                    theme: "dark",
                  }}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={navigation.state != "idle"}
              className="py-2.5 rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500">
              {t("Create temporary email")}
            </button>
          </Form>
        )}
        <div>
          {actionData?.error && (
            <div className="text-red-500">{t(actionData.error)}</div>
          )}
        </div>
      </div>

      <div className="w-full flex-1 overflow-hidden">
        <MailListWithQuery mails={loaderData.mails} />
      </div>
    </div>
  );
}
