<template>
  <div class="monitor-points-page">
    <div class="page-header">
      <h2>监测点管理</h2>
      <div>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增监测点
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
        <div class="table-header">
          <el-input
            v-model="searchQuery"
            placeholder="搜索监测点名称或编号"
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
              v-model="filterType" 
              placeholder="按监测类型筛选" 
              clearable
              style="width: 150px; margin-right: 10px;"
            >
              <el-option label="视频监控" value="视频监控" />
              <el-option label="流量监测" value="流量监测" />
              <el-option label="环境监测" value="环境监测" />
              <el-option label="设备状态" value="设备状态" />
              <el-option label="安全检查" value="安全检查" />
              <el-option label="客流统计" value="客流统计" />
              <el-option label="车辆识别" value="车辆识别" />
            </el-select>
            
            <el-button @click="resetFilters">
              <el-icon><Refresh /></el-icon>
              重置筛选
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredMonitorPoints" height="500" v-loading="loading" stripe>
        <el-table-column type="selection" width="50" />
        <el-table-column prop="MonitorPointID" label="监测点编号" width="120">
          <template #header>
            <div class="table-column-header">
              <span>监测点编号</span>
              <el-tooltip content="唯一标识，最多10个字符" placement="top">
                <el-icon style="margin-left: 5px; color: #909399;"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="MonitorPointName" label="监测点名称">
          <template #header>
            <div class="table-column-header">
              <span>监测点名称</span>
              <el-tooltip content="最多50个字符" placement="top">
                <el-icon style="margin-left: 5px; color: #909399;"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="MonitorType" label="监测类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getMonitorTypeTag(row.MonitorType)">
              {{ row.MonitorType || '未设置' }}
            </el-tag>
          </template>
          <template #header>
            <div class="table-column-header">
              <span>监测类型</span>
              <el-tooltip content="最多20个字符" placement="top">
                <el-icon style="margin-left: 5px; color: #909399;"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="MOLocation" label="位置信息">
          <template #header>
            <div class="table-column-header">
              <span>位置信息</span>
              <el-tooltip content="最多50个字符" placement="top">
                <el-icon style="margin-left: 5px; color: #909399;"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        
        <!-- 删除数据库中没有的字段 -->
        <!-- <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '在线' ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastCheckTime" label="最后检测时间" width="180" /> -->
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.MonitorPointID)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
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
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="监测点编号" prop="MonitorPointID" required>
          <el-input 
            v-model="form.MonitorPointID" 
            placeholder="例如：MP001、VID001"
            :disabled="isEdit"
            maxlength="10"
            show-word-limit
            clearable
          />
          <div class="form-tips">
            • 最多10个字符，保存后不可修改<br>
            • 建议格式：MP001、VID001、CAM001<br>
            • 必须唯一，不能重复
          </div>
        </el-form-item>
        
        <el-form-item label="监测点名称" prop="MonitorPointName">
          <el-input 
            v-model="form.MonitorPointName" 
            placeholder="请输入监测点完整名称"
            maxlength="50"
            show-word-limit
            clearable
          />
          <div class="form-tips">
            • 最多50个字符<br>
            • 示例：市中心视频监控点、火车站客流监测
          </div>
        </el-form-item>
        
        <el-form-item label="监测类型" prop="MonitorType">
          <el-select 
            v-model="form.MonitorType" 
            placeholder="请选择监测类型"
            style="width: 100%;"
            clearable
            filterable
            allow-create
          >
            <el-option label="视频监控" value="视频监控" />
            <el-option label="流量监测" value="流量监测" />
            <el-option label="环境监测" value="环境监测" />
            <el-option label="设备状态" value="设备状态" />
            <el-option label="安全检查" value="安全检查" />
            <el-option label="客流统计" value="客流统计" />
            <el-option label="车辆识别" value="车辆识别" />
            <el-option label="违章抓拍" value="违章抓拍" />
            <el-option label="信号监测" value="信号监测" />
            <el-option label="其他" value="其他" />
          </el-select>
          <div class="form-tips">
            • 最多20个字符<br>
            • 可从列表选择或自定义输入<br>
            • 常见类型：视频监控、流量监测、环境监测
          </div>
        </el-form-item>
        
        <el-form-item label="位置信息" prop="MOLocation">
          <el-input 
            v-model="form.MOLocation" 
            placeholder="请输入监测点具体位置"
            maxlength="50"
            show-word-limit
            clearable
            :rows="2"
            type="textarea"
          />
          <div class="form-tips">
            • 最多50个字符<br>
            • 建议填写详细安装位置<br>
            • 示例：市中心广场东南角、火车站入口处
          </div>
        </el-form-item>

        <!-- 外键约束提示 -->
        <div class="form-section-tips" v-if="isEdit">
          <el-alert
            title="注意"
            type="warning"
            :closable="false"
            show-icon
          >
            编辑模式下，监测点编号不可修改。监测点是交通数据记录的父表，删除前请确认无关联数据。
          </el-alert>
        </div>
        
        <div class="form-section-tips">
          <el-alert
            title="数据库字段限制"
            type="info"
            :closable="false"
            show-icon
          >
            监测点表字段长度限制：编号(10字符)、名称(50字符)、类型(20字符)、位置(50字符)
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
  Search,
  Refresh,
  InfoFilled
} from '@element-plus/icons-vue'

const API_BASE_URL = 'http://39.104.28.230:3000/api'

// 响应式数据
const monitorPoints = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const formRef = ref()
const isEdit = ref(false)
const submitting = ref(false)

// 表单数据（只包含数据库有的字段）
const form = ref({
  MonitorPointID: '',
  MonitorPointName: '',
  MonitorType: '',
  MOLocation: ''
})

// 计算属性
const total = computed(() => filteredMonitorPoints.value.length)

const filteredMonitorPoints = computed(() => {
  let result = monitorPoints.value
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(point => 
      (point.MonitorPointID && point.MonitorPointID.toLowerCase().includes(query)) || 
      (point.MonitorPointName && point.MonitorPointName.toLowerCase().includes(query)) ||
      (point.MOLocation && point.MOLocation.toLowerCase().includes(query))
    )
  }
  
  // 类型过滤
  if (filterType.value) {
    result = result.filter(point => point.MonitorType === filterType.value)
  }
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

const dialogTitle = computed(() => isEdit.value ? '编辑监测点' : '新增监测点')

// 验证规则（基于数据库约束）
const rules = {
  MonitorPointID: [
    { required: true, message: '请输入监测点编号', trigger: 'blur' },
    { max: 10, message: '监测点编号最多10个字符', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_-]+$/, message: '只能包含字母、数字、下划线和横线', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value && value.trim().length === 0) {
        callback(new Error('监测点编号不能为空'))
      } else if (value && value.length > 10) {
        callback(new Error('监测点编号不能超过10个字符'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  MonitorPointName: [
    { max: 50, message: '监测点名称最多50个字符', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value && value.length > 50) {
        callback(new Error('监测点名称不能超过50个字符'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  MonitorType: [
    { max: 20, message: '监测类型最多20个字符', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value && value.length > 20) {
        callback(new Error('监测类型不能超过20个字符'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  MOLocation: [
    { max: 50, message: '位置信息最多50个字符', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value && value.length > 50) {
        callback(new Error('位置信息不能超过50个字符'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ]
}

// 获取监测点列表
const fetchMonitorPoints = async () => {
  try {
    loading.value = true
    console.log('🔄 请求监测点数据...')
    
    const response = await axios.get(`${API_BASE_URL}/monitor-points`)
    console.log('✅ 监测点API响应:', response.data)
    
    let pointList = []
    
    if (response.data && response.data.data) {
      pointList = response.data.data
    } else if (Array.isArray(response.data)) {
      pointList = response.data
    }
    
    // 处理数据并验证字段长度
    monitorPoints.value = pointList.map(point => {
      // 验证字段长度
      if (point.MonitorPointID && point.MonitorPointID.length > 10) {
        console.warn(`⚠️ 监测点ID过长: "${point.MonitorPointID}" (${point.MonitorPointID.length}字符)`)
      }
      if (point.MonitorPointName && point.MonitorPointName.length > 50) {
        console.warn(`⚠️ 监测点名称过长: "${point.MonitorPointName}" (${point.MonitorPointName.length}字符)`)
      }
      if (point.MonitorType && point.MonitorType.length > 20) {
        console.warn(`⚠️ 监测类型过长: "${point.MonitorType}" (${point.MonitorType.length}字符)`)
      }
      if (point.MOLocation && point.MOLocation.length > 50) {
        console.warn(`⚠️ 位置信息过长: "${point.MOLocation}" (${point.MOLocation.length}字符)`)
      }
      
      return {
        MonitorPointID: point.MonitorPointID || '',
        MonitorPointName: point.MonitorPointName || '',
        MonitorType: point.MonitorType || '',
        MOLocation: point.MOLocation || ''
      }
    })
    
    console.log('✅ 监测点数据加载完成，共', monitorPoints.value.length, '条记录')
    
  } catch (error) {
    console.error('获取监测点列表失败:', error)
    ElMessage.error('获取监测点列表失败: ' + (error.message || '网络错误'))
    monitorPoints.value = []
  } finally {
    loading.value = false
  }
}

// 方法
const getMonitorTypeTag = (type) => {
  if (!type) return ''
  
  const map = {
    '视频监控': '',
    '流量监测': 'success',
    '环境监测': 'info',
    '设备状态': 'warning',
    '安全检查': 'danger',
    '客流统计': 'success',
    '车辆识别': 'warning',
    '违章抓拍': 'danger',
    '信号监测': 'info'
  }
  return map[type] || ''
}

const handleSearch = () => {
  currentPage.value = 1 // 搜索时回到第一页
}

const resetFilters = () => {
  searchQuery.value = ''
  filterType.value = ''
  currentPage.value = 1
}

const refreshData = async () => {
  await fetchMonitorPoints()
  ElMessage.success('数据已刷新')
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    MonitorPointID: '',
    MonitorPointName: '',
    MonitorType: '',
    MOLocation: ''
  }
  
  // 清空表单验证状态
  if (formRef.value) {
    formRef.value.clearValidate()
  }
  
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { 
    MonitorPointID: row.MonitorPointID,
    MonitorPointName: row.MonitorPointName,
    MonitorType: row.MonitorType,
    MOLocation: row.MOLocation
  }
  
  dialogVisible.value = true
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个监测点吗？此操作将影响相关的交通数据记录！',
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
              const response = await axios.delete(`${API_BASE_URL}/monitor-points/${id}`)
              
              if (response.data.code === 200) {
                ElMessage.success('监测点删除成功')
                await fetchMonitorPoints()
              } else {
                ElMessage.error(response.data.message || '删除失败')
              }
            } catch (error) {
              console.error('删除监测点失败:', error)
              let errorMsg = '删除失败'
              if (error.response?.data?.message) {
                errorMsg = error.response.data.message
              } else if (error.response?.data?.error?.includes('Foreign key constraint')) {
                errorMsg = '该监测点已被交通数据记录引用，无法删除'
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
  if (monitorPoints.value.length === 0) {
    ElMessage.warning('没有数据可以导出')
    return
  }
  
  // 简单导出功能
  const headers = ['监测点编号', '监测点名称', '监测类型', '位置信息']
  const data = monitorPoints.value.map(point => [
    point.MonitorPointID,
    point.MonitorPointName,
    point.MonitorType,
    point.MOLocation
  ])
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.join(','))
  ].join('\n')
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `监测点数据_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  
  ElMessage.success('数据导出成功')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 额外验证
    if (form.value.MonitorPointID && form.value.MonitorPointID.length > 10) {
      ElMessage.error('监测点编号不能超过10个字符')
      return
    }
    
    if (form.value.MonitorPointName && form.value.MonitorPointName.length > 50) {
      ElMessage.error('监测点名称不能超过50个字符')
      return
    }
    
    if (form.value.MonitorType && form.value.MonitorType.length > 20) {
      ElMessage.error('监测类型不能超过20个字符')
      return
    }
    
    if (form.value.MOLocation && form.value.MOLocation.length > 50) {
      ElMessage.error('位置信息不能超过50个字符')
      return
    }
    
    submitting.value = true
    
    const monitorData = {
      MonitorPointID: form.value.MonitorPointID.trim(),
      MonitorPointName: form.value.MonitorPointName ? form.value.MonitorPointName.trim() : null,
      MonitorType: form.value.MonitorType ? form.value.MonitorType.trim() : null,
      MOLocation: form.value.MOLocation ? form.value.MOLocation.trim() : null
    }
    
    console.log('📤 提交监测点数据:', monitorData)
    
    if (isEdit.value) {
      const response = await axios.put(`${API_BASE_URL}/monitor-points/${form.value.MonitorPointID}`, monitorData)
      
      if (response.data.code === 200) {
        ElMessage.success('监测点更新成功')
        dialogVisible.value = false
        await fetchMonitorPoints()
      } else {
        ElMessage.error(response.data.message || '更新失败')
      }
    } else {
      const response = await axios.post(`${API_BASE_URL}/monitor-points`, monitorData)
      
      if (response.data.code === 201) {
        ElMessage.success('监测点新增成功')
        dialogVisible.value = false
        await fetchMonitorPoints()
      } else {
        ElMessage.error(response.data.message || '新增失败')
      }
    }
    
  } catch (error) {
    console.error('保存监测点失败:', error)
    
    let errorMessage = '保存失败'
    if (error.response?.data?.code === 409) {
      errorMessage = '监测点编号已存在'
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
  console.log('🚀 MonitorPoints.vue组件已挂载，开始加载数据')
  fetchMonitorPoints()
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