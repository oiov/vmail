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
