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
import { getEmailByPassword, getEmailsByMessageTo } from "database/dao";
import { getWebTursoDB } from "database/db";

import CopyButton from "../components/CopyButton";
import MailListWithQuery from "../components/MailList";
import { userMailboxCookie } from "../cookies.server";
import ShieldCheck from "~/components/icons/ShieldCheck";
import Cloudflare from "~/components/icons/Cloudflare";
import Clock from "~/components/icons/Clock";
import Info from "~/components/icons/Info";

import { useTranslation } from "react-i18next";
// import { useSenderModal } from "~/components/sender";
import { getRandomCharacter } from "lib/hooks/utlis";

import { Toaster } from "react-hot-toast";
import { usePasswordModal } from "~/components/password";
import Password from "~/components/icons/Password";

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
  const siteKey = process.env.TURNSTILE_KEY || "";
  const domains = (process.env.EMAIL_DOMAIN || "").split(",");
  const userMailbox =
    ((await userMailboxCookie.parse(
      request.headers.get("Cookie")
    )) as string) || undefined;
  if (!userMailbox) {
    return {
      userMailbox: undefined,
      mails: [],
      siteKey,
      domains,
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
    domains,
  };
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const { _action } = Object.fromEntries(formData);
  const sendWorkerUrl = process.env.SEND_WORKER_URL || "";
  const siteKey = process.env.TURNSTILE_KEY || "";
  const IuserMailbox =
    ((await userMailboxCookie.parse(
      request.headers.get("Cookie")
    )) as string) || undefined;

  if (_action === "stop") {
    if (IuserMailbox) {
      return redirect("/", {
        headers: {
          "Set-Cookie": await userMailboxCookie.serialize("", {
            maxAge: 1,
          }),
        },
      });
    }
  } else if (_action === "create") {
    if (siteKey) {
      const response = formData.get("cf-turnstile-response");
      if (!response) {
        return {
          error: "No captcha response",
        };
      }
      const verifyEndpoint =
        "https://challenges.cloudflare.com/turnstile/v0/siteverify";
      const secret = process.env.TURNSTILE_SECRET || "";
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
    }

    const domains = (process.env.EMAIL_DOMAIN || "").split(",");
    if (domains.length === 0) {
      return {
        error: "Email domain not set in .env",
      };
    }

    const selectDomain = formData.get("selectDomain") as string;
    if (domains.length > 1 && !domains.includes(selectDomain)) {
      return {
        error: "Invalid email domain",
      };
    }

    const mailbox = `${randomName("", getRandomCharacter())}@${domains.length > 1 ? selectDomain : domains[0]}`;
    const userMailbox = await userMailboxCookie.serialize(mailbox);
    return redirect("/", {
      headers: {
        "Set-Cookie": userMailbox,
      },
    });
  } else if (_action === "send") {
    if (!sendWorkerUrl) {
      return {
        error: "SEND_WORKER_URL not set in .env",
      };
    }
    const res = await fetch(sendWorkerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: {
          email: IuserMailbox,
          name: formData.get("senderName") || "Anonymous",
        },
        personalizations: [
          {
            to: [
              {
                email: formData.get("receiverEmail") as string,
                name: "Receiver",
              },
            ],
          },
        ],
        subject: formData.get("subject") as string,
        content: [
          {
            type: formData.get("type") as string,
            value: formData.get("content") as string,
          },
        ],
      }),
    });
    // console.log("[res]", res.status);
    return redirect("/");
  } else if (_action === "login") {
    let psd = formData.get("password") as string;
    if (!psd) {
      return {
        error: "Password is required",
      };
    }
    const db = getWebTursoDB(
      process.env.TURSO_DB_URL as string,
      process.env.TURSO_DB_RO_AUTH_TOKEN as string
    );
    const res = await getEmailByPassword(db, psd);
    if (!res) {
      return {
        error: "Invalid password",
      };
    }
    const userMailbox = await userMailboxCookie.serialize(res.messageTo);
    return redirect("/", {
      headers: {
        "Set-Cookie": userMailbox,
      },
    });
  } else {
    return {
      error: "Invalid action",
    };
  }
};

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const navigation = useNavigation();

  const { t } = useTranslation();

  // const { SenderModal, setShowSenderModal } = useSenderModal(
  //   loaderData.userMailbox
  // );

  const { PasswordModal, setShowPasswordModal } = usePasswordModal(
    loaderData.mails[0]?.id
  );

  return (
    <div className="h-full flex flex-col gap-4 md:flex-row justify-center items-start mt-24 mx-6 md:mx-10">
      <div className="flex flex-col text-white items-start w-full md:w-[350px] mx-auto gap-2">
        <div className="w-full mb-4 md:max-w-[350px] shrink-0 group group-hover:before:duration-500 group-hover:after:duration-500 after:duration-500 hover:border-cyan-600 hover:before:[box-shadow:_20px_20px_20px_30px_#a21caf] duration-500 before:duration-500 hover:duration-500 hover:after:-right-8 hover:before:right-12 hover:before:-bottom-8 hover:before:blur origin-left hover:decoration-2 relative bg-neutral-800 h-full border text-left p-4 rounded-lg overflow-hidden border-cyan-50/20 before:absolute before:w-12 before:h-12 before:content[''] before:right-1 before:top-1 before:z-10 before:bg-violet-500 before:rounded-full before:blur-lg  after:absolute after:z-10 after:w-20 after:h-20 after:content['']  after:bg-rose-300 after:right-8 after:top-3 after:rounded-full after:blur-lg">
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
              {t("Email address")}{" "}
              {loaderData.mails && loaderData.mails[0] && (
                <Password
                  className="cursor-pointer text-cyan-500 inline-block w-4 h-4"
                  onClick={() => setShowPasswordModal(true)}
                />
              )}
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
              name="_action"
              value="stop"
              className="py-2.5 rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500">
              {t("Stop")}
            </button>

            {/* <div className="text-sm text-gray-300 mt-4">
              {t("Vmail sender is beta now. ")}
              <span
                onClick={() => setShowSenderModal(true)}
                className="text-cyan-500 cursor-pointer">
                {t("Try it")}.
              </span>
            </div> */}
          </Form>
        )}

        {!loaderData?.userMailbox && (
          <Form method="POST" className="w-full md:max-w-[350px]">
            {loaderData.siteKey && (
              <div className="text-sm relative mb-4">
                <div className="mb-3 font-semibold">{t("Validater")}</div>
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
            )}
            {loaderData.domains && loaderData.domains.length > 1 && (
              <>
                <div className="mb-3 text-sm font-semibold">{t("Domain")}</div>
                <select
                  id="selectDomain"
                  name="selectDomain"
                  className="mb-4 border text-sm rounded-md block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-gray-500">
                  {loaderData.domains.map((item: string) => (
                    <option
                      className="py-2 h-10"
                      selected={item === loaderData.domains[0]}
                      value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </>
            )}
            <button
              type="submit"
              value="create"
              name="_action"
              disabled={navigation.state != "idle"}
              className="py-2.5 rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500">
              {t("Create temporary email")}
            </button>
            <p
              className="mt-4 text-sm text-cyan-500 cursor-pointer"
              onClick={() => setShowPasswordModal(true)}>
              <Password className="inline-block w-4 h-4 mr-2" />
              {t("Have a password? Login.")}
            </p>
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
      {/* <SenderModal /> */}
      <PasswordModal />
      <Toaster />
    </div>
  );
}
