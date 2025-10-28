import { Version, Project, dbAll, dbRun } from '../utils/database.js';

const authenticate = async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({
      success: false,
      message: '未授权访问'
    });
  }
};

export default async function versionRoutes(fastify, options) {
  // 获取项目版本列表
  fastify.get('/project/:projectId', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const projectId = request.params.projectId;
      const userId = request.user.id;
      const userRole = request.user.role;

      const project = await Project.findById(projectId);
      if (!project) {
        return reply.status(404).send({
          success: false,
          message: '项目不存在'
        });
      }

      // 检查权限
      if (userRole !== 'admin' && project.manager_id !== userId) {
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

      const versions = await dbAll(`
        SELECT v.*, u.username as upload_user_name 
        FROM versions v 
        LEFT JOIN users u ON v.upload_user_id = u.id 
        WHERE v.project_id = ? 
        ORDER BY v.created_at DESC
      `, [projectId]);

      return {
        success: true,
        data: versions
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: '服务器内部错误'
      });
    }
  });

  // 激活版本
  fastify.put('/:id/activate', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const versionId = request.params.id;
      const userId = request.user.id;
      const userRole = request.user.role;

      const version = await Version.findById(versionId);
      if (!version) {
        return reply.status(404).send({
          success: false,
          message: '版本不存在'
        });
      }

      const project = await Project.findById(version.project_id);
      if (!project) {
        return reply.status(404).send({
          success: false,
          message: '项目不存在'
        });
      }

      // 检查权限：管理员或项目管理员可以激活版本
      if (userRole !== 'admin' && project.manager_id !== userId) {
        const permission = await ProjectPermission.findOne(
          'project_id = ? AND user_id = ? AND permission = ?',
          [project.id, userId, 'write']
        );
        if (!permission) {
          return reply.status(403).send({
            success: false,
            message: '无权限修改此项目'
          });
        }
      }

      // 取消当前激活的版本
      await dbRun(
        'UPDATE versions SET is_active = FALSE WHERE project_id = ?',
        [version.project_id]
      );

      // 激活新版本
      await Version.update(versionId, { is_active: true });

      // 更新项目的当前版本
      await Project.update(project.id, { 
        current_version_id: versionId,
        updated_at: new Date().toISOString()
      });

      return {
        success: true,
        message: '版本激活成功'
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: '服务器内部错误'
      });
    }
  });

  // 删除版本
  fastify.delete('/:id', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const versionId = request.params.id;
      const userId = request.user.id;
      const userRole = request.user.role;

      const version = await Version.findById(versionId);
      if (!version) {
        return reply.status(404).send({
          success: false,
          message: '版本不存在'
        });
      }

      const project = await Project.findById(version.project_id);
      if (!project) {
        return reply.status(404).send({
          success: false,
          message: '项目不存在'
        });
      }

      // 检查权限：管理员或项目管理员可以删除版本
      if (userRole !== 'admin' && project.manager_id !== userId) {
        const permission = await ProjectPermission.findOne(
          'project_id = ? AND user_id = ? AND permission = ?',
          [project.id, userId, 'write']
        );
        if (!permission) {
          return reply.status(403).send({
            success: false,
            message: '无权限修改此项目'
          });
        }
      }

      // 如果是当前激活版本，需要清除项目的当前版本引用
      if (project.current_version_id === parseInt(versionId)) {
        await Project.update(project.id, { 
          current_version_id: null,
          updated_at: new Date().toISOString()
        });
      }

      await Version.delete(versionId);

      return {
        success: true,
        message: '版本删除成功'
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