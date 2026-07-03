import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// Standalone config — the Base44 vite plugin (which generated the @/entities/*
// and @/integrations/* virtual modules) has been removed. Those modules now
// exist as real files under src/, resolved via the @ alias below.
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Installable, offline-capable PWA. injectManifest keeps our custom service
    // worker (src/sw.ts — web push + Workbox precache/runtime caching) and
    // auto-registers it on load. The static public/manifest.webmanifest is kept
    // (manifest: false), so linking stays in index.html.
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
      // Don't run the SW in `vite dev` (avoids stale-cache confusion while coding).
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // NOTE: no manual vendor chunking — a hand-rolled manualChunks split Radix
    // into a chunk that initialized before React (blank screen: "useLayoutEffect
    // of undefined"). Route-level lazy() in pages.config still code-splits per page;
    // let Rollup order shared vendor deps correctly.
  },
  server: {
    port: 5173,
    // The project path contains a ':' (…/Hive:Omar/…) which trips Vite's FS
    // allow-list path matching; relax it for local dev.
    fs: { strict: false },
  },
})
