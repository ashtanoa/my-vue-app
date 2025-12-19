<template>
  <div class="lines-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>线路管理</h2>
      <div class="page-actions">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增线路
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
        <el-button type="info" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 主内容区 -->
    <el-card>
      <template #header>
        <div class="table-header">
          <div class="search-section">
            <el-input
              v-model="searchQuery"
              placeholder="搜索线路名称或编号"
              style="width: 300px;"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          
          <div class="filter-section">
            <el-select 
              v-model="filterType" 
              placeholder="按线路类型筛选" 
              clearable
              style="width: 150px;"
            >
              <el-option label="常规线路" value="常规" />
              <el-option label="快速公交" value="快速" />
              <el-option label="夜间线路" value="夜间" />
              <el-option label="地铁" value="地铁" />
            </el-select>
            
            <el-button @click="resetFilters" plain>
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
            
            <div class="stats-info">
              共 <strong>{{ total }}</strong> 条线路
            </div>
          </div>
        </div>
      </template>

      <!-- 数据表格 -->
      <el-table :data="filteredLines" height="500" v-loading="loading" stripe>
        <el-table-column type="index" label="序号" width="60" />
        
        <el-table-column prop="LineID" label="线路编号" width="120" />
        
        <el-table-column prop="LineName" label="线路名称" />
        
        <el-table-column prop="OperationMileage" label="运营里程" width="120">
          <template #default="{ row }">
            {{ row.OperationMileage ? Number(row.OperationMileage).toFixed(2) : '0.00' }} km
          </template>
        </el-table-column>
        
        <el-table-column prop="FirstBusTime" label="首班车" width="120">
          <template #default="{ row }">
            {{ formatDisplayTime(row.FirstBusTime) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="LastBusTime" label="末班车" width="120">
          <template #default="{ row }">
            {{ formatDisplayTime(row.LastBusTime) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="LineType" label="线路类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getLineTypeTag(row.LineType)" size="small">
              {{ row.LineType || '未设置' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.LineID)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
        <div class="pagination-tips">
          显示第 {{ Math.min((currentPage - 1) * pageSize + 1, total) }} 到 {{ Math.min(currentPage * pageSize, total) }} 条，共 {{ total }} 条记录
        </div>
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="sizes, prev, pager, next, jumper"
          />
        </div>
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
      @closed="handleDialogClosed"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        status-icon
      >
        <el-form-item label="线路编号" prop="LineID" required>
          <el-input 
            v-model="form.LineID" 
            placeholder="例如：L001、8080"
            :disabled="isEdit"
            maxlength="8"
            show-word-limit
            clearable
          />
          <div class="form-tips">
            • 最多8个字符，保存后不可修改
          </div>
        </el-form-item>
        
        <el-form-item label="线路名称" prop="LineName" required>
          <el-input 
            v-model="form.LineName" 
            placeholder="请输入线路完整名称"
            maxlength="50"
            show-word-limit
            clearable
          />
          <div class="form-tips">
            • 最多50个字符
          </div>
        </el-form-item>
        
        <el-form-item label="运营里程" prop="OperationMileage">
          <el-input-number 
            v-model="form.OperationMileage" 
            :min="0" 
            :max="1000"
            :step="0.1"
            :precision="2"
            controls-position="right"
            style="width: 100%;"
            placeholder="请输入运营里程"
          />
          <div class="form-tips">
            • 单位：公里(km)
          </div>
        </el-form-item>
        
        <el-form-item label="首班车时间" prop="FirstBusTime">
          <el-time-picker
            v-model="form.FirstBusTime"
            placeholder="选择首班车发车时间"
            format="HH:mm:ss"
            value-format="HH:mm:ss"
            style="width: 100%;"
            :clearable="false"
          />
        </el-form-item>
        
        <el-form-item label="末班车时间" prop="LastBusTime">
          <el-time-picker
            v-model="form.LastBusTime"
            placeholder="选择末班车发车时间"
            format="HH:mm:ss"
            value-format="HH:mm:ss"
            style="width: 100%;"
            :clearable="false"
          />
        </el-form-item>
        
        <el-form-item label="线路类型" prop="LineType" required>
          <el-select 
            v-model="form.LineType" 
            placeholder="请选择线路类型"
            style="width: 100%;"
            clearable
          >
            <el-option label="常规线路" value="常规" />
            <el-option label="快速公交" value="快速" />
            <el-option label="夜间线路" value="夜间" />
            <el-option label="高峰专线" value="高峰" />
            <el-option label="地铁" value="地铁" />
            <el-option label="旅游专线" value="旅游" />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false" :disabled="submitting">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'
import {
  Plus,
  Download,
  Search,
  Edit,
  Delete,
  Refresh
} from '@element-plus/icons-vue'

// ========== 响应式数据 ==========
const lines = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const formRef = ref()
const isEdit = ref(false)
const submitting = ref(false)

// 表单数据
const form = ref({
  LineID: '',
  LineName: '',
  OperationMileage: 0,
  FirstBusTime: '06:00:00',
  LastBusTime: '22:00:00',
  LineType: '常规'
})

// ========== 时间处理工具函数 ==========
// 从数据库时间提取显示用的时间（HH:mm）
const formatDisplayTime = (datetimeStr) => {
  if (!datetimeStr) return '--:--'
  try {
    if (typeof datetimeStr === 'string') {
      // 数据库格式: "2025-12-19 06:00:00"
      if (datetimeStr.includes(' ')) {
        return datetimeStr.split(' ')[1].slice(0, 5)
      }
      // ISO格式: "2025-12-19T06:00:00.000Z"
      if (datetimeStr.includes('T')) {
        return datetimeStr.split('T')[1].slice(0, 5)
      }
      // 纯时间格式
      return datetimeStr.slice(0, 5)
    }
    return '--:--'
  } catch {
    return '--:--'
  }
}

// 从数据库时间提取完整时间（HH:mm:ss）用于表单编辑
const extractTimeForForm = (datetime) => {
  if (!datetime) return '06:00:00'
  
  console.log('提取表单时间，输入:', datetime)
  
  try {
    if (typeof datetime === 'string') {
      // 数据库格式
      if (datetime.includes(' ')) {
        return datetime.split(' ')[1]
      }
      // ISO格式
      if (datetime.includes('T')) {
        return datetime.split('T')[1].split('.')[0]
      }
      // 已经是时间格式
      return datetime
    }
    return '06:00:00'
  } catch {
    return '06:00:00'
  }
}

// 确保时间格式为 HH:mm:ss
const ensureTimeFormat = (timeValue) => {
  console.log('确保时间格式，输入:', timeValue, '类型:', typeof timeValue)
  
  if (!timeValue) return '06:00:00'
  
  // 如果是字符串
  if (typeof timeValue === 'string') {
    // 如果包含空格，取时间部分
    if (timeValue.includes(' ')) {
      return timeValue.split(' ')[1]
    }
    // 如果包含T，是ISO格式
    if (timeValue.includes('T')) {
      return timeValue.split('T')[1].split('.')[0]
    }
    // 已经是时间格式，确保是 HH:mm:ss
    const parts = timeValue.split(':')
    const hours = (parts[0] || '06').padStart(2, '0')
    const minutes = (parts[1] || '00').padStart(2, '0')
    const seconds = (parts[2] || '00').padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }
  
  // 如果是Date对象
  if (timeValue instanceof Date) {
    const hours = timeValue.getHours().toString().padStart(2, '0')
    const minutes = timeValue.getMinutes().toString().padStart(2, '0')
    const seconds = timeValue.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }
  
  return '06:00:00'
}

// ========== 计算属性 ==========
const total = computed(() => filteredLines.value.length)

const filteredLines = computed(() => {
  let result = lines.value
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(line => 
      (line.LineID || '').toLowerCase().includes(query) || 
      (line.LineName || '').toLowerCase().includes(query)
    )
  }
  
  // 类型过滤
  if (filterType.value) {
    result = result.filter(line => line.LineType === filterType.value)
  }
  
  // 分页
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

const dialogTitle = computed(() => isEdit.value ? '编辑线路' : '新增线路')

// ========== 辅助函数 ==========
const getLineTypeTag = (type) => {
  if (!type) return 'info'
  const map = { 
    '常规': '', 
    '快速': 'success', 
    '夜间': 'info', 
    '高峰': 'warning',
    '地铁': 'danger',
    '旅游': 'warning'
  }
  return map[type] || ''
}

// ========== API调用 ==========
const API_BASE_URL = 'http://39.104.28.230:3000/api'

const fetchLines = async () => {
  try {
    loading.value = true
    const response = await axios.get(`${API_BASE_URL}/lines`)
    
    // 处理不同的响应格式
    let lineList = []
    if (response.data && response.data.data) {
      lineList = response.data.data
    } else if (Array.isArray(response.data)) {
      lineList = response.data
    }
    
    // 确保数据格式正确
    lines.value = lineList.map(line => ({
      LineID: line.LineID || line.lineID || '',
      LineName: line.LineName || line.lineName || '',
      OperationMileage: parseFloat(line.OperationMileage || line.operationMileage || 0),
      FirstBusTime: line.FirstBusTime || line.firstBusTime || '',
      LastBusTime: line.LastBusTime || line.lastBusTime || '',
      LineType: line.LineType || line.lineType || '常规'
    }))
    
  } catch (error) {
    console.error('获取线路失败:', error)
    ElMessage.error('获取线路列表失败')
    lines.value = []
  } finally {
    loading.value = false
  }
}

// ========== 验证规则 ==========
const rules = {
  LineID: [
    { required: true, message: '请输入线路编号', trigger: 'blur' },
    { max: 8, message: '线路编号最多8个字符', trigger: 'blur' }
  ],
  LineName: [
    { required: true, message: '请输入线路名称', trigger: 'blur' },
    { max: 50, message: '线路名称最多50个字符', trigger: 'blur' }
  ],
  LineType: [
    { required: true, message: '请选择线路类型', trigger: 'change' }
  ],
  FirstBusTime: [
    { required: true, message: '请选择首班车时间', trigger: 'change' }
  ],
  LastBusTime: [
    { required: true, message: '请选择末班车时间', trigger: 'change' }
  ]
}

// ========== 事件处理 ==========
const handleSearch = () => {
  currentPage.value = 1
}

const resetFilters = () => {
  searchQuery.value = ''
  filterType.value = ''
  currentPage.value = 1
  ElMessage.success('筛选条件已重置')
}

const refreshData = async () => {
  await fetchLines()
  ElMessage.success('数据已刷新')
}

const handleExport = () => {
  if (lines.value.length === 0) {
    ElMessage.warning('没有数据可以导出')
    return
  }
  
  const headers = ['线路编号', '线路名称', '运营里程(km)', '首班车', '末班车', '线路类型']
  const data = lines.value.map(line => [
    line.LineID,
    line.LineName,
    Number(line.OperationMileage).toFixed(2),
    formatDisplayTime(line.FirstBusTime),
    formatDisplayTime(line.LastBusTime),
    line.LineType
  ])
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.join(','))
  ].join('\n')
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `线路数据_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  
  ElMessage.success('数据导出成功')
}

const handleDialogClosed = () => {
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    LineID: '',
    LineName: '',
    OperationMileage: 0,
    FirstBusTime: '06:00:00',
    LastBusTime: '22:00:00',
    LineType: '常规'
  }
  
  dialogVisible.value = true
  
  nextTick(() => {
    if (formRef.value) {
      formRef.value.clearValidate()
    }
  })
}

const handleEdit = (row) => {
  isEdit.value = true
  
  form.value = {
    LineID: row.LineID,
    LineName: row.LineName,
    OperationMileage: parseFloat(row.OperationMileage) || 0,
    FirstBusTime: extractTimeForForm(row.FirstBusTime),
    LastBusTime: extractTimeForForm(row.LastBusTime),
    LineType: row.LineType || '常规'
  }
  
  console.log('编辑表单数据:', form.value)
  dialogVisible.value = true
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条线路吗？',
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    )
    
    const response = await axios.delete(`${API_BASE_URL}/lines/${id}`)
    
    if (response.data.code === 200) {
      ElMessage.success('线路删除成功')
      await fetchLines()
    } else {
      ElMessage.error(response.data.message || '删除失败')
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    // 确保时间格式正确（只发送 HH:mm:ss）
    const firstBusTime = ensureTimeFormat(form.value.FirstBusTime)
    const lastBusTime = ensureTimeFormat(form.value.LastBusTime)
    
    console.log('处理后的时间:', {
      原始首班车: form.value.FirstBusTime,
      处理后首班车: firstBusTime,
      原始末班车: form.value.LastBusTime,
      处理后末班车: lastBusTime
    })
    
    const lineData = {
      LineID: form.value.LineID.trim(),
      LineName: form.value.LineName.trim(),
      OperationMileage: parseFloat(form.value.OperationMileage) || 0,
      FirstBusTime: firstBusTime,  // 只发送 HH:mm:ss
      LastBusTime: lastBusTime,    // 只发送 HH:mm:ss
      LineType: form.value.LineType.trim() || '常规'
    }
    
    console.log('提交到API的数据:', lineData)
    
    if (isEdit.value) {
      const response = await axios.put(`${API_BASE_URL}/lines/${form.value.LineID}`, lineData)
      
      if (response.data.code === 200) {
        ElMessage.success('线路更新成功')
        dialogVisible.value = false
        await fetchLines()
      } else {
        ElMessage.error(response.data.message || '更新失败')
      }
    } else {
      const response = await axios.post(`${API_BASE_URL}/lines`, lineData)
      
      if (response.data.code === 201) {
        ElMessage.success('线路新增成功')
        dialogVisible.value = false
        await fetchLines()
      } else {
        ElMessage.error(response.data.message || '新增失败')
      }
    }
    
  } catch (error) {
    console.error('保存线路失败:', error)
    
    if (error.response) {
      console.error('服务器响应:', error.response.data)
      console.error('状态码:', error.response.status)
      
      if (error.response.status === 403) {
        ElMessage.error('需要管理员权限')
      } else if (error.response.data && error.response.data.message) {
        ElMessage.error('保存失败: ' + error.response.data.message)
      } else {
        ElMessage.error('保存失败: 服务器错误')
      }
    } else if (error.request) {
      ElMessage.error('保存失败: 网络错误')
    } else {
      ElMessage.error('保存失败: ' + error.message)
    }
  } finally {
    submitting.value = false
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  console.log('Lines.vue 组件已挂载')
  fetchLines()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.search-section {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats-info {
  font-size: 12px;
  color: #666;
  margin-left: 10px;
}

.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.pagination-tips {
  font-size: 12px;
  color: #909399;
}

.form-tips {
  font-size: 12px;
  color: #606266;
  line-height: 1.6;
  margin-top: 6px;
}

@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .el-dialog {
    width: 95% !important;
  }
}
</style>