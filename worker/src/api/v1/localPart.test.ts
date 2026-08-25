import test from "node:test";
import { isValidLocalPart } from "./localPart.ts";

// 契约: localPart 必须为 2-32 位, 首尾字母数字, 中间允许 . _ -
// 该正则是 v1 创建邮箱的唯一格式闸口, 非法输入一律 400 而非入库

test("LOCAL_PART_PATTERN — 合法值放行", () => {
  for (const ok of ["ab", "a.b", "user_1", "9z-_.y", "a".repeat(32)]) {
    if (!isValidLocalPart(ok)) {
      throw new Error(`合法值被误拒: ${ok}`);
    }
  }
});

test("LOCAL_PART_PATTERN — 单字符与畸形值一律拒绝", () => {
  for (const bad of [
    "a",
    "",
    "-ab",
    "ab-",
    ".ab",
    "ab.",
    "a b",
    "a@b",
    "a!".repeat(1),
    "x".repeat(33),
  ]) {
    if (isValidLocalPart(bad)) {
      throw new Error(`非法值被误放: ${JSON.stringify(bad)}`);
    }
  }
});

// 契约(2026-08-25 review-F3): 大写输入必须归一化为小写后返回
// 身份/白名单层(mailboxIdentity)全链路 toLowerCase，创建层若不归一，
// 'John.Smith@' 与 'john.smith@' 会在 BINARY 排序规则下同库共存，
// 绕过 UNIQUE 冲突检测且读路径精确匹配导致收不到信
test("normalizeLocalPart — 大写归一化为小写", async () => {
  const { normalizeLocalPart } = await import("./localPart.ts");
  if (normalizeLocalPart("John.Smith") !== "john.smith") {
    throw new Error(
      "大写未被归一化: John.Smith -> " + normalizeLocalPart("John.Smith"),
    );
  }
  if (normalizeLocalPart("JOHN") !== "john") {
    throw new Error("大写未被归一化: JOHN -> " + normalizeLocalPart("JOHN"));
  }
  // 归一化后再校验仍须合法（混合边界如 'A.b-' 归一为 'a.b-' 合法）
  if (normalizeLocalPart("MiXeD-Case_1.x") !== "mixed-case_1.x") {
    throw new Error("混合大小写归一化结果不符");
  }
});
