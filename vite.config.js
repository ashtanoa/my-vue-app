import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  base: './',
  
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    
    // 关键：添加这些配置
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    
    // 清空输出目录
    emptyOutDir: true,
    
    // 确保使用正确的资源路径
    assetsInlineLimit: 4096
  },
  
  // 预览配置
  preview: {
    port: 4173
  }
})