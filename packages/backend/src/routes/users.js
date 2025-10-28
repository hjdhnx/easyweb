import { User } from '../utils/database.js';

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

const requireAdmin = async (request, reply) => {
  if (request.user.role !== 'admin') {
    reply.status(403).send({
      success: false,
      message: '需要管理员权限'
    });
  }
};

export default async function userRoutes(fastify, options) {
  // 获取用户列表（管理员）
  fastify.get('/', {
    preHandler: [authenticate, requireAdmin]
  }, async (request, reply) => {
    try {
      const users = await User.findAll();
      
      // 移除密码字段
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });

      return {
        success: true,
        data: safeUsers
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: '服务器内部错误'
      });
    }
  });

  // 更新用户角色（管理员）
  fastify.put('/:id/role', {
    preHandler: [authenticate, requireAdmin]
  }, async (request, reply) => {
    try {
      const userId = request.params.id;
      const { role } = request.body;

      if (!['admin', 'manager', 'user'].includes(role)) {
        return reply.status(400).send({
          success: false,
          message: '无效的用户角色'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return reply.status(404).send({
          success: false,
          message: '用户不存在'
        });
      }

      // 防止修改自己的角色
      if (parseInt(userId) === request.user.id) {
        return reply.status(400).send({
          success: false,
          message: '不能修改自己的角色'
        });
      }

      await User.update(userId, { 
        role,
        updated_at: new Date().toISOString()
      });

      return {
        success: true,
        message: '用户角色更新成功'
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: '服务器内部错误'
      });
    }
  });

  // 获取用户详情
  fastify.get('/:id', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const userId = request.params.id;
      const currentUserId = request.user.id;
      const userRole = request.user.role;

      // 只有管理员或用户本人可以查看详情
      if (userRole !== 'admin' && parseInt(userId) !== currentUserId) {
        return reply.status(403).send({
          success: false,
          message: '无权限查看此用户信息'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return reply.status(404).send({
          success: false,
          message: '用户不存在'
        });
      }

      const { password, ...safeUser } = user;
      return {
        success: true,
        data: safeUser
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