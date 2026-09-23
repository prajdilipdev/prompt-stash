import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

import { mockSupabasePlugin } from './scripts/mockSupabasePlugin'

// QA convenience: `QA_PROXY=1 npm run dev` forwards Supabase-shaped API calls
// to an external port (8877). Otherwise, the dev server middleware handles it directly.
const qaProxy = process.env.QA_PROXY === '1'

export default defineConfig({
  plugins: [react(), mockSupabasePlugin()],
  define: {
    // Dev-only flag consumed by src/lib/supabase.ts to route API calls to the
    // same origin in QA/mock environments.
    __QA_PROXY__: JSON.stringify(true),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: qaProxy
      ? {
          '/rest': { target: 'http://127.0.0.1:8877', changeOrigin: true },
          '/auth': { target: 'http://127.0.0.1:8877', changeOrigin: true },
        }
      : undefined,
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
