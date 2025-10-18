import {
  require_runtime
} from "/build/_shared/chunk-GBXHMM5O.js";
import {
  __toESM
} from "/build/_shared/chunk-73CLBT4D.js";

// hmr-runtime:remix:hmr
var import_runtime = __toESM(require_runtime());
var prevRefreshReg = window.$RefreshReg$;
var prevRefreshSig = window.$RefreshSig$;
window.$RefreshReg$ = (type, id) => {
  const fullId = id;
  import_runtime.default.register(type, fullId);
};
window.$RefreshReg$ = prevRefreshReg;
window.$RefreshSig$ = prevRefreshSig;
window.$RefreshSig$ = import_runtime.default.createSignatureFunctionForTransform;
window.$RefreshRuntime$ = import_runtime.default;
window.$RefreshRuntime$.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {
};
window.$RefreshSig$ = () => (type) => type;
if (!window.__hmr__) {
  window.__hmr__ = {
    contexts: {}
  };
}
function createHotContext(id) {
  let callback;
  let disposed = false;
  let hot = {
    accept: (dep, cb) => {
      if (typeof dep !== "string") {
        cb = dep;
        dep = void 0;
      }
      if (dep) {
        if (window.__hmr__.contexts[dep]) {
          window.__hmr__.contexts[dep].dispose();
        }
        window.__hmr__.contexts[dep] = createHotContext(dep);
        window.__hmr__.contexts[dep].accept(cb);
        return;
      }
      if (disposed) {
        throw new Error("import.meta.hot.accept() called after dispose()");
      }
      if (callback) {
        throw new Error("import.meta.hot.accept() already called");
      }
      callback = cb;
    },
    dispose: () => {
      disposed = true;
    },
    emit(self) {
      if (callback) {
        callback(self);
        return true;
      }
      return false;
    }
  };
  if (window.__hmr__.contexts[id]) {
    window.__hmr__.contexts[id].dispose();
  }
  window.__hmr__.contexts[id] = hot;
  return hot;
}

export {
  createHotContext
};
//# sourceMappingURL=/build/_shared/chunk-FCUJHL2V.js.map
