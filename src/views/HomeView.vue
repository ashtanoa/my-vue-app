<script setup>
// 这里可以导入组件或定义数据
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const message = ref('')

const goToUsers = () => {
  router.push('/users')  // 跳转到用户页面
}

const showTest = () => {
  message.value = 'Vue 3运行正常！'
}
</script>

<template>
  <div class="home">
    <h1>数据库管理系统</h1>
    <p>Vue 3 + Node.js + MySQL 全栈项目</p>
    
    <div class="features">
      <h3>功能特性：</h3>
      <ul>
        <li>用户数据CRUD操作</li>
        <li>响应式表格展示</li>
        <li>表单验证处理</li>
        <li>RESTful API调用</li>
      </ul>
    </div>
    
    <div class="actions">
      <button @click="goToUsers" class="btn-primary">开始使用</button>
      <button @click="showTest" class="btn-secondary">测试功能</button>
    </div>
    
    <p v-if="message" class="message">{{ message }}</p>
  </div>
</template>

<style scoped>
.home {
  padding: 2rem;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
}

.features {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  text-align: left;
}

.features ul {
  list-style-type: none;
  padding-left: 0;
}

.features li {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e9ecef;
}

.features li:last-child {
  border-bottom: none;
}

.actions {
  margin: 2rem 0;
}

.btn-primary, .btn-secondary {
  padding: 0.75rem 1.5rem;
  margin: 0 0.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary {
  background: #42b983;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-primary:hover {
  background: #3aa876;
}

.btn-secondary:hover {
  background: #5a6268;
}

.message {
  margin-top: 1rem;
  color: #42b983;
  font-weight: bold;
}
</style>