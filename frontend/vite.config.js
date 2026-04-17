import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { 
        target: process.env.VITE_API_BASE_URL || 'http://localhost:4000', 
        changeOrigin: true 
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['zustand', 'axios', 'react-hot-toast'],
          'vendor-maps': ['leaflet', 'react-leaflet'],
          'vendor-charts': ['recharts'],
          'vendor-socket': ['socket.io-client'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
})
