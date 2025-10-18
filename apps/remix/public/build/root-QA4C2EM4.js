import {
  useTranslation
} from "/build/_shared/chunk-NU7WI5CG.js";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData
} from "/build/_shared/chunk-6S5XBZ6T.js";
import "/build/_shared/chunk-TJ7Q2BQK.js";
import {
  require_jsx_dev_runtime
} from "/build/_shared/chunk-FJEV5JCJ.js";
import {
  createHotContext
} from "/build/_shared/chunk-FCUJHL2V.js";
import "/build/_shared/chunk-GBXHMM5O.js";
import {
  require_react
} from "/build/_shared/chunk-3YTOVALE.js";
import {
  __commonJS,
  __toESM
} from "/build/_shared/chunk-73CLBT4D.js";

// empty-module:~/i18next.server
var require_i18next = __commonJS({
  "empty-module:~/i18next.server"(exports, module) {
    module.exports = {};
  }
});

// app/tailwind.css
var tailwind_default = "/build/_assets/tailwind-ASMKV4RQ.css";

// ../../node_modules/.pnpm/remix-i18next@6.0.1_@remix-run+cloudflare@2.5.0_@cloudflare+workers-types@4.20231218.0_typesc_qrhi7mlauebmj5hlvaxs5l32lm/node_modules/remix-i18next/build/react.js
var React = __toESM(require_react(), 1);
function useChangeLanguage(locale) {
  let { i18n } = useTranslation();
  React.useEffect(() => {
    i18n.changeLanguage(locale);
  }, [locale, i18n]);
}

// app/root.tsx
var import_i18next = __toESM(require_i18next(), 1);
var import_react3 = __toESM(require_react(), 1);
var import_jsx_dev_runtime = __toESM(require_jsx_dev_runtime(), 1);
if (!window.$RefreshReg$ || !window.$RefreshSig$ || !window.$RefreshRuntime$) {
  console.warn("remix:hmr: React Fast Refresh only works when the Remix compiler is running in development mode.");
} else {
  prevRefreshReg = window.$RefreshReg$;
  prevRefreshSig = window.$RefreshSig$;
  window.$RefreshReg$ = (type, id) => {
    window.$RefreshRuntime$.register(type, '"app/root.tsx"' + id);
  };
  window.$RefreshSig$ = window.$RefreshRuntime$.createSignatureFunctionForTransform;
}
var prevRefreshReg;
var prevRefreshSig;
var _s = $RefreshSig$();
if (import.meta) {
  import.meta.hot = createHotContext(
    //@ts-expect-error
    "app/root.tsx"
  );
}
var handle = {
  // In the handle export, we can add a i18n key with namespaces our route
  // will need to load. This key can be a single string or an array of strings.
  // TIP: In most cases, you should set this to your defaultNS from your i18n config
  // or if you did not set one, set it to the i18next default namespace "translation"
  i18n: "common"
};
var links = () => [{
  rel: "stylesheet",
  href: tailwind_default
}];
function isInWebView() {
  if (typeof window === "undefined")
    return false;
  const ua = navigator.userAgent || "";
  const isIOSWebView = /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(ua);
  const isAndroidWebView = /Android.*(wv|\.0\.0\.0)/i.test(ua);
  const noReferrer = document.referrer === "";
  const shortHistory = history.length <= 1;
  const noOpener = !window.opener;
  return isAndroidWebView;
}
function App() {
  _s();
  let {
    locale
  } = useLoaderData();
  let {
    i18n
  } = useTranslation();
  useChangeLanguage(locale);
  (0, import_react3.useEffect)(() => {
    if (isInWebView()) {
      window.location.href = "https://18.wr.do";
    }
  }, []);
  return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("html", { lang: locale, dir: i18n.dir(), children: [
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("head", { children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("meta", { charSet: "utf-8" }, void 0, false, {
        fileName: "app/root.tsx",
        lineNumber: 73,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }, void 0, false, {
        fileName: "app/root.tsx",
        lineNumber: 74,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("meta", { name: "monetag", content: "3b91a63b69a7f937a33993b4d456c476" }, void 0, false, {
        fileName: "app/root.tsx",
        lineNumber: 75,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Meta, {}, void 0, false, {
        fileName: "app/root.tsx",
        lineNumber: 76,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Links, {}, void 0, false, {
        fileName: "app/root.tsx",
        lineNumber: 77,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("script", { async: true, src: "https://www.googletagmanager.com/gtag/js?id=G-39WSEGK1FQ" }, void 0, false, {
        fileName: "app/root.tsx",
        lineNumber: 83,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("script", { dangerouslySetInnerHTML: {
        __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-39WSEGK1FQ');
            `
      } }, void 0, false, {
        fileName: "app/root.tsx",
        lineNumber: 84,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/root.tsx",
      lineNumber: 72,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("body", { className: "", children: [
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Outlet, {}, void 0, false, {
        fileName: "app/root.tsx",
        lineNumber: 94,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ScrollRestoration, {}, void 0, false, {
        fileName: "app/root.tsx",
        lineNumber: 95,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Scripts, {}, void 0, false, {
        fileName: "app/root.tsx",
        lineNumber: 96,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(LiveReload, {}, void 0, false, {
        fileName: "app/root.tsx",
        lineNumber: 97,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "app/root.tsx",
      lineNumber: 93,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "app/root.tsx",
    lineNumber: 71,
    columnNumber: 10
  }, this);
}
_s(App, "ooeLzUYl3XIrS6taY2efuqkHU6M=", false, function() {
  return [useLoaderData, useTranslation, useChangeLanguage];
});
_c = App;
var _c;
$RefreshReg$(_c, "App");
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
export {
  App as default,
  handle,
  links
};
//# sourceMappingURL=/build/root-QA4C2EM4.js.map
