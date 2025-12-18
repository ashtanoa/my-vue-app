<template>
  <div id="app">
    <el-container style="height: 100vh;">
      <!-- 侧边栏导航 -->
      <el-aside width="200px" style="background-color: #304156;">
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          router
        >
          <div class="logo">交通管理系统</div>
          <el-menu-item index="/">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/lines">
            <el-icon><MapLocation /></el-icon>
            <span>线路管理</span>
          </el-menu-item>
          <el-menu-item index="/stations">
            <el-icon><Location /></el-icon>
            <span>站点管理</span>
          </el-menu-item>
          <el-menu-item index="/monitor-points">
            <el-icon><Monitor /></el-icon>
            <span>监测点管理</span>
          </el-menu-item>
          <el-menu-item index="/traffic-data">
            <el-icon><DataAnalysis /></el-icon>
            <span>交通数据</span>
          </el-menu-item>
          <el-menu-item index="/users">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container>
        <el-header style="border-bottom: 1px solid #e6e6e6; display: flex; align-items: center;">
          <div style="flex: 1;">
            <h3 style="margin: 0; color: #333;">交通数据管理系统</h3>
          </div>
          <div>
            <el-dropdown>
              <span class="el-dropdown-link">
                <el-icon><User /></el-icon>
                <span>管理员</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item>个人中心</el-dropdown-item>
                  <el-dropdown-item>修改密码</el-dropdown-item>
                  <el-dropdown-item divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <el-main style="background-color: #f0f2f5;">
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  House,
  MapLocation,
  Location,
  Monitor,
  DataAnalysis,
  User,
  ArrowDown
} from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = ref('/')

watch(() => route.path, (newPath) => {
  activeMenu.value = newPath
})
</script>

<style scoped>
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #263445;
}

.el-menu-vertical {
  border-right: none;
  height: 100%;
}

.el-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #333;
}

.el-dropdown-link .el-icon {
  margin-right: 5px;
}
</style>