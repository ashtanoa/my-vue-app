<template>
  <div class="users-page">
    <div class="page-header">
      <h2>用户管理</h2>
      <div>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
        <el-button @click="handleResetPassword">
          <el-icon><Key /></el-icon>
          重置密码
        </el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="users" height="500" v-loading="loading">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="UserID" label="用户ID" width="150" />
        <el-table-column prop="UserName" label="用户名" width="150" />
        <el-table-column prop="RoleType" label="角色类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleTypeTag(row.RoleType)">
              {{ row.RoleType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="CreateTime" label="创建时间" width="180" />
        <el-table-column prop="lastLoginTime" label="最后登录" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="'启用'"
              :inactive-value="'禁用'"
              @change="handleStatusChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.UserID)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="用户ID" prop="UserID">
          <el-input v-model="form.UserID" placeholder="请输入用户ID" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="用户名" prop="UserName">
          <el-input v-model="form.UserName" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="Password" v-if="!isEdit">
          <el-input v-model="form.Password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="ConfirmPassword" v-if="!isEdit">
          <el-input v-model="form.ConfirmPassword" type="password" placeholder="请确认密码" />
        </el-form-item>
        <el-form-item label="角色类型" prop="RoleType">
          <el-select v-model="form.RoleType" placeholder="请选择">
            <el-option label="系统管理员" value="系统管理员" />
            <el-option label="数据管理员" value="数据管理员" />
            <el-option label="普通用户" value="普通用户" />
            <el-option label="查看用户" value="查看用户" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="启用">启用</el-radio>
            <el-radio label="禁用">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Key,
  Edit,
  Delete
} from '@element-plus/icons-vue'

// 模拟数据
const mockUsers = [
  { UserID: 'admin', UserName: '系统管理员', Password_Encrypted: '***', RoleType: '系统管理员', 
    CreateTime: '2023-01-01 00:00:00', lastLoginTime: '2024-01-15 09:00:00', status: '启用' },
  { UserID: 'data_manager', UserName: '数据管理员', Password_Encrypted: '***', RoleType: '数据管理员', 
    CreateTime: '2023-02-15 10:30:00', lastLoginTime: '2024-01-15 08:45:00', status: '启用' },
  { UserID: 'user001', UserName: '普通用户1', Password_Encrypted: '***', RoleType: '普通用户', 
    CreateTime: '2023-03-20 14:20:00', lastLoginTime: '2024-01-14 16:30:00', status: '启用' },
  { UserID: 'viewer001', UserName: '查看用户1', Password_Encrypted: '***', RoleType: '查看用户', 
    CreateTime: '2023-04-10 09:15:00', lastLoginTime: '2024-01-15 07:20:00', status: '禁用' },
  { UserID: 'user002', UserName: '普通用户2', Password_Encrypted: '***', RoleType: '普通用户', 
    CreateTime: '2023-05-05 11:40:00', lastLoginTime: '2024-01-13 15:10:00', status: '启用' },
  { UserID: 'operator001', UserName: '操作员1', Password_Encrypted: '***', RoleType: '数据管理员', 
    CreateTime: '2023-06-10 08:30:00', lastLoginTime: '2024-01-15 10:15:00', status: '启用' },
  { UserID: 'monitor001', UserName: '监控员1', Password_Encrypted: '***', RoleType: '普通用户', 
    CreateTime: '2023-07-15 13:25:00', lastLoginTime: '2024-01-14 14:40:00', status: '启用' }
]

// 响应式数据
const users = ref([...mockUsers])
const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref()
const isEdit = ref(false)

// 表单数据
const form = ref({
  UserID: '',
  UserName: '',
  Password: '',
  ConfirmPassword: '',
  RoleType: '',
  status: '启用'
})

// 验证规则
const validatePassword = (rule, value, callback) => {
  if (!isEdit.value && !value) {
    callback(new Error('请输入密码'))
  } else if (value && value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (!isEdit.value && value !== form.value.Password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  UserID: [{ required: true, message: '请输入用户ID', trigger: 'blur' }],
  UserName: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  Password: [{ validator: validatePassword, trigger: 'blur' }],
  ConfirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }],
  RoleType: [{ required: true, message: '请选择角色类型', trigger: 'change' }]
}

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑用户' : '新增用户')

// 方法
const getRoleTypeTag = (type) => {
  const map = {
    '系统管理员': 'danger',
    '数据管理员': 'warning',
    '普通用户': '',
    '查看用户': 'info'
  }
  return map[type] || ''
}

const handleStatusChange = (row) => {
  const action = row.status === '启用' ? '启用' : '禁用'
  ElMessage.success(`已${action}用户 ${row.UserName}`)
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    UserID: '',
    UserName: '',
    Password: '',
    ConfirmPassword: '',
    RoleType: '',
    status: '启用'
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = {
    UserID: row.UserID,
    UserName: row.UserName,
    Password: '',
    ConfirmPassword: '',
    RoleType: row.RoleType,
    status: row.status
  }
  dialogVisible.value = true
}

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除这个用户吗？', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(() => {
    const index = users.value.findIndex(user => user.UserID === id)
    if (index > -1) {
      users.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

const handleResetPassword = () => {
  ElMessageBox.prompt('请输入新密码', '重置密码', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputType: 'password'
  }).then(({ value }) => {
    if (value && value.length >= 6) {
      ElMessage.success('密码重置成功')
    } else {
      ElMessage.error('密码长度不能少于6位')
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    const userData = {
      UserID: form.value.UserID,
      UserName: form.value.UserName,
      Password_Encrypted: '***',
      RoleType: form.value.RoleType,
      CreateTime: isEdit.value ? users.value.find(u => u.UserID === form.value.UserID)?.CreateTime : new Date().toLocaleString(),
      lastLoginTime: '',
      status: form.value.status
    }
    
    if (isEdit.value) {
      // 更新
      const index = users.value.findIndex(user => user.UserID === form.value.UserID)
      if (index > -1) {
        users.value[index] = { ...users.value[index], ...userData }
      }
      ElMessage.success('更新成功')
    } else {
      // 新增
      users.value.unshift(userData)
      ElMessage.success('新增成功')
    }
    
    dialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>