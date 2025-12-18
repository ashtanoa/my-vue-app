<template>
  <div class="lines-page">
    <div class="page-header">
      <h2>线路管理</h2>
      <div>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增线路
        </el-button>
      </div>
    </div>

    <el-card>
      <template #header>
        <div class="table-header">
          <el-input
            v-model="searchQuery"
            placeholder="搜索线路名称或编号"
            style="width: 300px;"
            clearable
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <div>
            <el-select v-model="filterType" placeholder="线路类型" clearable>
              <el-option label="常规线路" value="常规" />
              <el-option label="快速公交" value="快速" />
              <el-option label="夜间线路" value="夜间" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="filteredLines" height="500" v-loading="loading">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="LineID" label="线路编号" width="120" />
        <el-table-column prop="LineName" label="线路名称" />
        <el-table-column prop="OperationMileage" label="运营里程(km)" width="120">
          <template #default="{ row }">
            {{ row.OperationMileage.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="FirstBusTime" label="首班车" width="120" />
        <el-table-column prop="LastBusTime" label="末班车" width="120" />
        <el-table-column prop="LineType" label="线路类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getLineTypeTag(row.LineType)">
              {{ row.LineType }}
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
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="线路编号" prop="LineID">
          <el-input v-model="form.LineID" placeholder="如：L001" />
        </el-form-item>
        <el-form-item label="线路名称" prop="LineName">
          <el-input v-model="form.LineName" placeholder="请输入线路名称" />
        </el-form-item>
        <el-form-item label="运营里程" prop="OperationMileage">
          <el-input-number 
            v-model="form.OperationMileage" 
            :min="0" 
            :step="0.1"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="首班车时间" prop="FirstBusTime">
          <el-time-picker
            v-model="form.FirstBusTime"
            placeholder="选择时间"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="末班车时间" prop="LastBusTime">
          <el-time-picker
            v-model="form.LastBusTime"
            placeholder="选择时间"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="线路类型" prop="LineType">
          <el-select v-model="form.LineType" placeholder="请选择">
            <el-option label="常规线路" value="常规" />
            <el-option label="快速公交" value="快速" />
            <el-option label="夜间线路" value="夜间" />
            <el-option label="高峰专线" value="高峰" />
          </el-select>
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
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Search,
  Edit,
  Delete
} from '@element-plus/icons-vue'

// 模拟数据
const mockLines = [
  { LineID: 'L001', LineName: '1路公交', OperationMileage: 12.5, FirstBusTime: '06:00', LastBusTime: '22:00', LineType: '常规' },
  { LineID: 'L002', LineName: '2路快速', OperationMileage: 15.3, FirstBusTime: '05:30', LastBusTime: '23:00', LineType: '快速' },
  { LineID: 'L003', LineName: '3路夜间', OperationMileage: 10.8, FirstBusTime: '22:00', LastBusTime: '05:00', LineType: '夜间' },
  { LineID: 'L004', LineName: 'K1路', OperationMileage: 18.2, FirstBusTime: '06:15', LastBusTime: '21:30', LineType: '快速' },
  { LineID: 'L005', LineName: '5路', OperationMileage: 9.6, FirstBusTime: '05:45', LastBusTime: '22:30', LineType: '常规' },
  { LineID: 'L006', LineName: '6路高峰', OperationMileage: 8.3, FirstBusTime: '07:00', LastBusTime: '19:00', LineType: '高峰' },
  { LineID: 'L007', LineName: '7路', OperationMileage: 14.7, FirstBusTime: '06:30', LastBusTime: '22:00', LineType: '常规' },
  { LineID: 'L008', LineName: '8路', OperationMileage: 11.2, FirstBusTime: '05:50', LastBusTime: '22:45', LineType: '常规' },
  { LineID: 'L009', LineName: '9路快速', OperationMileage: 16.8, FirstBusTime: '06:00', LastBusTime: '23:30', LineType: '快速' },
  { LineID: 'L010', LineName: '10路', OperationMileage: 13.4, FirstBusTime: '06:10', LastBusTime: '21:45', LineType: '常规' }
]

// 响应式数据
const lines = ref([...mockLines])
const loading = ref(false)
const searchQuery = ref('')
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = computed(() => filteredLines.value.length)
const dialogVisible = ref(false)
const formRef = ref()
const isEdit = ref(false)

// 表单数据
const form = ref({
  LineID: '',
  LineName: '',
  OperationMileage: 0,
  FirstBusTime: '',
  LastBusTime: '',
  LineType: ''
})

// 验证规则
const rules = {
  LineID: [{ required: true, message: '请输入线路编号', trigger: 'blur' }],
  LineName: [{ required: true, message: '请输入线路名称', trigger: 'blur' }],
  LineType: [{ required: true, message: '请选择线路类型', trigger: 'change' }]
}

// 计算属性
const filteredLines = computed(() => {
  let result = lines.value
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(line => 
      line.LineID.toLowerCase().includes(query) || 
      line.LineName.toLowerCase().includes(query)
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

// 方法
const getLineTypeTag = (type) => {
  const map = { '常规': '', '快速': 'success', '夜间': 'info', '高峰': 'warning' }
  return map[type] || ''
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    LineID: '',
    LineName: '',
    OperationMileage: 0,
    FirstBusTime: '',
    LastBusTime: '',
    LineType: ''
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除这条线路吗？', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(() => {
    const index = lines.value.findIndex(line => line.LineID === id)
    if (index > -1) {
      lines.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (isEdit.value) {
      // 更新
      const index = lines.value.findIndex(line => line.LineID === form.value.LineID)
      if (index > -1) {
        lines.value[index] = { ...form.value }
      }
      ElMessage.success('更新成功')
    } else {
      // 新增
      lines.value.unshift({ ...form.value })
      ElMessage.success('新增成功')
    }
    
    dialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

onMounted(() => {
  // 这里可以调用API获取数据
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
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>