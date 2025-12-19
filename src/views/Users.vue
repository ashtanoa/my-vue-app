<template>
  <!-- 权限检查 -->
  <div v-if="!isAdmin" class="no-permission">
    <el-result icon="warning" title="无权限访问">
      <template #extra>
        <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
      </template>
    </el-result>
  </div>

  <div v-else class="users-page">
    <div class="page-header">
      <h2>用户管理</h2>
      <div>
        <el-button 
          type="primary" 
          @click="handleAdd"
          v-if="isAdmin"
        >
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
        <el-button type="info" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <el-card>
      <template #header>
        <div class="table-header">
          <el-input
            v-model="searchQuery"
            placeholder="搜索用户ID、用户名"
            style="width: 300px;"
            clearable
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          
          <div class="filter-group">
            <el-select 
              v-model="filterRole" 
              placeholder="按角色筛选" 
              clearable
              style="width: 200px;"
            >
              <el-option label="所有角色" value="" />
              <el-option label="管理员" value="admin" />
              <el-option label="普通用户" value="user" />
            </el-select>
            
            <el-button @click="resetFilters">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredUsers" height="500" v-loading="loading" stripe>
        <el-table-column type="selection" width="50" />
        
        <el-table-column prop="UserID" label="用户ID" width="150">
          <template #header>
            <div class="table-column-header">
              <span>用户ID</span>
              <el-tooltip content="唯一标识，最多20个字符" placement="top">
                <el-icon style="margin-left: 5px; color: #909399;"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="UserName" label="用户名" width="150">
          <template #header>
            <div class="table-column-header">
              <span>用户名</span>
              <el-tooltip content="最多50个字符" placement="top">
                <el-icon style="margin-left: 5px; color: #909399;"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="RoleType" label="角色类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTypeTag(row.RoleType)">
              {{ formatRoleType(row.RoleType) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="CreateTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.CreateTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <!-- 不能删除自己 -->
            <el-button 
              v-if="isAdmin && row.UserID !== currentUser.userId"
              type="primary" 
              size="small" 
              @click="handleEdit(row)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              v-if="isAdmin && row.UserID !== currentUser.userId"
              type="danger" 
              size="small" 
              @click="handleDelete(row.UserID)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
            <span v-if="row.UserID === currentUser.userId" class="current-user-hint">
              当前用户
            </span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="用户ID" prop="UserID" required v-if="!isEdit">
          <el-input 
            v-model="form.UserID" 
            placeholder="例如：admin、user001"
            maxlength="20"
            show-word-limit
            clearable
          />
          <div class="form-tips">
            • 最多20个字符，保存后不可修改<br>
            • 必须唯一，不能重复
          </div>
        </el-form-item>
        
        <el-form-item label="用户名" prop="UserName" required>
          <el-input 
            v-model="form.UserName" 
            placeholder="请输入用户名"
            maxlength="50"
            show-word-limit
            clearable
          />
          <div class="form-tips">
            • 最多50个字符
          </div>
        </el-form-item>
        
        <el-form-item label="密码" prop="Password_Encrypted" required v-if="!isEdit">
          <el-input 
            v-model="form.Password_Encrypted" 
            type="password" 
            placeholder="请输入密码"
            maxlength="100"
            show-word-limit
            clearable
          />
          <div class="form-tips">
            • 最多100个字符<br>
            • 建议长度6-20位
          </div>
        </el-form-item>
        
        <el-form-item label="确认密码" prop="ConfirmPassword" required v-if="!isEdit">
          <el-input 
            v-model="form.ConfirmPassword" 
            type="password" 
            placeholder="请确认密码"
            maxlength="100"
            show-word-limit
            clearable
          />
        </el-form-item>
        
        <el-form-item label="角色类型" prop="RoleType" required>
          <el-select 
            v-model="form.RoleType" 
            placeholder="请选择角色"
            style="width: 100%;"
            clearable
          >
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
          <div class="form-tips">
            • 管理员有全部权限<br>
            • 普通用户只能查看
          </div>
        </el-form-item>

        <!-- 数据库约束提示 -->
        <div class="form-section-tips">
          <el-alert
            title="数据库字段限制"
            type="info"
            :closable="false"
            show-icon
          >
            用户表字段长度限制：用户ID(20字符)、用户名(50字符)、密码(100字符)
          </el-alert>
        </div>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import {
  Plus,
  Edit,
  Delete,
  Search,
  Refresh,
  InfoFilled
} from '@element-plus/icons-vue'

const API_BASE_URL = 'http://39.104.28.230:3000/api'

// 响应式数据
const users = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterRole = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const formRef = ref()
const isEdit = ref(false)
const submitting = ref(false)

// 表单数据
const form = ref({
  UserID: '',
  UserName: '',
  Password_Encrypted: '',
  ConfirmPassword: '',
  RoleType: 'user'
})

// 计算属性
const currentUser = computed(() => {
  return JSON.parse(localStorage.getItem('user') || '{}')
})

const isAdmin = computed(() => {
  return currentUser.value.roleType === 'admin'
})

const total = computed(() => filteredUsers.value.length)

const filteredUsers = computed(() => {
  let result = users.value
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(user => 
      (user.UserID && user.UserID.toLowerCase().includes(query)) || 
      (user.UserName && user.UserName.toLowerCase().includes(query))
    )
  }
  
  // 角色过滤
  if (filterRole.value) {
    result = result.filter(user => user.RoleType === filterRole.value)
  }
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

const dialogTitle = computed(() => isEdit.value ? '编辑用户' : '新增用户')

// 验证规则（根据数据库约束）
const rules = {
  UserID: [
    { required: true, message: '请输入用户ID', trigger: 'blur' },
    { max: 20, message: '用户ID最多20个字符', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value && value.trim().length === 0) {
        callback(new Error('用户ID不能为空'))
      } else if (value && value.length > 20) {
        callback(new Error('用户ID不能超过20个字符'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  UserName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { max: 50, message: '用户名最多50个字符', trigger: 'blur' }
  ],
  Password_Encrypted: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { max: 100, message: '密码最多100个字符', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  ConfirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value !== form.value.Password_Encrypted) {
        callback(new Error('两次输入密码不一致'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  RoleType: [
    { required: true, message: '请选择角色类型', trigger: 'change' }
  ]
}

// 获取用户列表
const fetchUsers = async () => {
  try {
    loading.value = true
    const token = localStorage.getItem('token')
    
    const response = await axios.get(`${API_BASE_URL}/users`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    
    console.log('🔍 用户API响应:', response.data)
    
    let userList = []
    
    if (response.data && response.data.data) {
      userList = response.data.data
    } else if (Array.isArray(response.data)) {
      userList = response.data
    }
    
    // 处理数据
    users.value = userList.map(user => ({
      UserID: user.UserID || '',
      UserName: user.UserName || '',
      RoleType: user.RoleType || 'user',
      CreateTime: user.CreateTime || ''
    }))
    
    console.log('✅ 用户数据加载完成，共', users.value.length, '条记录')
    
  } catch (error) {
    console.error('获取用户列表失败:', error)
    
    if (error.response?.status === 403) {
      ElMessage.error('需要管理员权限')
    } else if (error.response?.status === 401) {
      ElMessage.error('请先登录')
      // 可以跳转到登录页
    } else {
      ElMessage.error('获取用户列表失败: ' + (error.message || '网络错误'))
    }
    
    users.value = []
  } finally {
    loading.value = false
  }
}

// 辅助方法
const getRoleTypeTag = (type) => {
  return type === 'admin' ? 'danger' : 'info'
}

const formatRoleType = (type) => {
  return type === 'admin' ? '管理员' : '普通用户'
}

const formatDateTime = (datetime) => {
  if (!datetime) return ''
  const date = new Date(datetime)
  return date.toLocaleString('zh-CN')
}

const handleSearch = () => {
  currentPage.value = 1
}

const resetFilters = () => {
  searchQuery.value = ''
  filterRole.value = ''
  currentPage.value = 1
}

const refreshData = async () => {
  await fetchUsers()
  ElMessage.success('数据已刷新')
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    UserID: '',
    UserName: '',
    Password_Encrypted: '',
    ConfirmPassword: '',
    RoleType: 'user'
  }
  
  if (formRef.value) {
    formRef.value.clearValidate()
  }
  
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = {
    UserID: row.UserID,
    UserName: row.UserName,
    Password_Encrypted: '',  // 编辑时不显示密码
    ConfirmPassword: '',
    RoleType: row.RoleType || 'user'
  }
  
  dialogVisible.value = true
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个用户吗？',
      '警告', 
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
        beforeClose: async (action, instance, done) => {
          if (action === 'confirm') {
            instance.confirmButtonLoading = true
            instance.confirmButtonText = '删除中...'
            
            try {
              const token = localStorage.getItem('token')
              const response = await axios.delete(`${API_BASE_URL}/users/${id}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
              })
              
              if (response.data.code === 200) {
                ElMessage.success('用户删除成功')
                await fetchUsers()
              } else {
                ElMessage.error(response.data.message || '删除失败')
              }
            } catch (error) {
              console.error('删除用户失败:', error)
              let errorMsg = '删除失败'
              
              if (error.response?.status === 403) {
                errorMsg = '需要管理员权限'
              } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message
              } else if (error.message) {
                errorMsg = error.message
              }
              
              ElMessage.error(errorMsg)
            } finally {
              instance.confirmButtonLoading = false
              done()
            }
          } else {
            done()
          }
        }
      }
    )
  } catch (error) {
    // 取消删除
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 额外验证
    if (form.value.UserID && form.value.UserID.length > 20) {
      ElMessage.error('用户ID不能超过20个字符')
      return
    }
    
    if (form.value.UserName && form.value.UserName.length > 50) {
      ElMessage.error('用户名不能超过50个字符')
      return
    }
    
    if (!isEdit.value && form.value.Password_Encrypted.length > 100) {
      ElMessage.error('密码不能超过100个字符')
      return
    }
    
    submitting.value = true
    const token = localStorage.getItem('token')
    
    const userData = {
      UserID: form.value.UserID.trim(),
      UserName: form.value.UserName.trim(),
      RoleType: form.value.RoleType
    }
    
    // 如果是新增，添加密码
    if (!isEdit.value) {
      userData.Password_Encrypted = form.value.Password_Encrypted
    }
    
    console.log('📤 提交用户数据:', userData)
    
    if (isEdit.value) {
      const response = await axios.put(
        `${API_BASE_URL}/users/${form.value.UserID}`, 
        userData,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      )
      
      if (response.data.code === 200) {
        ElMessage.success('用户更新成功')
        dialogVisible.value = false
        await fetchUsers()
      } else {
        ElMessage.error(response.data.message || '更新失败')
      }
    } else {
      const response = await axios.post(
        `${API_BASE_URL}/users`, 
        userData,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      )
      
      if (response.data.code === 201) {
        ElMessage.success('用户新增成功')
        dialogVisible.value = false
        await fetchUsers()
      } else {
        ElMessage.error(response.data.message || '新增失败')
      }
    }
    
  } catch (error) {
    console.error('保存用户失败:', error)
    
    let errorMessage = '保存失败'
    if (error.response?.status === 403) {
      errorMessage = '需要管理员权限'
    } else if (error.response?.data?.code === 409) {
      errorMessage = '用户ID已存在'
    } else if (error.response?.data?.code === 400) {
      errorMessage = error.response.data.message
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      errorMessage = error.message
    }
    
    ElMessage.error(errorMessage)
  } finally {
    submitting.value = false
  }
}

// 组件挂载时加载数据
onMounted(() => {
  console.log('🚀 Users.vue组件已挂载，开始加载数据')
  
  // 只有管理员才能加载数据
  if (isAdmin.value) {
    fetchUsers()
  }
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.table-column-header {
  display: flex;
  align-items: center;
}

.current-user-hint {
  font-size: 12px;
  color: #909399;
  font-style: italic;
}

/* 无权限样式 */
.no-permission {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60vh;
}

/* 表单提示样式 */
.form-tips {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
  margin-top: 4px;
  padding-left: 2px;
}

.form-section-tips {
  margin-top: 16px;
  margin-bottom: 8px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .table-header .el-input,
  .table-header .el-select {
    width: 100% !important;
  }
  
  .el-dialog {
    width: 95% !important;
  }
  
  .filter-group {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>