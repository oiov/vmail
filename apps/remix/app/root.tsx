import type { LinksFunction, LoaderFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
  useLoaderData,
} from "@remix-run/react";
import stylesheet from "./tailwind.css";

import { useChangeLanguage } from "remix-i18next/react";
import { useTranslation } from "react-i18next";
import i18next from "~/i18next.server";
import { useEffect } from "react";

export const loader: LoaderFunction = async ({ request }) => {
  let locale = await i18next.getLocale(request);
  return json({ locale });
};

export let handle = {
  // In the handle export, we can add a i18n key with namespaces our route
  // will need to load. This key can be a single string or an array of strings.
  // TIP: In most cases, you should set this to your defaultNS from your i18n config
  // or if you did not set one, set it to the i18next default namespace "translation"
  i18n: "common",
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

function isInWebView() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const isIOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua);
  const isAndroidWebView = /Android.*(wv|\.0\.0\.0)/i.test(ua);
  const noReferrer = document.referrer === "";
  const shortHistory = history.length <= 1;
  const noOpener = !window.opener;

  return isAndroidWebView;
}

export default function App() {
  let { locale } = useLoaderData<typeof loader>();
  let { i18n } = useTranslation();
  useChangeLanguage(locale);

  useEffect(() => {
    if (isInWebView()) {
      // alert("禁止 WebView 访问");
      window.location.href = "https://wr.do";
    }
  }, []);

  return (
    <html lang={locale} dir={i18n.dir()}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/*         <meta name="monetag" content="3b91a63b69a7f937a33993b4d456c476"></meta> */}
        <Meta />
        <Links />
        {/* Umami Analytics 
        <script
          defer
          src="https://umami.oiov.dev/script.js"
          data-website-id="4e48018a-ecd4-4d52-81ef-fcc771e981c5"></script> */}
        {/* Google Analytics */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-39WSEGK1FQ"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-39WSEGK1FQ');
            `,
          }}></script>
      </head>
      <body className="">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
