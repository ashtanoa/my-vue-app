import { createRouter, createWebHashHistory } from 'vue-router'

const Dashboard = () => import('../views/Dashboard.vue')
const Lines = () => import('../views/Lines.vue')
const Stations = () => import('../views/Stations.vue')
const MonitorPoints = () => import('../views/MonitorPoints.vue')
const TrafficData = () => import('../views/TrafficData.vue')
const Users = () => import('../views/Users.vue')

const routes = [
  { path: '/', component: Dashboard },
  { path: '/lines', component: Lines },
  { path: '/stations', component: Stations },
  { path: '/monitor-points', component: MonitorPoints },
  { path: '/traffic-data', component: TrafficData },
  { path: '/users', component: Users }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router