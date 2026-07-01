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
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendors into their own chunks. Route-specific libs
        // (charts/maps/editor/pdf) load only where used; shared framework libs
        // (react/radix/supabase) are one cacheable chunk instead of bloating
        // every route's entry.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('leaflet')) return 'vendor-maps';
          if (id.includes('react-quill') || id.includes('quill')) return 'vendor-editor';
          if (id.includes('pdf-lib')) return 'vendor-pdf';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('@radix-ui')) return 'vendor-radix';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('@tanstack')) return 'vendor-query';
          if (id.includes('@phosphor-icons')) return 'vendor-icons';
          if (id.includes('date-fns')) return 'vendor-date';
          if (id.includes('i18next')) return 'vendor-i18n';
          if (id.includes('/react-dom/') || id.includes('/react-router') || id.includes('/scheduler/') || id.includes('/react/')) return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    // The project path contains a ':' (…/Hive:Omar/…) which trips Vite's FS
    // allow-list path matching; relax it for local dev.
    fs: { strict: false },
  },
})
