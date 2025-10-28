<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h1>注册账号</h1>
        <p>创建您的EasyWeb账号</p>
      </div>
      
      <a-form
        :model="form"
        :rules="rules"
        @submit="handleSubmit"
        layout="vertical"
        class="register-form"
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
        
        <a-form-item field="email" label="邮箱">
          <a-input
            v-model="form.email"
            placeholder="请输入邮箱地址"
            size="large"
          >
            <template #prefix>
              <IconEmail />
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
        
        <a-form-item field="confirmPassword" label="确认密码">
          <a-input-password
            v-model="form.confirmPassword"
            placeholder="请再次输入密码"
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
            注册
          </a-button>
        </a-form-item>
        
        <div class="register-footer">
          <span>已有账号？</span>
          <a-link @click="$router.push('/login')">立即登录</a-link>
        </div>
      </a-form>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { IconUser, IconLock, IconEmail } from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名' },
    { minLength: 3, message: '用户名至少3个字符' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址' },
    { type: 'email', message: '请输入有效的邮箱地址' }
  ],
  password: [
    { required: true, message: '请输入密码' },
    { minLength: 6, message: '密码至少6个字符' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码' },
    {
      validator: (value, callback) => {
        if (value !== form.password) {
          callback('两次输入的密码不一致')
        } else {
          callback()
        }
      }
    }
  ]
}

const handleSubmit = async ({ errors }) => {
  if (errors) return
  
  const result = await userStore.register({
    username: form.username,
    email: form.email,
    password: form.password
  })
  
  if (result.success) {
    Message.success('注册成功，请登录')
    router.push('/login')
  } else {
    Message.error(result.message)
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-header h1 {
  font-size: 28px;
  font-weight: bold;
  color: #1d2129;
  margin-bottom: 8px;
}

.register-header p {
  color: #86909c;
  font-size: 14px;
}

.register-form {
  margin-bottom: 0;
}

.register-footer {
  text-align: center;
  margin-top: 24px;
  color: #86909c;
  font-size: 14px;
}

.register-footer span {
  margin-right: 8px;
}

@media (max-width: 480px) {
  .register-card {
    padding: 24px;
  }
  
  .register-header h1 {
    font-size: 24px;
  }
}
</style>