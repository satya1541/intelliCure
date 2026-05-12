import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 4001,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:4002',
        changeOrigin: true,
        ws: true,
      },
      '/icu-stream': {
        target: 'http://98.130.96.220:3000',
        changeOrigin: true,
        rewrite: (proxyPath) => proxyPath.replace(/^\/icu-stream/, '') || '/',
      },
    },
  },
})
