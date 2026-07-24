import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/uploads': 'http://localhost:3777',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
