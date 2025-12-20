// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  
  // ✅ 关键配置：确保 base 是 '/'
  base: '/',
  
  // ✅ 构建输出目录
  build: {
    outDir: 'dist',
    
    // ✅ 优化选项
    rollupOptions: {
      output: {
        manualChunks: {
          // 代码分割优化
          vendor: ['vue', 'vue-router', 'axios']
        }
      }
    }
  },
  
  // ✅ 开发服务器配置（仅本地开发）
  server: {
    port: 3000,
    host: true, // 监听所有地址
    open: true, // 自动打开浏览器
    proxy: {
      // 本地开发代理配置
      '/api': {
        target: 'http://39.104.28.230:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  }
})