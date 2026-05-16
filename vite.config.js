import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "https://taxproconsult.co.tz/",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
