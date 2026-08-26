// worker/src/api/v1/routes/mailboxes.test.ts
// 契约(CodeRabbit PR#42 CR-3): EMAIL_DOMAIN 配置解析必须与用户输入同样小写归一化，
// 否则配置含大写域名时合法请求被误判 400。与身份层 parseAllowedDomains 的归一化对齐。
import assert from "node:assert/strict";
import test from "node:test";
import mailboxesRouter from "./mailboxes.ts";

// 最小假 D1: 建箱走 insertMailbox(db, mailbox) -> db.insert().values().execute()
function fakeDb() {
  return {
    insert: () => ({ values: () => ({ execute: async () => ({}) }) }),
    select: () => { throw new Error("not expected in this path"); },
  } as never;
}

const ctxStub = {
  waitUntil() {},
  passThroughOnException() {},
} as never;

// 大写配置域名: 归一化正确时应与小写输入匹配
const ENV = {
  EMAIL_DOMAIN: "Mail.Example.COM,plain.org",
  DB: fakeDb(),
} as never;

async function createMailbox(body: object): Promise<Response> {
  const req = new Request("https://vmail.test/api/v1/mailboxes", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": "k" },
    body: JSON.stringify(body),
  });
  // mailboxesRouter 是挂载在 /mailboxes 下的子路由，直接以根路径请求
  return mailboxesRouter.request("/", { ...req, method: "POST" } as Request, ENV, ctxStub);
}

test("配置大写域名 + 用户传小写: 不得误判 400 (CR-3)", async () => {
  const res = await createMailbox({ domain: "mail.example.com", localPart: "alice" });
  assert.notEqual(res.status, 400, `status=${res.status} body=${await res.text()}`);
});

test("配置小写域名 + 用户传大写: 同样接受后归一化", async () => {
  const res = await createMailbox({ domain: "PLAIN.ORG", localPart: "bob" });
  assert.notEqual(res.status, 400, `status=${res.status} body=${await res.text()}`);
});
