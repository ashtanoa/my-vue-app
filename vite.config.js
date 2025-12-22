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
    
    // 关键修复：指定入口文件
    rollupOptions: {
      // 这里！明确指定index.html作为入口
      input: './index.html',
      
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    },
    
    emptyOutDir: true,
    assetsInlineLimit: 4096
  },
  
  preview: {
    port: 4173
  }
})