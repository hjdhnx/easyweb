<template>
  <div class="not-found">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1>页面未找到</h1>
      <p>抱歉，您访问的页面不存在或已被移除。</p>
      
      <div class="actions">
        <a-button type="primary" @click="goHome">
          返回首页
        </a-button>
        <a-button @click="goBack">
          返回上页
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
}

.error-code {
  font-size: 120px;
  font-weight: bold;
  color: #165dff;
  line-height: 1;
  margin-bottom: 24px;
}

.not-found-content h1 {
  font-size: 32px;
  color: #1d2129;
  margin-bottom: 16px;
}

.not-found-content p {
  font-size: 16px;
  color: #86909c;
  margin-bottom: 32px;
  line-height: 1.6;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

@media (max-width: 480px) {
  .error-code {
    font-size: 80px;
  }
  
  .not-found-content h1 {
    font-size: 24px;
  }
  
  .actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>