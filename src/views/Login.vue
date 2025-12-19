<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2 class="login-title">交通数据系统</h2>
      <p class="login-subtitle">用户登录</p>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-width="80px"
        class="login-form"
      >
        <el-form-item label="用户ID" prop="UserID">
          <el-input
            v-model="loginForm.UserID"
            placeholder="请输入用户ID"
            :prefix-icon="User"
            clearable
            autocomplete="username"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="Password_Encrypted">
          <el-input
            v-model="loginForm.Password_Encrypted"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            show-password
            clearable
            autocomplete="current-password"
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            class="login-button" 
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const loginFormRef = ref()
const loading = ref(false)

// 登录表单数据 - 改为空值，不会自动填写
const loginForm = reactive({
  UserID: '',
  Password_Encrypted: ''
})

// 验证规则
const loginRules = {
  UserID: [
    { required: true, message: '请输入用户ID', trigger: 'blur' }
  ],
  Password_Encrypted: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 登录方法
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    
    loading.value = true
    
    const response = await axios.post('/login', {
      UserID: loginForm.UserID,
      Password_Encrypted: loginForm.Password_Encrypted
    })
    
    if (response.data.code === 200) {
      // 保存token和用户信息
      localStorage.setItem('token', response.data.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.data.user))
      
      // 设置axios默认请求头
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.data.token}`
      
      ElMessage.success('登录成功')
      
      // 跳转到首页
      router.push('/')
    } else {
      ElMessage.error(response.data.message || '登录失败')
    }
    
  } catch (error) {
    console.error('登录失败:', error)
    
    let errorMessage = '登录失败'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }
    
    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 28px;
  font-weight: bold;
}

.login-subtitle {
  text-align: center;
  color: #7f8c8d;
  margin-bottom: 30px;
  font-size: 16px;
}

.login-form {
  margin-top: 20px;
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 16px;
  margin-top: 10px;
}

/* 移除登录提示的样式 */
.login-tips {
  display: none;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    width: 90%;
    padding: 30px 20px;
  }
}
</style>