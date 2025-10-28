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
            <div class="header-actions">
              <a-button type="primary" @click="showCreateUserModal">
                <template #icon>
                  <IconPlus />
                </template>
                新建用户
              </a-button>
              <a-button type="primary" @click="refreshUsers">
                <template #icon>
                  <IconRefresh />
                </template>
                刷新
              </a-button>
            </div>
          </div>
          
          <a-table
            :columns="userColumns"
            :data="users"
            :loading="usersLoading"
            :pagination="false"
            row-key="id"
          >
            <template #actions="{ record }">
              <a-space>
                <a-button size="small" @click="showChangePasswordModal(record)">
                  修改密码
                </a-button>
                <a-button 
                  size="small" 
                  status="danger" 
                  @click="deleteUser(record)"
                  :disabled="record.id === currentUser.id"
                >
                  删除
                </a-button>
              </a-space>
            </template>
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
            :data="safeProjects"
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
                :loading="usersLoading"
                placeholder="选择负责人"
                allow-clear
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
                @click="showProjectPermissions(record)"
                style="margin-right: 8px;"
              >
                权限
              </a-button>
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
    
    <!-- 项目权限管理模态框 -->
    <a-modal
      v-model:visible="permissionModalVisible"
      title="项目权限管理"
      width="800px"
      @ok="handlePermissionModalOk"
      @cancel="handlePermissionModalCancel"
    >
      <div v-if="currentProject">
        <h3>{{ currentProject.name }}</h3>
        <p>{{ currentProject.description }}</p>
        
        <div style="margin: 20px 0;">
          <h4>添加用户权限</h4>
          <a-form layout="inline" :model="newPermission">
            <a-form-item label="用户">
              <a-select
                v-model="newPermission.userId"
                placeholder="选择用户"
                style="width: 200px;"
              >
                <a-option
                  v-for="user in availableUsers"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.username }} ({{ getRoleText(user.role) }})
                </a-option>
              </a-select>
            </a-form-item>
            <a-form-item label="权限">
              <a-select
                v-model="newPermission.permission"
                placeholder="选择权限"
                style="width: 150px;"
              >
                <a-option value="read">查看</a-option>
                <a-option value="write">编辑</a-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="addPermission">
                添加
              </a-button>
            </a-form-item>
          </a-form>
        </div>
        
        <div>
          <h4>当前权限列表</h4>
          <a-table
            :data="projectPermissions"
            :columns="permissionColumns"
            :loading="permissionsLoading"
            :pagination="false"
          >
            <template #username="{ record }">
              {{ getUserName(record.user_id) }}
            </template>
            <template #permission="{ record }">
              <a-tag :color="record.permission === 'write' ? 'blue' : 'green'">
                {{ record.permission === 'write' ? '编辑' : '查看' }}
              </a-tag>
            </template>
            <template #actions="{ record }">
              <a-button
                type="text"
                size="small"
                @click="removePermission(record)"
                class="danger"
              >
                移除
              </a-button>
            </template>
          </a-table>
        </div>
      </div>
    </a-modal>

    <!-- 新建用户模态框 -->
    <a-modal 
      v-model:visible="createUserModalVisible" 
      title="新建用户" 
      @ok="createUser"
      :confirm-loading="createUserLoading"
    >
      <a-form :model="createUserForm" layout="vertical">
        <a-form-item label="用户名" required>
          <a-input v-model="createUserForm.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="邮箱" required>
          <a-input v-model="createUserForm.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="密码" required>
          <a-input-password v-model="createUserForm.password" placeholder="请输入密码（至少6位）" />
        </a-form-item>
        <a-form-item label="角色" required>
          <a-select v-model="createUserForm.role" placeholder="请选择角色">
            <a-option value="user">普通用户</a-option>
            <a-option value="admin">管理员</a-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 修改密码模态框 -->
    <a-modal 
      v-model:visible="changePasswordModalVisible" 
      title="修改密码" 
      @ok="changePassword"
      :confirm-loading="changePasswordLoading"
    >
      <a-form :model="changePasswordForm" layout="vertical">
        <a-form-item label="用户">
          <a-input :value="selectedUser?.username" disabled />
        </a-form-item>
        <a-form-item label="新密码" required>
          <a-input-password v-model="changePasswordForm.password" placeholder="请输入新密码（至少6位）" />
        </a-form-item>
        <a-form-item label="确认密码" required>
          <a-input-password v-model="changePasswordForm.confirmPassword" placeholder="请再次输入新密码" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import {
  IconRefresh,
  IconDelete,
  IconPlus
} from '@arco-design/web-vue/es/icon'
import { useUserStore } from '@/stores/user'
import api from '@/utils/api'

const router = useRouter()
const userStore = useUserStore()

// 当前用户信息
const currentUser = computed(() => userStore.user)

const users = ref([])
const usersLoading = ref(false)
const allProjects = ref([])
const projectsLoading = ref(false)

// 新建用户相关
const createUserModalVisible = ref(false)
const createUserLoading = ref(false)
const createUserForm = ref({
  username: '',
  email: '',
  password: '',
  role: 'user'
})

// 修改密码相关
const changePasswordModalVisible = ref(false)
const changePasswordLoading = ref(false)
const selectedUser = ref(null)
const changePasswordForm = ref({
  password: '',
  confirmPassword: ''
})

// 权限管理相关
const permissionModalVisible = ref(false)
const currentProject = ref(null)
const projectPermissions = ref([])
const permissionsLoading = ref(false)
const newPermission = reactive({
  userId: null,
  permission: 'read'
})

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
  },
  {
    title: '操作',
    slotName: 'actions',
    width: 200
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

const permissionColumns = [
  {
    title: '用户',
    dataIndex: 'user_id',
    slotName: 'username'
  },
  {
    title: '权限',
    dataIndex: 'permission',
    slotName: 'permission'
  },
  {
    title: '操作',
    slotName: 'actions',
    width: 100
  }
]

const managers = computed(() => {
  return (users.value || []).filter(user => user.role === 'manager' || user.role === 'admin')
})

// 安全的项目数据，确保owner_id在managers列表中存在
const safeProjects = computed(() => {
  const managerIds = (managers.value || []).map(m => m.id)
  return (allProjects.value || []).map(project => ({
    ...project,
    // 如果owner_id不在managers列表中，设为null以避免渲染错误
    owner_id: managerIds.includes(project.owner_id) ? project.owner_id : null
  }))
})

// 可分配权限的用户（排除已有权限的用户）
const availableUsers = computed(() => {
  if (!currentProject.value) return []
  
  const existingUserIds = projectPermissions.value.map(p => p.user_id)
  return users.value.filter(user => 
    !existingUserIds.includes(user.id) && 
    user.id !== currentProject.value.user_id && // 排除项目创建者
    user.id !== currentProject.value.manager_id // 排除项目管理员
  )
})

const fetchUsers = async () => {
  usersLoading.value = true
  try {
    const response = await api.get('/users')
    users.value = response.data.data || []  // 修复数据访问路径，添加默认值
    systemStats.userCount = users.value.length
  } catch (error) {
    Message.error('获取用户列表失败')
    users.value = []  // 确保错误时也有默认值
  } finally {
    usersLoading.value = false
  }
}

const fetchProjects = async () => {
  projectsLoading.value = true
  try {
    const response = await api.get('/projects/all')
    allProjects.value = response.data.projects || []  // 添加默认值
    systemStats.projectCount = allProjects.value.length
    systemStats.versionCount = allProjects.value.reduce((sum, p) => sum + (p.version_count || 0), 0)
  } catch (error) {
    Message.error('获取项目列表失败')
    allProjects.value = []  // 确保错误时也有默认值
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
    
    // 如果更新的是当前用户，需要更新用户状态
    if (user.id === userStore.user?.id) {
      await userStore.checkAuth()
      // 刷新项目列表，因为权限可能发生变化
      await fetchProjects()
    }
  } catch (error) {
    Message.error('用户角色更新失败')
    await fetchUsers() // 重新获取数据
  }
}

// 显示新建用户模态框
const showCreateUserModal = () => {
  createUserForm.value = {
    username: '',
    email: '',
    password: '',
    role: 'user'
  }
  createUserModalVisible.value = true
}

// 新建用户
const createUser = async () => {
  const form = createUserForm.value
  
  if (!form.username || !form.email || !form.password || !form.role) {
    Message.error('请填写完整信息')
    return
  }
  
  if (form.password.length < 6) {
    Message.error('密码长度不能少于6位')
    return
  }
  
  createUserLoading.value = true
  try {
    const response = await api.post('/users', form)
    if (response.data.success) {
      Message.success('用户创建成功')
      createUserModalVisible.value = false
      await refreshUsers()
    } else {
      Message.error(response.data.message || '创建失败')
    }
  } catch (error) {
    console.error('创建用户失败:', error)
    Message.error('创建失败')
  } finally {
    createUserLoading.value = false
  }
}

// 删除用户
const deleteUser = (user) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
    onOk: async () => {
      try {
        const response = await api.delete(`/users/${user.id}`)
        if (response.data.success) {
          Message.success('用户删除成功')
          await refreshUsers()
        } else {
          Message.error(response.data.message || '删除失败')
        }
      } catch (error) {
        console.error('删除用户失败:', error)
        Message.error('删除失败')
      }
    }
  })
}

// 显示修改密码模态框
const showChangePasswordModal = (user) => {
  selectedUser.value = user
  changePasswordForm.value = {
    password: '',
    confirmPassword: ''
  }
  changePasswordModalVisible.value = true
}

// 修改密码
const changePassword = async () => {
  const form = changePasswordForm.value
  
  if (!form.password || !form.confirmPassword) {
    Message.error('请填写完整信息')
    return
  }
  
  if (form.password.length < 6) {
    Message.error('密码长度不能少于6位')
    return
  }
  
  if (form.password !== form.confirmPassword) {
    Message.error('两次输入的密码不一致')
    return
  }
  
  changePasswordLoading.value = true
  try {
    const response = await api.put(`/users/${selectedUser.value.id}/password`, {
      password: form.password
    })
    if (response.data.success) {
      Message.success('密码修改成功')
      changePasswordModalVisible.value = false
    } else {
      Message.error(response.data.message || '修改失败')
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    Message.error('修改失败')
  } finally {
    changePasswordLoading.value = false
  }
}

const updateProjectOwner = async (project) => {
  try {
    await api.put(`/projects/${project.id}`, {
      manager_id: project.owner_id
    })
    Message.success('项目负责人更新成功')
    // 立即更新界面显示
    await fetchProjects()
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

// 权限管理方法
const showProjectPermissions = async (project) => {
  currentProject.value = project
  permissionModalVisible.value = true
  await fetchProjectPermissions(project.id)
}

const fetchProjectPermissions = async (projectId) => {
  permissionsLoading.value = true
  try {
    const response = await api.get(`/projects/${projectId}/permissions`)
    projectPermissions.value = response.data.data || []
  } catch (error) {
    Message.error('获取项目权限失败')
    projectPermissions.value = []
  } finally {
    permissionsLoading.value = false
  }
}

const addPermission = async () => {
  if (!newPermission.userId || !newPermission.permission) {
    Message.warning('请选择用户和权限')
    return
  }
  
  try {
    await api.post(`/projects/${currentProject.value.id}/permissions`, {
      user_id: newPermission.userId,
      permission: newPermission.permission
    })
    Message.success('权限添加成功')
    
    // 重置表单
    newPermission.userId = null
    newPermission.permission = 'read'
    
    // 刷新权限列表
    await fetchProjectPermissions(currentProject.value.id)
  } catch (error) {
    Message.error('权限添加失败')
  }
}

const removePermission = async (permission) => {
  try {
    await api.delete(`/projects/${currentProject.value.id}/permissions/${permission.user_id}`)
    Message.success('权限移除成功')
    await fetchProjectPermissions(currentProject.value.id)
  } catch (error) {
    Message.error('权限移除失败')
  }
}

const getUserName = (userId) => {
  const user = users.value.find(u => u.id === userId)
  return user ? user.username : '未知用户'
}

const handlePermissionModalOk = () => {
  permissionModalVisible.value = false
}

const handlePermissionModalCancel = () => {
  permissionModalVisible.value = false
  currentProject.value = null
  projectPermissions.value = []
  newPermission.userId = null
  newPermission.permission = 'read'
}

onMounted(async () => {
  // 先加载用户数据，再加载项目数据，避免竞态条件
  await fetchUsers()
  await fetchProjects()
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

.header-actions {
  display: flex;
  gap: 8px;
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