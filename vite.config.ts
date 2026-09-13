import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => ({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["logo.png", "app-icon.svg"],
      manifest: {
        name: "HalalScan — Ingredient checks",
        short_name: "HalalScan",
        description:
          "Ingredient evidence, saved checks, and guidance on your device.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#1b5c36",
        background_color: "#f9f5f0",
        icons: [
          {
            src: "/logo.png",
            sizes: "1254x1254",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/app-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2,png,svg,webmanifest}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
        // Only build assets are precached. API responses and uploads remain network-only.
        runtimeCaching: [],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    hmr: process.env.DISABLE_HMR !== "true",
    proxy: {
      "/api": {
        target: process.env.FLASK_API_URL || "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
}));
