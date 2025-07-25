// frontend/vite.config.js
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [tailwindcss(), vue()],
  server: {
    port: 3000,        // 改回 3000 端口
    host: '127.0.0.1', // 使用 127.0.0.1 而不是 0.0.0.0
    strictPort: true,  
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('❌ Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('🔄 Sending Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('✅ Received Response:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'), 
    },
  },
  // css: {
  //   postcss: path.resolve(__dirname, 'postcss.config.cjs'), 
  // },
})