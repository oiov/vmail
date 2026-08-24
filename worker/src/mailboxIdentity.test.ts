import assert from "node:assert/strict";
import test from "node:test";
import {
  createMailboxIdentity,
  isAllowedMailboxAddress,
} from "./mailboxIdentity.ts";

test("MailboxIdentity Module — 对象接口固化白名单解析，仅暴露 isAllowed/verify", async () => {
  const id = createMailboxIdentity("example.com, mail.test", "secret");
  assert.equal(id.isAllowed("Alice@Example.com"), true);
  assert.equal(id.isAllowed("alice@sub.example.com"), false);
  assert.equal(id.isAllowedDomain("mail.test"), true);
  assert.equal(id.isAllowed("not-an-email"), false);
  // CSV 只在构造时解析一次
  assert.equal(
    isAllowedMailboxAddress("alice@mail.test", " example.com , MAIL.TEST "),
    true,
  );
});

test("MailboxIdentity Module — token 生命周期由 Module 拥有", async () => {
  const id = createMailboxIdentity("example.com", "s3cr3t");
  const now = 1_700_000_000_000;
  const token = await id.createToken("Alice@Example.com", now, 60);
  assert.ok(token);
  assert.equal(await id.verifyToken(token!, now + 1000), "alice@example.com");
  assert.equal(await id.verifyToken(token!, now + 61_000), null);
  assert.equal(await id.verifyToken(token! + "x", now + 1000), null);
  // 无 secret 时 create/verify 返回 null
  const noSecret = createMailboxIdentity("example.com");
  assert.equal(await noSecret.createToken("a@example.com"), null);
});
