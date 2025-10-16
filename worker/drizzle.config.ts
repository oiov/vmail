import type { Config } from "drizzle-kit";

export default {
  // 指向新的 schema 文件位置
  schema: "./src/database/schema.ts",
  // 指定迁移文件的输出目录
  out: "./drizzle",
} satisfies Config;