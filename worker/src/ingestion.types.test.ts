import assert from "node:assert/strict";
import test from "node:test";
import { mapPostalToInsertEmail, type ParsedMail } from "./app/ingestion.ts";

// 行为契约: ParsedMail 类型化后，headers 缺省时回退为空数组而非 undefined/null
test("Ingestion Module — headers 缺省回退空数组 (类型化契约)", () => {
  const now = new Date("2025-01-01T00:00:00.000Z");
  const mail: ParsedMail = {
    from: { address: "a@b.com", name: "" },
    subject: "s",
    messageId: "<m@b.com>",
    // headers 故意缺省
  };
  const inserted = mapPostalToInsertEmail(
    mail,
    { from: "a@b.com", to: "c@wenxi.dev" },
    now,
    "id-hdr",
  );
  assert.ok(Array.isArray(inserted.headers), "headers 必须是数组");
  assert.equal(inserted.headers.length, 0);
});
