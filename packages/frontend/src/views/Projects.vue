<template>
  <div class="projects">
    <div class="page-header">
      <h1>项目管理</h1>
      <a-button
        type="primary"
        @click="showCreateModal = true"
        v-if="userStore.isAdmin || userStore.isManager"
      >
        <template #icon>
          <IconPlus />
        </template>
        创建项目
      </a-button>
    </div>
    
    <div class="projects-grid">
      <div
        v-for="project in projectStore.projects"
        :key="project.id"
        class="project-card"
        @click="goToProject(project.id)"
      >
        <div class="project-header">
          <h3>{{ project.name }}</h3>
          <a-dropdown v-if="canManageProject(project)" @click.stop>
            <a-button type="text" size="small" @click.stop>
              <IconMore />
            </a-button>
            <template #content>
              <a-doption @click.stop="editProject(project)">
                <IconEdit />
                编辑
              </a-doption>
              <a-doption @click.stop="deleteProject(project)" class="danger">
                <IconDelete />
                删除
              </a-doption>
            </template>
          </a-dropdown>
        </div>
        
        <p class="project-description">{{ project.description || '暂无描述' }}</p>
        
        <div class="project-meta">
          <div class="meta-item">
            <IconCalendar />
            <span>{{ formatDate(project.created_at) }}</span>
          </div>
          <div class="meta-item">
            <IconUser />
            <span>{{ project.owner_name }}</span>
          </div>
        </div>
        
        <div class="project-status">
          <a-tag v-if="project.active_version" color="green">
            活跃版本: {{ project.active_version }}
          </a-tag>
          <a-tag v-else color="gray">
            暂无版本
          </a-tag>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="projectStore.projects.length === 0 && !projectStore.loading" class="empty-state">
        <IconFolder class="empty-icon" />
        <h3>暂无项目</h3>
        <p>您还没有任何项目，创建一个开始吧</p>
        <a-button
          type="primary"
          @click="showCreateModal = true"
          v-if="userStore.isAdmin || userStore.isManager"
        >
          创建项目
        </a-button>
      </div>
    </div>
    
    <!-- 创建/编辑项目模态框 -->
    <a-modal
      v-model:visible="showCreateModal"
      :title="editingProject ? '编辑项目' : '创建项目'"
      @ok="handleCreateProject"
      @cancel="resetForm"
      :confirm-loading="projectStore.loading"
    >
      <a-form :model="projectForm" layout="vertical">
        <a-form-item label="项目名称" required>
          <a-input
            v-model="projectForm.name"
            placeholder="请输入项目名称"
          />
        </a-form-item>
        
        <a-form-item label="项目描述">
          <a-textarea
            v-model="projectForm.description"
            placeholder="请输入项目描述"
            :rows="3"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconPlus,
  IconMore,
  IconEdit,
  IconDelete,
  IconCalendar,
  IconUser,
  IconFolder
} from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/stores/user'
import { useProjectStore } from '@/stores/project'

const router = useRouter()
const userStore = useUserStore()
const projectStore = useProjectStore()

const showCreateModal = ref(false)
const editingProject = ref(null)

const projectForm = reactive({
  name: '',
  description: ''
})

const canManageProject = (project) => {
  return userStore.isAdmin || project.owner_id === userStore.user?.id
}

const goToProject = (projectId) => {
  router.push(`/dashboard/projects/${projectId}`)
}

const editProject = (project) => {
  editingProject.value = project
  projectForm.name = project.name
  projectForm.description = project.description
  showCreateModal.value = true
}

const deleteProject = (project) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除项目"${project.name}"吗？此操作不可恢复。`,
    onOk: async () => {
      const result = await projectStore.deleteProject(project.id)
      if (result.success) {
        Message.success('项目删除成功')
        await projectStore.fetchProjects()
      } else {
        Message.error(result.message)
      }
    }
  })
}

const handleCreateProject = async () => {
  if (!projectForm.name.trim()) {
    Message.error('请输入项目名称')
    return
  }
  
  let result
  if (editingProject.value) {
    result = await projectStore.updateProject(editingProject.value.id, projectForm)
  } else {
    result = await projectStore.createProject(projectForm)
  }
  
  if (result.success) {
    Message.success(editingProject.value ? '项目更新成功' : '项目创建成功')
    showCreateModal.value = false
    resetForm()
    await projectStore.fetchProjects()
  } else {
    Message.error(result.message)
  }
}

const resetForm = () => {
  editingProject.value = null
  projectForm.name = ''
  projectForm.description = ''
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

onMounted(() => {
  projectStore.fetchProjects()
})
</script>

<style scoped>
.projects {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  color: #1d2129;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.project-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.project-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.project-header h3 {
  margin: 0;
  color: #1d2129;
  font-size: 18px;
  font-weight: 600;
}

.project-description {
  color: #86909c;
  margin-bottom: 16px;
  line-height: 1.5;
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #86909c;
  font-size: 14px;
}

.project-status {
  display: flex;
  justify-content: flex-end;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  color: #86909c;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  color: #4e5969;
}

.empty-state p {
  margin: 0 0 24px 0;
}

.danger {
  color: #f53f3f !important;
}

@media (max-width: 768px) {
  .projects-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .project-card {
    padding: 16px;
  }
}
</style>