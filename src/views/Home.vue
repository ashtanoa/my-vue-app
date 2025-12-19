<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)

// 获取当前用户信息
onMounted(() => {
  try {
    const userStr = localStorage.getItem('user')
    user.value = userStr ? JSON.parse(userStr) : null
  } catch {
    user.value = null
  }
})

// 跳转函数
const goTo = (path) => router.push(path)

// 退出登录
const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}
</script>

<template>
  <div class="home">
    <div class="header">
      <h1>交通数据管理系统</h1>
      <div v-if="user" class="user-info">
        <span>{{ user.userName }}</span>
        <el-tag :type="user.roleType === 'admin' ? 'danger' : 'info'" size="small">
          {{ user.roleType === 'admin' ? '管理员' : '普通用户' }}
        </el-tag>
        <el-button type="text" @click="handleLogout" size="small">退出</el-button>
      </div>
    </div>
    
    <p class="subtitle">Vue 3 + Node.js + MySQL 全栈项目</p>
    
    <div class="features">
      <h3>功能模块</h3>
      <div class="feature-grid">
        <el-card class="feature-card" shadow="hover" @click="goTo('/lines')">
          <h4>🚌 线路管理</h4>
          <p>公交线路的增删改查</p>
        </el-card>
        
        <el-card class="feature-card" shadow="hover" @click="goTo('/stations')">
          <h4>📍 站点管理</h4>
          <p>公交站点的管理维护</p>
        </el-card>
        
        <el-card class="feature-card" shadow="hover" @click="goTo('/monitor-points')">
          <h4>📊 监测点管理</h4>
          <p>交通监测点配置</p>
        </el-card>
        
        <el-card class="feature-card" shadow="hover" @click="goTo('/traffic-data')">
          <h4>📈 交通数据</h4>
          <p>交通数据记录查询</p>
        </el-card>
        
        <el-card 
          class="feature-card" 
          shadow="hover" 
          @click="goTo('/users')" 
          v-if="user?.roleType === 'admin'"
        >
          <h4>👥 用户管理</h4>
          <p>系统用户管理（仅管理员）</p>
        </el-card>
      </div>
    </div>
    
    <div v-if="!user" class="login-prompt">
      <p>请先登录系统以使用完整功能</p>
      <el-button type="primary" @click="goTo('/login')">去登录</el-button>
    </div>
  </div>
</template>

<style scoped>
.home {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eaeaea;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
  text-align: center;
  font-size: 16px;
}

.features {
  margin: 40px 0;
}

.features h3 {
  margin-bottom: 20px;
  color: #333;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.feature-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #eaeaea;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.feature-card h4 {
  color: #409EFF;
  margin-bottom: 10px;
}

.feature-card p {
  color: #666;
  font-size: 14px;
}

.login-prompt {
  text-align: center;
  padding: 40px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-top: 40px;
  border: 1px dashed #ddd;
}

.login-prompt p {
  margin-bottom: 20px;
  color: #666;
}
</style>