// vite.config.ts
import { defineConfig } from "file:///sessions/sharp-adoring-shannon/mnt/wood-working/pwa-react/node_modules/vite/dist/node/index.js";
import react from "file:///sessions/sharp-adoring-shannon/mnt/wood-working/pwa-react/node_modules/@vitejs/plugin-react-swc/index.js";
import { VitePWA } from "file:///sessions/sharp-adoring-shannon/mnt/wood-working/pwa-react/node_modules/vite-plugin-pwa/dist/index.js";
import path from "node:path";
var __vite_injected_original_dirname = "/sessions/sharp-adoring-shannon/mnt/wood-working/pwa-react";
var vite_config_default = defineConfig({
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
        "icons/maskable-512.png"
      ],
      manifest: {
        name: "Workshop",
        short_name: "Workshop",
        description: "Browse, sort, and build woodworking projects. Works offline.",
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
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        // Precache app shell (HTML/JS/CSS) and the projects.json bundle.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,json}"],
        // Project image assets and PDFs can be large; we register a runtime
        // cache for them and let the "Save offline" button warm the cache.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // Self-hosted project images + plan PDFs under /assets
            urlPattern: ({ url }) => url.pathname.includes("/assets/"),
            handler: "CacheFirst",
            options: {
              cacheName: "workshop-assets",
              expiration: {
                maxEntries: 3e3,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // Anything cross-origin (legacy remote images, PDFs)
            urlPattern: ({ url }) => url.origin !== self.location.origin,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "workshop-remote",
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    port: 5173
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvc2Vzc2lvbnMvc2hhcnAtYWRvcmluZy1zaGFubm9uL21udC93b29kLXdvcmtpbmcvcHdhLXJlYWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvc2Vzc2lvbnMvc2hhcnAtYWRvcmluZy1zaGFubm9uL21udC93b29kLXdvcmtpbmcvcHdhLXJlYWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9zZXNzaW9ucy9zaGFycC1hZG9yaW5nLXNoYW5ub24vbW50L3dvb2Qtd29ya2luZy9wd2EtcmVhY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwibm9kZTpwYXRoXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIFZpdGVQV0Eoe1xuICAgICAgcmVnaXN0ZXJUeXBlOiBcImF1dG9VcGRhdGVcIixcbiAgICAgIGluamVjdFJlZ2lzdGVyOiBcImF1dG9cIixcbiAgICAgIGluY2x1ZGVBc3NldHM6IFtcbiAgICAgICAgXCJpY29ucy9mYXZpY29uLTMyLnBuZ1wiLFxuICAgICAgICBcImljb25zL2FwcGxlLXRvdWNoLWljb24ucG5nXCIsXG4gICAgICAgIFwiaWNvbnMvaWNvbi0xOTIucG5nXCIsXG4gICAgICAgIFwiaWNvbnMvaWNvbi01MTIucG5nXCIsXG4gICAgICAgIFwiaWNvbnMvbWFza2FibGUtMTkyLnBuZ1wiLFxuICAgICAgICBcImljb25zL21hc2thYmxlLTUxMi5wbmdcIixcbiAgICAgIF0sXG4gICAgICBtYW5pZmVzdDoge1xuICAgICAgICBuYW1lOiBcIldvcmtzaG9wXCIsXG4gICAgICAgIHNob3J0X25hbWU6IFwiV29ya3Nob3BcIixcbiAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgXCJCcm93c2UsIHNvcnQsIGFuZCBidWlsZCB3b29kd29ya2luZyBwcm9qZWN0cy4gV29ya3Mgb2ZmbGluZS5cIixcbiAgICAgICAgc3RhcnRfdXJsOiBcIi4vXCIsXG4gICAgICAgIHNjb3BlOiBcIi4vXCIsXG4gICAgICAgIGRpc3BsYXk6IFwic3RhbmRhbG9uZVwiLFxuICAgICAgICBvcmllbnRhdGlvbjogXCJhbnlcIixcbiAgICAgICAgYmFja2dyb3VuZF9jb2xvcjogXCIjZjZmNGVlXCIsXG4gICAgICAgIHRoZW1lX2NvbG9yOiBcIiNmNmY0ZWVcIixcbiAgICAgICAgY2F0ZWdvcmllczogW1wibGlmZXN0eWxlXCIsIFwidXRpbGl0aWVzXCIsIFwicHJvZHVjdGl2aXR5XCJdLFxuICAgICAgICBpY29uczogW1xuICAgICAgICAgIHsgc3JjOiBcImljb25zL2ljb24tMTkyLnBuZ1wiLCBzaXplczogXCIxOTJ4MTkyXCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCIsIHB1cnBvc2U6IFwiYW55XCIgfSxcbiAgICAgICAgICB7IHNyYzogXCJpY29ucy9pY29uLTUxMi5wbmdcIiwgc2l6ZXM6IFwiNTEyeDUxMlwiLCB0eXBlOiBcImltYWdlL3BuZ1wiLCBwdXJwb3NlOiBcImFueVwiIH0sXG4gICAgICAgICAgeyBzcmM6IFwiaWNvbnMvbWFza2FibGUtMTkyLnBuZ1wiLCBzaXplczogXCIxOTJ4MTkyXCIsIHR5cGU6IFwiaW1hZ2UvcG5nXCIsIHB1cnBvc2U6IFwibWFza2FibGVcIiB9LFxuICAgICAgICAgIHsgc3JjOiBcImljb25zL21hc2thYmxlLTUxMi5wbmdcIiwgc2l6ZXM6IFwiNTEyeDUxMlwiLCB0eXBlOiBcImltYWdlL3BuZ1wiLCBwdXJwb3NlOiBcIm1hc2thYmxlXCIgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB3b3JrYm94OiB7XG4gICAgICAgIC8vIFByZWNhY2hlIGFwcCBzaGVsbCAoSFRNTC9KUy9DU1MpIGFuZCB0aGUgcHJvamVjdHMuanNvbiBidW5kbGUuXG4gICAgICAgIGdsb2JQYXR0ZXJuczogW1wiKiovKi57anMsY3NzLGh0bWwsaWNvLHBuZyxzdmcsd2VibWFuaWZlc3QsanNvbn1cIl0sXG4gICAgICAgIC8vIFByb2plY3QgaW1hZ2UgYXNzZXRzIGFuZCBQREZzIGNhbiBiZSBsYXJnZTsgd2UgcmVnaXN0ZXIgYSBydW50aW1lXG4gICAgICAgIC8vIGNhY2hlIGZvciB0aGVtIGFuZCBsZXQgdGhlIFwiU2F2ZSBvZmZsaW5lXCIgYnV0dG9uIHdhcm0gdGhlIGNhY2hlLlxuICAgICAgICBtYXhpbXVtRmlsZVNpemVUb0NhY2hlSW5CeXRlczogNSAqIDEwMjQgKiAxMDI0LFxuICAgICAgICBydW50aW1lQ2FjaGluZzogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIC8vIFNlbGYtaG9zdGVkIHByb2plY3QgaW1hZ2VzICsgcGxhbiBQREZzIHVuZGVyIC9hc3NldHNcbiAgICAgICAgICAgIHVybFBhdHRlcm46ICh7IHVybCB9KSA9PiB1cmwucGF0aG5hbWUuaW5jbHVkZXMoXCIvYXNzZXRzL1wiKSxcbiAgICAgICAgICAgIGhhbmRsZXI6IFwiQ2FjaGVGaXJzdFwiLFxuICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICBjYWNoZU5hbWU6IFwid29ya3Nob3AtYXNzZXRzXCIsXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAzMDAwLFxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCAqIDM2NSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHsgc3RhdHVzZXM6IFswLCAyMDBdIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgLy8gQW55dGhpbmcgY3Jvc3Mtb3JpZ2luIChsZWdhY3kgcmVtb3RlIGltYWdlcywgUERGcylcbiAgICAgICAgICAgIHVybFBhdHRlcm46ICh7IHVybCB9KSA9PiB1cmwub3JpZ2luICE9PSBzZWxmLmxvY2F0aW9uLm9yaWdpbixcbiAgICAgICAgICAgIGhhbmRsZXI6IFwiU3RhbGVXaGlsZVJldmFsaWRhdGVcIixcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiBcIndvcmtzaG9wLXJlbW90ZVwiLFxuICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZTogeyBzdGF0dXNlczogWzAsIDIwMF0gfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICBkZXZPcHRpb25zOiB7XG4gICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9KSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICB9LFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0OiA1MTczLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdXLFNBQVMsb0JBQW9CO0FBQzdYLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFDeEIsT0FBTyxVQUFVO0FBSGpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLGdCQUFnQjtBQUFBLE1BQ2hCLGVBQWU7QUFBQSxRQUNiO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxVQUFVO0FBQUEsUUFDUixNQUFNO0FBQUEsUUFDTixZQUFZO0FBQUEsUUFDWixhQUNFO0FBQUEsUUFDRixXQUFXO0FBQUEsUUFDWCxPQUFPO0FBQUEsUUFDUCxTQUFTO0FBQUEsUUFDVCxhQUFhO0FBQUEsUUFDYixrQkFBa0I7QUFBQSxRQUNsQixhQUFhO0FBQUEsUUFDYixZQUFZLENBQUMsYUFBYSxhQUFhLGNBQWM7QUFBQSxRQUNyRCxPQUFPO0FBQUEsVUFDTCxFQUFFLEtBQUssc0JBQXNCLE9BQU8sV0FBVyxNQUFNLGFBQWEsU0FBUyxNQUFNO0FBQUEsVUFDakYsRUFBRSxLQUFLLHNCQUFzQixPQUFPLFdBQVcsTUFBTSxhQUFhLFNBQVMsTUFBTTtBQUFBLFVBQ2pGLEVBQUUsS0FBSywwQkFBMEIsT0FBTyxXQUFXLE1BQU0sYUFBYSxTQUFTLFdBQVc7QUFBQSxVQUMxRixFQUFFLEtBQUssMEJBQTBCLE9BQU8sV0FBVyxNQUFNLGFBQWEsU0FBUyxXQUFXO0FBQUEsUUFDNUY7QUFBQSxNQUNGO0FBQUEsTUFDQSxTQUFTO0FBQUE7QUFBQSxRQUVQLGNBQWMsQ0FBQyxpREFBaUQ7QUFBQTtBQUFBO0FBQUEsUUFHaEUsK0JBQStCLElBQUksT0FBTztBQUFBLFFBQzFDLGdCQUFnQjtBQUFBLFVBQ2Q7QUFBQTtBQUFBLFlBRUUsWUFBWSxDQUFDLEVBQUUsSUFBSSxNQUFNLElBQUksU0FBUyxTQUFTLFVBQVU7QUFBQSxZQUN6RCxTQUFTO0FBQUEsWUFDVCxTQUFTO0FBQUEsY0FDUCxXQUFXO0FBQUEsY0FDWCxZQUFZO0FBQUEsZ0JBQ1YsWUFBWTtBQUFBLGdCQUNaLGVBQWUsS0FBSyxLQUFLLEtBQUs7QUFBQSxjQUNoQztBQUFBLGNBQ0EsbUJBQW1CLEVBQUUsVUFBVSxDQUFDLEdBQUcsR0FBRyxFQUFFO0FBQUEsWUFDMUM7QUFBQSxVQUNGO0FBQUEsVUFDQTtBQUFBO0FBQUEsWUFFRSxZQUFZLENBQUMsRUFBRSxJQUFJLE1BQU0sSUFBSSxXQUFXLEtBQUssU0FBUztBQUFBLFlBQ3RELFNBQVM7QUFBQSxZQUNULFNBQVM7QUFBQSxjQUNQLFdBQVc7QUFBQSxjQUNYLG1CQUFtQixFQUFFLFVBQVUsQ0FBQyxHQUFHLEdBQUcsRUFBRTtBQUFBLFlBQzFDO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQSxZQUFZO0FBQUEsUUFDVixTQUFTO0FBQUEsTUFDWDtBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
