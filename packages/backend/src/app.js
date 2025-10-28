import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import staticFiles from '@fastify/static';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './utils/database.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import versionRoutes from './routes/versions.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';
import previewRoutes from './routes/preview.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  }
});

// 注册插件
await fastify.register(cors, {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
});

await fastify.register(cookie, {
  secret: process.env.COOKIE_SECRET || 'easyweb-cookie-secret-key',
  parseOptions: {}
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'easyweb-jwt-secret-key',
  cookie: {
    cookieName: 'token',
    signed: false
  }
});

await fastify.register(multipart, {
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// 静态文件服务
await fastify.register(staticFiles, {
  root: path.join(__dirname, '../static'),
  prefix: '/static/'
});

// 初始化数据库
await initDatabase();

// 注册路由
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(projectRoutes, { prefix: '/api/projects' });
await fastify.register(versionRoutes, { prefix: '/api/versions' });
await fastify.register(userRoutes, { prefix: '/api/users' });
await fastify.register(uploadRoutes, { prefix: '/api/upload' });
await fastify.register(previewRoutes, { prefix: '/api/preview' });

// 健康检查
fastify.get('/api/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// 启动服务器
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    fastify.log.info(`服务器运行在 http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();