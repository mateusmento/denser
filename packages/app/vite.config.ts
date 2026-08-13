import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { themeOverrideDevPlugin } from "./vite-plugin-theme-override";

const designSystemSrc = path.resolve(import.meta.dirname, "../design-system/src");

export default defineConfig({
  plugins: [vue(), tailwindcss(), themeOverrideDevPlugin()],
  resolve: {
    alias: [
      {
        find: "@/lib/utils",
        replacement: path.join(designSystemSrc, "lib/utils.ts"),
      },
      {
        find: "@/components",
        replacement: path.join(designSystemSrc, "components"),
      },
      {
        find: "@/composables",
        replacement: path.join(designSystemSrc, "composables"),
      },
      { find: "@", replacement: path.resolve(import.meta.dirname, "src") },
    ],
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL ?? "http://localhost:3457",
        changeOrigin: true,
      },
      "/socket.io": {
        target: process.env.VITE_API_URL ?? "http://localhost:3457",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
