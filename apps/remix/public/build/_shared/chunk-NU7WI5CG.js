import {
  require_react
} from "/build/_shared/chunk-3YTOVALE.js";
import {
  __commonJS,
  __toESM
} from "/build/_shared/chunk-73CLBT4D.js";

// ../../node_modules/.pnpm/void-elements@3.1.0/node_modules/void-elements/index.js
var require_void_elements = __commonJS({
  "../../node_modules/.pnpm/void-elements@3.1.0/node_modules/void-elements/index.js"(exports, module) {
    module.exports = {
      "area": true,
      "base": true,
      "br": true,
      "col": true,
      "embed": true,
      "hr": true,
      "img": true,
      "input": true,
      "link": true,
      "meta": true,
      "param": true,
      "source": true,
      "track": true,
      "wbr": true
    };
  }
});

// ../../node_modules/.pnpm/react-i18next@14.1.0_i18next@23.10.1_react-dom@18.2.0_react@18.2.0__react@18.2.0/node_modules/react-i18next/dist/es/unescape.js
var matchHtmlEntity = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g;
var htmlEntities = {
  "&amp;": "&",
  "&#38;": "&",
  "&lt;": "<",
  "&#60;": "<",
  "&gt;": ">",
  "&#62;": ">",
  "&apos;": "'",
  "&#39;": "'",
  "&quot;": '"',
  "&#34;": '"',
  "&nbsp;": " ",
  "&#160;": " ",
  "&copy;": "\xA9",
  "&#169;": "\xA9",
  "&reg;": "\xAE",
  "&#174;": "\xAE",
  "&hellip;": "\u2026",
  "&#8230;": "\u2026",
  "&#x2F;": "/",
  "&#47;": "/"
};
var unescapeHtmlEntity = (m) => htmlEntities[m];
var unescape = (text) => text.replace(matchHtmlEntity, unescapeHtmlEntity);

// ../../node_modules/.pnpm/react-i18next@14.1.0_i18next@23.10.1_react-dom@18.2.0_react@18.2.0__react@18.2.0/node_modules/react-i18next/dist/es/defaults.js
var defaultOptions = {
  bindI18n: "languageChanged",
  bindI18nStore: "",
  transEmptyNodeValue: "",
  transSupportBasicHtmlNodes: true,
  transWrapTextNodes: "",
  transKeepBasicHtmlNodesFor: ["br", "strong", "i", "p"],
  useSuspense: true,
  unescape
};
function setDefaults() {
  let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
  defaultOptions = {
    ...defaultOptions,
    ...options
  };
}
function getDefaults() {
  return defaultOptions;
}

// ../../node_modules/.pnpm/react-i18next@14.1.0_i18next@23.10.1_react-dom@18.2.0_react@18.2.0__react@18.2.0/node_modules/react-i18next/dist/es/i18nInstance.js
var i18nInstance;
function setI18n(instance) {
  i18nInstance = instance;
}
function getI18n() {
  return i18nInstance;
}

// ../../node_modules/.pnpm/react-i18next@14.1.0_i18next@23.10.1_react-dom@18.2.0_react@18.2.0__react@18.2.0/node_modules/react-i18next/dist/es/initReactI18next.js
var initReactI18next = {
  type: "3rdParty",
  init(instance) {
    setDefaults(instance.options.react);
    setI18n(instance);
  }
};

// ../../node_modules/.pnpm/react-i18next@14.1.0_i18next@23.10.1_react-dom@18.2.0_react@18.2.0__react@18.2.0/node_modules/react-i18next/dist/es/I18nextProvider.js
var import_react2 = __toESM(require_react(), 1);

// ../../node_modules/.pnpm/react-i18next@14.1.0_i18next@23.10.1_react-dom@18.2.0_react@18.2.0__react@18.2.0/node_modules/react-i18next/dist/es/context.js
var import_react = __toESM(require_react(), 1);
var I18nContext = (0, import_react.createContext)();
var ReportNamespaces = class {
  constructor() {
    this.usedNamespaces = {};
  }
  addUsedNamespaces(namespaces) {
    namespaces.forEach((ns) => {
      if (!this.usedNamespaces[ns])
        this.usedNamespaces[ns] = true;
    });
  }
  getUsedNamespaces() {
    return Object.keys(this.usedNamespaces);
  }
};

// ../../node_modules/.pnpm/react-i18next@14.1.0_i18next@23.10.1_react-dom@18.2.0_react@18.2.0__react@18.2.0/node_modules/react-i18next/dist/es/I18nextProvider.js
function I18nextProvider(_ref) {
  let {
    i18n,
    defaultNS,
    children
  } = _ref;
  const value = (0, import_react2.useMemo)(() => ({
    i18n,
    defaultNS
  }), [i18n, defaultNS]);
  return (0, import_react2.createElement)(I18nContext.Provider, {
    value
  }, children);
}

// ../../node_modules/.pnpm/react-i18next@14.1.0_i18next@23.10.1_react-dom@18.2.0_react@18.2.0__react@18.2.0/node_modules/react-i18next/dist/es/Trans.js
var import_react4 = __toESM(require_react(), 1);

// ../../node_modules/.pnpm/react-i18next@14.1.0_i18next@23.10.1_react-dom@18.2.0_react@18.2.0__react@18.2.0/node_modules/react-i18next/dist/es/TransWithoutContext.js
var import_react3 = __toESM(require_react(), 1);

// ../../node_modules/.pnpm/html-parse-stringify@3.0.1/node_modules/html-parse-stringify/dist/html-parse-stringify.module.js
var import_void_elements = __toESM(require_void_elements());

// ../../node_modules/.pnpm/react-i18next@14.1.0_i18next@23.10.1_react-dom@18.2.0_react@18.2.0__react@18.2.0/node_modules/react-i18next/dist/es/utils.js
function warn() {
  if (console && console.warn) {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    if (typeof args[0] === "string")
      args[0] = `react-i18next:: ${args[0]}`;
    console.warn(...args);
  }
}
var alreadyWarned = {};
function warnOnce() {
  for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
    args[_key2] = arguments[_key2];
  }
  if (typeof args[0] === "string" && alreadyWarned[args[0]])
    return;
  if (typeof args[0] === "string")
    alreadyWarned[args[0]] = /* @__PURE__ */ new Date();
  warn(...args);
}
var loadedClb = (i18n, cb) => () => {
  if (i18n.isInitialized) {
    cb();
  } else {
    const initialized = () => {
      setTimeout(() => {
        i18n.off("initialized", initialized);
      }, 0);
      cb();
    };
    i18n.on("initialized", initialized);
  }
};
function loadNamespaces(i18n, ns, cb) {
  i18n.loadNamespaces(ns, loadedClb(i18n, cb));
}
function loadLanguages(i18n, lng, ns, cb) {
  if (typeof ns === "string")
    ns = [ns];
  ns.forEach((n) => {
    if (i18n.options.ns.indexOf(n) < 0)
      i18n.options.ns.push(n);
  });
  i18n.loadLanguages(lng, loadedClb(i18n, cb));
}
function oldI18nextHasLoadedNamespace(ns, i18n) {
  let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  const lng = i18n.languages[0];
  const fallbackLng = i18n.options ? i18n.options.fallbackLng : false;
  const lastLng = i18n.languages[i18n.languages.length - 1];
  if (lng.toLowerCase() === "cimode")
    return true;
  const loadNotPending = (l, n) => {
    const loadState = i18n.services.backendConnector.state[`${l}|${n}`];
    return loadState === -1 || loadState === 2;
  };
  if (options.bindI18n && options.bindI18n.indexOf("languageChanging") > -1 && i18n.services.backendConnector.backend && i18n.isLanguageChangingTo && !loadNotPending(i18n.isLanguageChangingTo, ns))
    return false;
  if (i18n.hasResourceBundle(lng, ns))
    return true;
  if (!i18n.services.backendConnector.backend || i18n.options.resources && !i18n.options.partialBundledLanguages)
    return true;
  if (loadNotPending(lng, ns) && (!fallbackLng || loadNotPending(lastLng, ns)))
    return true;
  return false;
}
function hasLoadedNamespace(ns, i18n) {
  let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
  if (!i18n.languages || !i18n.languages.length) {
    warnOnce("i18n.languages were undefined or empty", i18n.languages);
    return true;
  }
  const isNewerI18next = i18n.options.ignoreJSONStructure !== void 0;
  if (!isNewerI18next) {
    return oldI18nextHasLoadedNamespace(ns, i18n, options);
  }
  return i18n.hasLoadedNamespace(ns, {
    lng: options.lng,
    precheck: (i18nInstance2, loadNotPending) => {
      if (options.bindI18n && options.bindI18n.indexOf("languageChanging") > -1 && i18nInstance2.services.backendConnector.backend && i18nInstance2.isLanguageChangingTo && !loadNotPending(i18nInstance2.isLanguageChangingTo, ns))
        return false;
    }
  });
}

// ../../node_modules/.pnpm/react-i18next@14.1.0_i18next@23.10.1_react-dom@18.2.0_react@18.2.0__react@18.2.0/node_modules/react-i18next/dist/es/useTranslation.js
var import_react5 = __toESM(require_react(), 1);
var usePrevious = (value, ignore) => {
  const ref = (0, import_react5.useRef)();
  (0, import_react5.useEffect)(() => {
    ref.current = ignore ? ref.current : value;
  }, [value, ignore]);
  return ref.current;
};
function alwaysNewT(i18n, language, namespace, keyPrefix) {
  return i18n.getFixedT(language, namespace, keyPrefix);
}
function useMemoizedT(i18n, language, namespace, keyPrefix) {
  return (0, import_react5.useCallback)(alwaysNewT(i18n, language, namespace, keyPrefix), [i18n, language, namespace, keyPrefix]);
}
function useTranslation(ns) {
  let props = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
  const {
    i18n: i18nFromProps
  } = props;
  const {
    i18n: i18nFromContext,
    defaultNS: defaultNSFromContext
  } = (0, import_react5.useContext)(I18nContext) || {};
  const i18n = i18nFromProps || i18nFromContext || getI18n();
  if (i18n && !i18n.reportNamespaces)
    i18n.reportNamespaces = new ReportNamespaces();
  if (!i18n) {
    warnOnce("You will need to pass in an i18next instance by using initReactI18next");
    const notReadyT = (k, optsOrDefaultValue) => {
      if (typeof optsOrDefaultValue === "string")
        return optsOrDefaultValue;
      if (optsOrDefaultValue && typeof optsOrDefaultValue === "object" && typeof optsOrDefaultValue.defaultValue === "string")
        return optsOrDefaultValue.defaultValue;
      return Array.isArray(k) ? k[k.length - 1] : k;
    };
    const retNotReady = [notReadyT, {}, false];
    retNotReady.t = notReadyT;
    retNotReady.i18n = {};
    retNotReady.ready = false;
    return retNotReady;
  }
  if (i18n.options.react && i18n.options.react.wait !== void 0)
    warnOnce("It seems you are still using the old wait option, you may migrate to the new useSuspense behaviour.");
  const i18nOptions = {
    ...getDefaults(),
    ...i18n.options.react,
    ...props
  };
  const {
    useSuspense,
    keyPrefix
  } = i18nOptions;
  let namespaces = ns || defaultNSFromContext || i18n.options && i18n.options.defaultNS;
  namespaces = typeof namespaces === "string" ? [namespaces] : namespaces || ["translation"];
  if (i18n.reportNamespaces.addUsedNamespaces)
    i18n.reportNamespaces.addUsedNamespaces(namespaces);
  const ready = (i18n.isInitialized || i18n.initializedStoreOnce) && namespaces.every((n) => hasLoadedNamespace(n, i18n, i18nOptions));
  const memoGetT = useMemoizedT(i18n, props.lng || null, i18nOptions.nsMode === "fallback" ? namespaces : namespaces[0], keyPrefix);
  const getT = () => memoGetT;
  const getNewT = () => alwaysNewT(i18n, props.lng || null, i18nOptions.nsMode === "fallback" ? namespaces : namespaces[0], keyPrefix);
  const [t, setT] = (0, import_react5.useState)(getT);
  let joinedNS = namespaces.join();
  if (props.lng)
    joinedNS = `${props.lng}${joinedNS}`;
  const previousJoinedNS = usePrevious(joinedNS);
  const isMounted = (0, import_react5.useRef)(true);
  (0, import_react5.useEffect)(() => {
    const {
      bindI18n,
      bindI18nStore
    } = i18nOptions;
    isMounted.current = true;
    if (!ready && !useSuspense) {
      if (props.lng) {
        loadLanguages(i18n, props.lng, namespaces, () => {
          if (isMounted.current)
            setT(getNewT);
        });
      } else {
        loadNamespaces(i18n, namespaces, () => {
          if (isMounted.current)
            setT(getNewT);
        });
      }
    }
    if (ready && previousJoinedNS && previousJoinedNS !== joinedNS && isMounted.current) {
      setT(getNewT);
    }
    function boundReset() {
      if (isMounted.current)
        setT(getNewT);
    }
    if (bindI18n && i18n)
      i18n.on(bindI18n, boundReset);
    if (bindI18nStore && i18n)
      i18n.store.on(bindI18nStore, boundReset);
    return () => {
      isMounted.current = false;
      if (bindI18n && i18n)
        bindI18n.split(" ").forEach((e2) => i18n.off(e2, boundReset));
      if (bindI18nStore && i18n)
        bindI18nStore.split(" ").forEach((e2) => i18n.store.off(e2, boundReset));
    };
  }, [i18n, joinedNS]);
  (0, import_react5.useEffect)(() => {
    if (isMounted.current && ready) {
      setT(getT);
    }
  }, [i18n, keyPrefix, ready]);
  const ret = [t, i18n, ready];
  ret.t = t;
  ret.i18n = i18n;
  ret.ready = ready;
  if (ready)
    return ret;
  if (!ready && !useSuspense)
    return ret;
  throw new Promise((resolve) => {
    if (props.lng) {
      loadLanguages(i18n, props.lng, namespaces, () => resolve());
    } else {
      loadNamespaces(i18n, namespaces, () => resolve());
    }
  });
}

// ../../node_modules/.pnpm/react-i18next@14.1.0_i18next@23.10.1_react-dom@18.2.0_react@18.2.0__react@18.2.0/node_modules/react-i18next/dist/es/withTranslation.js
var import_react6 = __toESM(require_react(), 1);

// ../../node_modules/.pnpm/react-i18next@14.1.0_i18next@23.10.1_react-dom@18.2.0_react@18.2.0__react@18.2.0/node_modules/react-i18next/dist/es/withSSR.js
var import_react8 = __toESM(require_react(), 1);

// ../../node_modules/.pnpm/react-i18next@14.1.0_i18next@23.10.1_react-dom@18.2.0_react@18.2.0__react@18.2.0/node_modules/react-i18next/dist/es/useSSR.js
var import_react7 = __toESM(require_react(), 1);

export {
  initReactI18next,
  useTranslation,
  I18nextProvider
};
//# sourceMappingURL=/build/_shared/chunk-NU7WI5CG.js.map
