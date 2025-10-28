import axios from 'axios'
import { Message } from '@arco-design/web-vue'
import router from '@/router'
import { useUserStore } from '@/stores/user'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  withCredentials: true
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // 未授权，清除用户状态并跳转到登录页
          console.log('🔒 API返回401，需要重新登录')
          // 清除localStorage中的用户状态
          localStorage.removeItem('user')
          console.log('🗑️ 已清除本地用户状态')
          // 清除Pinia store中的用户状态
          try {
            const userStore = useUserStore()
            userStore.user = null
            console.log('🗑️ 已清除Pinia store用户状态')
          } catch (error) {
            console.log('⚠️ 清除Pinia store状态时出错:', error)
          }
          if (router.currentRoute.value.path !== '/login') {
            console.log('🔄 使用router跳转到登录页')
            router.push('/login')
          }
          break
        case 403:
          Message.error(data.message || '权限不足')
          break
        case 404:
          Message.error(data.message || '请求的资源不存在')
          break
        case 500:
          Message.error(data.message || '服务器内部错误')
          break
        default:
          Message.error(data.message || '请求失败')
      }
    } else if (error.request) {
      Message.error('网络连接失败，请检查网络设置')
    } else {
      Message.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

export default api