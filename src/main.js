// src/main.js
import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import axios from 'axios'
import { ElMessage, ElLoading } from 'element-plus'
import router from './router'
import App from './App.vue'

// 创建Vue应用
const app = createApp(App)

// 注册Element Plus
app.use(ElementPlus, {
  locale: zhCn,
  size: 'default'
})

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// ========== 全局axios配置 ==========
// 核心修复：使用相对路径，通过Vercel代理转发到后端
axios.defaults.baseURL = '/api'

// 超时时间
axios.defaults.timeout = 30000

// 请求拦截器
let loadingInstance = null
axios.interceptors.request.use(
  config => {
    console.log(`📡 请求: ${config.method.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      fullURL: config.baseURL + config.url
    })
    
    // 显示加载状态
    if (config.showLoading !== false) {
      loadingInstance = ElLoading.service({
        lock: true,
        text: '加载中...',
        background: 'rgba(0, 0, 0, 0.7)'
      })
    }
    
    // 添加token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 确保内容类型
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json'
    }
    
    return config
  },
  error => {
    // 关闭加载状态
    if (loadingInstance) {
      loadingInstance.close()
    }
    console.error('❌ 请求配置错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
axios.interceptors.response.use(
  response => {
    // 关闭加载状态
    if (loadingInstance) {
      loadingInstance.close()
      loadingInstance = null
    }
    
    console.log(`✅ 响应成功: ${response.config.url}`, {
      status: response.status,
      data: response.data
    })
    
    // 如果后端返回了token，存储它
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token)
    }
    
    return response.data
  },
  error => {
    // 关闭加载状态
    if (loadingInstance) {
      loadingInstance.close()
      loadingInstance = null
    }
    
    const errorInfo = {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL
    }
    
    console.error('❌ API请求失败:', errorInfo)
    
    // ========== 处理网络错误 ==========
    if (!error.response) {
      // 网络错误或混合内容被阻止
      if (error.message === 'Network Error') {
        // 检查是否是混合内容问题
        if (error.config?.url?.startsWith('http://') && window.location.protocol === 'https:') {
          ElMessage.error({
            message: '安全连接问题：前端已启用HTTPS，但后端API为HTTP',
            duration: 8000,
            showClose: true
          })
          console.error('🔒 混合内容被阻止！请检查：')
          console.error('1. vercel.json 是否配置正确？')
          console.error('2. axios.baseURL 是否为 /api？')
          console.error('3. 当前请求URL:', error.config.url)
        } else {
          ElMessage.error('网络连接失败，请检查网络连接')
        }
      } else if (error.code === 'ECONNABORTED') {
        ElMessage.error('请求超时，请稍后重试')
      } else {
        ElMessage.error(`网络错误: ${error.message}`)
      }
      return Promise.reject(error)
    }
    
    // ========== 处理HTTP状态码 ==========
    const status = error.response?.status
    const data = error.response?.data
    
    switch (status) {
      case 400:
        ElMessage.error(data?.message || '请求参数错误')
        break
      case 401:
        // 未授权/Token过期
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        
        // 如果不在登录页面，跳转到登录
        if (!window.location.pathname.includes('/login')) {
          ElMessage.warning('登录已过期，请重新登录')
          setTimeout(() => {
            // 使用router.push而不是window.location，避免循环
            if (router.currentRoute.value.path !== '/login') {
              router.push('/login')
            }
          }, 1500)
        }
        break
      case 403:
        ElMessage.error(data?.message || '没有权限执行此操作')
        break
      case 404:
        // 404可能是代理配置问题
        if (error.config.url.includes('/api/')) {
          console.warn('⚠️ API 404错误，检查：')
          console.warn('1. 后端服务是否运行？')
          console.warn('2. API路径是否正确？')
          console.warn('3. Vercel代理配置是否正确？')
        }
        ElMessage.error(data?.message || '请求的资源不存在')
        break
      case 500:
        ElMessage.error(data?.message || '服务器内部错误')
        break
      case 502:
      case 503:
      case 504:
        ElMessage.error('服务暂时不可用，请稍后重试')
        break
      default:
        const msg = data?.message || data?.msg || `请求失败 (${status})`
        ElMessage.error(msg)
    }
    
    return Promise.reject(error)
  }
)

// ========== 全局挂载 ==========
app.config.globalProperties.$axios = axios
app.config.globalProperties.$http = axios
app.config.globalProperties.$message = ElMessage

// 全局请求方法
const http = {
  get(url, config = {}) {
    return axios.get(url, config)
  },
  post(url, data = {}, config = {}) {
    return axios.post(url, data, config)
  },
  put(url, data = {}, config = {}) {
    return axios.put(url, data, config)
  },
  delete(url, config = {}) {
    return axios.delete(url, config)
  }
}
app.config.globalProperties.$httpUtil = http

// ========== 全局错误处理 ==========
// Vue错误处理
app.config.errorHandler = (err, instance, info) => {
  console.error('🚨 Vue应用错误:', {
    error: err,
    component: instance?.$options?.name || '未知组件',
    info: info,
    stack: err.stack
  })
  ElMessage.error('应用出现异常，请刷新页面或联系管理员')
}

// 全局Promise错误处理
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 未处理的Promise错误:', event.reason)
  
  // 避免重复显示错误消息
  if (!event.reason?.config?.url?.includes('/api/')) {
    ElMessage.error('操作失败，请重试')
  }
  
  // 阻止默认处理（避免控制台报错）
  event.preventDefault()
})

// ========== 初始化检查 ==========
console.log('🚀 应用初始化信息:', {
  mode: import.meta.env.MODE,
  baseURL: axios.defaults.baseURL,
  protocol: window.location.protocol,
  host: window.location.host,
  env: {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    PROD: import.meta.env.PROD,
    DEV: import.meta.env.DEV
  }
})

// 检查API连接（可选）
const checkApiConnection = async () => {
  try {
    // 测试一个简单的API端点
    const response = await axios.get('/health', {
      timeout: 5000,
      showLoading: false
    }).catch(() => ({ data: { status: 'unreachable' } }))
    
    console.log('🔗 API连接状态:', response.data)
  } catch (error) {
    console.warn('⚠️ API连接测试失败，可能后端未启动或代理配置问题')
  }
}

// ========== 挂载应用 ==========
app.use(router)

// 挂载应用 - 这是同步操作
app.mount('#app')

console.log('✅ Vue应用挂载成功')

// 延迟检查API连接
setTimeout(() => {
  if (import.meta.env.DEV) {
    checkApiConnection()
  }
}, 1000)

// 导出axios实例，方便其他地方导入使用
export { axios as $http }
export default app