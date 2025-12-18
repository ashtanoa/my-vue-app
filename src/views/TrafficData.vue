<template>
  <div class="traffic-data-page">
    <div class="page-header">
      <h2>交通数据管理</h2>
      <div>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增记录
        </el-button>
        <el-button type="success" @click="handleBatchImport">
          <el-icon><Upload /></el-icon>
          批量导入
        </el-button>
        <el-button type="warning" @click="handleGenerateReport">
          <el-icon><Document /></el-icon>
          生成报表
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
              />
            </el-col>
            <el-col :span="4">
              <el-select v-model="filterLine" placeholder="选择线路" clearable>
                <el-option v-for="line in lines" :key="line.LineID" 
                  :label="line.LineName" 
                  :value="line.LineID" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select v-model="filterStation" placeholder="选择站点" clearable>
                <el-option v-for="station in stations" :key="station.StationID" 
                  :label="station.StationName" 
                  :value="station.StationID" />
              </el-select>
            </el-col>
            <el-col :span="4">
              <el-select v-model="filterDataType" placeholder="数据类型" clearable>
                <el-option label="客流量" value="客流量" />
                <el-option label="车流量" value="车流量" />
                <el-option label="速度" value="速度" />
                <el-option label="延误" value="延误" />
              </el-select>
            </el-col>
            <el-col :span="6">
              <el-button type="primary" @click="handleFilter">
                <el-icon><Search /></el-icon>
                查询
              </el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-col>
          </el-row>
        </div>
      </template>

      <el-table :data="trafficData" height="500" v-loading="loading" stripe>
        <el-table-column prop="RecordID" label="记录ID" width="120" />
        <el-table-column prop="RecordTime" label="记录时间" width="180" />
        <el-table-column prop="StationName" label="站点" width="150" />
        <el-table-column prop="LineName" label="线路" width="120" />
        <el-table-column prop="MonitorPointName" label="监测点" width="150" />
        <el-table-column prop="DataType" label="数据类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getDataTypeTag(row.DataType)">
              {{ row.DataType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="数值" width="180">
          <template #default="{ row }">
            <div class="data-values">
              <span v-if="row.Value1 !== null">值1: {{ row.Value1 }}</span>
              <span v-if="row.Value2 !== null">值2: {{ row.Value2 }}</span>
              <span v-if="row.Value3 !== null">值3: {{ row.Value3 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="AnnotationInfo" label="备注" show-overflow-tooltip />
        <el-table-column prop="Operator" label="操作员" width="100" />
        <el-table-column prop="OperationTime" label="操作时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.RecordID)">
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
      @closed="handleDialogClosed"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="记录ID" prop="RecordID">
              <el-input v-model="form.RecordID" placeholder="系统自动生成" :disabled="isEdit" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="记录时间" prop="RecordTime">
              <el-date-picker
                v-model="form.RecordTime"
                type="datetime"
                placeholder="选择记录时间"
                style="width: 100%;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="线路" prop="LineID">
              <el-select v-model="form.LineID" placeholder="请选择线路" @change="handleLineChange">
                <el-option v-for="line in lines" :key="line.LineID" 
                  :label="line.LineName" 
                  :value="line.LineID" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="站点" prop="StationID">
              <el-select v-model="form.StationID" placeholder="请选择站点">
                <el-option v-for="station in filteredStations" :key="station.StationID" 
                  :label="station.StationName" 
                  :value="station.StationID" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="监测点" prop="MonitorPointID">
              <el-select v-model="form.MonitorPointID" placeholder="请选择监测点">
                <el-option v-for="point in monitorPoints" :key="point.MonitorPointID" 
                  :label="point.MonitorPointName" 
                  :value="point.MonitorPointID" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="数据类型" prop="DataType">
              <el-select v-model="form.DataType" placeholder="请选择数据类型">
                <el-option label="客流量" value="客流量" />
                <el-option label="车流量" value="车流量" />
                <el-option label="速度" value="速度" />
                <el-option label="延误" value="延误" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="值1">
              <el-input-number v-model="form.Value1" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="值2">
              <el-input-number v-model="form.Value2" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="值3">
              <el-input-number v-model="form.Value3" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注信息" prop="AnnotationInfo">
          <el-input
            v-model="form.AnnotationInfo"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
            maxlength="200"
            show-word-limit
          />
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
  Upload,
  Document,
  Search,
  Edit,
  Delete
} from '@element-plus/icons-vue'

// 模拟数据
const mockTrafficData = [
  { RecordID: 'RD001', RecordTime: '2024-01-15 08:30:00', StationID: 'ST001', StationName: '市中心站', 
    LineID: 'L001', LineName: '1路公交', MonitorPointID: 'MP001', MonitorPointName: '市中心视频监控',
    DataType: '客流量', Value1: 156, Value2: null, Value3: null, 
    AnnotationInfo: '早高峰客流量统计', Operator: '管理员', OperationTime: '2024-01-15 08:35:00' },
  { RecordID: 'RD002', RecordTime: '2024-01-15 08:25:00', StationID: 'ST002', StationName: '大学城站', 
    LineID: 'L001', LineName: '1路公交', MonitorPointID: 'MP003', MonitorPointName: '大学城车辆识别',
    DataType: '车流量', Value1: 45, Value2: null, Value3: null, 
    AnnotationInfo: '进站车辆统计', Operator: '管理员', OperationTime: '2024-01-15 08:30:00' },
  { RecordID: 'RD003', RecordTime: '2024-01-15 08:20:00', StationID: 'ST003', StationName: '火车站', 
    LineID: 'L002', LineName: '2路快速', MonitorPointID: 'MP002', MonitorPointName: '火车站客流统计',
    DataType: '客流量', Value1: 234, Value2: 120, Value3: null, 
    AnnotationInfo: '火车站双向客流', Operator: '管理员', OperationTime: '2024-01-15 08:25:00' },
  { RecordID: 'RD004', RecordTime: '2024-01-15 08:15:00', StationID: 'ST004', StationName: '体育中心站', 
    LineID: 'L003', LineName: '3路夜间', MonitorPointID: 'MP004', MonitorPointName: '购物中心客流统计',
    DataType: '速度', Value1: 35, Value2: null, Value3: null, 
    AnnotationInfo: '平均车速', Operator: '管理员', OperationTime: '2024-01-15 08:20:00' },
  { RecordID: 'RD005', RecordTime: '2024-01-15 08:10:00', StationID: 'ST005', StationName: '开发区站', 
    LineID: 'L004', LineName: 'K1路', MonitorPointID: 'MP005', MonitorPointName: '开发区环境监测',
    DataType: '延误', Value1: 5, Value2: null, Value3: null, 
    AnnotationInfo: '进站延误时间', Operator: '管理员', OperationTime: '2024-01-15 08:15:00' },
  { RecordID: 'RD006', RecordTime: '2024-01-15 08:05:00', StationID: 'ST006', StationName: '医院站', 
    LineID: 'L003', LineName: '3路夜间', MonitorPointID: 'MP007', MonitorPointName: '医院客流统计',
    DataType: '客流量', Value1: 89, Value2: null, Value3: null, 
    AnnotationInfo: '早班车客流', Operator: '管理员', OperationTime: '2024-01-15 08:10:00' },
  { RecordID: 'RD007', RecordTime: '2024-01-15 08:00:00', StationID: 'ST007', StationName: '购物中心站', 
    LineID: 'L002', LineName: '2路快速', MonitorPointID: 'MP004', MonitorPointName: '购物中心客流统计',
    DataType: '客流量', Value1: 67, Value2: null, Value3: null, 
    AnnotationInfo: '购物中心站客流', Operator: '管理员', OperationTime: '2024-01-15 08:05:00' }
]

// 响应式数据
const trafficData = ref([...mockTrafficData])
const loading = ref(false)
const filterDate = ref([])
const filterLine = ref('')
const filterStation = ref('')
const filterDataType = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = computed(() => trafficData.value.length)
const dialogVisible = ref(false)
const formRef = ref()
const isEdit = ref(false)

// 关联数据
const lines = ref([
  { LineID: 'L001', LineName: '1路公交' },
  { LineID: 'L002', LineName: '2路快速' },
  { LineID: 'L003', LineName: '3路夜间' },
  { LineID: 'L004', LineName: 'K1路' },
  { LineID: 'L005', LineName: '5路' }
])

const stations = ref([
  { StationID: 'ST001', StationName: '市中心站', LineID: 'L001' },
  { StationID: 'ST002', StationName: '大学城站', LineID: 'L001' },
  { StationID: 'ST003', StationName: '火车站', LineID: 'L001' },
  { StationID: 'ST004', StationName: '体育中心站', LineID: 'L002' },
  { StationID: 'ST005', StationName: '开发区站', LineID: 'L002' },
  { StationID: 'ST006', StationName: '医院站', LineID: 'L003' },
  { StationID: 'ST007', StationName: '购物中心站', LineID: 'L003' }
])

const monitorPoints = ref([
  { MonitorPointID: 'MP001', MonitorPointName: '市中心视频监控' },
  { MonitorPointID: 'MP002', MonitorPointName: '火车站客流统计' },
  { MonitorPointID: 'MP003', MonitorPointName: '大学城车辆识别' },
  { MonitorPointID: 'MP004', MonitorPointName: '购物中心客流统计' },
  { MonitorPointID: 'MP005', MonitorPointName: '开发区环境监测' },
  { MonitorPointID: 'MP006', MonitorPointName: '体育中心监控' },
  { MonitorPointID: 'MP007', MonitorPointName: '医院客流统计' },
  { MonitorPointID: 'MP008', MonitorPointName: '公园环境监测' }
])

// 表单数据
const form = ref({
  RecordID: '',
  RecordTime: '',
  StationID: '',
  LineID: '',
  MonitorPointID: '',
  DataType: '',
  Value1: null,
  Value2: null,
  Value3: null,
  AnnotationInfo: '',
  Operator: '管理员',
  OperationTime: ''
})

// 验证规则
const rules = {
  RecordTime: [{ required: true, message: '请选择记录时间', trigger: 'change' }],
  LineID: [{ required: true, message: '请选择线路', trigger: 'change' }],
  StationID: [{ required: true, message: '请选择站点', trigger: 'change' }],
  DataType: [{ required: true, message: '请选择数据类型', trigger: 'change' }]
}

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑交通数据' : '新增交通数据')
const filteredStations = computed(() => {
  if (!form.value.LineID) return stations.value
  return stations.value.filter(station => station.LineID === form.value.LineID)
})

// 方法
const getDataTypeTag = (type) => {
  const map = {
    '客流量': 'success',
    '车流量': '',
    '速度': 'warning',
    '延误': 'danger'
  }
  return map[type] || ''
}

const handleLineChange = () => {
  // 切换线路时清空站点选择
  form.value.StationID = ''
}

const handleFilter = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    ElMessage.success('查询完成')
  }, 500)
}

const handleReset = () => {
  filterDate.value = []
  filterLine.value = ''
  filterStation.value = ''
  filterDataType.value = ''
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    RecordID: `RD${String(trafficData.value.length + 1).padStart(3, '0')}`,
    RecordTime: new Date(),
    StationID: '',
    LineID: '',
    MonitorPointID: '',
    DataType: '',
    Value1: null,
    Value2: null,
    Value3: null,
    AnnotationInfo: '',
    Operator: '管理员',
    OperationTime: new Date()
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(() => {
    const index = trafficData.value.findIndex(data => data.RecordID === id)
    if (index > -1) {
      trafficData.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

const handleBatchImport = () => {
  ElMessage.info('批量导入功能开发中...')
}

const handleGenerateReport = () => {
  ElMessage.info('报表生成功能开发中...')
}

const handleDialogClosed = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 设置操作时间
    form.value.OperationTime = new Date().toLocaleString()
    
    // 获取关联数据名称
    const line = lines.value.find(l => l.LineID === form.value.LineID)
    const station = stations.value.find(s => s.StationID === form.value.StationID)
    const monitorPoint = monitorPoints.value.find(mp => mp.MonitorPointID === form.value.MonitorPointID)
    
    const recordData = {
      ...form.value,
      LineName: line ? line.LineName : '',
      StationName: station ? station.StationName : '',
      MonitorPointName: monitorPoint ? monitorPoint.MonitorPointName : ''
    }
    
    if (isEdit.value) {
      // 更新
      const index = trafficData.value.findIndex(data => data.RecordID === form.value.RecordID)
      if (index > -1) {
        trafficData.value[index] = recordData
      }
      ElMessage.success('更新成功')
    } else {
      // 新增
      trafficData.value.unshift(recordData)
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

.filter-container {
  padding: 10px 0;
}

.data-values {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.data-values span {
  font-size: 12px;
  color: #666;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>