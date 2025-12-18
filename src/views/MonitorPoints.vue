<template>
  <div class="monitor-points-page">
    <div class="page-header">
      <h2>监测点管理</h2>
      <div>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增监测点
        </el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="monitorPoints" height="500" v-loading="loading">
        <el-table-column prop="MonitorPointID" label="监测点ID" width="120" />
        <el-table-column prop="MonitorPointName" label="监测点名称" />
        <el-table-column prop="MonitorType" label="监测类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getMonitorTypeTag(row.MonitorType)">
              {{ row.MonitorType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="MOLocation" label="位置" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '在线' ? 'success' : 'danger'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastCheckTime" label="最后检测时间" width="180" />
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
        <el-form-item label="监测点ID" prop="MonitorPointID">
          <el-input v-model="form.MonitorPointID" placeholder="如：MP001" />
        </el-form-item>
        <el-form-item label="监测点名称" prop="MonitorPointName">
          <el-input v-model="form.MonitorPointName" placeholder="请输入监测点名称" />
        </el-form-item>
        <el-form-item label="监测类型" prop="MonitorType">
          <el-select v-model="form.MonitorType" placeholder="请选择">
            <el-option label="视频监控" value="视频监控" />
            <el-option label="客流统计" value="客流统计" />
            <el-option label="车辆识别" value="车辆识别" />
            <el-option label="环境监测" value="环境监测" />
          </el-select>
        </el-form-item>
        <el-form-item label="位置" prop="MOLocation">
          <el-input v-model="form.MOLocation" placeholder="请输入监测点位置" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="在线">在线</el-radio>
            <el-radio label="离线">离线</el-radio>
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
  Edit,
  Delete
} from '@element-plus/icons-vue'

// 模拟数据
const mockMonitorPoints = [
  { MonitorPointID: 'MP001', MonitorPointName: '市中心视频监控', MonitorType: '视频监控', MOLocation: '市中心广场', status: '在线', lastCheckTime: '2024-01-15 10:30:00' },
  { MonitorPointID: 'MP002', MonitorPointName: '火车站客流统计', MonitorType: '客流统计', MOLocation: '火车站入口', status: '在线', lastCheckTime: '2024-01-15 10:25:00' },
  { MonitorPointID: 'MP003', MonitorPointName: '大学城车辆识别', MonitorType: '车辆识别', MOLocation: '大学城南门', status: '在线', lastCheckTime: '2024-01-15 10:20:00' },
  { MonitorPointID: 'MP004', MonitorPointName: '购物中心客流统计', MonitorType: '客流统计', MOLocation: '购物中心西门', status: '在线', lastCheckTime: '2024-01-15 10:15:00' },
  { MonitorPointID: 'MP005', MonitorPointName: '开发区环境监测', MonitorType: '环境监测', MOLocation: '开发区路口', status: '离线', lastCheckTime: '2024-01-14 18:30:00' },
  { MonitorPointID: 'MP006', MonitorPointName: '体育中心监控', MonitorType: '视频监控', MOLocation: '体育中心北门', status: '在线', lastCheckTime: '2024-01-15 09:45:00' },
  { MonitorPointID: 'MP007', MonitorPointName: '医院客流统计', MonitorType: '客流统计', MOLocation: '第一医院门口', status: '在线', lastCheckTime: '2024-01-15 09:30:00' },
  { MonitorPointID: 'MP008', MonitorPointName: '公园环境监测', MonitorType: '环境监测', MOLocation: '人民公园', status: '在线', lastCheckTime: '2024-01-15 09:15:00' }
]

// 响应式数据
const monitorPoints = ref([...mockMonitorPoints])
const loading = ref(false)
const dialogVisible = ref(false)
const formRef = ref()
const isEdit = ref(false)

// 表单数据
const form = ref({
  MonitorPointID: '',
  MonitorPointName: '',
  MonitorType: '',
  MOLocation: '',
  status: '在线',
  lastCheckTime: new Date().toLocaleString()
})

// 验证规则
const rules = {
  MonitorPointID: [{ required: true, message: '请输入监测点ID', trigger: 'blur' }],
  MonitorPointName: [{ required: true, message: '请输入监测点名称', trigger: 'blur' }],
  MonitorType: [{ required: true, message: '请选择监测类型', trigger: 'change' }],
  MOLocation: [{ required: true, message: '请输入监测点位置', trigger: 'blur' }]
}

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑监测点' : '新增监测点')

// 方法
const getMonitorTypeTag = (type) => {
  const map = {
    '视频监控': '',
    '客流统计': 'success',
    '车辆识别': 'warning',
    '环境监测': 'info'
  }
  return map[type] || ''
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    MonitorPointID: '',
    MonitorPointName: '',
    MonitorType: '',
    MOLocation: '',
    status: '在线',
    lastCheckTime: new Date().toLocaleString()
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除这个监测点吗？', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(() => {
    const index = monitorPoints.value.findIndex(point => point.MonitorPointID === id)
    if (index > -1) {
      monitorPoints.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 更新最后检测时间
    if (isEdit.value) {
      form.value.lastCheckTime = new Date().toLocaleString()
    }
    
    if (isEdit.value) {
      // 更新
      const index = monitorPoints.value.findIndex(point => point.MonitorPointID === form.value.MonitorPointID)
      if (index > -1) {
        monitorPoints.value[index] = { ...form.value }
      }
      ElMessage.success('更新成功')
    } else {
      // 新增
      monitorPoints.value.unshift({ ...form.value })
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