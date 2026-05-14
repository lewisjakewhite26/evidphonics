import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Portable layout: UI + data stay at repo root (`components/`, `data/`, `lib/`).
// Only bootstrap + routes live under `src/` so a future Next.js `app/` tree can
// re-import the same modules via `@/…` without moving lesson logic again.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
  // Listen on all interfaces so both http://localhost:5173 and http://127.0.0.1:5173 work.
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    // Pre-transform the planner graph so the first browser request is faster after `vite` starts.
    warmup: {
      clientFiles: ['./index.html', './src/main.tsx', './src/App.tsx', './src/pages/GraphemePickerPage.tsx'],
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
  },
})
