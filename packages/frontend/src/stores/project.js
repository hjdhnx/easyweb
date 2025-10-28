import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/utils/api'

export const useProjectStore = defineStore('project', () => {
  const projects = ref([])
  const currentProject = ref(null)
  const versions = ref([])
  const loading = ref(false)

  // 获取项目列表
  const fetchProjects = async () => {
    loading.value = true
    try {
      const response = await api.get('/projects')
      if (response.data.success) {
        projects.value = response.data.data
      }
      return response.data
    } catch (error) {
      console.error('获取项目列表失败:', error)
      return { success: false, message: '获取项目列表失败' }
    } finally {
      loading.value = false
    }
  }

  // 获取项目详情
  const fetchProject = async (id) => {
    loading.value = true
    try {
      const response = await api.get(`/projects/${id}`)
      if (response.data.success) {
        currentProject.value = response.data.data
      }
      return response.data
    } catch (error) {
      console.error('获取项目详情失败:', error)
      return { success: false, message: '获取项目详情失败' }
    } finally {
      loading.value = false
    }
  }

  // 创建项目
  const createProject = async (projectData) => {
    loading.value = true
    try {
      const response = await api.post('/projects', projectData)
      if (response.data.success) {
        await fetchProjects() // 刷新项目列表
      }
      return response.data
    } catch (error) {
      console.error('创建项目失败:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || '创建项目失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 更新项目
  const updateProject = async (id, projectData) => {
    loading.value = true
    try {
      const response = await api.put(`/projects/${id}`, projectData)
      if (response.data.success) {
        await fetchProjects() // 刷新项目列表
        if (currentProject.value?.id === parseInt(id)) {
          await fetchProject(id) // 刷新当前项目
        }
      }
      return response.data
    } catch (error) {
      console.error('更新项目失败:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || '更新项目失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 删除项目
  const deleteProject = async (id) => {
    loading.value = true
    try {
      const response = await api.delete(`/projects/${id}`)
      if (response.data.success) {
        await fetchProjects() // 刷新项目列表
      }
      return response.data
    } catch (error) {
      console.error('删除项目失败:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || '删除项目失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 获取项目版本列表
  const fetchVersions = async (projectId) => {
    loading.value = true
    try {
      const response = await api.get(`/versions/project/${projectId}`)
      if (response.data.success) {
        versions.value = response.data.data
      }
      return response.data
    } catch (error) {
      console.error('获取版本列表失败:', error)
      return { success: false, message: '获取版本列表失败' }
    } finally {
      loading.value = false
    }
  }

  // 激活版本
  const activateVersion = async (versionId) => {
    loading.value = true
    try {
      const response = await api.put(`/versions/${versionId}/activate`)
      if (response.data.success && currentProject.value) {
        await fetchVersions(currentProject.value.id) // 刷新版本列表
        await fetchProject(currentProject.value.id) // 刷新项目信息
      }
      return response.data
    } catch (error) {
      console.error('激活版本失败:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || '激活版本失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 删除版本
  const deleteVersion = async (versionId) => {
    loading.value = true
    try {
      const response = await api.delete(`/versions/${versionId}`)
      if (response.data.success && currentProject.value) {
        await fetchVersions(currentProject.value.id) // 刷新版本列表
        await fetchProject(currentProject.value.id) // 刷新项目信息
      }
      return response.data
    } catch (error) {
      console.error('删除版本失败:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || '删除版本失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 上传文件
  const uploadFile = async (projectId, formData) => {
    loading.value = true
    try {
      // 添加projectId到formData
      formData.append('projectId', projectId)
      
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return response.data
    } catch (error) {
      console.error('上传文件失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    projects,
    currentProject,
    versions,
    loading,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    fetchVersions,
    activateVersion,
    deleteVersion,
    uploadFile
  }
})