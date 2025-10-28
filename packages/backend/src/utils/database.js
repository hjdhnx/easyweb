import sqlite3 from 'node-sqlite3-wasm'
import path from 'path'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 数据库文件路径
const dbPath = path.join(__dirname, '../../data/easyweb.db')

// 确保数据目录存在
const dataDir = path.dirname(dbPath)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// 创建数据库连接
let db = null

function getDatabase() {
  if (!db) {
    try {
      db = new sqlite3.Database(dbPath)
      console.log('数据库连接成功')
    } catch (error) {
      console.error('数据库连接失败:', error)
      throw error
    }
  }
  return db
}

// 数据库操作封装 - 使用同步API
const dbOps = {
  // 执行SQL语句
  run: (sql, params = []) => {
    try {
      const database = getDatabase()
      const result = database.run(sql, params)
      return { lastID: result.lastInsertRowid, changes: result.changes }
    } catch (error) {
      throw error
    }
  },

  // 查询单条记录
  get: (sql, params = []) => {
    try {
      const database = getDatabase()
      return database.get(sql, params)
    } catch (error) {
      throw error
    }
  },

  // 查询多条记录
  all: (sql, params = []) => {
    try {
      const database = getDatabase()
      return database.all(sql, params)
    } catch (error) {
      throw error
    }
  }
}

// 为了兼容性，也导出单独的函数
const dbRun = dbOps.run
const dbGet = dbOps.get
const dbAll = dbOps.all

// 基础模型类
class Model {
  constructor(tableName) {
    this.tableName = tableName
  }

  findAll(where = '', params = []) {
    const sql = `SELECT * FROM ${this.tableName} ${where ? 'WHERE ' + where : ''}`
    return dbAll(sql, params)
  }

  findById(id) {
    const sql = `SELECT * FROM ${this.tableName} WHERE id = ?`
    return dbGet(sql, [id])
  }

  findOne(where, params = []) {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${where} LIMIT 1`
    return dbGet(sql, params)
  }

  create(data) {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const placeholders = keys.map(() => '?').join(', ')
    const sql = `INSERT INTO ${this.tableName} (${keys.join(', ')}) VALUES (${placeholders})`
    const result = dbRun(sql, values)
    return result.lastID
  }

  update(id, data) {
    const keys = Object.keys(data)
    const values = Object.values(data)
    const setClause = keys.map(key => `${key} = ?`).join(', ')
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`
    return dbRun(sql, [...values, id])
  }

  delete(id) {
    const sql = `DELETE FROM ${this.tableName} WHERE id = ?`
    return dbRun(sql, [id])
  }
}

// 用户模型
const User = new Model('users')

// 项目模型
const Project = new Model('projects')

// 版本模型
const Version = new Model('versions')

// 项目权限模型
const ProjectPermission = new Model('project_permissions')

// 初始化数据库表和数据
function initDatabase() {
  try {
    getDatabase()
    
    // 创建用户表
    dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        avatar VARCHAR(255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // 创建项目表
    dbRun(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        user_id INTEGER NOT NULL,
        manager_id INTEGER,
        domain VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (manager_id) REFERENCES users (id)
      )
    `)

    // 创建版本表
    dbRun(`
      CREATE TABLE IF NOT EXISTS versions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        version VARCHAR(50) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_size INTEGER,
        upload_user_id INTEGER,
        status VARCHAR(20) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (upload_user_id) REFERENCES users (id)
      )
    `)

    // 创建项目权限表
    dbRun(`
      CREATE TABLE IF NOT EXISTS project_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        permission VARCHAR(20) DEFAULT 'read',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects (id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(project_id, user_id)
      )
    `)

    // 添加缺少的字段（如果不存在）
    try {
      dbRun(`ALTER TABLE projects ADD COLUMN manager_id INTEGER REFERENCES users(id)`)
    } catch (error) {
      // 字段已存在，忽略错误
    }

    try {
      dbRun(`ALTER TABLE versions ADD COLUMN upload_user_id INTEGER REFERENCES users(id)`)
    } catch (error) {
      // 字段已存在，忽略错误
    }

    // 检查是否已有管理员用户
    const adminUser = dbGet("SELECT * FROM users WHERE role = 'admin'")
    
    if (!adminUser) {
      // 创建默认管理员用户，使用bcrypt加密密码
      const hashedPassword = bcrypt.hashSync('admin123', 10)
      dbRun(`
        INSERT INTO users (username, email, password, role)
        VALUES (?, ?, ?, ?)
      `, ['admin', 'admin@easyweb.com', hashedPassword, 'admin'])
      
      console.log('默认管理员用户已创建: admin / admin123')
    }

    console.log('数据库初始化完成')
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  }
}

export {
  initDatabase,
  getDatabase,
  dbOps,
  dbRun,
  dbGet,
  dbAll,
  Model,
  User,
  Project,
  Version,
  ProjectPermission
}