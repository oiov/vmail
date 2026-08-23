import assert from "node:assert/strict";
import test from "node:test";
import { isSiteUnlocked, shouldBypassSiteGate, SITE_AUTH_COOKIE } from "./app/siteGate.ts";

test("SiteGate Module — 无 PASSWORD 时任意请求视为已解锁", () => {
  const req = new Request("https://vmail.test/", { headers: {} });
  assert.equal(isSiteUnlocked(req, {}), true);
  assert.equal(isSiteUnlocked(req, { PASSWORD: "" }), true);
});

test("SiteGate Module — 有 PASSWORD 时仅当 cookie 含 vmail_site_auth=1 才放行", () => {
  const unlocked = new Request("https://vmail.test/", { headers: { cookie: `${SITE_AUTH_COOKIE}=1` } });
  const wrong = new Request("https://vmail.test/", { headers: { cookie: "other=1" } });
  const empty = new Request("https://vmail.test/", { headers: {} });
  const spaced = new Request("https://vmail.test/", { headers: { cookie: `${SITE_AUTH_COOKIE}=1; other=1` } });
  assert.equal(isSiteUnlocked(unlocked, { PASSWORD: "secret" }), true);
  assert.equal(isSiteUnlocked(spaced, { PASSWORD: "secret" }), true);
  assert.equal(isSiteUnlocked(wrong, { PASSWORD: "secret" }), false);
  assert.equal(isSiteUnlocked(empty, { PASSWORD: "secret" }), false);
});

test("SiteGate Module — 白名单路径直接绕过门禁", () => {
  assert.equal(shouldBypassSiteGate("/"), true);
  assert.equal(shouldBypassSiteGate("/index.html"), true);
  assert.equal(shouldBypassSiteGate("/api/emails"), true);
  assert.equal(shouldBypassSiteGate("/config"), true);
  assert.equal(shouldBypassSiteGate("/auth/unlock"), true);
  assert.equal(shouldBypassSiteGate("/auth/status"), true);
  assert.equal(shouldBypassSiteGate("/assets/app.js"), true);
  assert.equal(shouldBypassSiteGate("/favicon.ico"), true);
  assert.equal(shouldBypassSiteGate("/some.map"), true);
  assert.equal(shouldBypassSiteGate("/dashboard"), false);
  assert.equal(shouldBypassSiteGate("/api-docs"), false);
});
