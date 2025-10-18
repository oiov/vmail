import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

export default {
  // 修复：确保 Tailwind 扫描 index.html 和 src 目录下的所有相关文件以生成样式
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    // 迁移自 Remix 项目，用于邮件详情页面的文章样式
    typography,
  ],
} satisfies Config;
