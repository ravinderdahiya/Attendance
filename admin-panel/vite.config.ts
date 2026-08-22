import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Deployed under /admin/ in production (mharidhani.com/admin) alongside
  // the separate marketing site at the domain root - local dev stays at /.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
    host: '0.0.0.0',
  },
})
