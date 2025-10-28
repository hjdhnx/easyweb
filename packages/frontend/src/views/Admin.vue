<template>
  <div class="admin">
    <div class="page-header">
      <h1>系统管理</h1>
    </div>
    
    <a-tabs default-active-key="users" type="card">
      <!-- 用户管理 -->
      <a-tab-pane key="users" title="用户管理">
        <div class="users-section">
          <div class="section-header">
            <h2>用户列表</h2>
            <a-button type="primary" @click="refreshUsers">
              <template #icon>
                <IconRefresh />
              </template>
              刷新
            </a-button>
          </div>
          
          <a-table
            :columns="userColumns"
            :data="users"
            :loading="usersLoading"
            :pagination="false"
            row-key="id"
          >
            <template #role="{ record }">
              <a-select
                v-model="record.role"
                @change="updateUserRole(record)"
                :disabled="record.id === userStore.user?.id"
                style="width: 120px"
              >
                <a-option value="user">普通用户</a-option>
                <a-option value="manager">项目管理员</a-option>
                <a-option value="admin">系统管理员</a-option>
              </a-select>
            </template>
            
            <template #status="{ record }">
              <a-tag :color="record.role === 'admin' ? 'red' : record.role === 'manager' ? 'orange' : 'blue'">
                {{ getRoleText(record.role) }}
              </a-tag>
            </template>
            
            <template #created_at="{ record }">
              {{ formatDate(record.created_at) }}
            </template>
          </a-table>
        </div>
      </a-tab-pane>
      
      <!-- 项目管理 -->
      <a-tab-pane key="projects" title="项目管理">
        <div class="projects-section">
          <div class="section-header">
            <h2>所有项目</h2>
            <a-button type="primary" @click="refreshProjects">
              <template #icon>
                <IconRefresh />
              </template>
              刷新
            </a-button>
          </div>
          
          <a-table
            :columns="projectColumns"
            :data="allProjects"
            :loading="projectsLoading"
            :pagination="false"
            row-key="id"
          >
            <template #name="{ record }">
              <a-link @click="goToProject(record.id)">
                {{ record.name }}
              </a-link>
            </template>
            
            <template #owner="{ record }">
              <a-select
                v-model="record.owner_id"
                @change="updateProjectOwner(record)"
                style="width: 150px"
              >
                <a-option
                  v-for="user in managers"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.username }}
                </a-option>
              </a-select>
            </template>
            
            <template #versions="{ record }">
              <a-tag>{{ record.version_count || 0 }} 个版本</a-tag>
            </template>
            
            <template #created_at="{ record }">
              {{ formatDate(record.created_at) }}
            </template>
            
            <template #actions="{ record }">
              <a-button
                type="text"
                size="small"
                @click="deleteProject(record)"
                class="danger"
              >
                <IconDelete />
                删除
              </a-button>
            </template>
          </a-table>
        </div>
      </a-tab-pane>
      
      <!-- 系统信息 -->
      <a-tab-pane key="system" title="系统信息">
        <div class="system-section">
          <a-descriptions title="系统统计" :column="2" bordered>
            <a-descriptions-item label="用户总数">
              {{ systemStats.userCount }}
            </a-descriptions-item>
            <a-descriptions-item label="项目总数">
              {{ systemStats.projectCount }}
            </a-descriptions-item>
            <a-descriptions-item label="版本总数">
              {{ systemStats.versionCount }}
            </a-descriptions-item>
            <a-descriptions-item label="存储使用">
              {{ formatFileSize(systemStats.storageUsed) }}
            </a-descriptions-item>
          </a-descriptions>
        </div>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconRefresh,
  IconDelete
} from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const router = useRouter()
const userStore = useUserStore()

const users = ref([])
const usersLoading = ref(false)
const allProjects = ref([])
const projectsLoading = ref(false)

const systemStats = reactive({
  userCount: 0,
  projectCount: 0,
  versionCount: 0,
  storageUsed: 0
})

const userColumns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80
  },
  {
    title: '用户名',
    dataIndex: 'username'
  },
  {
    title: '邮箱',
    dataIndex: 'email'
  },
  {
    title: '角色',
    dataIndex: 'role',
    slotName: 'role'
  },
  {
    title: '状态',
    dataIndex: 'status',
    slotName: 'status'
  },
  {
    title: '注册时间',
    dataIndex: 'created_at',
    slotName: 'created_at'
  }
]

const projectColumns = [
  {
    title: 'ID',
    dataIndex: 'id',
    width: 80
  },
  {
    title: '项目名称',
    dataIndex: 'name',
    slotName: 'name'
  },
  {
    title: '描述',
    dataIndex: 'description'
  },
  {
    title: '负责人',
    dataIndex: 'owner_id',
    slotName: 'owner'
  },
  {
    title: '版本数',
    dataIndex: 'versions',
    slotName: 'versions'
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    slotName: 'created_at'
  },
  {
    title: '操作',
    slotName: 'actions',
    width: 100
  }
]

const managers = computed(() => {
  return users.value.filter(user => user.role === 'manager' || user.role === 'admin')
})

const fetchUsers = async () => {
  usersLoading.value = true
  try {
    const response = await api.get('/users')
    users.value = response.data.users
    systemStats.userCount = users.value.length
  } catch (error) {
    Message.error('获取用户列表失败')
  } finally {
    usersLoading.value = false
  }
}

const fetchProjects = async () => {
  projectsLoading.value = true
  try {
    const response = await api.get('/projects/all')
    allProjects.value = response.data.projects
    systemStats.projectCount = allProjects.value.length
    systemStats.versionCount = allProjects.value.reduce((sum, p) => sum + (p.version_count || 0), 0)
  } catch (error) {
    Message.error('获取项目列表失败')
  } finally {
    projectsLoading.value = false
  }
}

const updateUserRole = async (user) => {
  try {
    await api.put(`/users/${user.id}/role`, {
      role: user.role
    })
    Message.success('用户角色更新成功')
  } catch (error) {
    Message.error('用户角色更新失败')
    await fetchUsers() // 重新获取数据
  }
}

const updateProjectOwner = async (project) => {
  try {
    await api.put(`/projects/${project.id}`, {
      owner_id: project.owner_id
    })
    Message.success('项目负责人更新成功')
  } catch (error) {
    Message.error('项目负责人更新失败')
    await fetchProjects() // 重新获取数据
  }
}

const deleteProject = (project) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除项目"${project.name}"吗？此操作不可恢复。`,
    onOk: async () => {
      try {
        await api.delete(`/projects/${project.id}`)
        Message.success('项目删除成功')
        await fetchProjects()
      } catch (error) {
        Message.error('项目删除失败')
      }
    }
  })
}

const goToProject = (projectId) => {
  router.push(`/dashboard/projects/${projectId}`)
}

const refreshUsers = () => {
  fetchUsers()
}

const refreshProjects = () => {
  fetchProjects()
}

const getRoleText = (role) => {
  const roleMap = {
    user: '普通用户',
    manager: '项目管理员',
    admin: '系统管理员'
  }
  return roleMap[role] || role
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

onMounted(() => {
  fetchUsers()
  fetchProjects()
})
</script>

<style scoped>
.admin {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;
  color: #1d2129;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  margin: 0;
  color: #1d2129;
}

.users-section,
.projects-section,
.system-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.danger {
  color: #f53f3f !important;
}

:deep(.arco-table-th) {
  background: #f7f8fa;
}

:deep(.arco-tabs-content) {
  padding-top: 0;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .users-section,
  .projects-section {
    padding: 16px;
  }
  
  :deep(.arco-table) {
    font-size: 12px;
  }
  
  :deep(.arco-table-container) {
    overflow-x: auto;
  }
  
  :deep(.arco-descriptions) {
    font-size: 14px;
  }
  
  :deep(.arco-descriptions-item-label) {
    min-width: 80px;
  }
}
</style>