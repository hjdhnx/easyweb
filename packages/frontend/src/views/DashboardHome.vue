<template>
  <div class="dashboard-home">
    <div class="welcome-section">
      <h1>欢迎使用 EasyWeb 管理系统</h1>
      <p>这里是您的工作台，您可以快速访问各种功能</p>
      
      <!-- 调试信息 -->
      <div style="background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 4px; font-size: 12px;">
        <strong>调试信息：</strong><br>
        用户名: {{ userStore.user?.username }}<br>
        用户角色: {{ userStore.user?.role }}<br>
        是否管理员: {{ userStore.isAdmin }}<br>
        登录状态: {{ userStore.isLoggedIn }}
      </div>
    </div>

    <div class="stats-grid">
      <a-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon">
            <IconFolder />
          </div>
          <div class="stat-info">
            <h3>项目总数</h3>
            <p class="stat-number">{{ projectCount }}</p>
          </div>
        </div>
      </a-card>

      <a-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon">
            <IconUser />
          </div>
          <div class="stat-info">
            <h3>用户角色</h3>
            <p class="stat-text">{{ userStore.isAdmin ? '管理员' : '普通用户' }}</p>
          </div>
        </div>
      </a-card>

      <a-card class="stat-card">
        <div class="stat-content">
          <div class="stat-icon">
            <IconCalendar />
          </div>
          <div class="stat-info">
            <h3>今日日期</h3>
            <p class="stat-text">{{ currentDate }}</p>
          </div>
        </div>
      </a-card>
    </div>

    <div class="quick-actions">
      <h2>快速操作</h2>
      <div class="action-buttons">
        <a-button type="primary" @click="$router.push('/dashboard/projects')">
          <IconFolder />
          管理项目
        </a-button>
        <a-button v-if="userStore.isAdmin" @click="$router.push('/dashboard/admin')">
          <IconSettings />
          系统管理
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { 
  IconFolder, 
  IconUser, 
  IconCalendar, 
  IconSettings 
} from '@arco-design/web-vue/es/icon'

const userStore = useUserStore()
const projectCount = ref(0)

const currentDate = computed(() => {
  return new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

onMounted(async () => {
  // 这里可以加载项目数量等统计信息
  // 暂时设置为模拟数据
  projectCount.value = 5
})
</script>

<style scoped>
.dashboard-home {
  padding: 24px;
}

.welcome-section {
  margin-bottom: 32px;
}

.welcome-section h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1d2129;
}

.welcome-section p {
  font-size: 16px;
  color: #86909c;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: linear-gradient(135deg, #165dff, #246fff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.stat-info h3 {
  font-size: 14px;
  color: #86909c;
  margin-bottom: 4px;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
  margin: 0;
}

.stat-text {
  font-size: 16px;
  font-weight: 500;
  color: #1d2129;
  margin: 0;
}

.quick-actions h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1d2129;
}

.action-buttons {
  display: flex;
  gap: 16px;
}

.action-buttons .arco-btn {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>