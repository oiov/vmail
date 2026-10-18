import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

export default {
  // 修复：确保 Tailwind 扫描 index.html 和 src 目录下的所有相关文件以生成样式
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cyan: {
          50: "#edf7ef",
          100: "#d9efdf",
          200: "#bbdfc5",
          300: "#a4d0b2",
          400: "#8fc4a0",
          500: "#71ae88",
          600: "#438461",
          700: "#34684c",
          800: "#294e3a",
          900: "#223d2e",
          950: "#17291f",
        },
        blue: {
          50: "#eff7f1",
          100: "#dceee2",
          200: "#bedcc9",
          300: "#a3cdb3",
          400: "#86b79b",
          500: "#639d7d",
          600: "#447e60",
          700: "#34664c",
          800: "#2b523f",
          900: "#233f32",
          950: "#172b21",
        },
        slate: {
          50: "#f4f7f4",
          100: "#e8eee9",
          200: "#d2ddd5",
          300: "#b7c8bc",
          400: "#92a79a",
          500: "#708779",
          600: "#526a5b",
          700: "#3b5143",
          800: "#28382d",
          900: "#1c2820",
          950: "#141d17",
        },
      },
    },
  },
  plugins: [
    // 迁移自 Remix 项目，用于邮件详情页面的文章样式
    typography,
  ],
} satisfies Config;
