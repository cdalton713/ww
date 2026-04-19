import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "icons/favicon-32.png",
        "icons/apple-touch-icon.png",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/maskable-192.png",
        "icons/maskable-512.png",
      ],
      manifest: {
        name: "Workshop",
        short_name: "Workshop",
        description:
          "Browse, sort, and build woodworking projects. Works offline.",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "any",
        background_color: "#f6f4ee",
        theme_color: "#f6f4ee",
        categories: ["lifestyle", "utilities", "productivity"],
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Precache app shell (HTML/JS/CSS) and the projects.json bundle.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,json}"],
        // Project image assets and PDFs can be large; we register a runtime
        // cache for them and let the "Save offline" button warm the cache.
        // projects.json is ~8.5 MB now that it carries Woodsense + Kreg.
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        runtimeCaching: [
          {
            // Self-hosted project images + plan PDFs under /assets
            urlPattern: ({ url }) => url.pathname.includes("/assets/"),
            handler: "CacheFirst",
            options: {
              cacheName: "workshop-assets",
              expiration: {
                maxEntries: 3000,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Anything cross-origin (legacy remote images, PDFs)
            urlPattern: ({ url }) => url.origin !== self.location.origin,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "workshop-remote",
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
});
