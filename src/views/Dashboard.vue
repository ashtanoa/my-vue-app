<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-icon" style="background: #1890ff;">
              <el-icon><MapLocation /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">25</div>
              <div class="stat-label">公交线路</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-icon" style="background: #52c41a;">
              <el-icon><Location /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">186</div>
              <div class="stat-label">站点数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-icon" style="background: #faad14;">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">42</div>
              <div class="stat-label">监测点</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat-card">
            <div class="stat-icon" style="background: #f5222d;">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">1,248,756</div>
              <div class="stat-label">数据记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card>
          <template #header>
            <span>最新交通数据</span>
          </template>
          <el-table :data="recentData" height="300">
            <el-table-column prop="time" label="时间" width="180" />
            <el-table-column prop="line" label="线路" width="100" />
            <el-table-column prop="station" label="站点" />
            <el-table-column prop="passengers" label="客流量" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === '正常' ? 'success' : 'warning'">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>系统公告</span>
          </template>
          <div class="notice-list">
            <div v-for="(notice, index) in notices" :key="index" class="notice-item">
              <div class="notice-title">{{ notice.title }}</div>
              <div class="notice-time">{{ notice.time }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MapLocation, Location, Monitor, DataAnalysis } from '@element-plus/icons-vue'

const recentData = ref([
  { time: '2024-01-15 08:30:00', line: 'K1路', station: '市中心站', passengers: 156, status: '正常' },
  { time: '2024-01-15 08:25:00', line: '2路', station: '大学城站', passengers: 89, status: '正常' },
  { time: '2024-01-15 08:20:00', line: '3路', station: '火车站', passengers: 234, status: '拥挤' },
  { time: '2024-01-15 08:15:00', line: 'K1路', station: '开发区站', passengers: 67, status: '正常' },
  { time: '2024-01-15 08:10:00', line: '5路', station: '体育中心站', passengers: 123, status: '正常' }
])

const notices = ref([
  { title: '系统维护通知', time: '2024-01-14' },
  { title: '新增监测点上线', time: '2024-01-13' },
  { title: '春节运营时间调整', time: '2024-01-10' },
  { title: '数据备份完成', time: '2024-01-08' }
])
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
}

.stat-icon .el-icon {
  font-size: 24px;
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.notice-list .notice-item {
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.notice-list .notice-item:last-child {
  border-bottom: none;
}

.notice-list .notice-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.notice-list .notice-time {
  font-size: 12px;
  color: #999;
}
</style>