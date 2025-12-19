// src/main.js
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from './router'
import App from './App.vue'

const app = createApp(App)

// 注册Element Plus
app.use(ElementPlus)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// ========== 全局axios配置 ==========
// 设置基础URL
axios.defaults.baseURL = 'http://39.104.28.230:3000/api'

// 请求拦截器：添加token
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => {
  return Promise.reject(error)
})

// 响应拦截器：处理错误
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API错误:', error.response?.status, error.message)
    
    if (error.response?.status === 401) {
      // 未登录或token过期
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      ElMessage.error('请先登录')
      
      // 使用window.location跳转，避免router循环依赖
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } else if (error.response?.status === 403) {
      // 无权限
      ElMessage.error('您没有权限执行此操作')
    }
    
    return Promise.reject(error)
  }
)

// 挂载到全局
app.config.globalProperties.$axios = axios
app.config.globalProperties.$http = axios

// 最后挂载router
app.use(router)

app.mount('#app')