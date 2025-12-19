// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/Home.vue'),  // 注意：需要重命名HomeView.vue为Home.vue
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
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 获取用户信息
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const token = localStorage.getItem('token')
  const isLoggedIn = !!(token && user?.userId)
  
  console.log(`路由守卫: ${to.path}, 已登录: ${isLoggedIn}, 角色: ${user?.roleType}`)
  
  // 如果访问登录页但已登录，跳转到首页
  if (to.path === '/login' && isLoggedIn) {
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
      alert('需要管理员权限')
      next('/')
      return
    }
  }
  
  next()
})

export default router