import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'DashboardHome',
        component: () => import('@/views/DashboardHome.vue')
      },
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('@/views/Projects.vue')
      },
      {
        path: 'projects/:id',
        name: 'ProjectDetail',
        component: () => import('@/views/ProjectDetail.vue')
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('@/views/Admin.vue'),
        meta: { requiresAdmin: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  console.log(`🚦 路由守卫: ${from.path} -> ${to.path}`)
  console.log(`👤 当前用户状态: isLoggedIn=${userStore.isLoggedIn}, role=${userStore.user?.role}`)
  console.log(`🔒 目标路由权限: requiresAuth=${to.meta.requiresAuth}, requiresAdmin=${to.meta.requiresAdmin}, requiresGuest=${to.meta.requiresGuest}`)
  console.log(`📍 路由匹配记录:`, to.matched.map(record => ({ path: record.path, meta: record.meta })))
  
  // 检查是否有任何匹配的路由记录设置了 requiresGuest
  const hasRequiresGuest = to.matched.some(record => record.meta.requiresGuest)
  console.log(`🔍 嵌套路由检查: hasRequiresGuest=${hasRequiresGuest}`)
  
  // 只在用户状态未知且访问需要认证的页面时检查认证状态
  if (!userStore.isLoggedIn && to.meta.requiresAuth) {
    console.log('🔄 访问需要认证的页面，检查认证状态...')
    await userStore.checkAuth(true)
    console.log(`🔄 认证检查完成: isLoggedIn=${userStore.isLoggedIn}, role=${userStore.user?.role}`)
    
    // 如果认证成功，启动权限检查
    if (userStore.isLoggedIn) {
      userStore.startPermissionCheck()
    }
  }
  
  // 简化的路由逻辑
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    // 需要认证但用户未登录 -> 跳转到登录页
    console.log('❌ 需要认证但用户未登录，跳转到登录页面')
    next('/login')
    return
  }
  
  // 检查当前路由或其匹配的路由记录是否需要游客状态
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)
  if (requiresGuest && userStore.isLoggedIn) {
    // 需要游客状态但用户已登录 -> 跳转到仪表板
    console.log('❌ 需要游客状态但用户已登录，跳转到仪表板')
    next('/dashboard')
    return
  }
  
  // 检查当前路由或其匹配的路由记录是否需要管理员权限
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  if (requiresAdmin && userStore.user?.role !== 'admin') {
    // 需要管理员权限但用户不是管理员 -> 跳转到仪表板
    console.log(`❌ 需要管理员权限但用户不是管理员 (当前角色: ${userStore.user?.role})，跳转到仪表板`)
    next('/dashboard')
    return
  }
  
  console.log('✅ 路由守卫通过，允许访问')
  next()
})

export default router