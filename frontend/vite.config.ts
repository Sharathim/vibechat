import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    port: 7001,
    strictPort: true,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:7002',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:7002',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:7002',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})