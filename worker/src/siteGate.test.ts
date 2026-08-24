import assert from "node:assert/strict";
import test from "node:test";
import {
  createSiteGateCookieValue,
  isSiteUnlocked,
  shouldBypassSiteGate,
  SITE_AUTH_COOKIE,
} from "./app/siteGate.ts";
test("SiteGate Module — 无 PASSWORD 时任意请求视为已解锁", async () => {
  const req = new Request("https://vmail.test/", { headers: {} });
  assert.equal(await isSiteUnlocked(req, {}), true);
  assert.equal(await isSiteUnlocked(req, { PASSWORD: "" }), true);
});

test("SiteGate Module — 签发的合法 cookie 放行，伪造/过期/篡改一律拒绝", async () => {
  const password = "secret";
  const value = await createSiteGateCookieValue(password);
  const unlocked = new Request("https://vmail.test/", {
    headers: { cookie: `${SITE_AUTH_COOKIE}=${value}` },
  });
  const spaced = new Request("https://vmail.test/", {
    headers: { cookie: `${SITE_AUTH_COOKIE}=${value}; other=1` },
  });
  // 旧版明文 "1" 不再被认可
  const legacy = new Request("https://vmail.test/", {
    headers: { cookie: `${SITE_AUTH_COOKIE}=1` },
  });
  // 篡改 expiry 的值（签名不匹配）
  const tampered = new Request("https://vmail.test/", {
    headers: {
      cookie: `${SITE_AUTH_COOKIE}=99999999999999.${value.split(".")[1]}`,
    },
  });
  // 错误密码签发的 cookie
  const wrongKey = await createSiteGateCookieValue("other-password");
  const wrongSigned = new Request("https://vmail.test/", {
    headers: { cookie: `${SITE_AUTH_COOKIE}=${wrongKey}` },
  });
  const noCookie = new Request("https://vmail.test/", { headers: {} });
  assert.equal(await isSiteUnlocked(unlocked, { PASSWORD: password }), true);
  assert.equal(await isSiteUnlocked(spaced, { PASSWORD: password }), true);
  assert.equal(await isSiteUnlocked(legacy, { PASSWORD: password }), false);
  assert.equal(await isSiteUnlocked(tampered, { PASSWORD: password }), false);
  assert.equal(
    await isSiteUnlocked(wrongSigned, { PASSWORD: password }),
    false,
  );
  assert.equal(await isSiteUnlocked(noCookie, { PASSWORD: password }), false);
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
