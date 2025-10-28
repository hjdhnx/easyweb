import { dbAll, dbGet, Version, Project } from './src/utils/database.js'

console.log('测试数据库操作...')

// 测试查询项目
const projects = dbAll('SELECT * FROM projects')
console.log('所有项目:', projects)

if (projects.length > 0) {
  const projectId = projects[0].id
  console.log('使用项目ID:', projectId)
  
  // 测试创建版本
  const versionId = Version.create({
    project_id: projectId,
    version: 'test-v1.0.0',
    file_path: 'test/path',
    file_size: 1024
  })
  
  console.log('创建的版本ID:', versionId)
  
  // 查询创建的版本
  const version = Version.findById(versionId)
  console.log('查询到的版本:', version)
}

console.log('检查数据库表:')
const tables = dbAll("SELECT name FROM sqlite_master WHERE type='table'")
console.log('Tables:', tables)

console.log('\n检查用户表:')
const users = dbAll("SELECT * FROM users")
console.log('Users:', users)

console.log('\n检查管理员用户:')
const admin = dbGet("SELECT * FROM users WHERE role='admin'")
console.log('Admin user:', admin)