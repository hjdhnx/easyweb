import { User } from '../utils/database.js';
import bcrypt from 'bcrypt';

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

  // 创建新用户（管理员）
  fastify.post('/', {
    preHandler: [authenticate, requireAdmin]
  }, async (request, reply) => {
    try {
      const { username, password, email, role = 'user' } = request.body;

      if (!username || !password) {
        return reply.status(400).send({
          success: false,
          message: '用户名和密码不能为空'
        });
      }

      if (password.length < 6) {
        return reply.status(400).send({
          success: false,
          message: '密码长度不能少于6位'
        });
      }

      if (!['admin', 'manager', 'user'].includes(role)) {
        return reply.status(400).send({
          success: false,
          message: '无效的用户角色'
        });
      }

      // 检查用户名是否已存在
      const existingUser = await User.findOne('username = ?', [username]);
      if (existingUser) {
        return reply.status(409).send({
          success: false,
          message: '用户名已存在'
        });
      }

      // 检查邮箱是否已存在（如果提供了邮箱）
      if (email) {
        const existingEmail = await User.findOne('email = ?', [email]);
        if (existingEmail) {
          return reply.status(409).send({
            success: false,
            message: '邮箱已被使用'
          });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = await User.create({
        username,
        password: hashedPassword,
        email: email || null,
        role
      });

      return {
        success: true,
        message: '用户创建成功',
        data: { id: userId }
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

  // 删除用户（管理员）
  fastify.delete('/:id', {
    preHandler: [authenticate, requireAdmin]
  }, async (request, reply) => {
    try {
      const userId = request.params.id;
      const currentUserId = request.user.id;

      // 防止删除自己
      if (parseInt(userId) === currentUserId) {
        return reply.status(400).send({
          success: false,
          message: '不能删除自己的账号'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return reply.status(404).send({
          success: false,
          message: '用户不存在'
        });
      }

      await User.delete(userId);

      return {
        success: true,
        message: '用户删除成功'
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: '服务器内部错误'
      });
    }
  });

  // 修改用户密码（管理员或用户本人）
  fastify.put('/:id/password', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const userId = request.params.id;
      const currentUserId = request.user.id;
      const userRole = request.user.role;
      const { password, oldPassword } = request.body;

      if (!password) {
        return reply.status(400).send({
          success: false,
          message: '新密码不能为空'
        });
      }

      if (password.length < 6) {
        return reply.status(400).send({
          success: false,
          message: '密码长度不能少于6位'
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return reply.status(404).send({
          success: false,
          message: '用户不存在'
        });
      }

      // 权限检查：管理员可以修改任何人的密码，普通用户只能修改自己的密码
      if (userRole !== 'admin' && parseInt(userId) !== currentUserId) {
        return reply.status(403).send({
          success: false,
          message: '无权限修改此用户密码'
        });
      }

      // 如果是用户修改自己的密码，需要验证旧密码
      if (parseInt(userId) === currentUserId && userRole !== 'admin') {
        if (!oldPassword) {
          return reply.status(400).send({
            success: false,
            message: '请提供当前密码'
          });
        }

        const isValidOldPassword = await bcrypt.compare(oldPassword, user.password);
        if (!isValidOldPassword) {
          return reply.status(400).send({
            success: false,
            message: '当前密码错误'
          });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await User.update(userId, { 
        password: hashedPassword,
        updated_at: new Date().toISOString()
      });

      return {
        success: true,
        message: '密码修改成功'
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