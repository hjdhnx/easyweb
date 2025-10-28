import { Project, User, ProjectPermission, dbAll, dbRun } from '../utils/database.js';

// 认证中间件
const authenticate = async (request, reply) => {
  try {
    // 添加调试日志
    console.log('🔍 认证中间件调试信息:');
    console.log('📋 请求头:', JSON.stringify(request.headers, null, 2));
    console.log('🍪 Cookie:', request.headers.cookie);
    console.log('🔑 Authorization:', request.headers.authorization);
    
    await request.jwtVerify();
    console.log('✅ JWT验证成功, 用户:', request.user);
  } catch (err) {
    console.log('❌ JWT验证失败:', err.message);
    reply.status(401).send({
      success: false,
      message: '未授权访问'
    });
  }
};

// 管理员权限检查
const requireAdmin = async (request, reply) => {
  if (request.user.role !== 'admin') {
    reply.status(403).send({
      success: false,
      message: '需要管理员权限'
    });
  }
};

export default async function projectRoutes(fastify, options) {
  // 获取所有项目（管理员专用）
  fastify.get('/all', {
    preHandler: [authenticate, requireAdmin]
  }, async (request, reply) => {
    try {
      const projects = dbAll(`
        SELECT p.id, p.name, p.description, p.created_at, p.updated_at,
               COALESCE(p.manager_id, p.user_id) as owner_id, 
               COALESCE(m.username, u.username) as owner_name,
               (SELECT COUNT(*) FROM versions v WHERE v.project_id = p.id) as version_count
        FROM projects p 
        LEFT JOIN users u ON p.user_id = u.id 
        LEFT JOIN users m ON p.manager_id = m.id
        ORDER BY p.created_at DESC
      `);

      return {
        success: true,
        projects: projects
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: '服务器内部错误'
      });
    }
  });

  // 获取项目列表
  fastify.get('/', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      const userRole = request.user.role;

      let projects;
      if (userRole === 'admin') {
        // 管理员可以看到所有项目
        projects = dbAll(`
          SELECT p.*, u.username as owner_name,
                 v.version as active_version
          FROM projects p 
          LEFT JOIN users u ON p.user_id = u.id 
          LEFT JOIN versions v ON p.id = v.project_id AND v.is_active = 1
          ORDER BY p.created_at DESC
        `);
      } else if (userRole === 'manager') {
        // 项目管理员可以看到自己创建的项目和被分配管理的项目
        projects = dbAll(`
          SELECT p.*, u.username as owner_name,
                 v.version as active_version
          FROM projects p 
          LEFT JOIN users u ON p.user_id = u.id 
          LEFT JOIN versions v ON p.id = v.project_id AND v.is_active = 1
          WHERE p.user_id = ? OR p.manager_id = ?
          ORDER BY p.created_at DESC
        `, [userId, userId]);
      } else {
        // 普通用户只能看到自己的项目
        projects = dbAll(`
          SELECT p.*, u.username as owner_name,
                 v.version as active_version
          FROM projects p 
          LEFT JOIN users u ON p.user_id = u.id 
          LEFT JOIN versions v ON p.id = v.project_id AND v.is_active = 1
          WHERE p.user_id = ? 
          ORDER BY p.created_at DESC
        `, [userId]);
      }

      return {
        success: true,
        data: projects
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: '服务器内部错误'
      });
    }
  });

  // 获取项目详情
  fastify.get('/:id', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const projectId = request.params.id;
      const userId = request.user.id;
      const userRole = request.user.role;

      const project = await dbAll(`
        SELECT p.*, u.username as manager_name 
        FROM projects p 
        LEFT JOIN users u ON p.manager_id = u.id 
        WHERE p.id = ?
      `, [projectId]);

      if (!project.length) {
        return reply.status(404).send({
          success: false,
          message: '项目不存在'
        });
      }

      const projectData = project[0];

      // 检查权限
      if (userRole !== 'admin' && projectData.manager_id !== userId) {
        const permission = await ProjectPermission.findOne(
          'project_id = ? AND user_id = ?',
          [projectId, userId]
        );
        if (!permission) {
          return reply.status(403).send({
            success: false,
            message: '无权限访问此项目'
          });
        }
      }

      return {
        success: true,
        data: projectData
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: '服务器内部错误'
      });
    }
  });

  // 创建项目
  fastify.post('/', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const { name, description, manager_id } = request.body;

      if (!name) {
        return reply.status(400).send({
          success: false,
          message: '项目名称不能为空'
        });
      }

      // 创建项目，项目所有者为当前用户
      const userId = request.user.id;
      
      const projectId = Project.create({
        name,
        description: description || null,
        user_id: userId
      });

      return {
        success: true,
        message: '项目创建成功',
        data: { id: projectId }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: '服务器内部错误'
      });
    }
  });

  // 更新项目
  fastify.put('/:id', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const projectId = request.params.id;
      const userId = request.user.id;
      const userRole = request.user.role;
      const { name, description, manager_id } = request.body;

      const project = await Project.findById(projectId);
      if (!project) {
        return reply.status(404).send({
          success: false,
          message: '项目不存在'
        });
      }

      // 检查权限：管理员或项目管理员可以更新
      if (userRole !== 'admin' && project.manager_id !== userId) {
        return reply.status(403).send({
          success: false,
          message: '无权限修改此项目'
        });
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (manager_id !== undefined) {
        if (manager_id && userRole === 'admin') {
          const manager = await User.findById(manager_id);
          if (!manager) {
            return reply.status(400).send({
              success: false,
              message: '指定的项目管理员不存在'
            });
          }
          updateData.manager_id = manager_id;
        } else if (userRole === 'admin') {
          updateData.manager_id = null;
        }
      }

      if (Object.keys(updateData).length > 0) {
        updateData.updated_at = new Date().toISOString();
        await Project.update(projectId, updateData);
      }

      return {
        success: true,
        message: '项目更新成功'
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: '服务器内部错误'
      });
    }
  });

  // 删除项目
  fastify.delete('/:id', {
    preHandler: [authenticate, requireAdmin]
  }, async (request, reply) => {
    try {
      const projectId = request.params.id;

      const project = await Project.findById(projectId);
      if (!project) {
        return reply.status(404).send({
          success: false,
          message: '项目不存在'
        });
      }

      // 先删除相关的版本记录
      const versions = dbAll('SELECT * FROM versions WHERE project_id = ?', [projectId]);
      
      // 删除版本的静态文件
      const fs = await import('fs/promises');
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const staticDir = path.join(__dirname, '../../static');
      
      for (const version of versions) {
        try {
          const versionDir = path.join(staticDir, 'projects', projectId.toString(), version.version);
          await fs.rmdir(versionDir, { recursive: true });
          console.log(`删除版本目录: ${versionDir}`);
        } catch (error) {
          console.warn(`删除版本目录失败: ${error.message}`);
        }
      }
      
      // 删除项目目录
      try {
        const projectDir = path.join(staticDir, 'projects', projectId.toString());
        await fs.rmdir(projectDir, { recursive: true });
        console.log(`删除项目目录: ${projectDir}`);
      } catch (error) {
        console.warn(`删除项目目录失败: ${error.message}`);
      }

      // 先清除项目的current_version_id字段（避免循环引用）
      try {
        dbRun('UPDATE projects SET current_version_id = NULL WHERE id = ?', [projectId]);
      } catch (error) {
        console.warn(`清除current_version_id失败: ${error.message}`);
      }

      // 删除版本记录
      dbRun('DELETE FROM versions WHERE project_id = ?', [projectId]);
      
      // 删除项目权限记录
      dbRun('DELETE FROM project_permissions WHERE project_id = ?', [projectId]);

      // 最后删除项目记录
      await Project.delete(projectId);

      return {
        success: true,
        message: '项目删除成功'
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: '项目删除失败: ' + error.message
      });
    }
  });

  // 分配项目权限
  fastify.post('/:id/permissions', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const projectId = request.params.id;
      const userId = request.user.id;
      const userRole = request.user.role;
      const { user_id, permission = 'read' } = request.body;

      const project = await Project.findById(projectId);
      if (!project) {
        return reply.status(404).send({
          success: false,
          message: '项目不存在'
        });
      }

      // 检查权限：管理员或项目管理员可以分配权限
      if (userRole !== 'admin' && project.manager_id !== userId) {
        return reply.status(403).send({
          success: false,
          message: '无权限分配此项目的权限'
        });
      }

      const targetUser = await User.findById(user_id);
      if (!targetUser) {
        return reply.status(400).send({
          success: false,
          message: '目标用户不存在'
        });
      }

      // 检查是否已有权限
      const existingPermission = await ProjectPermission.findOne(
        'project_id = ? AND user_id = ?',
        [projectId, user_id]
      );

      if (existingPermission) {
        await ProjectPermission.update(existingPermission.id, { permission });
      } else {
        await ProjectPermission.create({
          project_id: projectId,
          user_id,
          permission
        });
      }

      return {
        success: true,
        message: '权限分配成功'
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: '服务器内部错误'
      });
    }
  });
}