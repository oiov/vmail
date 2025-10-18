var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: !0 });
};

// app/entry.server.tsx
var entry_server_exports = {};
__export(entry_server_exports, {
  default: () => handleRequest
});
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { createInstance } from "i18next";

// app/i18next.server.ts
import Backend from "i18next-fs-backend";
import { resolve } from "node:path";
import { RemixI18Next } from "remix-i18next/server";

// app/i18n.ts
var i18n_default = {
  // This is the list of languages your application supports
  supportedLngs: [
    "en",
    "zh",
    "fr",
    "ja",
    "hi",
    "de",
    "ko",
    "zh-TW",
    "it",
    "pt",
    "tr",
    "ru"
  ],
  // This is the language you want to use in case
  // if the user language is not in the supportedLngs
  fallbackLng: "en",
  // The default namespace of i18next is "translation", but you can customize it here
  defaultNS: "common"
};

// app/i18next.server.ts
var i18next = new RemixI18Next({
  detection: {
    supportedLanguages: i18n_default.supportedLngs,
    fallbackLanguage: i18n_default.fallbackLng
  },
  // This is the configuration for i18next used
  // when translating messages server-side only
  i18next: {
    ...i18n_default,
    backend: {
      loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json")
    }
  },
  // The i18next plugins you want RemixI18next to use for `i18n.getFixedT` inside loaders and actions.
  // E.g. The Backend plugin for loading translations from the file system
  // Tip: You could pass `resources` to the `i18next` configuration and avoid a backend here
  plugins: [Backend]
}), i18next_server_default = i18next;

// app/entry.server.tsx
import { I18nextProvider, initReactI18next } from "react-i18next";
import Backend2 from "i18next-fs-backend";
import { resolve as resolve2 } from "node:path";
import { jsxDEV } from "react/jsx-dev-runtime";
var ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
async function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  let instance = createInstance(), lng = await i18next_server_default.getLocale(request), ns = i18next_server_default.getRouteNamespaces(remixContext);
  return await instance.use(initReactI18next).use(Backend2).init({
    ...i18n_default,
    // spread the configuration
    lng,
    // The locale we detected above
    ns,
    // The namespaces the routes about to render wants to use
    backend: { loadPath: resolve2("./public/locales/{{lng}}/{{ns}}.json") }
  }), new Promise((resolve3, reject) => {
    let shellRendered = !1, { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsxDEV(I18nextProvider, { i18n: instance, children: /* @__PURE__ */ jsxDEV(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        },
        void 0,
        !1,
        {
          fileName: "app/entry.server.tsx",
          lineNumber: 72,
          columnNumber: 9
        },
        this
      ) }, void 0, !1, {
        fileName: "app/entry.server.tsx",
        lineNumber: 71,
        columnNumber: 7
      }, this),
      {
        onAllReady() {
          shellRendered = !0;
          let body = new PassThrough(), stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html"), resolve3(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          ), pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500, shellRendered && console.error(error);
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
async function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  let instance = createInstance(), lng = await i18next_server_default.getLocale(request), ns = i18next_server_default.getRouteNamespaces(remixContext);
  return await instance.use(initReactI18next).use(Backend2).init({
    ...i18n_default,
    // spread the configuration
    lng,
    // The locale we detected above
    ns,
    // The namespaces the routes about to render wants to use
    backend: { loadPath: resolve2("./public/locales/{{lng}}/{{ns}}.json") }
  }), new Promise((resolve3, reject) => {
    let shellRendered = !1, { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsxDEV(I18nextProvider, { i18n: instance, children: /* @__PURE__ */ jsxDEV(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        },
        void 0,
        !1,
        {
          fileName: "app/entry.server.tsx",
          lineNumber: 138,
          columnNumber: 9
        },
        this
      ) }, void 0, !1, {
        fileName: "app/entry.server.tsx",
        lineNumber: 137,
        columnNumber: 7
      }, this),
      {
        onShellReady() {
          shellRendered = !0;
          let body = new PassThrough(), stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html"), resolve3(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          ), pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500, shellRendered && console.error(error);
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}

// app/root.tsx
var root_exports = {};
__export(root_exports, {
  default: () => App,
  handle: () => handle,
  links: () => links,
  loader: () => loader
});
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
  useLoaderData
} from "@remix-run/react";

// app/tailwind.css
var tailwind_default = "/build/_assets/tailwind-ASMKV4RQ.css";

// app/root.tsx
import { useChangeLanguage } from "remix-i18next/react";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
var loader = async ({ request }) => {
  let locale = await i18next_server_default.getLocale(request);
  return json({ locale });
}, handle = {
  // In the handle export, we can add a i18n key with namespaces our route
  // will need to load. This key can be a single string or an array of strings.
  // TIP: In most cases, you should set this to your defaultNS from your i18n config
  // or if you did not set one, set it to the i18next default namespace "translation"
  i18n: "common"
}, links = () => [
  { rel: "stylesheet", href: tailwind_default }
];
function isInWebView() {
  if (typeof window > "u")
    return !1;
  let ua = navigator.userAgent || "", isIOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua), isAndroidWebView = /Android.*(wv|\.0\.0\.0)/i.test(ua), noReferrer = document.referrer === "", shortHistory = history.length <= 1, noOpener = !window.opener;
  return isAndroidWebView;
}
function App() {
  let { locale } = useLoaderData(), { i18n } = useTranslation();
  return useChangeLanguage(locale), useEffect(() => {
    isInWebView() && (window.location.href = "https://18.wr.do");
  }, []), /* @__PURE__ */ jsxDEV2("html", { lang: locale, dir: i18n.dir(), children: [
    /* @__PURE__ */ jsxDEV2("head", { children: [
      /* @__PURE__ */ jsxDEV2("meta", { charSet: "utf-8" }, void 0, !1, {
        fileName: "app/root.tsx",
        lineNumber: 63,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }, void 0, !1, {
        fileName: "app/root.tsx",
        lineNumber: 64,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2("meta", { name: "monetag", content: "3b91a63b69a7f937a33993b4d456c476" }, void 0, !1, {
        fileName: "app/root.tsx",
        lineNumber: 65,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2(Meta, {}, void 0, !1, {
        fileName: "app/root.tsx",
        lineNumber: 66,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2(Links, {}, void 0, !1, {
        fileName: "app/root.tsx",
        lineNumber: 67,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2(
        "script",
        {
          async: !0,
          src: "https://www.googletagmanager.com/gtag/js?id=G-39WSEGK1FQ"
        },
        void 0,
        !1,
        {
          fileName: "app/root.tsx",
          lineNumber: 73,
          columnNumber: 9
        },
        this
      ),
      /* @__PURE__ */ jsxDEV2(
        "script",
        {
          dangerouslySetInnerHTML: {
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-39WSEGK1FQ');
            `
          }
        },
        void 0,
        !1,
        {
          fileName: "app/root.tsx",
          lineNumber: 76,
          columnNumber: 9
        },
        this
      )
    ] }, void 0, !0, {
      fileName: "app/root.tsx",
      lineNumber: 62,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV2("body", { className: "", children: [
      /* @__PURE__ */ jsxDEV2(Outlet, {}, void 0, !1, {
        fileName: "app/root.tsx",
        lineNumber: 87,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2(ScrollRestoration, {}, void 0, !1, {
        fileName: "app/root.tsx",
        lineNumber: 88,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2(Scripts, {}, void 0, !1, {
        fileName: "app/root.tsx",
        lineNumber: 89,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV2(LiveReload, {}, void 0, !1, {
        fileName: "app/root.tsx",
        lineNumber: 90,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/root.tsx",
      lineNumber: 86,
      columnNumber: 7
    }, this)
  ] }, void 0, !0, {
    fileName: "app/root.tsx",
    lineNumber: 61,
    columnNumber: 5
  }, this);
}

// app/routes/_h.mails.$id._index.tsx
var h_mails_id_index_exports = {};
__export(h_mails_id_index_exports, {
  ErrorBoundary: () => ErrorBoundary,
  default: () => MailViewer,
  loader: () => loader2,
  meta: () => meta
});
import { Link, useLoaderData as useLoaderData2, useRouteError } from "@remix-run/react";

// ../../packages/database/dao.ts
import { count, desc, eq, and } from "drizzle-orm";

// ../../packages/database/schema.ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import * as z from "zod";
var emails = sqliteTable("emails", {
  id: text("id").primaryKey(),
  messageFrom: text("message_from").notNull(),
  messageTo: text("message_to").notNull(),
  headers: text("headers", { mode: "json" }).$type().notNull(),
  from: text("from", { mode: "json" }).$type().notNull(),
  sender: text("sender", { mode: "json" }).$type(),
  replyTo: text("reply_to", { mode: "json" }).$type(),
  deliveredTo: text("delivered_to"),
  returnPath: text("return_path"),
  to: text("to", { mode: "json" }).$type(),
  cc: text("cc", { mode: "json" }).$type(),
  bcc: text("bcc", { mode: "json" }).$type(),
  subject: text("subject"),
  messageId: text("message_id").notNull(),
  inReplyTo: text("in_reply_to"),
  references: text("references"),
  date: text("date"),
  html: text("html"),
  text: text("text"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull()
}), AddressSchema = z.object({
  address: z.string(),
  name: z.string()
}), insertEmailSchema = createInsertSchema(emails, {
  headers: z.array(z.record(z.string())),
  from: AddressSchema,
  sender: AddressSchema.optional(),
  replyTo: z.array(AddressSchema).optional(),
  to: z.array(AddressSchema).optional(),
  cc: z.array(AddressSchema).optional(),
  bcc: z.array(AddressSchema).optional()
});

// ../../packages/database/dao.ts
async function getEmail(db, id) {
  try {
    let result = await db.select().from(emails).where(and(eq(emails.id, id))).execute();
    return result.length != 1 ? null : result[0];
  } catch {
    return null;
  }
}
async function getEmailByPassword(db, id) {
  try {
    return (await db.select({ messageTo: emails.messageTo }).from(emails).where(and(eq(emails.id, id))).limit(1).execute())[0];
  } catch {
    return null;
  }
}
async function getEmailsByMessageTo(db, messageTo) {
  try {
    return await db.select().from(emails).where(eq(emails.messageTo, messageTo)).orderBy(desc(emails.createdAt)).execute();
  } catch {
    return [];
  }
}

// ../../packages/database/db.ts
import { createClient as createWebClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";
function getWebTursoDB(url, authToken) {
  return drizzle(createWebClient({ url, authToken }));
}

// app/routes/_h.mails.$id._index.tsx
import { format } from "date-fns/format";

// ../../packages/icons/svg/ArrowUturnLeft.tsx
import { jsxDEV as jsxDEV3 } from "react/jsx-dev-runtime";
function ArrowUturnLeft(props) {
  return /* @__PURE__ */ jsxDEV3(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      stroke: "currentColor",
      fill: "none",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ...props,
      children: /* @__PURE__ */ jsxDEV3("path", { d: "M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" }, void 0, !1, {
        fileName: "../../packages/icons/svg/ArrowUturnLeft.tsx",
        lineNumber: 17,
        columnNumber: 7
      }, this)
    },
    void 0,
    !1,
    {
      fileName: "../../packages/icons/svg/ArrowUturnLeft.tsx",
      lineNumber: 5,
      columnNumber: 5
    },
    this
  );
}

// ../../packages/icons/svg/CheckIcon.tsx
import { jsxDEV as jsxDEV4 } from "react/jsx-dev-runtime";
function CheckIcon(props) {
  return /* @__PURE__ */ jsxDEV4(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      stroke: "currentColor",
      fill: "none",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ...props,
      children: [
        /* @__PURE__ */ jsxDEV4("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }, void 0, !1, {
          fileName: "../../packages/icons/svg/CheckIcon.tsx",
          lineNumber: 17,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV4("path", { d: "M5 12l5 5l10 -10" }, void 0, !1, {
          fileName: "../../packages/icons/svg/CheckIcon.tsx",
          lineNumber: 18,
          columnNumber: 7
        }, this)
      ]
    },
    void 0,
    !0,
    {
      fileName: "../../packages/icons/svg/CheckIcon.tsx",
      lineNumber: 5,
      columnNumber: 5
    },
    this
  );
}

// ../../packages/icons/svg/CopyIcon.tsx
import { jsxDEV as jsxDEV5 } from "react/jsx-dev-runtime";
function CopyIcon(props) {
  return /* @__PURE__ */ jsxDEV5(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      stroke: "currentColor",
      fill: "none",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ...props,
      children: [
        /* @__PURE__ */ jsxDEV5("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }, void 0, !1, {
          fileName: "../../packages/icons/svg/CopyIcon.tsx",
          lineNumber: 17,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV5("path", { d: "M7 7m0 2.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667z" }, void 0, !1, {
          fileName: "../../packages/icons/svg/CopyIcon.tsx",
          lineNumber: 18,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV5("path", { d: "M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" }, void 0, !1, {
          fileName: "../../packages/icons/svg/CopyIcon.tsx",
          lineNumber: 19,
          columnNumber: 7
        }, this)
      ]
    },
    void 0,
    !0,
    {
      fileName: "../../packages/icons/svg/CopyIcon.tsx",
      lineNumber: 5,
      columnNumber: 5
    },
    this
  );
}

// ../../packages/icons/svg/ExclamationCircle.tsx
import { jsxDEV as jsxDEV6 } from "react/jsx-dev-runtime";
function ExclamationCircle(props) {
  return /* @__PURE__ */ jsxDEV6(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      stroke: "currentColor",
      fill: "none",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ...props,
      children: [
        /* @__PURE__ */ jsxDEV6("path", { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }, void 0, !1, {
          fileName: "../../packages/icons/svg/ExclamationCircle.tsx",
          lineNumber: 17,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV6("path", { d: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" }, void 0, !1, {
          fileName: "../../packages/icons/svg/ExclamationCircle.tsx",
          lineNumber: 18,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV6("path", { d: "M12 9v4" }, void 0, !1, {
          fileName: "../../packages/icons/svg/ExclamationCircle.tsx",
          lineNumber: 19,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV6("path", { d: "M12 16v.01" }, void 0, !1, {
          fileName: "../../packages/icons/svg/ExclamationCircle.tsx",
          lineNumber: 20,
          columnNumber: 7
        }, this)
      ]
    },
    void 0,
    !0,
    {
      fileName: "../../packages/icons/svg/ExclamationCircle.tsx",
      lineNumber: 5,
      columnNumber: 5
    },
    this
  );
}

// ../../packages/icons/svg/GithubIcon.tsx
import { jsxDEV as jsxDEV7 } from "react/jsx-dev-runtime";

// ../../packages/icons/svg/InboxIcon.tsx
import { jsxDEV as jsxDEV8 } from "react/jsx-dev-runtime";

// ../../packages/icons/svg/MailIcon.tsx
import { jsxDEV as jsxDEV9 } from "react/jsx-dev-runtime";
function MailIcon(props) {
  return /* @__PURE__ */ jsxDEV9(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      stroke: "currentColor",
      fill: "none",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ...props,
      children: /* @__PURE__ */ jsxDEV9("path", { d: "M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" }, void 0, !1, {
        fileName: "../../packages/icons/svg/MailIcon.tsx",
        lineNumber: 17,
        columnNumber: 7
      }, this)
    },
    void 0,
    !1,
    {
      fileName: "../../packages/icons/svg/MailIcon.tsx",
      lineNumber: 5,
      columnNumber: 5
    },
    this
  );
}

// ../../packages/icons/svg/RefreshIcon.tsx
import { jsxDEV as jsxDEV10 } from "react/jsx-dev-runtime";

// ../../packages/icons/svg/ReloadIcon.tsx
import { jsxDEV as jsxDEV11 } from "react/jsx-dev-runtime";

// ../../packages/icons/svg/UserCircleIcon.tsx
import { jsxDEV as jsxDEV12 } from "react/jsx-dev-runtime";
function UserCircleIcon(props) {
  return /* @__PURE__ */ jsxDEV12(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      strokeWidth: "2",
      stroke: "currentColor",
      fill: "none",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ...props,
      children: /* @__PURE__ */ jsxDEV12("path", { d: "M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" }, void 0, !1, {
        fileName: "../../packages/icons/svg/UserCircleIcon.tsx",
        lineNumber: 17,
        columnNumber: 7
      }, this)
    },
    void 0,
    !1,
    {
      fileName: "../../packages/icons/svg/UserCircleIcon.tsx",
      lineNumber: 5,
      columnNumber: 5
    },
    this
  );
}

// app/routes/_h.mails.$id._index.tsx
import { useTranslation as useTranslation2 } from "react-i18next";
import { jsxDEV as jsxDEV13 } from "react/jsx-dev-runtime";
var meta = () => [
  { title: "Detail" },
  {
    name: "description",
    content: "Virtual temporary Email. Privacy friendly, Valid for 1 day, AD friendly, 100% Run on Cloudflare"
  }
], loader2 = async ({ params }) => {
  let id = params.id, db = getWebTursoDB(
    process.env.TURSO_DB_URL,
    process.env.TURSO_DB_RO_AUTH_TOKEN
  );
  if (!id)
    throw new Error("No mail id provided");
  let mail = await getEmail(db, id);
  if (!mail)
    throw new Error("No mail found");
  return mail;
};
function MailViewer() {
  let { t } = useTranslation2(), mail = useLoaderData2();
  return /* @__PURE__ */ jsxDEV13("div", { className: "mt-24 mx-6 md:mx-10 flex flex-1 flex-col p-2 gap-10", children: [
    /* @__PURE__ */ jsxDEV13(
      Link,
      {
        to: "/",
        className: "flex text-white w-fit font-semibold items-center border p-2 rounded-md gap-2",
        children: [
          /* @__PURE__ */ jsxDEV13(ArrowUturnLeft, {}, void 0, !1, {
            fileName: "app/routes/_h.mails.$id._index.tsx",
            lineNumber: 45,
            columnNumber: 9
          }, this),
          t("Back Home")
        ]
      },
      void 0,
      !0,
      {
        fileName: "app/routes/_h.mails.$id._index.tsx",
        lineNumber: 42,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV13("div", { className: "flex items-start text-white", children: [
      /* @__PURE__ */ jsxDEV13("div", { className: "flex items-start gap-4 text-sm", children: [
        /* @__PURE__ */ jsxDEV13("div", { children: /* @__PURE__ */ jsxDEV13(UserCircleIcon, {}, void 0, !1, {
          fileName: "app/routes/_h.mails.$id._index.tsx",
          lineNumber: 51,
          columnNumber: 13
        }, this) }, void 0, !1, {
          fileName: "app/routes/_h.mails.$id._index.tsx",
          lineNumber: 50,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV13("div", { className: "grid gap-1", children: [
          /* @__PURE__ */ jsxDEV13("div", { className: "font-semibold", children: mail.from.name }, void 0, !1, {
            fileName: "app/routes/_h.mails.$id._index.tsx",
            lineNumber: 54,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV13("div", { className: "line-clamp-1 text-xs", children: mail.subject }, void 0, !1, {
            fileName: "app/routes/_h.mails.$id._index.tsx",
            lineNumber: 55,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV13("div", { className: "line-clamp-1 text-xs", children: [
            /* @__PURE__ */ jsxDEV13("span", { className: "font-medium", children: "Reply-To:" }, void 0, !1, {
              fileName: "app/routes/_h.mails.$id._index.tsx",
              lineNumber: 57,
              columnNumber: 15
            }, this),
            " ",
            mail.from.address
          ] }, void 0, !0, {
            fileName: "app/routes/_h.mails.$id._index.tsx",
            lineNumber: 56,
            columnNumber: 13
          }, this)
        ] }, void 0, !0, {
          fileName: "app/routes/_h.mails.$id._index.tsx",
          lineNumber: 53,
          columnNumber: 11
        }, this)
      ] }, void 0, !0, {
        fileName: "app/routes/_h.mails.$id._index.tsx",
        lineNumber: 49,
        columnNumber: 9
      }, this),
      mail.date && /* @__PURE__ */ jsxDEV13("div", { className: "ml-auto text-xs text-muted-foreground", children: format(new Date(mail.date), "PPpp") }, void 0, !1, {
        fileName: "app/routes/_h.mails.$id._index.tsx",
        lineNumber: 62,
        columnNumber: 11
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/_h.mails.$id._index.tsx",
      lineNumber: 48,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV13("div", { className: "flex-1 flex text-sm bg-[#ffffffd6] backdrop-blur-xl rounded-md p-3 min-h-0 overflow-y-auto", children: /* @__PURE__ */ jsxDEV13(
      "article",
      {
        className: "prose",
        dangerouslySetInnerHTML: { __html: mail.html || mail.text || "" }
      },
      void 0,
      !1,
      {
        fileName: "app/routes/_h.mails.$id._index.tsx",
        lineNumber: 68,
        columnNumber: 9
      },
      this
    ) }, void 0, !1, {
      fileName: "app/routes/_h.mails.$id._index.tsx",
      lineNumber: 67,
      columnNumber: 7
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/_h.mails.$id._index.tsx",
    lineNumber: 41,
    columnNumber: 5
  }, this);
}
function ErrorBoundary() {
  let error = useRouteError();
  return /* @__PURE__ */ jsxDEV13("div", { className: "flex flex-1 flex-col gap-10", children: [
    /* @__PURE__ */ jsxDEV13(
      Link,
      {
        to: "/",
        className: "flex w-fit font-semibold items-center border p-2 rounded-md gap-2",
        children: [
          /* @__PURE__ */ jsxDEV13(ArrowUturnLeft, {}, void 0, !1, {
            fileName: "app/routes/_h.mails.$id._index.tsx",
            lineNumber: 84,
            columnNumber: 9
          }, this),
          "Back Home"
        ]
      },
      void 0,
      !0,
      {
        fileName: "app/routes/_h.mails.$id._index.tsx",
        lineNumber: 81,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV13("div", { className: "flex items-center justify-center font-semibold text-xl text-red-500", children: error.message }, void 0, !1, {
      fileName: "app/routes/_h.mails.$id._index.tsx",
      lineNumber: 88,
      columnNumber: 7
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/_h.mails.$id._index.tsx",
    lineNumber: 80,
    columnNumber: 5
  }, this);
}

// app/routes/api.mails._index.ts
var api_mails_index_exports = {};
__export(api_mails_index_exports, {
  loader: () => loader3
});

// app/cookies.server.ts
import { createCookie } from "@remix-run/node";
var secrets = (process.env.COOKIES_SECRET || "").split(",").map((s) => s.trim()).filter(Boolean), userMailboxCookie = createCookie("userMailbox", {
  maxAge: Number(process.env.EXPIRY_TIME) || 86400,
  // default for one day (86400 seconds)
  secrets,
  httpOnly: !0
});

// app/routes/api.mails._index.ts
var loader3 = async ({ request }) => {
  let userMailbox = await userMailboxCookie.parse(
    request.headers.get("Cookie")
  ) || void 0;
  if (!userMailbox)
    return [];
  let db = getWebTursoDB(
    process.env.TURSO_DB_URL,
    process.env.TURSO_DB_RO_AUTH_TOKEN
  );
  return await getEmailsByMessageTo(db, userMailbox);
};

// app/routes/_h.privacy.tsx
var h_privacy_exports = {};
__export(h_privacy_exports, {
  default: () => Index,
  meta: () => meta2
});
import { jsxDEV as jsxDEV14 } from "react/jsx-dev-runtime";
var meta2 = () => [
  { title: "Privacy Policy" },
  {
    name: "description",
    content: "Virtual temporary Email. Privacy friendly, Valid for 1 day, AD friendly, 100% Run on Cloudflare"
  }
];
function Index() {
  return /* @__PURE__ */ jsxDEV14("div", { className: "mx-10 mt-24 text-white", children: /* @__PURE__ */ jsxDEV14("div", { className: "max-w-[1400px] ", children: [
    /* @__PURE__ */ jsxDEV14("h1", { className: "text-4xl font-bold", id: "about", children: "Privacy Policy" }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 18,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("p", { className: "mt-8", children: "At Vmail.DEV, we value the privacy of our users and are committed to protecting their personal information. This Privacy Policy outlines the practices we follow regarding the collection, use, storage, and deletion of data on our one-time email website." }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 21,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("h2", { className: "mt-8 text-2xl font-bold", id: "Collection of Information", children: "1. Collection of Information" }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 28,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("p", { className: "mt-4", children: "We only collect and store an email name for the duration of the session. This information is necessary to facilitate the functioning of our one-time email service." }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 31,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("h2", { className: "mt-8 text-2xl font-bold", id: "Storage of Emails", children: "2. Storage of Emails" }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 37,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("p", { className: "mt-4", children: "All emails sent and received through our one-time email service are temporarily stored in Cloudflare data centers. This storage is essential for the proper delivery and retrieval of emails during the active session." }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 40,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("h2", { className: "mt-8 text-2xl font-bold", id: "Deletion of Emails", children: "3. Deletion of Emails" }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 47,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("p", { className: "mt-4", children: "Once an email expires, we ensure the complete deletion of the email from our system. This means that all associated data, including the email content and any related information, will be permanently removed from our servers." }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 50,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("h2", { className: "mt-8 text-2xl font-bold", id: "Data Security", children: "4. Data Security" }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 57,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("p", { className: "mt-4", children: "We take appropriate measures to protect the personal information and emails stored on our website. However, it is important to note that no method of data transmission or storage is completely secure. While we strive to use commercially acceptable means to protect user data, we cannot guarantee absolute security." }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 60,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("h2", { className: "mt-8 text-2xl font-bold", id: "Third-Party Services", children: "5. Third-Party Services" }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 68,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("p", { className: "mt-4", children: "We may use third-party services, such as Cloudflare, to assist in the operation and maintenance of our website. These third-party services may have access to certain user data, including email names and content, solely for the purpose of providing their services. We ensure that any third-party services we use are reputable and have appropriate data protection measures in place." }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 71,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("h2", { className: "mt-8 text-2xl font-bold", id: "", children: "6. Information Sharing" }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 80,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("p", { className: "mt-4", children: "We do not share, sell, or disclose any personal information or email content to third parties, except as required by law or as necessary to protect our rights, property, or safety." }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 83,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("h2", { className: "mt-8 text-2xl font-bold", id: "Cookies", children: "7. Cookies" }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 89,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("p", { className: "mt-4", children: "We may use cookies to enhance the user experience on our website. These cookies may collect non-personal information and are used solely for website analytics and functionality purposes." }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 92,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("h2", { className: "mt-8 text-2xl font-bold", id: "Children's Privacy", children: "8. Children's Privacy" }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 98,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("p", { className: "mt-4", children: "Our website is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children. If you believe that we may have inadvertently collected personal information from a child under 13, please contact us immediately, and we will take appropriate steps to delete such information." }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 101,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14(
      "h2",
      {
        className: "mt-8 text-2xl font-bold",
        id: "Changes to the Privacy Policy",
        children: "9. Changes to the Privacy Policy"
      },
      void 0,
      !1,
      {
        fileName: "app/routes/_h.privacy.tsx",
        lineNumber: 109,
        columnNumber: 9
      },
      this
    ),
    /* @__PURE__ */ jsxDEV14("p", { className: "mt-4", children: "We reserve the right to modify or update this Privacy Policy at any time. Any changes made will be effective immediately upon posting the revised Privacy Policy on our website. It is advisable to review this Privacy Policy periodically for any updates." }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 114,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("h2", { className: "mt-8 text-2xl font-bold", id: "Contact Us", children: "10. Contact Us" }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 121,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("p", { className: "mt-4", children: "If you have any questions, concerns, or feedback regarding this Privacy Policy or our website's privacy practices, please contact us." }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 124,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV14("p", { className: "mt-8", children: "Last updated: 2024-03-15" }, void 0, !1, {
      fileName: "app/routes/_h.privacy.tsx",
      lineNumber: 128,
      columnNumber: 9
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/_h.privacy.tsx",
    lineNumber: 17,
    columnNumber: 7
  }, this) }, void 0, !1, {
    fileName: "app/routes/_h.privacy.tsx",
    lineNumber: 16,
    columnNumber: 5
  }, this);
}

// app/routes/_h._index.tsx
var h_index_exports = {};
__export(h_index_exports, {
  action: () => action,
  default: () => Index2,
  loader: () => loader4,
  meta: () => meta3
});
import { Turnstile } from "@marsidev/react-turnstile";
import {
  redirect
} from "@remix-run/node";
import {
  Form as Form2,
  useActionData,
  useLoaderData as useLoaderData3,
  useNavigation as useNavigation2
} from "@remix-run/react";
import randomName from "@scaleway/random-name";

// app/components/CopyButton.tsx
import { useState } from "react";
import { jsxDEV as jsxDEV15 } from "react/jsx-dev-runtime";
function CopyButton(props) {
  let [status, setStatus] = useState("idle"), icons = {
    idle: /* @__PURE__ */ jsxDEV15(CopyIcon, { className: "" }, void 0, !1, {
      fileName: "app/components/CopyButton.tsx",
      lineNumber: 16,
      columnNumber: 11
    }, this),
    error: /* @__PURE__ */ jsxDEV15(ExclamationCircle, { className: "text-red-500" }, void 0, !1, {
      fileName: "app/components/CopyButton.tsx",
      lineNumber: 17,
      columnNumber: 12
    }, this),
    success: /* @__PURE__ */ jsxDEV15(CheckIcon, { className: "text-green-500" }, void 0, !1, {
      fileName: "app/components/CopyButton.tsx",
      lineNumber: 18,
      columnNumber: 14
    }, this)
  };
  function copy() {
    if (navigator.clipboard)
      navigator.clipboard.writeText(props.content).then(() => setStatus("success")).catch(() => setStatus("error")).finally(() => setTimeout(() => setStatus("idle"), 1e3));
    else {
      let textArea = document.createElement("textarea");
      textArea.value = props.content, document.body.appendChild(textArea), textArea.focus(), textArea.select(), document.execCommand("copy"), document.body.removeChild(textArea);
    }
  }
  return /* @__PURE__ */ jsxDEV15("button", { type: "button", ...props, onClick: copy, children: icons[status] }, void 0, !1, {
    fileName: "app/components/CopyButton.tsx",
    lineNumber: 40,
    columnNumber: 5
  }, this);
}

// app/components/MailList.tsx
import { Link as Link2 } from "@remix-run/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery
} from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

// app/components/icons/Refresh.tsx
import { jsxDEV as jsxDEV16 } from "react/jsx-dev-runtime";
function Refresh(props) {
  return /* @__PURE__ */ jsxDEV16(
    "svg",
    {
      className: props.className,
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      children: [
        /* @__PURE__ */ jsxDEV16("path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" }, void 0, !1, {
          fileName: "app/components/icons/Refresh.tsx",
          lineNumber: 16,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV16("path", { d: "M21 3v5h-5" }, void 0, !1, {
          fileName: "app/components/icons/Refresh.tsx",
          lineNumber: 17,
          columnNumber: 7
        }, this)
      ]
    },
    void 0,
    !0,
    {
      fileName: "app/components/icons/Refresh.tsx",
      lineNumber: 5,
      columnNumber: 5
    },
    this
  );
}

// app/components/icons/Loader.tsx
import { jsxDEV as jsxDEV17 } from "react/jsx-dev-runtime";
function Loader() {
  return /* @__PURE__ */ jsxDEV17("div", { className: "loader", children: [
    /* @__PURE__ */ jsxDEV17("div", { className: "box box-1", children: [
      /* @__PURE__ */ jsxDEV17("div", { className: "side-left" }, void 0, !1, {
        fileName: "app/components/icons/Loader.tsx",
        lineNumber: 5,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV17("div", { className: "side-right" }, void 0, !1, {
        fileName: "app/components/icons/Loader.tsx",
        lineNumber: 6,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV17("div", { className: "side-top" }, void 0, !1, {
        fileName: "app/components/icons/Loader.tsx",
        lineNumber: 7,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/components/icons/Loader.tsx",
      lineNumber: 4,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV17("div", { className: "box box-2", children: [
      /* @__PURE__ */ jsxDEV17("div", { className: "side-left" }, void 0, !1, {
        fileName: "app/components/icons/Loader.tsx",
        lineNumber: 10,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV17("div", { className: "side-right" }, void 0, !1, {
        fileName: "app/components/icons/Loader.tsx",
        lineNumber: 11,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV17("div", { className: "side-top" }, void 0, !1, {
        fileName: "app/components/icons/Loader.tsx",
        lineNumber: 12,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/components/icons/Loader.tsx",
      lineNumber: 9,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV17("div", { className: "box box-3", children: [
      /* @__PURE__ */ jsxDEV17("div", { className: "side-left" }, void 0, !1, {
        fileName: "app/components/icons/Loader.tsx",
        lineNumber: 15,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV17("div", { className: "side-right" }, void 0, !1, {
        fileName: "app/components/icons/Loader.tsx",
        lineNumber: 16,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV17("div", { className: "side-top" }, void 0, !1, {
        fileName: "app/components/icons/Loader.tsx",
        lineNumber: 17,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/components/icons/Loader.tsx",
      lineNumber: 14,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV17("div", { className: "box box-4", children: [
      /* @__PURE__ */ jsxDEV17("div", { className: "side-left" }, void 0, !1, {
        fileName: "app/components/icons/Loader.tsx",
        lineNumber: 20,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV17("div", { className: "side-right" }, void 0, !1, {
        fileName: "app/components/icons/Loader.tsx",
        lineNumber: 21,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV17("div", { className: "side-top" }, void 0, !1, {
        fileName: "app/components/icons/Loader.tsx",
        lineNumber: 22,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/components/icons/Loader.tsx",
      lineNumber: 19,
      columnNumber: 7
    }, this)
  ] }, void 0, !0, {
    fileName: "app/components/icons/Loader.tsx",
    lineNumber: 3,
    columnNumber: 5
  }, this);
}

// app/components/MailList.tsx
import { useTranslation as useTranslation3 } from "react-i18next";
import { Fragment, jsxDEV as jsxDEV18 } from "react/jsx-dev-runtime";
var queryClient = new QueryClient();
function MailItem({ mail: item }) {
  return /* @__PURE__ */ jsxDEV18(
    Link2,
    {
      to: `/mails/${item.id}`,
      className: "flex flex-col items-start text-white gap-2 mb-1 rounded-lg border border-zinc-600 p-3 text-left text-sm transition-all hover:bg-zinc-700",
      children: [
        /* @__PURE__ */ jsxDEV18("div", { className: "flex w-full flex-col gap-1", children: [
          /* @__PURE__ */ jsxDEV18("div", { className: "flex items-center", children: [
            /* @__PURE__ */ jsxDEV18("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxDEV18("div", { className: "font-semibold", children: item.from.name }, void 0, !1, {
              fileName: "app/components/MailList.tsx",
              lineNumber: 29,
              columnNumber: 13
            }, this) }, void 0, !1, {
              fileName: "app/components/MailList.tsx",
              lineNumber: 28,
              columnNumber: 11
            }, this),
            /* @__PURE__ */ jsxDEV18("div", { className: "ml-auto text-xs", children: formatDistanceToNow(new Date(item.date || item.createdAt), {
              addSuffix: !0
            }) }, void 0, !1, {
              fileName: "app/components/MailList.tsx",
              lineNumber: 31,
              columnNumber: 11
            }, this)
          ] }, void 0, !0, {
            fileName: "app/components/MailList.tsx",
            lineNumber: 27,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ jsxDEV18("div", { className: "text-xs font-medium", children: item.subject }, void 0, !1, {
            fileName: "app/components/MailList.tsx",
            lineNumber: 37,
            columnNumber: 9
          }, this)
        ] }, void 0, !0, {
          fileName: "app/components/MailList.tsx",
          lineNumber: 26,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV18("div", { className: "line-clamp-2 text-xs text-zinc-300 font-normal w-full", children: item.text || item.html || "".substring(0, 300) }, void 0, !1, {
          fileName: "app/components/MailList.tsx",
          lineNumber: 39,
          columnNumber: 7
        }, this)
      ]
    },
    item.id,
    !0,
    {
      fileName: "app/components/MailList.tsx",
      lineNumber: 20,
      columnNumber: 5
    },
    this
  );
}
async function fetchMails() {
  try {
    return await (await fetch("/api/mails")).json();
  } catch {
    return [];
  }
}
function MailList(props) {
  let { t } = useTranslation3(), { data, isFetching } = useQuery({
    queryKey: ["mails"],
    queryFn: fetchMails,
    initialData: props.mails,
    refetchInterval: 2e4
    // refetch every 20 seconds
  });
  return /* @__PURE__ */ jsxDEV18(Fragment, { children: /* @__PURE__ */ jsxDEV18("div", { className: "rounded-md border border-cyan-50/20", children: [
    /* @__PURE__ */ jsxDEV18("div", { className: "w-full rounded-t-md p-2 flex items-center bg-zinc-800 text-zinc-200 gap-2", children: [
      /* @__PURE__ */ jsxDEV18("div", { className: "flex items-center justify-start gap-2 font-bold", children: [
        /* @__PURE__ */ jsxDEV18(MailIcon, { className: "size-6" }, void 0, !1, {
          fileName: "app/components/MailList.tsx",
          lineNumber: 70,
          columnNumber: 13
        }, this),
        t("INBOX"),
        data.length > 0 && /* @__PURE__ */ jsxDEV18("span", { className: "inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-zinc-600 rounded-full", children: data.length }, void 0, !1, {
          fileName: "app/components/MailList.tsx",
          lineNumber: 73,
          columnNumber: 15
        }, this)
      ] }, void 0, !0, {
        fileName: "app/components/MailList.tsx",
        lineNumber: 69,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV18(
        "button",
        {
          className: "rounded ml-auto p-1",
          title: "refresh",
          onClick: () => queryClient.invalidateQueries({
            queryKey: ["mails"]
          }),
          children: /* @__PURE__ */ jsxDEV18(
            Refresh,
            {
              className: isFetching ? "animate-spin" : " size-6 hover:animate-spin active:opacity-20 transition-all duration-300"
            },
            void 0,
            !1,
            {
              fileName: "app/components/MailList.tsx",
              lineNumber: 86,
              columnNumber: 13
            },
            this
          )
        },
        void 0,
        !1,
        {
          fileName: "app/components/MailList.tsx",
          lineNumber: 78,
          columnNumber: 11
        },
        this
      )
    ] }, void 0, !0, {
      fileName: "app/components/MailList.tsx",
      lineNumber: 68,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV18("div", { className: "grids flex flex-col flex-1 h-[488px] overflow-y-auto p-2", children: [
      data.length === 0 && /* @__PURE__ */ jsxDEV18("div", { className: "w-full items-center h-[488px] flex-col justify-center flex", children: [
        /* @__PURE__ */ jsxDEV18(Loader, {}, void 0, !1, {
          fileName: "app/components/MailList.tsx",
          lineNumber: 100,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV18("p", { className: "text-zinc-400 mt-6", children: t("Waiting for emails...") }, void 0, !1, {
          fileName: "app/components/MailList.tsx",
          lineNumber: 101,
          columnNumber: 15
        }, this)
      ] }, void 0, !0, {
        fileName: "app/components/MailList.tsx",
        lineNumber: 99,
        columnNumber: 13
      }, this),
      data.map((mail) => /* @__PURE__ */ jsxDEV18(MailItem, { mail }, mail.id, !1, {
        fileName: "app/components/MailList.tsx",
        lineNumber: 106,
        columnNumber: 13
      }, this))
    ] }, void 0, !0, {
      fileName: "app/components/MailList.tsx",
      lineNumber: 97,
      columnNumber: 9
    }, this)
  ] }, void 0, !0, {
    fileName: "app/components/MailList.tsx",
    lineNumber: 67,
    columnNumber: 7
  }, this) }, void 0, !1, {
    fileName: "app/components/MailList.tsx",
    lineNumber: 66,
    columnNumber: 5
  }, this);
}
function MailListWithQuery({ mails }) {
  return /* @__PURE__ */ jsxDEV18(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxDEV18(MailList, { mails }, void 0, !1, {
    fileName: "app/components/MailList.tsx",
    lineNumber: 117,
    columnNumber: 7
  }, this) }, void 0, !1, {
    fileName: "app/components/MailList.tsx",
    lineNumber: 116,
    columnNumber: 5
  }, this);
}

// app/components/icons/ShieldCheck.tsx
import { jsxDEV as jsxDEV19 } from "react/jsx-dev-runtime";
function ShieldCheck(props) {
  return /* @__PURE__ */ jsxDEV19(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "32",
      height: "32",
      viewBox: "0 0 24 24",
      children: /* @__PURE__ */ jsxDEV19(
        "path",
        {
          fill: "#0891b2",
          d: "M11 17h2v-6h-2zm1-8q.425 0 .713-.288T13 8q0-.425-.288-.712T12 7q-.425 0-.712.288T11 8q0 .425.288.713T12 9m0 13q-3.475-.875-5.738-3.988T4 11.1V5l8-3l8 3v6.1q0 3.8-2.262 6.913T12 22m0-2.1q2.6-.825 4.3-3.3t1.7-5.5V6.375l-6-2.25l-6 2.25V11.1q0 3.025 1.7 5.5t4.3 3.3m0-7.9"
        },
        void 0,
        !1,
        {
          fileName: "app/components/icons/ShieldCheck.tsx",
          lineNumber: 10,
          columnNumber: 7
        },
        this
      )
    },
    void 0,
    !1,
    {
      fileName: "app/components/icons/ShieldCheck.tsx",
      lineNumber: 5,
      columnNumber: 5
    },
    this
  );
}

// app/components/icons/Cloudflare.tsx
import { jsxDEV as jsxDEV20 } from "react/jsx-dev-runtime";
function Cloudflare(props) {
  return /* @__PURE__ */ jsxDEV20(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "32",
      height: "32",
      viewBox: "0 0 280 117",
      children: [
        /* @__PURE__ */ jsxDEV20(
          "path",
          {
            fill: "#FBAD41",
            d: "M205.52 50.813c-.858 0-1.705.03-2.551.058c-.137.007-.272.04-.398.094a1.424 1.424 0 0 0-.92.994l-3.628 12.672c-1.565 5.449-.983 10.48 1.646 14.174c2.41 3.416 6.42 5.421 11.289 5.655l19.679 1.194c.585.03 1.092.312 1.4.776a1.92 1.92 0 0 1 .2 1.692a2.496 2.496 0 0 1-2.134 1.662l-20.448 1.193c-11.11.515-23.062 9.58-27.255 20.633l-1.474 3.9a1.092 1.092 0 0 0 .967 1.49h70.425a1.872 1.872 0 0 0 1.81-1.365A51.172 51.172 0 0 0 256 101.828c0-28.16-22.582-50.984-50.449-50.984"
          },
          void 0,
          !1,
          {
            fileName: "app/components/icons/Cloudflare.tsx",
            lineNumber: 10,
            columnNumber: 7
          },
          this
        ),
        /* @__PURE__ */ jsxDEV20(
          "path",
          {
            fill: "#F6821F",
            d: "m174.782 115.362l1.303-4.583c1.568-5.449.987-10.48-1.639-14.173c-2.418-3.417-6.424-5.422-11.296-5.656l-92.312-1.193a1.822 1.822 0 0 1-1.459-.776a1.919 1.919 0 0 1-.203-1.693a2.496 2.496 0 0 1 2.154-1.662l93.173-1.193c11.063-.511 23.015-9.58 27.208-20.633l5.313-14.04c.214-.596.27-1.238.156-1.86C191.126 20.51 166.91 0 137.96 0C111.269 0 88.626 17.403 80.5 41.596a26.996 26.996 0 0 0-19.156-5.359C48.549 37.524 38.25 47.946 36.979 60.88a27.905 27.905 0 0 0 .702 9.642C16.773 71.145 0 88.454 0 109.726c0 1.923.137 3.818.413 5.667c.115.897.879 1.57 1.783 1.568h170.48a2.223 2.223 0 0 0 2.106-1.63"
          },
          void 0,
          !1,
          {
            fileName: "app/components/icons/Cloudflare.tsx",
            lineNumber: 14,
            columnNumber: 7
          },
          this
        )
      ]
    },
    void 0,
    !0,
    {
      fileName: "app/components/icons/Cloudflare.tsx",
      lineNumber: 5,
      columnNumber: 5
    },
    this
  );
}

// app/components/icons/Clock.tsx
import { jsxDEV as jsxDEV21 } from "react/jsx-dev-runtime";
function Clock(props) {
  return /* @__PURE__ */ jsxDEV21(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "32",
      height: "32",
      viewBox: "0 0 22 22",
      children: /* @__PURE__ */ jsxDEV21(
        "path",
        {
          fill: "#0891b2",
          d: "M7.376 6.745c-.447.275 1.197 4.242 1.598 4.888a1.206 1.206 0 0 0 2.053-1.266c-.397-.648-3.205-3.898-3.651-3.622m-.335-4.343a8.98 8.98 0 0 1 5.918 0c.329.114.765-.115.572-.611c-.141-.36-.277-.712-.332-.855c-.131-.339-.6-.619-.804-.665C11.623.097 10.823 0 10 0S8.377.097 7.604.271c-.204.046-.672.326-.803.665l-.332.855c-.193.496.243.726.572.611m12.057.784a10.132 10.132 0 0 0-1.283-1.285c-.153-.129-.603-.234-.888.051l-1.648 1.647a9.27 9.27 0 0 1 1.155.966c.362.361.677.752.966 1.155l1.647-1.647c.286-.286.181-.735.051-.887M10 2.9A8.1 8.1 0 0 0 1.899 11A8.1 8.1 0 0 0 10 19.101A8.1 8.1 0 0 0 10 2.9m0 14.201A6.1 6.1 0 1 1 10.001 4.9A6.1 6.1 0 0 1 10 17.1z"
        },
        void 0,
        !1,
        {
          fileName: "app/components/icons/Clock.tsx",
          lineNumber: 10,
          columnNumber: 7
        },
        this
      )
    },
    void 0,
    !1,
    {
      fileName: "app/components/icons/Clock.tsx",
      lineNumber: 5,
      columnNumber: 5
    },
    this
  );
}

// app/components/icons/Info.tsx
import { jsxDEV as jsxDEV22 } from "react/jsx-dev-runtime";
function Info(props) {
  return /* @__PURE__ */ jsxDEV22(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "32",
      height: "32",
      viewBox: "0 0 26 26",
      children: /* @__PURE__ */ jsxDEV22(
        "g",
        {
          fill: "none",
          stroke: "#0891b2",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: "2",
          children: [
            /* @__PURE__ */ jsxDEV22("path", { d: "m12.802 2.165l5.575 2.389c.48.206.863.589 1.07 1.07l2.388 5.574c.22.512.22 1.092 0 1.604l-2.389 5.575c-.206.48-.589.863-1.07 1.07l-5.574 2.388c-.512.22-1.092.22-1.604 0l-5.575-2.389a2.036 2.036 0 0 1-1.07-1.07l-2.388-5.574a2.036 2.036 0 0 1 0-1.604l2.389-5.575c.206-.48.589-.863 1.07-1.07l5.574-2.388a2.036 2.036 0 0 1 1.604 0M12 9h.01" }, void 0, !1, {
              fileName: "app/components/icons/Info.tsx",
              lineNumber: 16,
              columnNumber: 9
            }, this),
            /* @__PURE__ */ jsxDEV22("path", { d: "M11 12h1v4h1" }, void 0, !1, {
              fileName: "app/components/icons/Info.tsx",
              lineNumber: 17,
              columnNumber: 9
            }, this)
          ]
        },
        void 0,
        !0,
        {
          fileName: "app/components/icons/Info.tsx",
          lineNumber: 10,
          columnNumber: 7
        },
        this
      )
    },
    void 0,
    !1,
    {
      fileName: "app/components/icons/Info.tsx",
      lineNumber: 5,
      columnNumber: 5
    },
    this
  );
}

// app/routes/_h._index.tsx
import { useTranslation as useTranslation5 } from "react-i18next";

// lib/hooks/utlis.ts
function getRandomCharacter() {
  let characters = "abcdefghijklmnopqrstuvwxyz.";
  return characters.charAt(Math.floor(Math.random() * characters.length));
}

// app/routes/_h._index.tsx
import { Toaster } from "react-hot-toast";

// app/components/password.tsx
import {
  useCallback as useCallback2,
  useEffect as useEffect5,
  useMemo,
  useState as useState3
} from "react";

// app/components/modal.tsx
import {
  useCallback,
  useEffect as useEffect4,
  useRef as useRef2
} from "react";
import { AnimatePresence as AnimatePresence2, motion as motion2 } from "framer-motion";

// app/components/leaflet.tsx
import { useEffect as useEffect2, useRef } from "react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { jsxDEV as jsxDEV23 } from "react/jsx-dev-runtime";
function Leaflet({
  setShow,
  showBlur,
  children
}) {
  let leafletRef = useRef(null), controls = useAnimation(), transitionProps = { type: "spring", stiffness: 500, damping: 30 };
  useEffect2(() => {
    controls.start({
      y: 20,
      transition: transitionProps
    });
  }, []);
  async function handleDragEnd(_, info) {
    let offset = info.offset.y, velocity = info.velocity.y, height = leafletRef.current?.getBoundingClientRect().height || 0;
    offset > height / 2 || velocity > 800 ? (await controls.start({ y: "100%", transition: transitionProps }), setShow(!1)) : controls.start({ y: 0, transition: transitionProps });
  }
  return /* @__PURE__ */ jsxDEV23(AnimatePresence, { children: [
    /* @__PURE__ */ jsxDEV23(
      motion.div,
      {
        ref: leafletRef,
        className: "group fixed inset-x-0 bottom-0 z-40 w-screen cursor-grab overflow-y-scroll bg-white pb-5 active:cursor-grabbing sm:hidden",
        style: { maxHeight: "95%" },
        initial: { y: "100%" },
        animate: controls,
        exit: { y: "100%" },
        transition: transitionProps,
        drag: "y",
        dragDirectionLock: !0,
        onDragEnd: handleDragEnd,
        dragElastic: { top: 0, bottom: 1 },
        dragConstraints: { top: 0, bottom: 0 },
        children: [
          /* @__PURE__ */ jsxDEV23(
            "div",
            {
              className: "rounded-t-4xl -mb-1 flex h-7 w-full items-center justify-center border-t border-gray-200",
              children: [
                /* @__PURE__ */ jsxDEV23("div", { className: "-mr-1 h-1 w-6 rounded-full bg-gray-300 transition-all group-active:rotate-12" }, void 0, !1, {
                  fileName: "app/components/leaflet.tsx",
                  lineNumber: 54,
                  columnNumber: 11
                }, this),
                /* @__PURE__ */ jsxDEV23("div", { className: "h-1 w-6 rounded-full bg-gray-300 transition-all group-active:-rotate-12" }, void 0, !1, {
                  fileName: "app/components/leaflet.tsx",
                  lineNumber: 55,
                  columnNumber: 11
                }, this)
              ]
            },
            void 0,
            !0,
            {
              fileName: "app/components/leaflet.tsx",
              lineNumber: 52,
              columnNumber: 9
            },
            this
          ),
          children
        ]
      },
      "leaflet",
      !0,
      {
        fileName: "app/components/leaflet.tsx",
        lineNumber: 38,
        columnNumber: 7
      },
      this
    ),
    showBlur && /* @__PURE__ */ jsxDEV23(
      motion.div,
      {
        className: "fixed inset-0 z-30 bg-gray-100 bg-opacity-10 backdrop-blur",
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        onClick: () => setShow(!1)
      },
      "leaflet-backdrop",
      !1,
      {
        fileName: "app/components/leaflet.tsx",
        lineNumber: 60,
        columnNumber: 9
      },
      this
    )
  ] }, void 0, !0, {
    fileName: "app/components/leaflet.tsx",
    lineNumber: 37,
    columnNumber: 5
  }, this);
}

// lib/hooks/use-window-size.ts
import { useEffect as useEffect3, useState as useState2 } from "react";
function useWindowSize() {
  let [windowSize, setWindowSize] = useState2({
    width: void 0,
    height: void 0
  });
  return useEffect3(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    return window.addEventListener("resize", handleResize), handleResize(), () => window.removeEventListener("resize", handleResize);
  }, []), {
    windowSize,
    isMobile: typeof windowSize?.width == "number" && windowSize?.width < 768,
    isDesktop: typeof windowSize?.width == "number" && windowSize?.width >= 768
  };
}

// app/components/modal.tsx
import { Fragment as Fragment2, jsxDEV as jsxDEV24 } from "react/jsx-dev-runtime";
function Modal({
  children,
  showModal,
  setShowModal,
  showBlur = !0
}) {
  let desktopModalRef = useRef2(null), onKeyDown = useCallback(
    (e) => {
      e.key === "Escape" && setShowModal(!1);
    },
    [setShowModal]
  );
  useEffect4(() => (document.addEventListener("keydown", onKeyDown), () => document.removeEventListener("keydown", onKeyDown)), [onKeyDown]);
  let { isMobile, isDesktop } = useWindowSize();
  return /* @__PURE__ */ jsxDEV24(AnimatePresence2, { children: showModal && /* @__PURE__ */ jsxDEV24(Fragment2, { children: [
    isMobile && /* @__PURE__ */ jsxDEV24(Leaflet, { setShow: setShowModal, showBlur, children }, void 0, !1, {
      fileName: "app/components/modal.tsx",
      lineNumber: 48,
      columnNumber: 13
    }, this),
    isDesktop && showBlur && /* @__PURE__ */ jsxDEV24(Fragment2, { children: [
      /* @__PURE__ */ jsxDEV24(
        motion2.div,
        {
          ref: desktopModalRef,
          className: "fixed inset-0 z-[1000] min-h-screen flex-col items-center justify-center md:flex",
          initial: { scale: 0.95 },
          animate: { scale: 1 },
          exit: { scale: 0.95 },
          onMouseDown: (e) => {
            desktopModalRef.current === e.target && setShowModal(!1);
          },
          children
        },
        "desktop-modal",
        !1,
        {
          fileName: "app/components/modal.tsx",
          lineNumber: 54,
          columnNumber: 15
        },
        this
      ),
      /* @__PURE__ */ jsxDEV24(
        motion2.div,
        {
          className: "fixed inset-0 z-30 bg-gray-100 bg-opacity-10 backdrop-blur",
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          onClick: () => setShowModal(!1)
        },
        "desktop-backdrop",
        !1,
        {
          fileName: "app/components/modal.tsx",
          lineNumber: 68,
          columnNumber: 15
        },
        this
      )
    ] }, void 0, !0, {
      fileName: "app/components/modal.tsx",
      lineNumber: 53,
      columnNumber: 13
    }, this)
  ] }, void 0, !0, {
    fileName: "app/components/modal.tsx",
    lineNumber: 46,
    columnNumber: 9
  }, this) }, void 0, !1, {
    fileName: "app/components/modal.tsx",
    lineNumber: 44,
    columnNumber: 5
  }, this);
}

// app/components/password.tsx
import { Form, useNavigation } from "@remix-run/react";
import { useTranslation as useTranslation4 } from "react-i18next";

// app/components/icons/Close.tsx
import { jsxDEV as jsxDEV25 } from "react/jsx-dev-runtime";
function Close(props) {
  return /* @__PURE__ */ jsxDEV25(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ...props,
      children: [
        /* @__PURE__ */ jsxDEV25("path", { d: "M18 6 6 18" }, void 0, !1, {
          fileName: "app/components/icons/Close.tsx",
          lineNumber: 16,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV25("path", { d: "m6 6 12 12" }, void 0, !1, {
          fileName: "app/components/icons/Close.tsx",
          lineNumber: 17,
          columnNumber: 7
        }, this)
      ]
    },
    void 0,
    !0,
    {
      fileName: "app/components/icons/Close.tsx",
      lineNumber: 5,
      columnNumber: 5
    },
    this
  );
}

// app/components/password.tsx
import { jsxDEV as jsxDEV26 } from "react/jsx-dev-runtime";
function PasswordModal({
  password,
  showPasswordModal,
  setShowPasswordModal
}) {
  let navigation = useNavigation(), { t } = useTranslation4(), [isSubmitted, setIsSubmitted] = useState3(!1);
  return useEffect5(() => {
    showPasswordModal && navigation.state === "submitting" && setIsSubmitted(!0), showPasswordModal && navigation.state === "idle" && isSubmitted && setShowPasswordModal(!1);
  }, [navigation.state, showPasswordModal]), /* @__PURE__ */ jsxDEV26(Modal, { showModal: showPasswordModal, setShowModal: setShowPasswordModal, children: /* @__PURE__ */ jsxDEV26("div", { className: "w-full overflow-hidden bg-white/95 backdrop-blur-xl shadow-xl p-4 md:max-w-3xl md:rounded-2xl md:border md:border-gray-200", children: [
    /* @__PURE__ */ jsxDEV26(
      Close,
      {
        className: "absolute top-4 right-4 h-6 w-6 text-gray-500 hover:text-gray-700 cursor-pointer",
        onClick: () => setShowPasswordModal(!1)
      },
      void 0,
      !1,
      {
        fileName: "app/components/password.tsx",
        lineNumber: 41,
        columnNumber: 9
      },
      this
    ),
    /* @__PURE__ */ jsxDEV26("div", { className: "flex flex-col items-center justify-center space-y-3 border-b border-gray-200 px-4 py-5 text-center md:px-16", children: [
      /* @__PURE__ */ jsxDEV26("h3", { className: "font-display text-2xl font-bold", children: t("Save password") }, void 0, !1, {
        fileName: "app/components/password.tsx",
        lineNumber: 47,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV26("p", { className: "text-gray-500", children: t("Save your password and continue using this email in 1 day") }, void 0, !1, {
        fileName: "app/components/password.tsx",
        lineNumber: 50,
        columnNumber: 11
      }, this)
    ] }, void 0, !0, {
      fileName: "app/components/password.tsx",
      lineNumber: 46,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV26(Form, { method: "POST", className: "flex flex-col mt-4 space-y-4 px-4", children: [
      /* @__PURE__ */ jsxDEV26(
        "input",
        {
          value: password,
          type: "text",
          name: "password",
          placeholder: t("Enter your password *"),
          required: !0,
          className: "rounded-md border border-slate-200 px-3 py-2 shadow-inner w-full"
        },
        void 0,
        !1,
        {
          fileName: "app/components/password.tsx",
          lineNumber: 55,
          columnNumber: 11
        },
        this
      ),
      /* @__PURE__ */ jsxDEV26("p", { className: "text-sm", children: [
        t(
          "How to get a password? Click to create a temporary email and receive at least one email to generate a password"
        ),
        "."
      ] }, void 0, !0, {
        fileName: "app/components/password.tsx",
        lineNumber: 63,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV26("p", { className: "text-sm text-yellow-600", children: [
        t(
          "Remember your password, otherwise your email will expire and cannot be retrieved"
        ),
        "."
      ] }, void 0, !0, {
        fileName: "app/components/password.tsx",
        lineNumber: 70,
        columnNumber: 11
      }, this),
      password && password.length > 0 ? /* @__PURE__ */ jsxDEV26(
        "button",
        {
          type: "submit",
          name: "_action",
          value: "stop",
          className: "py-2.5 text-white rounded-md w-full bg-red-500 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500",
          children: t("Log out")
        },
        void 0,
        !1,
        {
          fileName: "app/components/password.tsx",
          lineNumber: 78,
          columnNumber: 13
        },
        this
      ) : /* @__PURE__ */ jsxDEV26(
        "button",
        {
          type: "submit",
          value: "login",
          name: "_action",
          disabled: navigation.state != "idle",
          className: "py-2.5 text-white rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500",
          children: navigation.state === "submitting" ? t("Submitting...") : t("Login")
        },
        void 0,
        !1,
        {
          fileName: "app/components/password.tsx",
          lineNumber: 86,
          columnNumber: 13
        },
        this
      )
    ] }, void 0, !0, {
      fileName: "app/components/password.tsx",
      lineNumber: 54,
      columnNumber: 9
    }, this)
  ] }, void 0, !0, {
    fileName: "app/components/password.tsx",
    lineNumber: 40,
    columnNumber: 7
  }, this) }, void 0, !1, {
    fileName: "app/components/password.tsx",
    lineNumber: 39,
    columnNumber: 5
  }, this);
}
function usePasswordModal(password) {
  let [showPasswordModal, setShowPasswordModal] = useState3(!1), SenderModalCallback = useCallback2(() => /* @__PURE__ */ jsxDEV26(
    PasswordModal,
    {
      password,
      showPasswordModal,
      setShowPasswordModal
    },
    void 0,
    !1,
    {
      fileName: "app/components/password.tsx",
      lineNumber: 108,
      columnNumber: 7
    },
    this
  ), [showPasswordModal, setShowPasswordModal]);
  return useMemo(
    () => ({ setShowPasswordModal, PasswordModal: SenderModalCallback }),
    [setShowPasswordModal, SenderModalCallback]
  );
}

// app/components/icons/Password.tsx
import { jsxDEV as jsxDEV27 } from "react/jsx-dev-runtime";
function Password(props) {
  return /* @__PURE__ */ jsxDEV27(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ...props,
      children: [
        /* @__PURE__ */ jsxDEV27("path", { d: "M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" }, void 0, !1, {
          fileName: "app/components/icons/Password.tsx",
          lineNumber: 16,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV27("circle", { cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor" }, void 0, !1, {
          fileName: "app/components/icons/Password.tsx",
          lineNumber: 17,
          columnNumber: 7
        }, this)
      ]
    },
    void 0,
    !0,
    {
      fileName: "app/components/icons/Password.tsx",
      lineNumber: 5,
      columnNumber: 5
    },
    this
  );
}

// app/routes/_h._index.tsx
import { Fragment as Fragment3, jsxDEV as jsxDEV28 } from "react/jsx-dev-runtime";
var meta3 = () => [
  { title: "Vmail - Virtual Temporary Email" },
  {
    name: "description",
    content: "Virtual temporary Email. Privacy friendly, Valid for 1 day, AD friendly, 100% Run on Cloudflare"
  }
], loader4 = async ({ request }) => {
  let siteKey = process.env.TURNSTILE_KEY || "", domains = (process.env.EMAIL_DOMAIN || "").split(","), userMailbox = await userMailboxCookie.parse(
    request.headers.get("Cookie")
  ) || void 0;
  if (!userMailbox)
    return {
      userMailbox: void 0,
      mails: [],
      siteKey,
      domains
    };
  let db = getWebTursoDB(
    process.env.TURSO_DB_URL,
    process.env.TURSO_DB_RO_AUTH_TOKEN
  ), mails = await getEmailsByMessageTo(db, userMailbox);
  return {
    userMailbox,
    mails,
    siteKey,
    domains
  };
}, action = async ({ request }) => {
  let formData = await request.formData(), { _action } = Object.fromEntries(formData), sendWorkerUrl = process.env.SEND_WORKER_URL || "", siteKey = process.env.TURNSTILE_KEY || "", IuserMailbox = await userMailboxCookie.parse(
    request.headers.get("Cookie")
  ) || void 0;
  if (_action === "stop") {
    if (IuserMailbox)
      return redirect("/", {
        headers: {
          "Set-Cookie": await userMailboxCookie.serialize("", {
            maxAge: 1
          })
        }
      });
  } else if (_action === "create") {
    if (siteKey) {
      let response = formData.get("cf-turnstile-response");
      if (!response)
        return {
          error: "No captcha response"
        };
      let verifyEndpoint = "https://challenges.cloudflare.com/turnstile/v0/siteverify", secret = process.env.TURNSTILE_SECRET || "";
      if (!(await (await fetch(verifyEndpoint, {
        method: "POST",
        body: JSON.stringify({
          secret,
          response
        }),
        headers: {
          "Content-Type": "application/json"
        }
      })).json()).success)
        return {
          error: "Failed to verify captcha"
        };
    }
    let domains = (process.env.EMAIL_DOMAIN || "").split(",");
    if (domains.length === 0)
      return {
        error: "Email domain not set in .env"
      };
    let selectDomain = formData.get("selectDomain");
    if (domains.length > 1 && !domains.includes(selectDomain))
      return {
        error: "Invalid email domain"
      };
    let mailbox = `${randomName("", getRandomCharacter())}@${domains.length > 1 ? selectDomain : domains[0]}`, userMailbox = await userMailboxCookie.serialize(mailbox);
    return redirect("/", {
      headers: {
        "Set-Cookie": userMailbox
      }
    });
  } else if (_action === "send") {
    if (!sendWorkerUrl)
      return {
        error: "SEND_WORKER_URL not set in .env"
      };
    let res = await fetch(sendWorkerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: {
          email: IuserMailbox,
          name: formData.get("senderName") || "Anonymous"
        },
        personalizations: [
          {
            to: [
              {
                email: formData.get("receiverEmail"),
                name: "Receiver"
              }
            ]
          }
        ],
        subject: formData.get("subject"),
        content: [
          {
            type: formData.get("type"),
            value: formData.get("content")
          }
        ]
      })
    });
    return redirect("/");
  } else if (_action === "login") {
    let psd = formData.get("password");
    if (!psd)
      return {
        error: "Password is required"
      };
    let db = getWebTursoDB(
      process.env.TURSO_DB_URL,
      process.env.TURSO_DB_RO_AUTH_TOKEN
    ), res = await getEmailByPassword(db, psd);
    if (!res)
      return {
        error: "Invalid password"
      };
    let userMailbox = await userMailboxCookie.serialize(res.messageTo);
    return redirect("/", {
      headers: {
        "Set-Cookie": userMailbox
      }
    });
  } else
    return {
      error: "Invalid action"
    };
};
function Index2() {
  let loaderData = useLoaderData3(), actionData = useActionData(), navigation = useNavigation2(), { t } = useTranslation5(), { PasswordModal: PasswordModal2, setShowPasswordModal } = usePasswordModal(
    loaderData.mails[0]?.id
  );
  return /* @__PURE__ */ jsxDEV28("div", { className: "h-full flex flex-col gap-4 md:flex-row justify-center items-start mt-24 mx-6 md:mx-10", children: [
    /* @__PURE__ */ jsxDEV28("div", { className: "flex flex-col text-white items-start w-full md:w-[350px] mx-auto gap-2", children: [
      /* @__PURE__ */ jsxDEV28("div", { className: "w-full mb-4 md:max-w-[350px] shrink-0 group group-hover:before:duration-500 group-hover:after:duration-500 after:duration-500 hover:border-cyan-600 hover:before:[box-shadow:_20px_20px_20px_30px_#a21caf] duration-500 before:duration-500 hover:duration-500 hover:after:-right-8 hover:before:right-12 hover:before:-bottom-8 hover:before:blur origin-left hover:decoration-2 relative bg-neutral-800 h-full border text-left p-4 rounded-lg overflow-hidden border-cyan-50/20 before:absolute before:w-12 before:h-12 before:content[''] before:right-1 before:top-1 before:z-10 before:bg-violet-500 before:rounded-full before:blur-lg  after:absolute after:z-10 after:w-20 after:h-20 after:content['']  after:bg-rose-300 after:right-8 after:top-3 after:rounded-full after:blur-lg", children: [
        /* @__PURE__ */ jsxDEV28("h1", { className: "text-gray-50 text-xl font-bold mb-7 group-hover:text-cyan-500 duration-500", children: t("Virtual Temporary Email") }, void 0, !1, {
          fileName: "app/routes/_h._index.tsx",
          lineNumber: 230,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV28("div", { className: "flex flex-col gap-4 text-sm text-gray-200", children: [
          /* @__PURE__ */ jsxDEV28("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxDEV28(ShieldCheck, {}, void 0, !1, {
              fileName: "app/routes/_h._index.tsx",
              lineNumber: 235,
              columnNumber: 15
            }, this),
            " ",
            t("Privacy friendly")
          ] }, void 0, !0, {
            fileName: "app/routes/_h._index.tsx",
            lineNumber: 234,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV28("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxDEV28(Clock, {}, void 0, !1, {
              fileName: "app/routes/_h._index.tsx",
              lineNumber: 238,
              columnNumber: 15
            }, this),
            t("Valid for 1 Day")
          ] }, void 0, !0, {
            fileName: "app/routes/_h._index.tsx",
            lineNumber: 237,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV28("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxDEV28(Info, {}, void 0, !1, {
              fileName: "app/routes/_h._index.tsx",
              lineNumber: 242,
              columnNumber: 15
            }, this),
            t("AD friendly")
          ] }, void 0, !0, {
            fileName: "app/routes/_h._index.tsx",
            lineNumber: 241,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV28("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxDEV28(Cloudflare, {}, void 0, !1, {
              fileName: "app/routes/_h._index.tsx",
              lineNumber: 246,
              columnNumber: 15
            }, this),
            t("100% Run on Cloudflare")
          ] }, void 0, !0, {
            fileName: "app/routes/_h._index.tsx",
            lineNumber: 245,
            columnNumber: 13
          }, this)
        ] }, void 0, !0, {
          fileName: "app/routes/_h._index.tsx",
          lineNumber: 233,
          columnNumber: 11
        }, this)
      ] }, void 0, !0, {
        fileName: "app/routes/_h._index.tsx",
        lineNumber: 229,
        columnNumber: 9
      }, this),
      loaderData?.userMailbox && /* @__PURE__ */ jsxDEV28(Form2, { method: "POST", className: "w-full md:max-w-[350px] mb-4", children: [
        /* @__PURE__ */ jsxDEV28("div", { className: "mb-4 font-semibold text-sm", children: [
          t("Email address"),
          " ",
          loaderData.mails && loaderData.mails[0] && /* @__PURE__ */ jsxDEV28(
            Password,
            {
              className: "cursor-pointer text-cyan-500 inline-block w-4 h-4",
              onClick: () => setShowPasswordModal(!0)
            },
            void 0,
            !1,
            {
              fileName: "app/routes/_h._index.tsx",
              lineNumber: 257,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, !0, {
          fileName: "app/routes/_h._index.tsx",
          lineNumber: 254,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV28("div", { className: "flex items-center mb-6 text-zinc-100 bg-white/10 backdrop-blur-xl shadow-inner px-4 py-4 rounded-md w-full", children: [
          /* @__PURE__ */ jsxDEV28("span", { className: "truncate", children: loaderData.userMailbox }, void 0, !1, {
            fileName: "app/routes/_h._index.tsx",
            lineNumber: 264,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV28(
            CopyButton,
            {
              content: loaderData.userMailbox,
              className: "p-1 rounded-md ml-auto transition-all duration-200"
            },
            void 0,
            !1,
            {
              fileName: "app/routes/_h._index.tsx",
              lineNumber: 265,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, !0, {
          fileName: "app/routes/_h._index.tsx",
          lineNumber: 263,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV28(
          "button",
          {
            type: "submit",
            name: "_action",
            value: "stop",
            className: "py-2.5 rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500",
            children: t("Stop")
          },
          void 0,
          !1,
          {
            fileName: "app/routes/_h._index.tsx",
            lineNumber: 271,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, !0, {
        fileName: "app/routes/_h._index.tsx",
        lineNumber: 253,
        columnNumber: 11
      }, this),
      !loaderData?.userMailbox && /* @__PURE__ */ jsxDEV28(Form2, { method: "POST", className: "w-full md:max-w-[350px]", children: [
        loaderData.siteKey && /* @__PURE__ */ jsxDEV28("div", { className: "text-sm relative mb-4", children: [
          /* @__PURE__ */ jsxDEV28("div", { className: "mb-3 font-semibold", children: t("Validater") }, void 0, !1, {
            fileName: "app/routes/_h._index.tsx",
            lineNumber: 294,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV28("div", { className: "[&_iframe]:!w-full h-[65px] max-w-[300px] bg-gray-700", children: /* @__PURE__ */ jsxDEV28(
            Turnstile,
            {
              className: "z-10 border-none",
              siteKey: loaderData.siteKey,
              options: {
                theme: "dark"
              }
            },
            void 0,
            !1,
            {
              fileName: "app/routes/_h._index.tsx",
              lineNumber: 296,
              columnNumber: 19
            },
            this
          ) }, void 0, !1, {
            fileName: "app/routes/_h._index.tsx",
            lineNumber: 295,
            columnNumber: 17
          }, this)
        ] }, void 0, !0, {
          fileName: "app/routes/_h._index.tsx",
          lineNumber: 293,
          columnNumber: 15
        }, this),
        loaderData.domains && loaderData.domains.length > 1 && /* @__PURE__ */ jsxDEV28(Fragment3, { children: [
          /* @__PURE__ */ jsxDEV28("div", { className: "mb-3 text-sm font-semibold", children: t("Domain") }, void 0, !1, {
            fileName: "app/routes/_h._index.tsx",
            lineNumber: 308,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV28(
            "select",
            {
              id: "selectDomain",
              name: "selectDomain",
              className: "mb-4 border text-sm rounded-md block w-full p-2.5 bg-gray-700 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-gray-500",
              children: loaderData.domains.map((item) => /* @__PURE__ */ jsxDEV28(
                "option",
                {
                  className: "py-2 h-10",
                  selected: item === loaderData.domains[0],
                  value: item,
                  children: item
                },
                void 0,
                !1,
                {
                  fileName: "app/routes/_h._index.tsx",
                  lineNumber: 314,
                  columnNumber: 21
                },
                this
              ))
            },
            void 0,
            !1,
            {
              fileName: "app/routes/_h._index.tsx",
              lineNumber: 309,
              columnNumber: 17
            },
            this
          )
        ] }, void 0, !0, {
          fileName: "app/routes/_h._index.tsx",
          lineNumber: 307,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV28(
          "button",
          {
            type: "submit",
            value: "create",
            name: "_action",
            disabled: navigation.state != "idle",
            className: "py-2.5 rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500",
            children: t("Create temporary email")
          },
          void 0,
          !1,
          {
            fileName: "app/routes/_h._index.tsx",
            lineNumber: 324,
            columnNumber: 13
          },
          this
        ),
        /* @__PURE__ */ jsxDEV28(
          "p",
          {
            className: "mt-4 text-sm text-cyan-500 cursor-pointer",
            onClick: () => setShowPasswordModal(!0),
            children: [
              /* @__PURE__ */ jsxDEV28(Password, { className: "inline-block w-4 h-4 mr-2" }, void 0, !1, {
                fileName: "app/routes/_h._index.tsx",
                lineNumber: 335,
                columnNumber: 15
              }, this),
              t("Have a password? Login.")
            ]
          },
          void 0,
          !0,
          {
            fileName: "app/routes/_h._index.tsx",
            lineNumber: 332,
            columnNumber: 13
          },
          this
        )
      ] }, void 0, !0, {
        fileName: "app/routes/_h._index.tsx",
        lineNumber: 291,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV28("div", { children: actionData?.error && /* @__PURE__ */ jsxDEV28("div", { className: "text-red-500", children: t(actionData.error) }, void 0, !1, {
        fileName: "app/routes/_h._index.tsx",
        lineNumber: 343,
        columnNumber: 13
      }, this) }, void 0, !1, {
        fileName: "app/routes/_h._index.tsx",
        lineNumber: 341,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/_h._index.tsx",
      lineNumber: 228,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV28("div", { className: "w-full flex-1 overflow-hidden", children: /* @__PURE__ */ jsxDEV28(MailListWithQuery, { mails: loaderData.mails }, void 0, !1, {
      fileName: "app/routes/_h._index.tsx",
      lineNumber: 349,
      columnNumber: 9
    }, this) }, void 0, !1, {
      fileName: "app/routes/_h._index.tsx",
      lineNumber: 348,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV28(PasswordModal2, {}, void 0, !1, {
      fileName: "app/routes/_h._index.tsx",
      lineNumber: 352,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV28(Toaster, {}, void 0, !1, {
      fileName: "app/routes/_h._index.tsx",
      lineNumber: 353,
      columnNumber: 7
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/_h._index.tsx",
    lineNumber: 227,
    columnNumber: 5
  }, this);
}

// app/routes/_h.about.tsx
var h_about_exports = {};
__export(h_about_exports, {
  default: () => Index3,
  meta: () => meta4
});
import { jsxDEV as jsxDEV29 } from "react/jsx-dev-runtime";
var meta4 = () => [
  { title: "About Vmail" },
  {
    name: "description",
    content: "Virtual temporary Email. Privacy friendly, Valid for 1 day, AD friendly, 100% Run on Cloudflare"
  }
];
function Index3() {
  return /* @__PURE__ */ jsxDEV29("div", { className: "mx-10 mt-24 text-white", children: /* @__PURE__ */ jsxDEV29("div", { className: "max-w-[1400px] ", children: [
    /* @__PURE__ */ jsxDEV29("h1", { className: "text-4xl font-bold", id: "about", children: [
      "About",
      " "
    ] }, void 0, !0, {
      fileName: "app/routes/_h.about.tsx",
      lineNumber: 18,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV29("p", { className: "mt-8", children: [
      /* @__PURE__ */ jsxDEV29("strong", { children: "Vmail.DEV " }, void 0, !1, {
        fileName: "app/routes/_h.about.tsx",
        lineNumber: 22,
        columnNumber: 11
      }, this),
      " is a Virtual temporary email service.",
      " "
    ] }, void 0, !0, {
      fileName: "app/routes/_h.about.tsx",
      lineNumber: 21,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV29("p", { className: "mt-4", children: [
      "You can get a temporary email without revealing any personal information, which greatly protects your privacy.",
      " "
    ] }, void 0, !0, {
      fileName: "app/routes/_h.about.tsx",
      lineNumber: 24,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV29("p", { className: "mt-4", children: [
      "It supports selecting one domain names, making it convenient for you to use in different scenarios.",
      " "
    ] }, void 0, !0, {
      fileName: "app/routes/_h.about.tsx",
      lineNumber: 28,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV29("p", { className: "mt-4", children: [
      "100% running on the ",
      /* @__PURE__ */ jsxDEV29("strong", { children: "Cloudflare " }, void 0, !1, {
        fileName: "app/routes/_h.about.tsx",
        lineNumber: 33,
        columnNumber: 31
      }, this),
      " network, providing you with a super-fast experience.",
      " "
    ] }, void 0, !0, {
      fileName: "app/routes/_h.about.tsx",
      lineNumber: 32,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV29("p", { className: "mt-4", children: "Misuse of the temporary email service not only violates our terms of service but can also impact the normal use of other users. We encourage each user to use our services responsibly to ensure that resources are allocated and used appropriately." }, void 0, !1, {
      fileName: "app/routes/_h.about.tsx",
      lineNumber: 37,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV29("h2", { className: "mt-8 text-2xl font-bold", id: "copyrights", children: /* @__PURE__ */ jsxDEV29("a", { href: "#copyrights", children: "Copyrights " }, void 0, !1, {
      fileName: "app/routes/_h.about.tsx",
      lineNumber: 45,
      columnNumber: 11
    }, this) }, void 0, !1, {
      fileName: "app/routes/_h.about.tsx",
      lineNumber: 44,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV29("p", { className: "mt-4", children: [
      "All copyrights belong to",
      " ",
      /* @__PURE__ */ jsxDEV29("a", { href: "https://vmail.dev", rel: "nofollow", children: [
        /* @__PURE__ */ jsxDEV29("strong", { children: "Vmail.DEV " }, void 0, !1, {
          fileName: "app/routes/_h.about.tsx",
          lineNumber: 50,
          columnNumber: 13
        }, this),
        " "
      ] }, void 0, !0, {
        fileName: "app/routes/_h.about.tsx",
        lineNumber: 49,
        columnNumber: 11
      }, this),
      ".",
      " "
    ] }, void 0, !0, {
      fileName: "app/routes/_h.about.tsx",
      lineNumber: 47,
      columnNumber: 9
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/_h.about.tsx",
    lineNumber: 17,
    columnNumber: 7
  }, this) }, void 0, !1, {
    fileName: "app/routes/_h.about.tsx",
    lineNumber: 16,
    columnNumber: 5
  }, this);
}

// app/routes/_h.terms.tsx
var h_terms_exports = {};
__export(h_terms_exports, {
  default: () => Index4,
  meta: () => meta5
});
import { jsxDEV as jsxDEV30 } from "react/jsx-dev-runtime";
var meta5 = () => [
  { title: "Terms of Service" },
  {
    name: "description",
    content: "Virtual temporary Email. Privacy friendly, Valid for 1 day, AD friendly, 100% Run on Cloudflare"
  }
];
function Index4() {
  return /* @__PURE__ */ jsxDEV30("div", { className: "mx-10 mt-24 text-white", children: /* @__PURE__ */ jsxDEV30("div", { className: "max-w-[1400px] ", children: [
    /* @__PURE__ */ jsxDEV30("h1", { className: "text-4xl font-bold", id: "about", children: "Terms of Service" }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 18,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("p", { className: "mt-8", children: 'Welcome to Vmail.DEV! These Terms of Service ("Terms") govern your access to and use of our website and services. By accessing or using our services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.' }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 21,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("h2", { className: "mt-8 text-2xl font-bold", id: "Collection of Information", children: "1. Description of Service" }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 28,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("p", { className: "mt-4", children: "Vmail.DEV is a minimalistic temporary email service that allows you to obtain a temporary email address without disclosing any personal information, ensuring the protection of your privacy. Our service supports the selection of multiple domain names, providing you with the convenience of using it in various scenarios. Additionally, Vmail.DEV operates on the Cloudflare network, guaranteeing a super-fast experience." }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 31,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("h2", { className: "mt-8 text-2xl font-bold", id: "Storage of Emails", children: "2. Usage Restrictions" }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 41,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("p", { className: "mt-4", children: "2.1 Availability: Please note that Vmail.DEV is not available in China Mainland. We apologize for any inconvenience caused." }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 44,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("p", { className: "mt-4", children: "2.2 Copyright: All copyrights related to Vmail.DEV and its services belong to Vmail.DEV. You may not copy, reproduce, distribute, modify, or create derivative works of Vmail.DEV or any part thereof without explicit permission from Vmail.DEV." }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 48,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("h2", { className: "mt-8 text-2xl font-bold", id: "Deletion of Emails", children: "3. User Responsibilities" }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 55,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("p", { className: "mt-4", children: "3.1 Registration: You are not required to register or provide any personal information to use Vmail.DEV. However, you are solely responsible for maintaining the confidentiality of any temporary email addresses generated through our service." }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 58,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("p", { className: "mt-4", children: "3.2 Prohibited Activities: While using Vmail.DEV, you agree not to engage in any activities that may violate any applicable laws, regulations, or these Terms. Prohibited activities include, but are not limited to:" }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 64,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("ul", { className: "mt-4", children: [
      /* @__PURE__ */ jsxDEV30("li", { children: "a) Sending spam or unsolicited emails. " }, void 0, !1, {
        fileName: "app/routes/_h.terms.tsx",
        lineNumber: 71,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV30("li", { children: "b) Interfering with or disrupting the operation of our services." }, void 0, !1, {
        fileName: "app/routes/_h.terms.tsx",
        lineNumber: 72,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV30("li", { children: "c) Attempting to gain unauthorized access to our systems or networks." }, void 0, !1, {
        fileName: "app/routes/_h.terms.tsx",
        lineNumber: 75,
        columnNumber: 11
      }, this)
    ] }, void 0, !0, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 70,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("h2", { className: "mt-8 text-2xl font-bold", id: "Data Security", children: "4. Disclaimer of Warranty" }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 81,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("p", { className: "mt-4", children: 'Vmail.DEV is provided on an "as is" and "as available" basis. We do not warrant that our services will be uninterrupted, error-free, or secure. Your use of Vmail.DEV is at your own risk, and we disclaim all warranties, whether express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.' }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 84,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("h2", { className: "mt-8 text-2xl font-bold", id: "Third-Party Services", children: "5. Limitation of Liability" }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 93,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("p", { className: "mt-4", children: "To the maximum extent permitted by law, in no event shall Vmail.DEV or its affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of Vmail.DEV or any content or services provided through Vmail.DEV." }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 96,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("h2", { className: "mt-8 text-2xl font-bold", id: "", children: "6. Modification of Terms" }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 105,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("p", { className: "mt-4", children: "We reserve the right to modify these Terms at any time, without prior notice. Any changes to the Terms will be effective immediately upon posting. Your continued use of Vmail.DEV after the posting of any modified Terms constitutes your acceptance of such changes." }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 108,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("h2", { className: "mt-8 text-2xl font-bold", id: "Cookies", children: "7. Governing Law and Jurisdiction" }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 115,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("p", { className: "mt-4", children: "These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where Vmail.DEV is located. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts in that jurisdiction." }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 118,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("p", { className: "mt-4", children: "If you have any questions or concerns regarding these Terms, please contact us." }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 125,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDEV30("p", { className: "mt-8", children: "Last updated: 2024-04-10" }, void 0, !1, {
      fileName: "app/routes/_h.terms.tsx",
      lineNumber: 129,
      columnNumber: 9
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/_h.terms.tsx",
    lineNumber: 17,
    columnNumber: 7
  }, this) }, void 0, !1, {
    fileName: "app/routes/_h.terms.tsx",
    lineNumber: 16,
    columnNumber: 5
  }, this);
}

// app/routes/_h.tsx
var h_exports = {};
__export(h_exports, {
  default: () => HomeLayout
});
import { Outlet as Outlet2 } from "@remix-run/react";

// app/components/Footer.tsx
import { Link as Link3 } from "@remix-run/react";

// app/components/icons/Twitter.tsx
import { jsxDEV as jsxDEV31 } from "react/jsx-dev-runtime";
function Twitter({ className }) {
  return /* @__PURE__ */ jsxDEV31(
    "svg",
    {
      width: "512",
      height: "512",
      viewBox: "0 0 24 24",
      className: "h-6 w-6",
      xmlns: "http://www.w3.org/2000/svg",
      children: /* @__PURE__ */ jsxDEV31(
        "path",
        {
          fill: "currentColor",
          d: "M8.5 2h2.5L11 2h-2.5zM13 2h2.5L15.5 2h-2.5zM10.5 2h5v0h-5zM8.5 2h5v0h-5zM10 2h3.5L13.5 2h-3.5z",
          children: /* @__PURE__ */ jsxDEV31(
            "animate",
            {
              fill: "freeze",
              attributeName: "d",
              dur: "0.4s",
              keyTimes: "0;0.3;0.5;1",
              values: `
          M8.5 2h2.5L11 2h-2.5zM13 2h2.5L15.5 2h-2.5zM10.5 2h5v0h-5zM8.5 2h5v0h-5zM10 2h3.5L13.5 2h-3.5z;
          M8.5 2h2.5L11 22h-2.5zM13 2h2.5L15.5 22h-2.5zM10.5 2h5v2h-5zM8.5 20h5v2h-5zM10 2h3.5L13.5 22h-3.5z;
          M8.5 2h2.5L11 22h-2.5zM13 2h2.5L15.5 22h-2.5zM10.5 2h5v2h-5zM8.5 20h5v2h-5zM10 2h3.5L13.5 22h-3.5z;
          M1 2h2.5L18.5 22h-2.5zM5.5 2h2.5L23 22h-2.5zM3 2h5v2h-5zM16 20h5v2h-5zM18.5 2h3.5L5 22h-3.5z`
            },
            void 0,
            !1,
            {
              fileName: "app/components/icons/Twitter.tsx",
              lineNumber: 12,
              columnNumber: 9
            },
            this
          )
        },
        void 0,
        !1,
        {
          fileName: "app/components/icons/Twitter.tsx",
          lineNumber: 9,
          columnNumber: 7
        },
        this
      )
    },
    void 0,
    !1,
    {
      fileName: "app/components/icons/Twitter.tsx",
      lineNumber: 3,
      columnNumber: 5
    },
    this
  );
}

// app/components/icons/GitHub.tsx
import { jsxDEV as jsxDEV32 } from "react/jsx-dev-runtime";
function Github({ className }) {
  return /* @__PURE__ */ jsxDEV32(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "512",
      height: "512",
      viewBox: "0 0 24 24",
      className: "h-6 w-6",
      fill: "currentColor",
      children: /* @__PURE__ */ jsxDEV32("path", { d: "M1 150c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z", children: /* @__PURE__ */ jsxDEV32(
        "animate",
        {
          fill: "freeze",
          attributeName: "d",
          dur: "0.4s",
          keyTimes: "0;0.3;0.5;1",
          values: `M4 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z;
          M8 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z;
          M10 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z;
          M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z`
        },
        void 0,
        !1,
        {
          fileName: "app/components/icons/GitHub.tsx",
          lineNumber: 11,
          columnNumber: 9
        },
        this
      ) }, void 0, !1, {
        fileName: "app/components/icons/GitHub.tsx",
        lineNumber: 10,
        columnNumber: 7
      }, this)
    },
    void 0,
    !1,
    {
      fileName: "app/components/icons/GitHub.tsx",
      lineNumber: 3,
      columnNumber: 5
    },
    this
  );
}

// app/components/icons/Wrdo.tsx
import { jsxDEV as jsxDEV33 } from "react/jsx-dev-runtime";
function WrdoLogo(props) {
  return /* @__PURE__ */ jsxDEV33(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "24",
      height: "24",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "3",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      children: [
        /* @__PURE__ */ jsxDEV33("path", { color: "#0070f3", strokeWidth: "3", d: "m12 14 4-4" }, void 0, !1, {
          fileName: "app/components/icons/Wrdo.tsx",
          lineNumber: 15,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV33("defs", { children: /* @__PURE__ */ jsxDEV33("linearGradient", { id: "gradient", x1: "0%", y1: "0%", x2: "100%", y2: "0%", children: [
          /* @__PURE__ */ jsxDEV33(
            "stop",
            {
              offset: "0%",
              style: { stopColor: "rgb(35, 35, 35)", stopOpacity: "1" }
            },
            void 0,
            !1,
            {
              fileName: "app/components/icons/Wrdo.tsx",
              lineNumber: 18,
              columnNumber: 11
            },
            this
          ),
          /* @__PURE__ */ jsxDEV33(
            "stop",
            {
              offset: "100%",
              style: { stopColor: "rgb(100,100,100)", stopOpacity: "1" }
            },
            void 0,
            !1,
            {
              fileName: "app/components/icons/Wrdo.tsx",
              lineNumber: 22,
              columnNumber: 11
            },
            this
          )
        ] }, void 0, !0, {
          fileName: "app/components/icons/Wrdo.tsx",
          lineNumber: 17,
          columnNumber: 9
        }, this) }, void 0, !1, {
          fileName: "app/components/icons/Wrdo.tsx",
          lineNumber: 16,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV33(
          "path",
          {
            d: "M3.34 19a10 10 0 1 1 17.32 0",
            stroke: "url(#gradient)",
            strokeWidth: "3"
          },
          void 0,
          !1,
          {
            fileName: "app/components/icons/Wrdo.tsx",
            lineNumber: 28,
            columnNumber: 7
          },
          this
        )
      ]
    },
    void 0,
    !0,
    {
      fileName: "app/components/icons/Wrdo.tsx",
      lineNumber: 5,
      columnNumber: 5
    },
    this
  );
}

// app/components/Footer.tsx
import { jsxDEV as jsxDEV34 } from "react/jsx-dev-runtime";
function Footer() {
  return /* @__PURE__ */ jsxDEV34("div", { className: "text-white w-full mt-auto flex flex-col items-center justify-between px-5 pt-16 mb-10 md:px-10 mx-auto sm:flex-row", children: [
    /* @__PURE__ */ jsxDEV34(Link3, { to: "/", className: "text-xl font-black leading-none select-none logo", children: "VMAIL.DEV" }, void 0, !1, {
      fileName: "app/components/Footer.tsx",
      lineNumber: 11,
      columnNumber: 7
    }, this),
    " ",
    /* @__PURE__ */ jsxDEV34("p", { className: "mt-4 text-sm text-gray-400 sm:ml-4 sm:pl-4 sm:border-l sm:border-gray-200 sm:mt-0", children: [
      "\xA9 2024 Products of",
      " ",
      /* @__PURE__ */ jsxDEV34(
        Link3,
        {
          className: "font-semibold underline hover:text-gray-600",
          to: "https://www.oiov.dev",
          target: "_blank",
          children: "oiov"
        },
        void 0,
        !1,
        {
          fileName: "app/components/Footer.tsx",
          lineNumber: 16,
          columnNumber: 9
        },
        this
      ),
      "."
    ] }, void 0, !0, {
      fileName: "app/components/Footer.tsx",
      lineNumber: 14,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV34("div", { className: "inline-flex justify-center mt-4 space-x-5 sm:ml-auto sm:mt-0 sm:justify-start", children: [
      /* @__PURE__ */ jsxDEV34(
        Link3,
        {
          to: "https://wr.do",
          target: "_blank",
          title: "WR.DO",
          className: "text-gray-400 hover:text-gray-500  scale-[1.2]",
          children: /* @__PURE__ */ jsxDEV34(WrdoLogo, { className: "w-6 h-6" }, void 0, !1, {
            fileName: "app/components/Footer.tsx",
            lineNumber: 30,
            columnNumber: 11
          }, this)
        },
        void 0,
        !1,
        {
          fileName: "app/components/Footer.tsx",
          lineNumber: 25,
          columnNumber: 9
        },
        this
      ),
      /* @__PURE__ */ jsxDEV34(
        Link3,
        {
          to: "mailto:hi@oiov.dev",
          title: "Email",
          className: "text-gray-400 hover:text-gray-500",
          children: /* @__PURE__ */ jsxDEV34(MailIcon, { className: "w-6 h-6" }, void 0, !1, {
            fileName: "app/components/Footer.tsx",
            lineNumber: 36,
            columnNumber: 11
          }, this)
        },
        void 0,
        !1,
        {
          fileName: "app/components/Footer.tsx",
          lineNumber: 32,
          columnNumber: 9
        },
        this
      ),
      /* @__PURE__ */ jsxDEV34(
        Link3,
        {
          to: "https://twitter.com/yesmoree",
          target: "_blank",
          title: "Twitter",
          className: "text-gray-400 hover:text-gray-500",
          children: /* @__PURE__ */ jsxDEV34(Twitter, {}, void 0, !1, {
            fileName: "app/components/Footer.tsx",
            lineNumber: 43,
            columnNumber: 11
          }, this)
        },
        void 0,
        !1,
        {
          fileName: "app/components/Footer.tsx",
          lineNumber: 38,
          columnNumber: 9
        },
        this
      ),
      /* @__PURE__ */ jsxDEV34(
        Link3,
        {
          to: "https://github.com/oiov/vmail",
          target: "_blank",
          title: "Github",
          className: "text-gray-400 hover:text-gray-500",
          children: /* @__PURE__ */ jsxDEV34(Github, {}, void 0, !1, {
            fileName: "app/components/Footer.tsx",
            lineNumber: 50,
            columnNumber: 11
          }, this)
        },
        void 0,
        !1,
        {
          fileName: "app/components/Footer.tsx",
          lineNumber: 45,
          columnNumber: 9
        },
        this
      )
    ] }, void 0, !0, {
      fileName: "app/components/Footer.tsx",
      lineNumber: 24,
      columnNumber: 7
    }, this)
  ] }, void 0, !0, {
    fileName: "app/components/Footer.tsx",
    lineNumber: 10,
    columnNumber: 5
  }, this);
}

// app/components/Header.tsx
import { Link as Link4 } from "@remix-run/react";

// app/components/icons/vmail.tsx
import { jsxDEV as jsxDEV35 } from "react/jsx-dev-runtime";
function VmailLogo() {
  return /* @__PURE__ */ jsxDEV35(
    "svg",
    {
      id: "iconce.com",
      width: "32",
      height: "32",
      viewBox: "0 0 256 256",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      xmlnsXlink: "http://www.w3.org/1999/xlink",
      children: [
        /* @__PURE__ */ jsxDEV35("defs", { children: [
          /* @__PURE__ */ jsxDEV35(
            "linearGradient",
            {
              id: "r5",
              gradientUnits: "userSpaceOnUse",
              gradientTransform: "rotate(45)",
              style: { transformOrigin: "center center" },
              children: [
                /* @__PURE__ */ jsxDEV35("stop", { stopColor: "#5C5C5C" }, void 0, !1, {
                  fileName: "app/components/icons/vmail.tsx",
                  lineNumber: 17,
                  columnNumber: 11
                }, this),
                /* @__PURE__ */ jsxDEV35("stop", { offset: "1", stopColor: "#0F1015" }, void 0, !1, {
                  fileName: "app/components/icons/vmail.tsx",
                  lineNumber: 18,
                  columnNumber: 11
                }, this)
              ]
            },
            void 0,
            !0,
            {
              fileName: "app/components/icons/vmail.tsx",
              lineNumber: 12,
              columnNumber: 9
            },
            this
          ),
          /* @__PURE__ */ jsxDEV35(
            "radialGradient",
            {
              id: "r6",
              cx: "0",
              cy: "0",
              r: "1",
              gradientUnits: "userSpaceOnUse",
              gradientTransform: "translate(256) rotate(90) scale(512)",
              children: [
                /* @__PURE__ */ jsxDEV35("stop", { stopColor: "white" }, void 0, !1, {
                  fileName: "app/components/icons/vmail.tsx",
                  lineNumber: 27,
                  columnNumber: 11
                }, this),
                /* @__PURE__ */ jsxDEV35("stop", { offset: "1", stopColor: "white", stopOpacity: "0" }, void 0, !1, {
                  fileName: "app/components/icons/vmail.tsx",
                  lineNumber: 28,
                  columnNumber: 11
                }, this)
              ]
            },
            void 0,
            !0,
            {
              fileName: "app/components/icons/vmail.tsx",
              lineNumber: 20,
              columnNumber: 9
            },
            this
          )
        ] }, void 0, !0, {
          fileName: "app/components/icons/vmail.tsx",
          lineNumber: 11,
          columnNumber: 7
        }, this),
        /* @__PURE__ */ jsxDEV35(
          "rect",
          {
            id: "r4",
            width: "256",
            height: "256",
            x: "0",
            y: "0",
            rx: "48",
            fill: "url(#r5)",
            stroke: "#FFFFFF",
            strokeWidth: "0",
            strokeOpacity: "100%",
            paintOrder: "stroke"
          },
          void 0,
          !1,
          {
            fileName: "app/components/icons/vmail.tsx",
            lineNumber: 31,
            columnNumber: 7
          },
          this
        ),
        /* @__PURE__ */ jsxDEV35(
          "svg",
          {
            xmlns: "http://www.w3.org/2000/svg",
            width: "170",
            height: "170",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "#FFFFFF",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            className: "text-white",
            alignmentBaseline: "middle",
            x: "43",
            y: "43",
            children: [
              /* @__PURE__ */ jsxDEV35("path", { d: "M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" }, void 0, !1, {
                fileName: "app/components/icons/vmail.tsx",
                lineNumber: 58,
                columnNumber: 9
              }, this),
              /* @__PURE__ */ jsxDEV35("polyline", { points: "15,9 18,9 18,11" }, void 0, !1, {
                fileName: "app/components/icons/vmail.tsx",
                lineNumber: 59,
                columnNumber: 9
              }, this),
              /* @__PURE__ */ jsxDEV35("path", { d: "M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2v0" }, void 0, !1, {
                fileName: "app/components/icons/vmail.tsx",
                lineNumber: 60,
                columnNumber: 9
              }, this),
              /* @__PURE__ */ jsxDEV35("line", { x1: "6", x2: "7", y1: "10", y2: "10" }, void 0, !1, {
                fileName: "app/components/icons/vmail.tsx",
                lineNumber: 61,
                columnNumber: 9
              }, this)
            ]
          },
          void 0,
          !0,
          {
            fileName: "app/components/icons/vmail.tsx",
            lineNumber: 44,
            columnNumber: 7
          },
          this
        )
      ]
    },
    void 0,
    !0,
    {
      fileName: "app/components/icons/vmail.tsx",
      lineNumber: 3,
      columnNumber: 5
    },
    this
  );
}

// app/components/Header.tsx
import { useTranslation as useTranslation6 } from "react-i18next";

// app/components/icons/GitHubPlat.tsx
import { jsxDEV as jsxDEV36 } from "react/jsx-dev-runtime";
function GithubPlat({ className }) {
  return /* @__PURE__ */ jsxDEV36(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className: "mb-[1px]",
      children: /* @__PURE__ */ jsxDEV36("path", { d: "M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 .6 -.6 1.2 -.5 2v3.5" }, void 0, !1, {
        fileName: "app/components/icons/GitHubPlat.tsx",
        lineNumber: 14,
        columnNumber: 7
      }, this)
    },
    void 0,
    !1,
    {
      fileName: "app/components/icons/GitHubPlat.tsx",
      lineNumber: 3,
      columnNumber: 5
    },
    this
  );
}

// app/components/Header.tsx
import { jsxDEV as jsxDEV37 } from "react/jsx-dev-runtime";
function Header() {
  let { t } = useTranslation6();
  return /* @__PURE__ */ jsxDEV37("div", { className: "fixed top-0 z-20 h-20 w-full px-5 backdrop-blur-xl md:px-10 text-white flex items-center justify-between first-letter:shadow-sm", children: [
    /* @__PURE__ */ jsxDEV37(Link4, { to: "/", className: "font-bold flex items-center justify-center gap-3", children: [
      /* @__PURE__ */ jsxDEV37(VmailLogo, {}, void 0, !1, {
        fileName: "app/components/Header.tsx",
        lineNumber: 11,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV37("button", { className: "cool-btn", children: /* @__PURE__ */ jsxDEV37("span", { children: "VMAIL.DEV" }, void 0, !1, {
        fileName: "app/components/Header.tsx",
        lineNumber: 13,
        columnNumber: 11
      }, this) }, void 0, !1, {
        fileName: "app/components/Header.tsx",
        lineNumber: 12,
        columnNumber: 9
      }, this)
    ] }, void 0, !0, {
      fileName: "app/components/Header.tsx",
      lineNumber: 10,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV37(
      Link4,
      {
        to: "https://www.oiov.dev",
        target: "_blank",
        className: "ml-auto text-sm md:text-base hidden md:block",
        children: t("Blog")
      },
      void 0,
      !1,
      {
        fileName: "app/components/Header.tsx",
        lineNumber: 16,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV37(
      Link4,
      {
        to: "/about",
        className: "ml-3 md:ml-8 text-sm md:text-base hidden md:block",
        children: t("About")
      },
      void 0,
      !1,
      {
        fileName: "app/components/Header.tsx",
        lineNumber: 22,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV37(
      Link4,
      {
        to: "/privacy",
        className: "ml-3 md:ml-8 text-sm md:text-base hidden md:block",
        children: t("Privacy")
      },
      void 0,
      !1,
      {
        fileName: "app/components/Header.tsx",
        lineNumber: 27,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV37(
      Link4,
      {
        to: "/terms",
        className: "ml-3 md:ml-8 text-sm md:text-base hidden md:block",
        children: t("Terms")
      },
      void 0,
      !1,
      {
        fileName: "app/components/Header.tsx",
        lineNumber: 32,
        columnNumber: 7
      },
      this
    ),
    /* @__PURE__ */ jsxDEV37(
      Link4,
      {
        className: "ml-3 md:ml-8",
        target: "_blank",
        to: "https://github.com/oiov/vmail",
        children: /* @__PURE__ */ jsxDEV37("button", { className: "whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-background hover:bg-accent hover:text-accent-foreground text-md flex h-[32px] w-[85px] cursor-pointer items-center justify-center rounded-md border-2 p-2 font-semibold hover:opacity-50", children: [
          /* @__PURE__ */ jsxDEV37(GithubPlat, {}, void 0, !1, {
            fileName: "app/components/Header.tsx",
            lineNumber: 42,
            columnNumber: 11
          }, this),
          /* @__PURE__ */ jsxDEV37("div", { className: "ml-1.5 text-sm", children: "Star" }, void 0, !1, {
            fileName: "app/components/Header.tsx",
            lineNumber: 43,
            columnNumber: 11
          }, this)
        ] }, void 0, !0, {
          fileName: "app/components/Header.tsx",
          lineNumber: 41,
          columnNumber: 9
        }, this)
      },
      void 0,
      !1,
      {
        fileName: "app/components/Header.tsx",
        lineNumber: 37,
        columnNumber: 7
      },
      this
    )
  ] }, void 0, !0, {
    fileName: "app/components/Header.tsx",
    lineNumber: 9,
    columnNumber: 5
  }, this);
}

// app/routes/_h.tsx
import { jsxDEV as jsxDEV38 } from "react/jsx-dev-runtime";
function HomeLayout() {
  return /* @__PURE__ */ jsxDEV38("div", { className: "mx-auto min-h-screen flex flex-col bg-[#1f2023]", children: [
    /* @__PURE__ */ jsxDEV38(Header, {}, void 0, !1, {
      fileName: "app/routes/_h.tsx",
      lineNumber: 9,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV38(Outlet2, {}, void 0, !1, {
      fileName: "app/routes/_h.tsx",
      lineNumber: 11,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV38(Footer, {}, void 0, !1, {
      fileName: "app/routes/_h.tsx",
      lineNumber: 12,
      columnNumber: 7
    }, this)
  ] }, void 0, !0, {
    fileName: "app/routes/_h.tsx",
    lineNumber: 8,
    columnNumber: 5
  }, this);
}

// server-assets-manifest:@remix-run/dev/assets-manifest
var assets_manifest_default = { entry: { module: "/build/entry.client-IXAUMTIT.js", imports: ["/build/_shared/chunk-MTZTULID.js", "/build/_shared/chunk-NU7WI5CG.js", "/build/_shared/chunk-6S5XBZ6T.js", "/build/_shared/chunk-TJ7Q2BQK.js", "/build/_shared/chunk-FJEV5JCJ.js", "/build/_shared/chunk-FCUJHL2V.js", "/build/_shared/chunk-GBXHMM5O.js", "/build/_shared/chunk-3YTOVALE.js", "/build/_shared/chunk-73CLBT4D.js"] }, routes: { root: { id: "root", parentId: void 0, path: "", index: void 0, caseSensitive: void 0, module: "/build/root-QA4C2EM4.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/_h": { id: "routes/_h", parentId: "root", path: void 0, index: void 0, caseSensitive: void 0, module: "/build/routes/_h-OQDJSII7.js", imports: ["/build/_shared/chunk-EWDPNYBT.js"], hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/_h._index": { id: "routes/_h._index", parentId: "routes/_h", path: void 0, index: !0, caseSensitive: void 0, module: "/build/routes/_h._index-74S23OB5.js", imports: ["/build/_shared/chunk-LQIBUHYG.js", "/build/_shared/chunk-DPAHWYCU.js"], hasAction: !0, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/_h.about": { id: "routes/_h.about", parentId: "routes/_h", path: "about", index: void 0, caseSensitive: void 0, module: "/build/routes/_h.about-72FBFU4T.js", imports: void 0, hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/_h.mails.$id._index": { id: "routes/_h.mails.$id._index", parentId: "routes/_h", path: "mails/:id", index: !0, caseSensitive: void 0, module: "/build/routes/_h.mails.$id._index-MNILINA3.js", imports: ["/build/_shared/chunk-DPAHWYCU.js"], hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !0 }, "routes/_h.privacy": { id: "routes/_h.privacy", parentId: "routes/_h", path: "privacy", index: void 0, caseSensitive: void 0, module: "/build/routes/_h.privacy-ZHMCW3XK.js", imports: void 0, hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/_h.terms": { id: "routes/_h.terms", parentId: "routes/_h", path: "terms", index: void 0, caseSensitive: void 0, module: "/build/routes/_h.terms-YGE77CUH.js", imports: void 0, hasAction: !1, hasLoader: !1, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 }, "routes/api.mails._index": { id: "routes/api.mails._index", parentId: "root", path: "api/mails", index: !0, caseSensitive: void 0, module: "/build/routes/api.mails._index-KAN44PTK.js", imports: void 0, hasAction: !1, hasLoader: !0, hasClientAction: !1, hasClientLoader: !1, hasErrorBoundary: !1 } }, version: "bc8a659b", hmr: { runtime: "/build/_shared/chunk-FCUJHL2V.js", timestamp: 1741490122906 }, url: "/build/manifest-BC8A659B.js" };

// server-entry-module:@remix-run/dev/server-build
var mode = "development", assetsBuildDirectory = "public/build", future = { v3_fetcherPersist: !1, v3_relativeSplatPath: !1 }, publicPath = "/build/", entry = { module: entry_server_exports }, routes = {
  root: {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: root_exports
  },
  "routes/_h.mails.$id._index": {
    id: "routes/_h.mails.$id._index",
    parentId: "routes/_h",
    path: "mails/:id",
    index: !0,
    caseSensitive: void 0,
    module: h_mails_id_index_exports
  },
  "routes/api.mails._index": {
    id: "routes/api.mails._index",
    parentId: "root",
    path: "api/mails",
    index: !0,
    caseSensitive: void 0,
    module: api_mails_index_exports
  },
  "routes/_h.privacy": {
    id: "routes/_h.privacy",
    parentId: "routes/_h",
    path: "privacy",
    index: void 0,
    caseSensitive: void 0,
    module: h_privacy_exports
  },
  "routes/_h._index": {
    id: "routes/_h._index",
    parentId: "routes/_h",
    path: void 0,
    index: !0,
    caseSensitive: void 0,
    module: h_index_exports
  },
  "routes/_h.about": {
    id: "routes/_h.about",
    parentId: "routes/_h",
    path: "about",
    index: void 0,
    caseSensitive: void 0,
    module: h_about_exports
  },
  "routes/_h.terms": {
    id: "routes/_h.terms",
    parentId: "routes/_h",
    path: "terms",
    index: void 0,
    caseSensitive: void 0,
    module: h_terms_exports
  },
  "routes/_h": {
    id: "routes/_h",
    parentId: "root",
    path: void 0,
    index: void 0,
    caseSensitive: void 0,
    module: h_exports
  }
};
export {
  assets_manifest_default as assets,
  assetsBuildDirectory,
  entry,
  future,
  mode,
  publicPath,
  routes
};
//# sourceMappingURL=index.js.map
