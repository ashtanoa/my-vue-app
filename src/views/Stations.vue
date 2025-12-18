<template>
  <div class="stations-page">
    <div class="page-header">
      <h2>站点管理</h2>
      <div>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增站点
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <el-card>
      <el-table :data="stations" height="500" v-loading="loading">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="StationID" label="站点编号" width="120" />
        <el-table-column prop="StationName" label="站点名称" />
        <el-table-column prop="LineID" label="所属线路" width="120">
          <template #default="{ row }">
            <el-tag>{{ row.LineID }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="Location" label="位置" />
        <el-table-column prop="PlatformCapacity" label="站台容量" width="100">
          <template #default="{ row }">
            <el-tag :type="getCapacityType(row.PlatformCapacity)">
              {{ row.PlatformCapacity }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row.StationID)">
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
        <el-form-item label="站点编号" prop="StationID">
          <el-input v-model="form.StationID" placeholder="如：ST001" />
        </el-form-item>
        <el-form-item label="站点名称" prop="StationName">
          <el-input v-model="form.StationName" placeholder="请输入站点名称" />
        </el-form-item>
        <el-form-item label="所属线路" prop="LineID">
          <el-select v-model="form.LineID" placeholder="请选择线路">
            <el-option v-for="line in lines" :key="line.LineID" 
              :label="`${line.LineID} - ${line.LineName}`" 
              :value="line.LineID" />
          </el-select>
        </el-form-item>
        <el-form-item label="位置" prop="Location">
          <el-input v-model="form.Location" placeholder="请输入站点位置" />
        </el-form-item>
        <el-form-item label="站台容量" prop="PlatformCapacity">
          <el-input-number 
            v-model="form.PlatformCapacity" 
            :min="1" 
            :max="1000"
            style="width: 100%;"
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
  Download,
  Edit,
  Delete
} from '@element-plus/icons-vue'

// 模拟数据
const mockStations = [
  { StationID: 'ST001', StationName: '市中心站', LineID: 'L001', Location: '市中心广场东侧', PlatformCapacity: 150 },
  { StationID: 'ST002', StationName: '大学城站', LineID: 'L001', Location: '大学城南门', PlatformCapacity: 200 },
  { StationID: 'ST003', StationName: '火车站', LineID: 'L001', Location: '火车站广场', PlatformCapacity: 300 },
  { StationID: 'ST004', StationName: '体育中心站', LineID: 'L002', Location: '体育中心北门', PlatformCapacity: 180 },
  { StationID: 'ST005', StationName: '开发区站', LineID: 'L002', Location: '开发区管委会', PlatformCapacity: 120 },
  { StationID: 'ST006', StationName: '医院站', LineID: 'L003', Location: '第一医院门诊部', PlatformCapacity: 100 },
  { StationID: 'ST007', StationName: '购物中心站', LineID: 'L003', Location: '购物中心西门', PlatformCapacity: 250 },
  { StationID: 'ST008', StationName: '公园站', LineID: 'L004', Location: '人民公园东门', PlatformCapacity: 90 },
  { StationID: 'ST009', StationName: '图书馆站', LineID: 'L004', Location: '市图书馆正门', PlatformCapacity: 110 },
  { StationID: 'ST010', StationName: '会展中心站', LineID: 'L005', Location: '国际会展中心', PlatformCapacity: 280 }
]

const mockLines = [
  { LineID: 'L001', LineName: '1路公交' },
  { LineID: 'L002', LineName: '2路快速' },
  { LineID: 'L003', LineName: '3路夜间' },
  { LineID: 'L004', LineName: 'K1路' },
  { LineID: 'L005', LineName: '5路' }
]

// 响应式数据
const stations = ref([...mockStations])
const lines = ref([...mockLines])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = computed(() => stations.value.length)
const dialogVisible = ref(false)
const formRef = ref()
const isEdit = ref(false)

// 表单数据
const form = ref({
  StationID: '',
  StationName: '',
  LineID: '',
  Location: '',
  PlatformCapacity: 50
})

// 验证规则
const rules = {
  StationID: [{ required: true, message: '请输入站点编号', trigger: 'blur' }],
  StationName: [{ required: true, message: '请输入站点名称', trigger: 'blur' }],
  LineID: [{ required: true, message: '请选择所属线路', trigger: 'change' }],
  Location: [{ required: true, message: '请输入站点位置', trigger: 'blur' }]
}

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑站点' : '新增站点')

// 方法
const getCapacityType = (capacity) => {
  if (capacity >= 200) return 'success'
  if (capacity >= 100) return ''
  return 'warning'
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
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除这个站点吗？', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(() => {
    const index = stations.value.findIndex(station => station.StationID === id)
    if (index > -1) {
      stations.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  })
}

const handleExport = () => {
  ElMessage.success('导出功能开发中...')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (isEdit.value) {
      // 更新
      const index = stations.value.findIndex(station => station.StationID === form.value.StationID)
      if (index > -1) {
        stations.value[index] = { ...form.value }
      }
      ElMessage.success('更新成功')
    } else {
      // 新增
      stations.value.unshift({ ...form.value })
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

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>