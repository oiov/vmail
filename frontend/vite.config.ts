import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build/client', // 重要：确保输出目录与 wrangler.toml 中的 assets.directory 一致
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    // 开发时代理，将 /api 和 /config 请求转发给本地运行的 worker
    proxy: {
      '/api': 'http://127.0.0.1:8787',
      '/config': 'http://127.0.0.1:8787',
    },
  },
});