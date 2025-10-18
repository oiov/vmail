import {
  __commonJS
} from "/build/_shared/chunk-73CLBT4D.js";

// ../../node_modules/.pnpm/react-refresh@0.14.0/node_modules/react-refresh/cjs/react-refresh-runtime.development.js
var require_react_refresh_runtime_development = __commonJS({
  "../../node_modules/.pnpm/react-refresh@0.14.0/node_modules/react-refresh/cjs/react-refresh-runtime.development.js"(exports) {
    "use strict";
    if (true) {
      (function() {
        "use strict";
        var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
        var REACT_MEMO_TYPE = Symbol.for("react.memo");
        var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
        var allFamiliesByID = /* @__PURE__ */ new Map();
        var allFamiliesByType = new PossiblyWeakMap();
        var allSignaturesByType = new PossiblyWeakMap();
        var updatedFamiliesByType = new PossiblyWeakMap();
        var pendingUpdates = [];
        var helpersByRendererID = /* @__PURE__ */ new Map();
        var helpersByRoot = /* @__PURE__ */ new Map();
        var mountedRoots = /* @__PURE__ */ new Set();
        var failedRoots = /* @__PURE__ */ new Set();
        var rootElements = (
          // $FlowIssue
          typeof WeakMap === "function" ? /* @__PURE__ */ new WeakMap() : null
        );
        var isPerformingRefresh = false;
        function computeFullKey(signature) {
          if (signature.fullKey !== null) {
            return signature.fullKey;
          }
          var fullKey = signature.ownKey;
          var hooks;
          try {
            hooks = signature.getCustomHooks();
          } catch (err) {
            signature.forceReset = true;
            signature.fullKey = fullKey;
            return fullKey;
          }
          for (var i = 0; i < hooks.length; i++) {
            var hook = hooks[i];
            if (typeof hook !== "function") {
              signature.forceReset = true;
              signature.fullKey = fullKey;
              return fullKey;
            }
            var nestedHookSignature = allSignaturesByType.get(hook);
            if (nestedHookSignature === void 0) {
              continue;
            }
            var nestedHookKey = computeFullKey(nestedHookSignature);
            if (nestedHookSignature.forceReset) {
              signature.forceReset = true;
            }
            fullKey += "\n---\n" + nestedHookKey;
          }
          signature.fullKey = fullKey;
          return fullKey;
        }
        function haveEqualSignatures(prevType, nextType) {
          var prevSignature = allSignaturesByType.get(prevType);
          var nextSignature = allSignaturesByType.get(nextType);
          if (prevSignature === void 0 && nextSignature === void 0) {
            return true;
          }
          if (prevSignature === void 0 || nextSignature === void 0) {
            return false;
          }
          if (computeFullKey(prevSignature) !== computeFullKey(nextSignature)) {
            return false;
          }
          if (nextSignature.forceReset) {
            return false;
          }
          return true;
        }
        function isReactClass(type) {
          return type.prototype && type.prototype.isReactComponent;
        }
        function canPreserveStateBetween(prevType, nextType) {
          if (isReactClass(prevType) || isReactClass(nextType)) {
            return false;
          }
          if (haveEqualSignatures(prevType, nextType)) {
            return true;
          }
          return false;
        }
        function resolveFamily(type) {
          return updatedFamiliesByType.get(type);
        }
        function cloneMap(map) {
          var clone = /* @__PURE__ */ new Map();
          map.forEach(function(value, key) {
            clone.set(key, value);
          });
          return clone;
        }
        function cloneSet(set) {
          var clone = /* @__PURE__ */ new Set();
          set.forEach(function(value) {
            clone.add(value);
          });
          return clone;
        }
        function getProperty(object, property) {
          try {
            return object[property];
          } catch (err) {
            return void 0;
          }
        }
        function performReactRefresh() {
          if (pendingUpdates.length === 0) {
            return null;
          }
          if (isPerformingRefresh) {
            return null;
          }
          isPerformingRefresh = true;
          try {
            var staleFamilies = /* @__PURE__ */ new Set();
            var updatedFamilies = /* @__PURE__ */ new Set();
            var updates = pendingUpdates;
            pendingUpdates = [];
            updates.forEach(function(_ref) {
              var family = _ref[0], nextType = _ref[1];
              var prevType = family.current;
              updatedFamiliesByType.set(prevType, family);
              updatedFamiliesByType.set(nextType, family);
              family.current = nextType;
              if (canPreserveStateBetween(prevType, nextType)) {
                updatedFamilies.add(family);
              } else {
                staleFamilies.add(family);
              }
            });
            var update = {
              updatedFamilies,
              // Families that will re-render preserving state
              staleFamilies
              // Families that will be remounted
            };
            helpersByRendererID.forEach(function(helpers) {
              helpers.setRefreshHandler(resolveFamily);
            });
            var didError = false;
            var firstError = null;
            var failedRootsSnapshot = cloneSet(failedRoots);
            var mountedRootsSnapshot = cloneSet(mountedRoots);
            var helpersByRootSnapshot = cloneMap(helpersByRoot);
            failedRootsSnapshot.forEach(function(root) {
              var helpers = helpersByRootSnapshot.get(root);
              if (helpers === void 0) {
                throw new Error("Could not find helpers for a root. This is a bug in React Refresh.");
              }
              if (!failedRoots.has(root)) {
              }
              if (rootElements === null) {
                return;
              }
              if (!rootElements.has(root)) {
                return;
              }
              var element = rootElements.get(root);
              try {
                helpers.scheduleRoot(root, element);
              } catch (err) {
                if (!didError) {
                  didError = true;
                  firstError = err;
                }
              }
            });
            mountedRootsSnapshot.forEach(function(root) {
              var helpers = helpersByRootSnapshot.get(root);
              if (helpers === void 0) {
                throw new Error("Could not find helpers for a root. This is a bug in React Refresh.");
              }
              if (!mountedRoots.has(root)) {
              }
              try {
                helpers.scheduleRefresh(root, update);
              } catch (err) {
                if (!didError) {
                  didError = true;
                  firstError = err;
                }
              }
            });
            if (didError) {
              throw firstError;
            }
            return update;
          } finally {
            isPerformingRefresh = false;
          }
        }
        function register(type, id) {
          {
            if (type === null) {
              return;
            }
            if (typeof type !== "function" && typeof type !== "object") {
              return;
            }
            if (allFamiliesByType.has(type)) {
              return;
            }
            var family = allFamiliesByID.get(id);
            if (family === void 0) {
              family = {
                current: type
              };
              allFamiliesByID.set(id, family);
            } else {
              pendingUpdates.push([family, type]);
            }
            allFamiliesByType.set(type, family);
            if (typeof type === "object" && type !== null) {
              switch (getProperty(type, "$$typeof")) {
                case REACT_FORWARD_REF_TYPE:
                  register(type.render, id + "$render");
                  break;
                case REACT_MEMO_TYPE:
                  register(type.type, id + "$type");
                  break;
              }
            }
          }
        }
        function setSignature(type, key) {
          var forceReset = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
          var getCustomHooks = arguments.length > 3 ? arguments[3] : void 0;
          {
            if (!allSignaturesByType.has(type)) {
              allSignaturesByType.set(type, {
                forceReset,
                ownKey: key,
                fullKey: null,
                getCustomHooks: getCustomHooks || function() {
                  return [];
                }
              });
            }
            if (typeof type === "object" && type !== null) {
              switch (getProperty(type, "$$typeof")) {
                case REACT_FORWARD_REF_TYPE:
                  setSignature(type.render, key, forceReset, getCustomHooks);
                  break;
                case REACT_MEMO_TYPE:
                  setSignature(type.type, key, forceReset, getCustomHooks);
                  break;
              }
            }
          }
        }
        function collectCustomHooksForSignature(type) {
          {
            var signature = allSignaturesByType.get(type);
            if (signature !== void 0) {
              computeFullKey(signature);
            }
          }
        }
        function getFamilyByID(id) {
          {
            return allFamiliesByID.get(id);
          }
        }
        function getFamilyByType(type) {
          {
            return allFamiliesByType.get(type);
          }
        }
        function findAffectedHostInstances(families) {
          {
            var affectedInstances = /* @__PURE__ */ new Set();
            mountedRoots.forEach(function(root) {
              var helpers = helpersByRoot.get(root);
              if (helpers === void 0) {
                throw new Error("Could not find helpers for a root. This is a bug in React Refresh.");
              }
              var instancesForRoot = helpers.findHostInstancesForRefresh(root, families);
              instancesForRoot.forEach(function(inst) {
                affectedInstances.add(inst);
              });
            });
            return affectedInstances;
          }
        }
        function injectIntoGlobalHook(globalObject) {
          {
            var hook = globalObject.__REACT_DEVTOOLS_GLOBAL_HOOK__;
            if (hook === void 0) {
              var nextID = 0;
              globalObject.__REACT_DEVTOOLS_GLOBAL_HOOK__ = hook = {
                renderers: /* @__PURE__ */ new Map(),
                supportsFiber: true,
                inject: function(injected) {
                  return nextID++;
                },
                onScheduleFiberRoot: function(id, root, children) {
                },
                onCommitFiberRoot: function(id, root, maybePriorityLevel, didError) {
                },
                onCommitFiberUnmount: function() {
                }
              };
            }
            if (hook.isDisabled) {
              console["warn"]("Something has shimmed the React DevTools global hook (__REACT_DEVTOOLS_GLOBAL_HOOK__). Fast Refresh is not compatible with this shim and will be disabled.");
              return;
            }
            var oldInject = hook.inject;
            hook.inject = function(injected) {
              var id = oldInject.apply(this, arguments);
              if (typeof injected.scheduleRefresh === "function" && typeof injected.setRefreshHandler === "function") {
                helpersByRendererID.set(id, injected);
              }
              return id;
            };
            hook.renderers.forEach(function(injected, id) {
              if (typeof injected.scheduleRefresh === "function" && typeof injected.setRefreshHandler === "function") {
                helpersByRendererID.set(id, injected);
              }
            });
            var oldOnCommitFiberRoot = hook.onCommitFiberRoot;
            var oldOnScheduleFiberRoot = hook.onScheduleFiberRoot || function() {
            };
            hook.onScheduleFiberRoot = function(id, root, children) {
              if (!isPerformingRefresh) {
                failedRoots.delete(root);
                if (rootElements !== null) {
                  rootElements.set(root, children);
                }
              }
              return oldOnScheduleFiberRoot.apply(this, arguments);
            };
            hook.onCommitFiberRoot = function(id, root, maybePriorityLevel, didError) {
              var helpers = helpersByRendererID.get(id);
              if (helpers !== void 0) {
                helpersByRoot.set(root, helpers);
                var current = root.current;
                var alternate = current.alternate;
                if (alternate !== null) {
                  var wasMounted = alternate.memoizedState != null && alternate.memoizedState.element != null && mountedRoots.has(root);
                  var isMounted = current.memoizedState != null && current.memoizedState.element != null;
                  if (!wasMounted && isMounted) {
                    mountedRoots.add(root);
                    failedRoots.delete(root);
                  } else if (wasMounted && isMounted)
                    ;
                  else if (wasMounted && !isMounted) {
                    mountedRoots.delete(root);
                    if (didError) {
                      failedRoots.add(root);
                    } else {
                      helpersByRoot.delete(root);
                    }
                  } else if (!wasMounted && !isMounted) {
                    if (didError) {
                      failedRoots.add(root);
                    }
                  }
                } else {
                  mountedRoots.add(root);
                }
              }
              return oldOnCommitFiberRoot.apply(this, arguments);
            };
          }
        }
        function hasUnrecoverableErrors() {
          return false;
        }
        function _getMountedRootCount() {
          {
            return mountedRoots.size;
          }
        }
        function createSignatureFunctionForTransform() {
          {
            var savedType;
            var hasCustomHooks;
            var didCollectHooks = false;
            return function(type, key, forceReset, getCustomHooks) {
              if (typeof key === "string") {
                if (!savedType) {
                  savedType = type;
                  hasCustomHooks = typeof getCustomHooks === "function";
                }
                if (type != null && (typeof type === "function" || typeof type === "object")) {
                  setSignature(type, key, forceReset, getCustomHooks);
                }
                return type;
              } else {
                if (!didCollectHooks && hasCustomHooks) {
                  didCollectHooks = true;
                  collectCustomHooksForSignature(savedType);
                }
              }
            };
          }
        }
        function isLikelyComponentType(type) {
          {
            switch (typeof type) {
              case "function": {
                if (type.prototype != null) {
                  if (type.prototype.isReactComponent) {
                    return true;
                  }
                  var ownNames = Object.getOwnPropertyNames(type.prototype);
                  if (ownNames.length > 1 || ownNames[0] !== "constructor") {
                    return false;
                  }
                  if (type.prototype.__proto__ !== Object.prototype) {
                    return false;
                  }
                }
                var name = type.name || type.displayName;
                return typeof name === "string" && /^[A-Z]/.test(name);
              }
              case "object": {
                if (type != null) {
                  switch (getProperty(type, "$$typeof")) {
                    case REACT_FORWARD_REF_TYPE:
                    case REACT_MEMO_TYPE:
                      return true;
                    default:
                      return false;
                  }
                }
                return false;
              }
              default: {
                return false;
              }
            }
          }
        }
        exports._getMountedRootCount = _getMountedRootCount;
        exports.collectCustomHooksForSignature = collectCustomHooksForSignature;
        exports.createSignatureFunctionForTransform = createSignatureFunctionForTransform;
        exports.findAffectedHostInstances = findAffectedHostInstances;
        exports.getFamilyByID = getFamilyByID;
        exports.getFamilyByType = getFamilyByType;
        exports.hasUnrecoverableErrors = hasUnrecoverableErrors;
        exports.injectIntoGlobalHook = injectIntoGlobalHook;
        exports.isLikelyComponentType = isLikelyComponentType;
        exports.performReactRefresh = performReactRefresh;
        exports.register = register;
        exports.setSignature = setSignature;
      })();
    }
  }
});

// ../../node_modules/.pnpm/react-refresh@0.14.0/node_modules/react-refresh/runtime.js
var require_runtime = __commonJS({
  "../../node_modules/.pnpm/react-refresh@0.14.0/node_modules/react-refresh/runtime.js"(exports, module) {
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_react_refresh_runtime_development();
    }
  }
});

export {
  require_runtime
};
/*! Bundled license information:

react-refresh/cjs/react-refresh-runtime.development.js:
  (**
   * @license React
   * react-refresh-runtime.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/
//# sourceMappingURL=/build/_shared/chunk-GBXHMM5O.js.map
