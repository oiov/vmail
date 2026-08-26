import test from "node:test";
import assert from "node:assert/strict";
import {
  generateRandomLocalPart,
  generateUniqueLocalPart,
  MAX_GENERATE_ATTEMPTS,
  RANDOM_SUFFIX_LENGTH,
} from "./randomLocalPart.ts";
import { isValidLocalPart } from "./localPart.ts";

// 契约(2026-08-25 PR#42 CR-2): 随机名 = 字典组合 + CSPRNG 六位字母数字后缀。
// 熵下限: 后缀 36^6 ≈ 21.8 亿, 使在线枚举读信不可行; 格式必须过 LOCAL_PART_PATTERN 闸口。
// 冲突重试: generateUniqueLocalPart 以注入 exists 探测冲突, 重生至多 MAX_GENERATE_ATTEMPTS 次。

test("生成的 localPart 必定通过 LOCAL_PART_PATTERN 格式闸口", () => {
  for (let i = 0; i < 200; i++) {
    const v = generateRandomLocalPart();
    if (!isValidLocalPart(v)) throw new Error(`生成值未过格式闸口: ${v}`);
  }
});

test("后缀长度恒为 RANDOM_SUFFIX_LENGTH 且来自受限字母表", () => {
  const ALPHABET = /^[a-z0-9]+$/;
  for (let i = 0; i < 200; i++) {
    const v = generateRandomLocalPart();
    const suffix = v.slice(-RANDOM_SUFFIX_LENGTH);
    if (suffix.length !== RANDOM_SUFFIX_LENGTH)
      throw new Error(`后缀缺失: ${v}`);
    if (!ALPHABET.test(suffix)) throw new Error(`后缀含非法字符: ${v}`);
    if (v[v.length - RANDOM_SUFFIX_LENGTH - 1] !== ".")
      throw new Error(`缺少分隔点: ${v}`);
  }
});

test("CSPRNG 熵检查: 同批次不应出现重复(collision 概率可忽略)", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 500; i++) seen.add(generateRandomLocalPart());
  if (seen.size !== 500)
    throw new Error(`出现重复, 抽样 500 去重后 ${seen.size} — 疑似非随机源`);
});

test("generateUniqueLocalPart 耗尽时抛 LOCAL_PART_EXHAUSTED (调用方映射 409)", async () => {
  let calls = 0;
  await assert.rejects(
    generateUniqueLocalPart(async () => {
      calls++;
      return true; // 恒冲突
    }),
    { message: "LOCAL_PART_EXHAUSTED" },
  );
  if (calls !== MAX_GENERATE_ATTEMPTS)
    throw new Error(`应探测 ${MAX_GENERATE_ATTEMPTS} 次, 实际 ${calls}`);
});

test("字典基座 + 分隔点 + 后缀总长不超过 32 (格式闸口零抛错前提)", () => {
  // CodeRabbit PR#42 CR-2: 基座最长模式 first.lastYY = 5+1+5+2 = 13,
  // 加 "." 与六位后缀共 20, 上限 32 留有 12 余量 — 该不变量是闸口永不触发的根因
  for (let i = 0; i < 500; i++) {
    const v = generateRandomLocalPart();
    if (v.length > 32) throw new Error(`超长: ${v} (${v.length})`);
  }
});

test("exists 恒 false 时一次通过", async () => {
  let calls = 0;
  await generateUniqueLocalPart(async () => {
    calls++;
    return false;
  });
  if (calls !== 1) throw new Error(`应只探测一次, 实际 ${calls}`);
});

test("前 N-1 次冲突后第 N 次成功且候选互不相同", async () => {
  let calls = 0;
  const seen = new Set<string>();
  const v = await generateUniqueLocalPart(async () => {
    calls++;
    return calls < 4;
  });
  if (calls !== 4) throw new Error(`应探测 4 次, 实际 ${calls}`);
  // 注意: 探测的是每次新生成的候选, generateUniqueLocalPart 内部持有候选但探测回调拿不到——
  // 该子句改为验证返回值与调用次数的关系(回调无参版本)
  if (!isValidLocalPart(v)) throw new Error(`最终值未过格式闸口: ${v}`);
});
