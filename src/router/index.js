// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'  // 修改这里

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('../views/Users.vue'),
    meta: { 
      requiresAuth: true,
      requiresAdmin: true
    }
  },
  {
    path: '/stations',
    name: 'stations',
    component: () => import('../views/Stations.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/lines',
    name: 'lines',
    component: () => import('../views/Lines.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/monitor-points',
    name: 'monitor-points',
    component: () => import('../views/MonitorPoints.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/traffic-data',
    name: 'traffic-data',
    component: () => import('../views/TrafficData.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  // 修改这里：使用哈希模式
  history: createWebHashHistory(),
  routes
})

// 路由守卫 - 添加详细的日志和错误处理
router.beforeEach((to, from, next) => {
  try {
    // 获取用户信息
    const userStr = localStorage.getItem('user')
    let user = null
    try {
      user = userStr ? JSON.parse(userStr) : null
    } catch (e) {
      console.warn('用户信息解析失败:', e)
      localStorage.removeItem('user')
    }
    
    const token = localStorage.getItem('token')
    const isLoggedIn = !!(token && user?.userId)
    
    console.log(`路由守卫: ${to.path}, 已登录: ${isLoggedIn}, 角色: ${user?.roleType}`)
    
    // 如果访问登录页但已登录，跳转到首页
    if (to.path === '/login' && isLoggedIn) {
      console.log('已登录，重定向到首页')
      next('/')
      return
    }
    
    // 如果需要登录但未登录，跳转到登录页
    if (to.meta.requiresAuth && !isLoggedIn) {
      console.log('需要登录，跳转到登录页')
      next('/login')
      return
    }
    
    // 如果需要管理员但不是管理员
    if (to.meta.requiresAdmin && isLoggedIn) {
      if (user.roleType !== 'admin') {
        console.log('需要管理员权限，当前角色:', user.roleType)
        // 使用 ElMessage 替代 alert
        import('element-plus').then(({ ElMessage }) => {
          ElMessage.error('需要管理员权限')
        })
        next('/')
        return
      }
    }
    
    next()
  } catch (error) {
    console.error('路由守卫错误:', error)
    // 发生错误时跳转到登录页
    next('/login')
  }
})

// 添加路由错误处理
router.onError((error) => {
  console.error('路由加载错误:', error)
  
  // 如果是组件加载失败，可能是 chunk 加载问题
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    console.warn('组件加载失败，尝试刷新页面')
    import('element-plus').then(({ ElMessage }) => {
      ElMessage.warning('组件加载失败，请刷新页面')
    })
  }
})

export default router