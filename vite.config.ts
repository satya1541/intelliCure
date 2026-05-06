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
    allowedHosts: true,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:4002',
        changeOrigin: true,
        ws: true,
      },
      '/hls': {
        target: 'http://13.48.231.221:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
