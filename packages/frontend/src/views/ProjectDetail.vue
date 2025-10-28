<template>
  <div class="project-detail" v-if="projectStore.currentProject">
    <div class="page-header">
      <div class="header-left">
        <a-button type="text" @click="$router.back()" class="back-btn">
          <IconLeft />
          返回
        </a-button>
        <div class="project-info">
          <h1>{{ projectStore.currentProject.name }}</h1>
          <p>{{ projectStore.currentProject.description || '暂无描述' }}</p>
        </div>
      </div>
      
      <div class="header-right">
        <a-button
          type="primary"
          @click="showUploadModal = true"
          v-if="canManageProject"
        >
          <template #icon>
            <IconUpload />
          </template>
          上传版本
        </a-button>
      </div>
    </div>
    
    <!-- 当前活跃版本 -->
    <div class="active-version" v-if="activeVersion">
      <div class="version-header">
        <h2>当前活跃版本</h2>
        <a-tag color="green">{{ activeVersion.version }}</a-tag>
      </div>
      
      <div class="version-content">
        <div class="version-info">
          <div class="info-item">
            <span class="label">版本号：</span>
            <span>{{ activeVersion.version }}</span>
          </div>
          <div class="info-item">
            <span class="label">上传时间：</span>
            <span>{{ formatDate(activeVersion.created_at) }}</span>
          </div>
          <div class="info-item">
            <span class="label">文件大小：</span>
            <span>{{ formatFileSize(activeVersion.file_size) }}</span>
          </div>
        </div>
        
        <div class="version-actions">
          <a-button
            type="primary"
            @click="previewVersion(activeVersion)"
          >
            <template #icon>
              <IconEye />
            </template>
            预览
          </a-button>
        </div>
      </div>
    </div>
    
    <!-- 版本列表 -->
    <div class="versions-section">
      <h2>版本历史</h2>
      
      <div class="versions-list">
        <div
          v-for="version in projectStore.versions"
          :key="version.id"
          class="version-item"
          :class="{ active: version.is_active }"
        >
          <div class="version-info">
            <div class="version-name">
              {{ version.version }}
              <a-tag v-if="version.is_active" color="green" size="small">活跃</a-tag>
            </div>
            <div class="version-meta">
              <span>{{ formatDate(version.created_at) }}</span>
              <span>{{ formatFileSize(version.file_size) }}</span>
            </div>
          </div>
          
          <div class="version-actions">
            <a-button
              type="text"
              size="small"
              @click="previewVersion(version)"
            >
              <IconEye />
              预览
            </a-button>
            
            <a-button
              v-if="!version.is_active && canManageProject"
              type="text"
              size="small"
              @click="activateVersion(version)"
            >
              <IconCheck />
              激活
            </a-button>
            
            <a-button
              v-if="canManageProject"
              type="text"
              size="small"
              @click="deleteVersion(version)"
              class="danger"
            >
              <IconDelete />
              删除
            </a-button>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-if="projectStore.versions.length === 0" class="empty-versions">
          <IconFolder class="empty-icon" />
          <h3>暂无版本</h3>
          <p>还没有上传任何版本，上传第一个版本开始吧</p>
          <a-button
            type="primary"
            @click="showUploadModal = true"
            v-if="canManageProject"
          >
            上传版本
          </a-button>
        </div>
      </div>
    </div>
    
    <!-- 上传模态框 -->
    <a-modal
      v-model:visible="showUploadModal"
      title="上传新版本"
      @ok="handleUpload"
      @cancel="resetUploadForm"
      :confirm-loading="uploading"
      width="500px"
    >
      <a-form :model="uploadForm" layout="vertical">
        <a-form-item label="版本号" required>
          <a-input
            v-model="uploadForm.version"
            placeholder="请输入版本号，如：v1.0.0"
          />
        </a-form-item>
        
        <a-form-item label="ZIP文件" required>
          <a-upload
            :file-list="uploadForm.fileList"
            :before-upload="beforeUpload"
            @remove="removeFile"
            accept=".zip"
            :limit="1"
          >
            <template #upload-button>
              <div class="upload-area">
                <IconCloudUpload class="upload-icon" />
                <div class="upload-text">
                  <div>点击上传ZIP文件</div>
                  <div class="upload-hint">支持静态网站打包文件</div>
                </div>
              </div>
            </template>
          </a-upload>
        </a-form-item>
        
        <a-form-item>
          <a-checkbox v-model="uploadForm.setActive">
            设为活跃版本
          </a-checkbox>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconLeft,
  IconUpload,
  IconEye,
  IconCheck,
  IconDelete,
  IconFolder,
  IconCloudUpload
} from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/stores/user'
import { useProjectStore } from '@/stores/project'

const route = useRoute()
const userStore = useUserStore()
const projectStore = useProjectStore()

const showUploadModal = ref(false)
const uploading = ref(false)

const uploadForm = reactive({
  version: '',
  fileList: [],
  setActive: true
})

const projectId = computed(() => route.params.id)

const canManageProject = computed(() => {
  const project = projectStore.currentProject
  return userStore.isAdmin || (project && project.owner_id === userStore.user?.id)
})

const activeVersion = computed(() => {
  return projectStore.versions.find(v => v.is_active)
})

const beforeUpload = (file) => {
  if (!file.name.endsWith('.zip')) {
    Message.error('只支持ZIP格式文件')
    return false
  }
  
  if (file.size > 100 * 1024 * 1024) { // 100MB
    Message.error('文件大小不能超过100MB')
    return false
  }
  
  uploadForm.fileList = [file]
  return false // 阻止自动上传
}

const removeFile = () => {
  uploadForm.fileList = []
}

const handleUpload = async () => {
  if (!uploadForm.version.trim()) {
    Message.error('请输入版本号')
    return
  }
  
  if (uploadForm.fileList.length === 0) {
    Message.error('请选择要上传的ZIP文件')
    return
  }
  
  uploading.value = true
  
  const formData = new FormData()
  formData.append('file', uploadForm.fileList[0])
  formData.append('versionName', uploadForm.version)
  formData.append('setActive', uploadForm.setActive)
  
  const result = await projectStore.uploadFile(projectId.value, formData)
  
  if (result.success) {
    Message.success('版本上传成功')
    showUploadModal.value = false
    resetUploadForm()
    await Promise.all([
      projectStore.fetchProjectDetail(projectId.value),
      projectStore.fetchVersions(projectId.value)
    ])
  } else {
    Message.error(result.message)
  }
  
  uploading.value = false
}

const resetUploadForm = () => {
  uploadForm.version = ''
  uploadForm.fileList = []
  uploadForm.setActive = true
}

const previewVersion = (version) => {
  const url = `/static/projects/${projectId.value}/${version.version}/index.html`
  window.open(url, '_blank')
}

const activateVersion = async (version) => {
  const result = await projectStore.activateVersion(projectId.value, version.id)
  if (result.success) {
    Message.success('版本激活成功')
    await projectStore.fetchVersions(projectId.value)
  } else {
    Message.error(result.message)
  }
}

const deleteVersion = (version) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除版本"${version.version}"吗？此操作不可恢复。`,
    onOk: async () => {
      const result = await projectStore.deleteVersion(projectId.value, version.id)
      if (result.success) {
        Message.success('版本删除成功')
        await projectStore.fetchVersions(projectId.value)
      } else {
        Message.error(result.message)
      }
    }
  })
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

onMounted(async () => {
  await Promise.all([
    projectStore.fetchProjectDetail(projectId.value),
    projectStore.fetchVersions(projectId.value)
  ])
})
</script>

<style scoped>
.project-detail {
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e6eb;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.back-btn {
  margin-top: 4px;
}

.project-info h1 {
  margin: 0 0 8px 0;
  color: #1d2129;
  font-size: 28px;
}

.project-info p {
  margin: 0;
  color: #86909c;
  font-size: 16px;
}

.active-version {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.version-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.version-header h2 {
  margin: 0;
  color: #1d2129;
}

.version-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.version-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  gap: 8px;
}

.label {
  color: #86909c;
  min-width: 80px;
}

.versions-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.versions-section h2 {
  margin: 0 0 24px 0;
  color: #1d2129;
}

.versions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.version-item:hover {
  border-color: #165dff;
  background: #f7f8fa;
}

.version-item.active {
  border-color: #00b42a;
  background: #f6ffed;
}

.version-name {
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-meta {
  color: #86909c;
  font-size: 14px;
  display: flex;
  gap: 16px;
}

.version-actions {
  display: flex;
  gap: 8px;
}

.empty-versions {
  text-align: center;
  padding: 60px 20px;
  color: #86909c;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-versions h3 {
  margin: 0 0 8px 0;
  color: #4e5969;
}

.empty-versions p {
  margin: 0 0 24px 0;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  border: 2px dashed #e5e6eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-area:hover {
  border-color: #165dff;
  background: #f7f8fa;
}

.upload-icon {
  font-size: 48px;
  color: #86909c;
  margin-bottom: 16px;
}

.upload-text {
  text-align: center;
}

.upload-hint {
  color: #86909c;
  font-size: 12px;
  margin-top: 4px;
}

.danger {
  color: #f53f3f !important;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-left {
    flex-direction: column;
    gap: 8px;
  }
  
  .version-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .version-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .version-actions {
    align-self: stretch;
    justify-content: flex-end;
  }
}
</style>