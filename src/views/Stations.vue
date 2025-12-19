<template>
  <!-- 权限检查 -->
  <div v-if="!isAdmin" class="no-permission">
    <el-result icon="warning" title="无权限访问">
      <template #extra>
        <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
      </template>
    </el-result>
  </div>

  <!-- 原有内容，但在按钮上添加v-if -->
  <div v-else class="stations-page">
    <div class="page-header">
      <h2>站点管理</h2>
      <div>
        <!-- 只有管理员能看到新增按钮 -->
        <el-button 
          type="primary" 
          @click="handleAdd"
          v-if="isAdmin"
        >
          <el-icon><Plus /></el-icon>
          新增站点
        </el-button>
        
        <!-- 导出和刷新所有人都能看到 -->
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
            placeholder="搜索站点名称、编号或位置"
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
              v-model="filterLine" 
              placeholder="按线路筛选" 
              clearable
              style="width: 200px;"
            >
              <el-option label="(未分配线路)" value="" />
              <el-option 
                v-for="line in lines" 
                :key="line.LineID" 
                :label="`${line.LineID} - ${line.LineName}`" 
                :value="line.LineID" 
              />
            </el-select>
            
            <el-button @click="resetFilters">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="filteredStations" height="500" v-loading="loading" stripe>
        <el-table-column type="selection" width="50" />
        
        <el-table-column prop="StationID" label="站点编号" width="120">
          <template #header>
            <div class="table-column-header">
              <span>站点编号</span>
              <el-tooltip content="唯一标识，最多10个字符" placement="top">
                <el-icon style="margin-left: 5px; color: #909399;"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="StationName" label="站点名称">
          <template #header>
            <div class="table-column-header">
              <span>站点名称</span>
              <el-tooltip content="最多50个字符" placement="top">
                <el-icon style="margin-left: 5px; color: #909399;"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="LineID" label="所属线路" width="150">
          <template #default="{ row }">
            <div v-if="row.LineID">
              <el-tag type="primary" size="small">{{ row.LineID }}</el-tag>
              <span v-if="row.LineName" class="line-name-text"> - {{ row.LineName }}</span>
            </div>
            <div v-else>
              <el-tag type="info" size="small">未分配线路</el-tag>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="Location" label="位置信息">
          <template #header>
            <div class="table-column-header">
              <span>位置信息</span>
              <el-tooltip content="最多100个字符" placement="top">
                <el-icon style="margin-left: 5px; color: #909399;"><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="PlatformCapacity" label="站台容量" width="100">
          <template #default="{ row }">
            <el-tag :type="getCapacityType(row.PlatformCapacity)">
              {{ row.PlatformCapacity }}
            </el-tag>
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
              @click="handleDelete(row.StationID)"
            >
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
        <el-form-item label="站点编号" prop="StationID" required>
          <el-input 
            v-model="form.StationID" 
            placeholder="例如：ST001、BJ001"
            :disabled="isEdit"
            maxlength="10"
            show-word-limit
            clearable
          />
          <div class="form-tips">
            • 最多10个字符，保存后不可修改<br>
            • 建议格式：ST001、BJ001、GZ001<br>
            • 必须唯一，不能重复
          </div>
        </el-form-item>
        
        <el-form-item label="站点名称" prop="StationName" required>
          <el-input 
            v-model="form.StationName" 
            placeholder="请输入站点完整名称"
            maxlength="50"
            show-word-limit
            clearable
          />
          <div class="form-tips">
            • 最多50个字符<br>
            • 示例：北京西站、人民广场、中山公园
          </div>
        </el-form-item>
        
        <el-form-item label="所属线路" prop="LineID">
          <el-select 
            v-model="form.LineID" 
            placeholder="请选择所属线路（可选）"
            style="width: 100%;"
            clearable
            filterable
          >
            <el-option label="(不分配线路)" value="" />
            <el-option 
              v-for="line in lines" 
              :key="line.LineID" 
              :label="`${line.LineID} - ${line.LineName}`" 
              :value="line.LineID"
              :disabled="!line.LineID"
            />
          </el-select>
          <div class="form-tips">
            • 可选字段，可以为空<br>
            • 如果选择线路，请确保线路已存在<br>
            • 当前可用线路数：{{ lines.length }}
          </div>
        </el-form-item>
        
        <el-form-item label="位置信息" prop="Location">
          <el-input 
            v-model="form.Location" 
            placeholder="请输入站点具体位置"
            maxlength="100"
            show-word-limit
            clearable
            :rows="2"
            type="textarea"
          />
          <div class="form-tips">
            • 最多100个字符<br>
            • 建议填写详细地址或地标<br>
            • 示例：北京市海淀区中关村大街1号
          </div>
        </el-form-item>
        
        <el-form-item label="站台容量" prop="PlatformCapacity">
          <el-input-number 
            v-model="form.PlatformCapacity" 
            :min="0" 
            :max="9999"
            :step="1"
            controls-position="right"
            style="width: 100%;"
            placeholder="请输入站台容量"
          />
          <div class="form-tips">
            • 单位：人/同时容纳人数<br>
            • 范围：0-9999（整数）<br>
            • 建议值：50-500人
            <div class="capacity-levels">
              <span class="capacity-low">低容量：&lt;100人</span>
              <span class="capacity-medium">中容量：100-300人</span>
              <span class="capacity-high">高容量：&gt;300人</span>
            </div>
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
            编辑模式下，站点编号不可修改。LineID为可选字段，可以为空。
          </el-alert>
        </div>
        
        <!-- 数据库约束提示 -->
        <div class="form-section-tips">
          <el-alert
            title="数据库字段限制"
            type="info"
            :closable="false"
            show-icon
          >
            站点表字段长度限制：编号(10字符)、名称(50字符)、位置(100字符)、容量(整数0-9999)。LineID为可选字段。
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
const stations = ref([])
const lines = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterLine = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const dialogVisible = ref(false)
const formRef = ref()
const isEdit = ref(false)
const submitting = ref(false)

// 表单数据
const form = ref({
  StationID: '',
  StationName: '',
  LineID: '',
  Location: '',
  PlatformCapacity: 50
})

// 计算属性
const currentUser = computed(() => {
  return JSON.parse(localStorage.getItem('user') || '{}')
})

const isAdmin = computed(() => {
  return currentUser.value.roleType === 'admin'
})

const total = computed(() => filteredStations.value.length)

const filteredStations = computed(() => {
  let result = stations.value
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(station => 
      (station.StationID && station.StationID.toLowerCase().includes(query)) || 
      (station.StationName && station.StationName.toLowerCase().includes(query)) ||
      (station.Location && station.Location.toLowerCase().includes(query))
    )
  }
  
  // 线路过滤（处理空值情况）
  if (filterLine.value !== undefined && filterLine.value !== '') {
    result = result.filter(station => station.LineID === filterLine.value)
  } else if (filterLine.value === '') {
    // 筛选未分配线路的站点
    result = result.filter(station => !station.LineID || station.LineID === '')
  }
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return result.slice(start, end)
})

const dialogTitle = computed(() => isEdit.value ? '编辑站点' : '新增站点')

// 验证规则（根据数据库约束调整）
const rules = {
  StationID: [
    { required: true, message: '请输入站点编号', trigger: 'blur' },
    { max: 10, message: '站点编号最多10个字符', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_-]+$/, message: '只能包含字母、数字、下划线和横线', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value && value.trim().length === 0) {
        callback(new Error('站点编号不能为空'))
      } else if (value && value.length > 10) {
        callback(new Error('站点编号不能超过10个字符'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  StationName: [
    { required: true, message: '请输入站点名称', trigger: 'blur' },
    { max: 50, message: '站点名称最多50个字符', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value && value.trim().length === 0) {
        callback(new Error('站点名称不能为空'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ],
  // LineID: 移除必填验证，允许为空
  Location: [
    { max: 100, message: '位置信息最多100个字符', trigger: 'blur' }
  ],
  PlatformCapacity: [
    { required: true, message: '请输入站台容量', trigger: 'blur' },
    { type: 'number', message: '站台容量必须为数字', trigger: 'blur' },
    { type: 'number', min: 0, message: '站台容量不能为负数', trigger: 'blur' },
    { type: 'number', max: 9999, message: '站台容量不能超过9999', trigger: 'blur' },
    { type: 'integer', message: '站台容量必须为整数', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (value < 0) {
        callback(new Error('站台容量不能为负数'))
      } else if (value > 9999) {
        callback(new Error('站台容量不能超过9999'))
      } else if (!Number.isInteger(value)) {
        callback(new Error('站台容量必须为整数'))
      } else {
        callback()
      }
    }, trigger: 'blur' }
  ]
}

// 获取线路列表
const fetchLines = async () => {
  try {
    const token = localStorage.getItem('token')
    
    const response = await axios.get(`${API_BASE_URL}/lines`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    
    if (response.data && response.data.data) {
      lines.value = response.data.data.filter(line => line.LineID).sort((a, b) => {
        return (a.LineID || '').localeCompare(b.LineID || '')
      })
      console.log('📋 可用线路列表:', lines.value.map(l => l.LineID))
    } else {
      lines.value = []
    }
  } catch (error) {
    console.error('获取线路列表失败:', error)
    
    if (error.response?.status === 401) {
      ElMessage.error('请先登录')
    } else {
      ElMessage.warning('获取线路列表失败，站点仍可创建但不分配线路')
    }
    
    lines.value = []
  }
}

// 获取站点列表
const fetchStations = async () => {
  try {
    loading.value = true
    const token = localStorage.getItem('token')
    
    const response = await axios.get(`${API_BASE_URL}/stations`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    
    console.log('🔍 站点API响应:', response.data)
    
    let stationList = []
    
    if (response.data && response.data.data) {
      stationList = response.data.data
    } else if (Array.isArray(response.data)) {
      stationList = response.data
    }
    
    // 处理数据并验证字段长度
    stations.value = stationList.map(station => {
      // 验证字段长度
      if (station.StationID && station.StationID.length > 10) {
        console.warn(`⚠️ 站点ID过长: "${station.StationID}" (${station.StationID.length}字符)`)
      }
      
      return {
        StationID: station.StationID || '',
        StationName: station.StationName || '',
        LineID: station.LineID || '',
        LineName: station.LineName || '',
        Location: station.Location || '',
        PlatformCapacity: parseInt(station.PlatformCapacity) || 0
      }
    })
    
    console.log('✅ 站点数据加载完成，共', stations.value.length, '条记录')
    
    // 统计有线路和无线路的站点数量
    const withLineCount = stations.value.filter(s => s.LineID).length
    const withoutLineCount = stations.value.length - withLineCount
    console.log(`📊 站点统计：有线路${withLineCount}个，无线路${withoutLineCount}个`)
    
  } catch (error) {
    console.error('获取站点列表失败:', error)
    
    if (error.response?.status === 403) {
      ElMessage.error('需要管理员权限')
    } else if (error.response?.status === 401) {
      ElMessage.error('请先登录')
    } else {
      ElMessage.error('获取站点列表失败: ' + (error.message || '网络错误'))
    }
    
    stations.value = []
  } finally {
    loading.value = false
  }
}

// 方法
const getCapacityType = (capacity) => {
  capacity = parseInt(capacity) || 0
  if (capacity >= 300) return 'success'
  if (capacity >= 100) return ''
  return 'warning'
}

const handleSearch = () => {
  currentPage.value = 1
}

const resetFilters = () => {
  searchQuery.value = ''
  filterLine.value = ''
  currentPage.value = 1
}

const refreshData = async () => {
  await fetchStations()
  ElMessage.success('数据已刷新')
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    StationID: '',
    StationName: '',
    LineID: '',
    Location: '',
    PlatformCapacity: 50
  }
  
  if (formRef.value) {
    formRef.value.clearValidate()
  }
  
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { 
    StationID: row.StationID,
    StationName: row.StationName,
    LineID: row.LineID || '',
    Location: row.Location || '',
    PlatformCapacity: parseInt(row.PlatformCapacity) || 50
  }
  
  dialogVisible.value = true
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个站点吗？此操作将同时删除相关的交通数据记录！',
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
              const response = await axios.delete(`${API_BASE_URL}/stations/${id}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
              })
              
              if (response.data.code === 200) {
                ElMessage.success('站点删除成功')
                await fetchStations()
              } else {
                ElMessage.error(response.data.message || '删除失败')
              }
            } catch (error) {
              console.error('删除站点失败:', error)
              let errorMsg = '删除失败'
              
              if (error.response?.status === 403) {
                errorMsg = '需要管理员权限'
              } else if (error.response?.status === 401) {
                errorMsg = '请先登录'
              } else if (error.response?.data?.error?.includes('foreign key constraint')) {
                errorMsg = '该站点已被交通数据记录引用，请先删除相关记录'
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
  if (stations.value.length === 0) {
    ElMessage.warning('没有数据可以导出')
    return
  }
  
  const headers = ['站点编号', '站点名称', '所属线路', '线路名称', '位置', '站台容量']
  const data = stations.value.map(station => [
    station.StationID,
    station.StationName,
    station.LineID || '(空)',
    station.LineName || '(空)',
    station.Location,
    station.PlatformCapacity
  ])
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.join(','))
  ].join('\n')
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `站点数据_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  
  ElMessage.success('数据导出成功')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 额外验证
    if (form.value.StationID && form.value.StationID.length > 10) {
      ElMessage.error('站点编号不能超过10个字符')
      return
    }
    
    if (form.value.StationName && form.value.StationName.length > 50) {
      ElMessage.error('站点名称不能超过50个字符')
      return
    }
    
    // LineID可以为空，但如果不为空，要检查线路是否存在
    if (form.value.LineID && form.value.LineID.trim()) {
      const lineExists = lines.value.some(line => line.LineID === form.value.LineID)
      if (!lineExists) {
        ElMessage.warning('选择的线路不存在，将创建不分配线路的站点')
        // 可以选择清空LineID或继续创建
      }
    }
    
    submitting.value = true
    const token = localStorage.getItem('token')
    
    const stationData = {
      StationID: form.value.StationID.trim(),
      StationName: form.value.StationName.trim(),
      LineID: form.value.LineID ? form.value.LineID.trim() : null, // 允许为null
      Location: form.value.Location ? form.value.Location.trim() : null,
      PlatformCapacity: parseInt(form.value.PlatformCapacity) || 0
    }
    
    console.log('📤 提交站点数据:', stationData)
    
    if (isEdit.value) {
      const response = await axios.put(
        `${API_BASE_URL}/stations/${form.value.StationID}`, 
        stationData,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      )
      
      if (response.data.code === 200) {
        ElMessage.success('站点更新成功')
        dialogVisible.value = false
        await fetchStations()
      } else {
        ElMessage.error(response.data.message || '更新失败')
      }
    } else {
      const response = await axios.post(
        `${API_BASE_URL}/stations`, 
        stationData,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      )
      
      if (response.data.code === 201) {
        ElMessage.success('站点新增成功')
        dialogVisible.value = false
        await fetchStations()
      } else {
        ElMessage.error(response.data.message || '新增失败')
      }
    }
    
  } catch (error) {
    console.error('保存站点失败:', error)
    
    let errorMessage = '保存失败'
    if (error.response?.status === 403) {
      errorMessage = '需要管理员权限'
    } else if (error.response?.status === 401) {
      errorMessage = '请先登录'
    } else if (error.response?.data?.code === 409) {
      errorMessage = '站点编号已存在'
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
  console.log('🚀 Stations.vue组件已挂载，开始加载数据')
  
  // 只有登录用户才能加载数据
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (user.userId) {
    fetchLines()
    fetchStations()
  } else {
    ElMessage.error('请先登录')
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

.line-name-text {
  font-size: 12px;
  color: #666;
  margin-left: 4px;
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

.capacity-levels {
  display: flex;
  gap: 10px;
  margin-top: 4px;
  font-size: 11px;
}

.capacity-low {
  color: #E6A23C;
}

.capacity-medium {
  color: #409EFF;
}

.capacity-high {
  color: #67C23A;
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