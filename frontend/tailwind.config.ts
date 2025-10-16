import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"], // 修复了内容扫描路径
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;