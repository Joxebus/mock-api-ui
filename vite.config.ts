import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Dev proxy: forward the backend routes to the Spring app on :8080 so the
    // SPA can call them same-origin (no CORS needed in development). The backend
    // also has CORS configured for http://localhost:5173 as a fallback.
    proxy: {
      '/config': 'http://localhost:8080',
      '/endpoint': 'http://localhost:8080',
    },
  },
})
