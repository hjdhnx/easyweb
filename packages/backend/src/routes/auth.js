import bcrypt from 'bcryptjs';
import { User } from '../utils/database.js';

export default async function authRoutes(fastify, options) {
  // 用户登录
  fastify.post('/login', async (request, reply) => {
    try {
      const { username, password } = request.body;

      if (!username || !password) {
        return reply.status(400).send({
          success: false,
          message: '用户名和密码不能为空'
        });
      }

      const user = User.findOne('username = ?', [username]);
      if (!user) {
        return reply.status(401).send({
          success: false,
          message: '用户名或密码错误'
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return reply.status(401).send({
          success: false,
          message: '用户名或密码错误'
        });
      }

      const token = await reply.jwtSign({
        id: user.id,
        username: user.username,
        role: user.role
      });

      reply.setCookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
      });

      return {
        success: true,
        message: '登录成功',
        token: token,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: '服务器内部错误'
      });
    }
  });

  // 用户注册
  fastify.post('/register', async (request, reply) => {
    try {
      const { username, password, email } = request.body;

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

      const existingUser = await User.findOne('username = ?', [username]);
      if (existingUser) {
        return reply.status(409).send({
          success: false,
          message: '用户名已存在'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = await User.create({
        username,
        password: hashedPassword,
        email: email || null,
        role: 'user'
      });

      return {
        success: true,
        message: '注册成功',
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

  // 用户登出
  fastify.post('/logout', async (request, reply) => {
    reply.clearCookie('token');
    return {
      success: true,
      message: '登出成功'
    };
  });

  // 获取用户信息
  fastify.get('/profile', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.status(401).send({
          success: false,
          message: '未授权访问'
        });
      }
    }
  }, async (request, reply) => {
    try {
      const user = await User.findById(request.user.id);
      if (!user) {
        return reply.status(404).send({
          success: false,
          message: '用户不存在'
        });
      }

      return {
        success: true,
        data: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        }
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