<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>EasyWeb</h1>
        <p>静态网站项目管理系统</p>
      </div>
      
      <a-form
        :model="form"
        :rules="rules"
        @submit="handleSubmit"
        layout="vertical"
        class="login-form"
      >
        <a-form-item field="username" label="用户名">
          <a-input
            v-model="form.username"
            placeholder="请输入用户名"
            size="large"
          >
            <template #prefix>
              <IconUser />
            </template>
          </a-input>
        </a-form-item>
        
        <a-form-item field="password" label="密码">
          <a-input-password
            v-model="form.password"
            placeholder="请输入密码"
            size="large"
          >
            <template #prefix>
              <IconLock />
            </template>
          </a-input-password>
        </a-form-item>
        
        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            size="large"
            long
            :loading="userStore.loading"
          >
            登录
          </a-button>
        </a-form-item>
        
        <div class="login-footer">
          <span>还没有账号？</span>
          <a-link @click="$router.push('/register')">立即注册</a-link>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconUser, IconLock } from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名' }
  ],
  password: [
    { required: true, message: '请输入密码' }
  ]
}

const handleSubmit = async ({ errors }) => {
  if (errors) return
  
  console.log('📝 开始提交登录表单...')
  const result = await userStore.login(form)
  if (result.success) {
    console.log('✅ 登录成功，用户状态:', userStore.user)
    console.log('✅ 登录状态检查:', userStore.isLoggedIn)
    Message.success('登录成功')
    
    // 等待一个tick确保状态更新完成
    await nextTick()
    console.log('🔄 状态更新完成，准备跳转到dashboard')
    
    // 先跳转到dashboard主页，让路由守卫正确处理
    router.push('/dashboard')
  } else {
    console.log('❌ 登录失败:', result.message)
    Message.error(result.message)
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 32px;
  font-weight: bold;
  color: #1d2129;
  margin-bottom: 8px;
}

.login-header p {
  color: #86909c;
  font-size: 14px;
}

.login-form {
  margin-bottom: 0;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  color: #86909c;
  font-size: 14px;
}

.login-footer span {
  margin-right: 8px;
}

@media (max-width: 480px) {
  .login-card {
    padding: 24px;
  }
  
  .login-header h1 {
    font-size: 28px;
  }
}
</style>