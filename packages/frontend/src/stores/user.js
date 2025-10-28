import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  // 从 localStorage 恢复用户状态
  const savedUser = localStorage.getItem('user')
  const user = ref(savedUser ? JSON.parse(savedUser) : null)
  const loading = ref(false)
  
  console.log('💾 从localStorage恢复用户状态:', user.value)

  // 保存用户状态到 localStorage
  const saveUserToStorage = (userData) => {
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('user')
    }
  }

  const isLoggedIn = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isManager = computed(() => user.value?.role === 'manager' || user.value?.role === 'admin')

  // 登录
  const login = async (credentials) => {
    loading.value = true
    try {
      console.log('🔐 开始登录请求...')
      const response = await api.post('/auth/login', credentials)
      if (response.data.success) {
        user.value = response.data.data
        saveUserToStorage(user.value)
        console.log('✅ 登录成功，用户状态已设置并保存:', user.value)
        return { success: true }
      }
      console.log('❌ 登录失败:', response.data.message)
      return { success: false, message: response.data.message }
    } catch (error) {
      console.log('❌ 登录请求异常:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || '登录失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (userData) => {
    loading.value = true
    try {
      const response = await api.post('/auth/register', userData)
      return { 
        success: response.data.success, 
        message: response.data.message 
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '注册失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = async () => {
    try {
      console.log('🚪 开始登出请求...')
      await api.post('/auth/logout')
      console.log('✅ 登出请求成功')
      return { success: true }
    } catch (error) {
      console.error('❌ 登出请求失败:', error)
      return { success: true } // 即使请求失败，也清空本地状态
    } finally {
      user.value = null
      saveUserToStorage(null)
      console.log('🗑️ 已清空用户状态和本地存储')
    }
  }

  // 检查认证状态
  const checkAuth = async (isInitialCheck = false) => {
    console.log(`🔍 开始认证检查 (初始检查: ${isInitialCheck})，当前用户状态:`, user.value)
    try {
      const response = await api.get('/auth/profile')
      if (response.data.success) {
        user.value = response.data.data
        saveUserToStorage(user.value)
        console.log('✅ 认证检查成功，用户状态已更新并保存:', user.value)
      } else {
        console.log('❌ 认证检查失败:', response.data.message)
        // 认证失败时清空用户状态
        user.value = null
        saveUserToStorage(null)
        console.log('🗑️ 认证失败，已清空用户状态')
      }
    } catch (error) {
      console.log('❌ 认证检查异常:', error.response?.status, error.message)
      // 401 未授权错误，清空用户状态
      if (error.response && error.response.status === 401) {
        user.value = null
        saveUserToStorage(null)
        console.log('🗑️ 401错误，已清空用户状态')
      } else if (isInitialCheck) {
        // 初始检查时的网络错误，保留用户状态以避免不必要的登录跳转
        console.log('⚠️ 初始检查时网络错误，保留用户状态')
      } else {
        // 非初始检查时的网络错误，也清空用户状态以确保安全
        user.value = null
        saveUserToStorage(null)
        console.log('🗑️ 网络错误，已清空用户状态')
      }
    }
    console.log('🔍 认证检查完成，最终用户状态:', user.value)
  }

  // 更新用户信息
  const updateUser = (userData) => {
    if (user.value) {
      user.value = { ...user.value, ...userData }
      saveUserToStorage(user.value)
    }
  }

  return {
    user,
    loading,
    isLoggedIn,
    isAdmin,
    isManager,
    login,
    register,
    logout,
    checkAuth,
    updateUser
  }
})