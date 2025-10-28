<template>
  <div class="dashboard">
    <a-layout class="layout">
      <!-- 侧边栏 -->
      <a-layout-sider
        :width="240"
        :collapsed="collapsed"
        :collapsible="true"
        @collapse="onCollapse"
        class="sidebar"
      >
        <div class="logo">
          <h2 v-if="!collapsed">EasyWeb</h2>
          <h2 v-else>EW</h2>
        </div>
        
        <a-menu
          :selected-keys="selectedKeys"
          :open-keys="openKeys"
          mode="inline"
          theme="dark"
          @menuItemClick="onMenuClick"
        >
          <a-menu-item key="dashboard">
            <template #icon>
              <IconDashboard />
            </template>
            仪表盘
          </a-menu-item>
          
          <a-menu-item key="projects">
            <template #icon>
              <IconFolder />
            </template>
            项目管理
          </a-menu-item>
          
          <a-menu-item key="admin" v-if="userStore.isAdmin">
            <template #icon>
              <IconSettings />
            </template>
            系统管理
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
      
      <!-- 主内容区 -->
      <a-layout>
        <!-- 顶部导航 -->
        <a-layout-header class="header">
          <div class="header-left">
            <a-button
              type="text"
              @click="collapsed = !collapsed"
              class="collapse-btn"
            >
              <IconMenuUnfold v-if="collapsed" />
              <IconMenuFold v-else />
            </a-button>
          </div>
          
          <div class="header-right">
            <a-dropdown>
              <a-button type="text" class="user-btn">
                <IconUser />
                {{ userStore.user?.username }}
                <IconDown />
              </a-button>
              <template #content>
                <a-doption @click="handleRefreshPermissions">
                  <IconRefresh />
                  刷新权限
                </a-doption>
                <a-doption @click="handleLogout">
                  <IconPoweroff />
                  退出登录
                </a-doption>
              </template>
            </a-dropdown>
          </div>
        </a-layout-header>
        
        <!-- 内容区域 -->
        <a-layout-content class="content">
          <router-view />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import {
  IconDashboard,
  IconFolder,
  IconSettings,
  IconUser,
  IconDown,
  IconPoweroff,
  IconMenuFold,
  IconMenuUnfold,
  IconRefresh
} from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const collapsed = ref(false)
const openKeys = ref([])

const selectedKeys = computed(() => {
  const path = route.path
  if (path === '/dashboard') return ['dashboard']
  if (path.includes('/dashboard/projects')) return ['projects']
  if (path.includes('/dashboard/admin')) return ['admin']
  return ['dashboard']
})

const onCollapse = (val) => {
  collapsed.value = val
}

const onMenuClick = (key) => {
  console.log('🔄 菜单点击事件触发!')
  console.log('🔄 菜单点击key:', key)
  console.log('🔄 菜单点击类型:', typeof key)
  console.log('🔄 当前路径:', route.path)
  console.log('🔄 当前用户:', userStore.user)
  console.log('🔄 用户角色:', userStore.user?.role)
  console.log('🔄 是否管理员:', userStore.isAdmin)
  
  console.log('🔄 开始路由跳转...')
  switch (key) {
    case 'dashboard':
      console.log('🔄 跳转到仪表盘')
      router.push('/dashboard')
      break
    case 'projects':
      console.log('🔄 跳转到项目管理')
      router.push('/dashboard/projects')
      break
    case 'admin':
      console.log('🔄 跳转到系统管理')
      router.push('/dashboard/admin')
      break
    default:
      console.log('🔄 未知的菜单key:', key)
  }
  console.log('🔄 菜单点击处理完成')
}

const handleRefreshPermissions = async () => {
  const success = await userStore.refreshPermissions()
  if (success) {
    Message.success('权限已刷新')
  } else {
    Message.error('权限刷新失败')
  }
}

const handleLogout = async () => {
  const result = await userStore.logout()
  if (result.success) {
    Message.success('退出登录成功')
    router.push('/login')
  }
}

onMounted(() => {
  // Dashboard 组件已加载，不需要自动重定向
  console.log('📊 Dashboard 组件已加载')
})
</script>

<style scoped>
.dashboard {
  height: 100vh;
}

.layout {
  height: 100%;
}

.sidebar {
  background: #001529;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  margin-bottom: 1px;
}

.logo h2 {
  color: white;
  margin: 0;
  font-weight: bold;
}

.header {
  background: white;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
}

.collapse-btn {
  font-size: 18px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
}

.content {
  padding: 24px;
  background: #f5f5f5;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    z-index: 1000;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar:not(.arco-layout-sider-collapsed) {
    transform: translateX(0);
  }
  
  .layout {
    position: relative;
  }
  
  .layout::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }
  
  .layout:has(.sidebar:not(.arco-layout-sider-collapsed))::before {
    opacity: 1;
    visibility: visible;
  }
  
  .header {
    padding: 0 16px;
  }
  
  .content {
    padding: 16px;
    margin-left: 0;
  }
}
</style>