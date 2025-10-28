# EasyWeb - 静态网站项目管理系统

## 项目概述

EasyWeb 是一个前后端分离的静态网站项目管理系统，主要用于管理和托管通过 Axure 等工具生成的静态网站原型文件。系统支持多项目管理、版本控制、用户权限管理等功能。

## 技术栈

### 前端
- **框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **UI组件库**: Arco Design
- **日志**: Pino
- **包管理**: pnpm
- **样式**: CSS3 + 响应式设计（支持移动端）

### 后端
- **框架**: Fastify
- **数据库**: SQLite3
- **ORM**: 简单ORM引擎（支持数据库切换）
- **代码风格**: ESM
- **包管理**: pnpm

## 功能模块

### 1. 用户系统
- **登录/注册**: 基础用户认证
- **用户角色**:
  - 普通用户：查看有权限的项目
  - 项目负责人：管理项目版本和文件
  - 管理员：创建项目、分配项目负责人

### 2. 项目管理
- **项目创建**: 管理员创建新项目
- **项目列表**: 根据用户权限显示项目
- **项目详情**: 查看项目信息和版本列表
- **权限管理**: 项目访问权限控制

### 3. 版本管理
- **版本创建**: 上传ZIP文件创建新版本
- **版本切换**: 在不同版本间切换
- **版本列表**: 显示项目所有版本
- **版本删除**: 删除不需要的版本

### 4. 文件管理
- **ZIP上传**: 支持静态网站ZIP文件上传
- **自动解压**: 自动解压并部署静态文件
- **文件预览**: 生成项目首页链接
- **文件存储**: 安全的文件存储机制

### 5. 静态网站托管
- **自动部署**: ZIP文件上传后自动部署
- **访问链接**: 为每个项目版本生成访问链接
- **静态资源**: 高效的静态资源服务

## 数据库设计

### 用户表 (users)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100),
  role ENUM('admin', 'manager', 'user') DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 项目表 (projects)
```sql
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  manager_id INTEGER,
  current_version_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id)
);
```

### 版本表 (versions)
```sql
CREATE TABLE versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  version_name VARCHAR(50) NOT NULL,
  file_path VARCHAR(255) NOT NULL,
  upload_user_id INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (upload_user_id) REFERENCES users(id)
);
```

### 项目权限表 (project_permissions)
```sql
CREATE TABLE project_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  permission ENUM('read', 'write') DEFAULT 'read',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(project_id, user_id)
);
```

## API 接口设计

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/profile` - 获取用户信息

### 项目接口
- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目（管理员）
- `GET /api/projects/:id` - 获取项目详情
- `PUT /api/projects/:id` - 更新项目信息
- `DELETE /api/projects/:id` - 删除项目

### 版本接口
- `GET /api/projects/:id/versions` - 获取项目版本列表
- `POST /api/projects/:id/versions` - 上传新版本
- `PUT /api/projects/:id/versions/:versionId/activate` - 激活版本
- `DELETE /api/projects/:id/versions/:versionId` - 删除版本

### 用户管理接口
- `GET /api/users` - 获取用户列表（管理员）
- `PUT /api/users/:id/role` - 更新用户角色（管理员）
- `POST /api/projects/:id/permissions` - 分配项目权限

### 文件接口
- `POST /api/upload` - 文件上传
- `GET /static/:project/:version/*` - 静态文件访问

## 项目结构

```
easyweb/
├── packages/
│   ├── frontend/          # 前端项目
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── views/
│   │   │   ├── router/
│   │   │   ├── stores/
│   │   │   ├── utils/
│   │   │   └── main.js
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.js
│   └── backend/           # 后端项目
│       ├── src/
│       │   ├── routes/
│       │   ├── models/
│       │   ├── middleware/
│       │   ├── utils/
│       │   └── app.js
│       ├── uploads/       # 文件上传目录
│       ├── static/        # 静态文件托管目录
│       ├── database/      # 数据库文件
│       └── package.json
├── pnpm-workspace.yaml    # pnpm工作空间配置
├── package.json           # 根package.json
└── README.md
```

## 开发计划

### 阶段一：基础架构搭建
1. 初始化项目结构和配置
2. 搭建后端基础框架
3. 搭建前端基础框架
4. 配置数据库和ORM

### 阶段二：核心功能开发
1. 用户认证系统
2. 项目管理功能
3. 版本管理功能
4. 文件上传和处理

### 阶段三：界面和体验优化
1. 前端界面开发
2. 移动端适配
3. 用户体验优化
4. 性能优化

### 阶段四：测试和部署
1. 功能测试
2. 安全测试
3. 部署配置
4. 文档完善

## 安装和运行

### 环境要求
- Node.js >= 16
- pnpm >= 7

### 安装依赖
```bash
# 安装根依赖
pnpm install

# 安装所有包的依赖
pnpm install -r
```

### 开发模式
```bash
# 启动后端开发服务器
pnpm --filter backend dev

# 启动前端开发服务器
pnpm --filter frontend dev
```

### 生产构建
```bash
# 构建前端
pnpm --filter frontend build

# 启动生产服务器
pnpm --filter backend start
```

## 特性

- ✅ 前后端分离架构
- ✅ 响应式设计，支持移动端
- ✅ 多项目管理
- ✅ 版本控制系统
- ✅ 用户权限管理
- ✅ 文件上传和自动部署
- ✅ 静态网站托管
- ✅ 现代化UI设计

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 许可证

MIT License
