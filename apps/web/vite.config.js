import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/nominatim/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('User-Agent', 'PolarisFleetManager/1.0 (contact: support@polarislogistics.org)');
            proxyReq.setHeader('Referer', 'https://polarislogistics.org');
          });
        }
      }
    }
  },
})
