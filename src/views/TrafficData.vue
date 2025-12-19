<template>
  <!-- 权限检查 -->
  <div v-if="!isLoggedIn" class="no-permission">
    <el-result icon="warning" title="请先登录">
      <template #extra>
        <el-button type="primary" @click="$router.push('/login')">去登录</el-button>
      </template>
    </el-result>
  </div>

  <div v-else class="traffic-data-page">
    <div class="page-header">
      <h2>交通数据管理</h2>
      <div>
        <!-- 只有管理员能看到新增按钮 -->
        <el-button 
          v-if="isAdmin"
          type="primary" 
          @click="handleAdd"
        >
          <el-icon><Plus /></el-icon>
          新增记录
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

    <el-card>
      <template #header>
        <div class="filter-container">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-date-picker
                v-model="filterDate"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 100%;"
                @change="handleFilter"
              />
            </el-col>
            <el-col :span="4">
              <el-select v-model="filterLine" placeholder="选择线路" clearable @change="handleFilter">
                <el-option label="(全部线路)" value="" />
                <el-option v-for="line in lines" :key="line.LineID" 
                  :label="line.LineName" 
                  :value="line.LineID" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select v-model="filterStation" placeholder="选择站点" clearable @change="handleFilter">
                <el-option label="(全部站点)" value="" />
                <el-option v-for="station in stations" :key="station.StationID" 
                  :label="station.StationName" 
                  :value="station.StationID" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select v-model="filterDataType" placeholder="数据类型" clearable @change="handleFilter">
                <el-option label="(全部类型)" value="" />
                <el-option label="客流量" value="客流量" />
                <el-option label="车流量" value="车流量" />
                <el-option label="速度" value="速度" />
                <el-option label="延误" value="延误" />
                <el-option label="常规" value="常规" />
                <el-option label="测试" value="测试" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-button @click="handleReset">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
            </el-col>
          </el-row>
        </div>
      </template>

      <el-table :data="filteredData" height="500" v-loading="loading" stripe>
        <el-table-column prop="RecordID" label="记录ID" width="120">
          <template #header>
            <div class="table-column-header">
              <span>记录ID</span>
              <el-tooltip content="唯一标识，最多20个字符" placement="top">
                <el-icon style="margin-left: 5px; color: #909399;"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="RecordTime" label="记录时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.RecordTime) }}
          </template>
        </el-table-column>
        
        <el-table-column prop="StationName" label="站点" width="150">
          <template #default="{ row }">
            <div v-if="row.StationName">
              <el-tag size="small">{{ row.StationName }}</el-tag>
            </div>
            <div v-else>
              <el-tag type="info" size="small">未指定站点</el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="LineName" label="线路" width="120">
          <template #default="{ row }">
            <div v-if="row.LineName">
              <el-tag type="primary" size="small">{{ row.LineName }}</el-tag>
            </div>
            <div v-else>
              <el-tag type="info" size="small">未指定线路</el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="MonitorPointName" label="监测点" width="150">
          <template #default="{ row }">
            <div v-if="row.MonitorPointName">
              {{ row.MonitorPointName }}
            </div>
            <div v-else>
              <span style="color: #909399;">未指定</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="DataType" label="数据类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getDataTypeTag(row.DataType)" size="small">
              {{ row.DataType || '常规' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="数值" width="180">
          <template #default="{ row }">
            <div class="data-values">
              <span v-if="row.Value1 !== null && row.Value1 !== undefined">值1: {{ row.Value1 }}</span>
              <span v-if="row.Value2 !== null && row.Value2 !== undefined">值2: {{ row.Value2 }}</span>
              <span v-if="row.Value3 !== null && row.Value3 !== undefined">值3: {{ row.Value3 }}</span>
              <span v-if="!row.Value1 && !row.Value2 && !row.Value3" style="color: #909399;">无数据</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="AnnotationInfo" label="备注" show-overflow-tooltip />
        
        <el-table-column prop="Operator" label="操作员" width="100" />
        
        <el-table-column prop="OperationTime" label="操作时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.OperationTime) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <!-- 只有管理员能看到编辑删除 -->
            <el-button 
              v-if="isAdmin"
              type="primary" 
              size="small" 
              @click="handleEdit(row)"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              v-if="isAdmin"
              type="danger" 
              size="small" 
              @click="handleDelete(row.RecordID)"
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
            <span v-if="!isAdmin" class="readonly-hint">只读</span>
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
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="记录ID" prop="RecordID" required v-if="!isEdit">
          <el-input 
            v-model="form.RecordID" 
            placeholder="例如：TRAFFIC001、TEST001"
            maxlength="20"
            show-word-limit
            clearable
          />
          <div class="form-tips">
            • 最多20个字符，保存后不可修改<br>
            • 必须唯一，不能重复<br>
            • 建议格式：TRAFFIC001、TEST20241219
          </div>
        </el-form-item>
        
        <el-form-item v-else label="记录ID">
          <el-input v-model="form.RecordID" disabled />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="记录时间" prop="RecordTime" required>
              <el-date-picker
                v-model="form.RecordTime"
                type="datetime"
                placeholder="选择记录时间"
                style="width: 100%;"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
              <div class="form-tips">
                • 数据记录的实际时间
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据类型" prop="DataType" required>
              <el-select v-model="form.DataType" placeholder="请选择数据类型" style="width: 100%;">
                <el-option label="客流量" value="客流量" />
                <el-option label="车流量" value="车流量" />
                <el-option label="速度" value="速度" />
                <el-option label="延误" value="延误" />
                <el-option label="常规" value="常规" />
                <el-option label="测试" value="测试" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="线路" prop="LineID">
              <el-select 
                v-model="form.LineID" 
                placeholder="请选择线路（可选）"
                style="width: 100%;"
                clearable
                @change="handleLineChange"
              >
                <el-option label="(不指定线路)" value="" />
                <el-option 
                  v-for="line in lines" 
                  :key="line.LineID" 
                  :label="`${line.LineID} - ${line.LineName}`" 
                  :value="line.LineID"
                />
              </el-select>
              <div class="form-tips">
                • 可选字段，可以为空<br>
                • 如果选择，确保线路已存在
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="站点" prop="StationID">
              <el-select 
                v-model="form.StationID" 
                placeholder="请选择站点（可选）"
                style="width: 100%;"
                clearable
                :disabled="!form.LineID"
              >
                <el-option label="(不指定站点)" value="" />
                <el-option 
                  v-for="station in filteredStations" 
                  :key="station.StationID" 
                  :label="`${station.StationID} - ${station.StationName}`" 
                  :value="station.StationID"
                />
              </el-select>
              <div class="form-tips">
                • 可选字段，可以为空<br>
                • 需先选择线路才能选择站点
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="监测点" prop="MonitorPointID">
              <el-select 
                v-model="form.MonitorPointID" 
                placeholder="请选择监测点（可选）"
                style="width: 100%;"
                clearable
              >
                <el-option label="(不指定监测点)" value="" />
                <el-option 
                  v-for="point in monitorPoints" 
                  :key="point.MonitorPointID" 
                  :label="`${point.MonitorPointID} - ${point.MonitorPointName}`" 
                  :value="point.MonitorPointID"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="操作用户" prop="UserID">
              <el-select 
                v-model="form.UserID" 
                placeholder="请选择用户（可选）"
                style="width: 100%;"
                clearable
              >
                <el-option label="(不指定用户)" value="" />
                <el-option 
                  v-for="user in users" 
                  :key="user.UserID" 
                  :label="`${user.UserID} - ${user.UserName}`" 
                  :value="user.UserID"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="数值1">
              <el-input-number 
                v-model="form.Value1" 
                :min="0" 
                :max="999999"
                :step="1"
                controls-position="right"
                style="width: 100%;"
                placeholder="数值1"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="数值2">
              <el-input-number 
                v-model="form.Value2" 
                :min="0" 
                :max="999999"
                :step="1"
                controls-position="right"
                style="width: 100%;"
                placeholder="数值2"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="数值3">
              <el-input-number 
                v-model="form.Value3" 
                :min="0" 
                :max="999999"
                :step="1"
                controls-position="right"
                style="width: 100%;"
                placeholder="数值3"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注信息" prop="AnnotationInfo">
          <el-input
            v-model="form.AnnotationInfo"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）"
            maxlength="200"
            show-word-limit
          />
          <div class="form-tips">
            • 最多200个字符<br>
            • 可选字段，可以为空
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
            记录ID(20字符)、备注(200字符)、数值为整数。所有外键字段均为可选。
          </el-alert>
        </div>

        <!-- 外键提示 -->
        <div class="form-section-tips" v-if="!isEdit">
          <el-alert
            title="外键说明"
            type="warning"
            :closable="false"
            show-icon
          >
            线路、站点、监测点、用户均为可选字段。如果提供，请确保对应的数据已存在。
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
  Download,
  Edit,
  Delete,
  Refresh,
  InfoFilled
} from '@element-plus/icons-vue'

const API_BASE_URL = 'http://39.104.28.230:3000/api'

// 响应式数据
const trafficData = ref([])
const lines = ref([])
const stations = ref([])
const monitorPoints = ref([])
const users = ref([])
const loading = ref(false)
const filterDate = ref([])
const filterLine = ref('')
const filterStation = ref('')
const filterDataType = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const formRef = ref()
const isEdit = ref(false)
const submitting = ref(false)

// 表单数据
const form = ref({
  RecordID: '',
  RecordTime: '',
  StationID: '',
  LineID: '',
  MonitorPointID: '',
  UserID: '',
  DataType: '常规',
  Value1: null,
  Value2: null,
  Value3: null,
  AnnotationInfo: '',
  Operator: ''
})

// 计算属性
const currentUser = computed(() => {
  try {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
})

const isLoggedIn = computed(() => {
  return !!currentUser.value?.userId
})

const isAdmin = computed(() => {
  return currentUser.value?.roleType === 'admin'
})

const total = computed(() => trafficData.value.length)

const filteredStations = computed(() => {
  if (!form.value.LineID) return stations.value
  return stations.value.filter(station => station.LineID === form.value.LineID)
})

const filteredData = computed(() => {
  let result = trafficData.value
  
  // 线路过滤
  if (filterLine.value) {
    result = result.filter(item => item.LineID === filterLine.value)
  }
  
  // 站点过滤
  if (filterStation.value) {
    result = result.filter(item => item.StationID === filterStation.value)
  }
  
  // 数据类型过滤
  if (filterDataType.value) {
    result = result.filter(item => item.DataType === filterDataType.value)
  }
  
  // 时间范围过滤
  if (filterDate.value && filterDate.value.length === 2) {
    const [start, end] = filterDate.value
    result = result.filter(item => {
      const recordTime = new Date(item.RecordTime)
      return recordTime >= new Date(start) && recordTime <= new Date(end)
    })
  }
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

const dialogTitle = computed(() => isEdit.value ? '编辑交通数据' : '新增交通数据')

// 验证规则
const rules = {
  RecordID: [
    { required: true, message: '请输入记录ID', trigger: 'blur' },
    { max: 20, message: '记录ID最多20个字符', trigger: 'blur' }
  ],
  RecordTime: [
    { required: true, message: '请选择记录时间', trigger: 'change' }
  ],
  DataType: [
    { required: true, message: '请选择数据类型', trigger: 'change' }
  ]
}

// API调用函数
const fetchTrafficData = async () => {
  try {
    loading.value = true
    const token = localStorage.getItem('token')
    
    // 构建查询参数
    const params = new URLSearchParams()
    params.append('limit', 1000)
    
    console.log('🔄 正在请求API...')
    
    const response = await axios.get(`${API_BASE_URL}/traffic-data?${params.toString()}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      timeout: 8000 // 8秒超时
    })
    
    console.log('✅ API响应:', response.data)
    
    if (response.data && response.data.data) {
      trafficData.value = response.data.data
      console.log('✅ 交通数据加载完成，共', trafficData.value.length, '条记录')
    } else {
      trafficData.value = []
      ElMessage.warning('API返回的数据格式不正确')
    }
    
  } catch (error) {
    console.error('❌ 获取交通数据失败:', error)
    
    // 显示详细的错误信息
    if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络连接')
    } else if (error.response) {
      // 服务器返回了错误状态码
      console.log('错误状态码:', error.response.status)
      console.log('错误响应:', error.response.data)
      
      if (error.response.status === 401) {
        ElMessage.error('请先登录')
      } else if (error.response.status === 403) {
        ElMessage.error('权限不足')
      } else if (error.response.status === 500) {
        ElMessage.error('服务器内部错误，请联系管理员')
      } else {
        ElMessage.error('获取数据失败: ' + (error.response.data?.message || `状态码 ${error.response.status}`))
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      ElMessage.error('无法连接到服务器，请检查网络')
    } else {
      // 请求配置错误
      ElMessage.error('请求配置错误: ' + error.message)
    }
    
    trafficData.value = []
  } finally {
    loading.value = false
  }
}

const fetchLines = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/lines`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    
    if (response.data && response.data.data) {
      lines.value = response.data.data
    }
  } catch (error) {
    console.error('获取线路列表失败:', error)
    lines.value = []
  }
}

const fetchStations = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/stations`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    
    if (response.data && response.data.data) {
      stations.value = response.data.data
    }
  } catch (error) {
    console.error('获取站点列表失败:', error)
    stations.value = []
  }
}

const fetchMonitorPoints = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/monitor-points`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    
    if (response.data && response.data.data) {
      monitorPoints.value = response.data.data
    }
  } catch (error) {
    console.error('获取监测点列表失败:', error)
    monitorPoints.value = []
  }
}

const fetchUsers = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${API_BASE_URL}/users`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    
    if (response.data && response.data.data) {
      users.value = response.data.data
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    users.value = []
  }
}

// 辅助函数
const getDataTypeTag = (type) => {
  const map = {
    '客流量': 'success',
    '车流量': '',
    '速度': 'warning',
    '延误': 'danger',
    '测试': 'info'
  }
  return map[type] || 'info'
}

const formatDateTime = (datetime) => {
  if (!datetime) return ''
  try {
    const date = new Date(datetime)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  } catch {
    return datetime
  }
}

const generateRecordId = () => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `T${dateStr}${random}`
}

// 事件处理
const handleLineChange = () => {
  // 切换线路时清空站点选择
  form.value.StationID = ''
}

const handleFilter = () => {
  currentPage.value = 1
  fetchTrafficData()
}

const handleReset = () => {
  filterDate.value = []
  filterLine.value = ''
  filterStation.value = ''
  filterDataType.value = ''
  currentPage.value = 1
  fetchTrafficData()
}

const refreshData = async () => {
  await fetchTrafficData()
  ElMessage.success('数据已刷新')
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    RecordID: generateRecordId(),
    RecordTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    StationID: '',
    LineID: '',
    MonitorPointID: '',
    UserID: '',
    DataType: '常规',
    Value1: null,
    Value2: null,
    Value3: null,
    AnnotationInfo: '',
    Operator: currentUser.value?.userId || ''
  }
  
  if (formRef.value) {
    formRef.value.clearValidate()
  }
  
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = {
    RecordID: row.RecordID,
    RecordTime: row.RecordTime || new Date().toISOString().slice(0, 19).replace('T', ' '),
    StationID: row.StationID || '',
    LineID: row.LineID || '',
    MonitorPointID: row.MonitorPointID || '',
    UserID: row.UserID || '',
    DataType: row.DataType || '常规',
    Value1: row.Value1 || null,
    Value2: row.Value2 || null,
    Value3: row.Value3 || null,
    AnnotationInfo: row.AnnotationInfo || '',
    Operator: row.Operator || currentUser.value?.userId || ''
  }
  
  dialogVisible.value = true
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条交通数据记录吗？',
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
              const response = await axios.delete(`${API_BASE_URL}/traffic-data/${id}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
              })
              
              if (response.data.code === 200) {
                ElMessage.success('交通数据删除成功')
                await fetchTrafficData()
              } else {
                ElMessage.error(response.data.message || '删除失败')
              }
            } catch (error) {
              console.error('删除交通数据失败:', error)
              
              let errorMsg = '删除失败'
              if (error.response?.status === 403) {
                errorMsg = '需要管理员权限'
              } else if (error.response?.data?.message) {
                errorMsg = error.response.data.message
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

const handleExport = () => {
  if (trafficData.value.length === 0) {
    ElMessage.warning('没有数据可以导出')
    return
  }
  
  const headers = ['记录ID', '记录时间', '站点', '线路', '监测点', '数据类型', '数值1', '数值2', '数值3', '备注', '操作员', '操作时间']
  const data = trafficData.value.map(item => [
    item.RecordID,
    formatDateTime(item.RecordTime),
    item.StationName || '(空)',
    item.LineName || '(空)',
    item.MonitorPointName || '(空)',
    item.DataType,
    item.Value1 || '',
    item.Value2 || '',
    item.Value3 || '',
    item.AnnotationInfo || '',
    item.Operator || '',
    formatDateTime(item.OperationTime)
  ])
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.join(','))
  ].join('\n')
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `交通数据_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  
  ElMessage.success('数据导出成功')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 额外验证
    if (form.value.RecordID && form.value.RecordID.length > 20) {
      ElMessage.error('记录ID不能超过20个字符')
      return
    }
    
    submitting.value = true
    const token = localStorage.getItem('token')
    
    // 准备提交数据
    const submitData = {
      RecordID: form.value.RecordID.trim(),
      RecordTime: form.value.RecordTime,
      StationID: form.value.StationID ? form.value.StationID.trim() : null,
      LineID: form.value.LineID ? form.value.LineID.trim() : null,
      MonitorPointID: form.value.MonitorPointID ? form.value.MonitorPointID.trim() : null,
      UserID: form.value.UserID ? form.value.UserID.trim() : null,
      DataType: form.value.DataType,
      Value1: form.value.Value1 || 0,
      Value2: form.value.Value2 || 0,
      Value3: form.value.Value3 || 0,
      AnnotationInfo: form.value.AnnotationInfo ? form.value.AnnotationInfo.trim() : null,
      Operator: currentUser.value?.userId || 'system'
    }
    
    console.log('📤 提交交通数据:', submitData)
    
    if (isEdit.value) {
      const response = await axios.put(
        `${API_BASE_URL}/traffic-data/${form.value.RecordID}`, 
        submitData,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      )
      
      if (response.data.code === 200) {
        ElMessage.success('交通数据更新成功')
        dialogVisible.value = false
        await fetchTrafficData()
      } else {
        ElMessage.error(response.data.message || '更新失败')
      }
    } else {
      const response = await axios.post(
        `${API_BASE_URL}/traffic-data`, 
        submitData,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      )
      
      if (response.data.code === 201) {
        ElMessage.success('交通数据新增成功')
        dialogVisible.value = false
        await fetchTrafficData()
      } else {
        ElMessage.error(response.data.message || '新增失败')
      }
    }
    
  } catch (error) {
    console.error('保存交通数据失败:', error)
    
    let errorMessage = '保存失败'
    if (error.response?.status === 403) {
      errorMessage = '需要管理员权限'
    } else if (error.response?.data?.code === 409) {
      errorMessage = '记录ID已存在'
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
  console.log('🚀 TrafficData.vue组件已挂载')
  
  if (isLoggedIn.value) {
    fetchTrafficData()
    fetchLines()
    fetchStations()
    fetchMonitorPoints()
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

.filter-container {
  padding: 10px 0;
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

.data-values {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.data-values span {
  font-size: 12px;
}

.readonly-hint {
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
  .filter-container .el-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .filter-container .el-col {
    width: 100% !important;
  }
  
  .el-dialog {
    width: 95% !important;
  }
}
</style>