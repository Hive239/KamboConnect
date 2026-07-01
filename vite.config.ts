import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// Standalone config — the Base44 vite plugin (which generated the @/entities/*
// and @/integrations/* virtual modules) has been removed. Those modules now
// exist as real files under src/, resolved via the @ alias below.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // The project path contains a ':' (…/Hive:Omar/…) which trips Vite's FS
    // allow-list path matching; relax it for local dev.
    fs: { strict: false },
  },
})
