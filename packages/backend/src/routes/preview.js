import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { Version } from '../utils/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function previewRoutes(fastify, options) {
  // 通过share_code预览项目版本
  fastify.get('/share/:shareCode/*', async (request, reply) => {
    try {
      const shareCode = request.params.shareCode;
      const filePath = request.params['*'] || 'index.html';

      // 根据share_code查找版本
      const version = await Version.findOne('share_code = ?', [shareCode]);
      if (!version) {
        return reply.status(404).send({
          success: false,
          message: '预览链接不存在或已失效'
        });
      }

      // 构建文件的完整路径
      const staticDir = path.join(__dirname, '../../static');
      const versionDir = path.join(staticDir, 'projects', version.project_id.toString(), version.version);
      const requestedFile = path.join(versionDir, filePath);

      // 安全检查：确保请求的文件在版本目录内
      const normalizedVersionDir = path.resolve(versionDir);
      const normalizedRequestedFile = path.resolve(requestedFile);
      
      if (!normalizedRequestedFile.startsWith(normalizedVersionDir)) {
        return reply.status(403).send({
          success: false,
          message: '访问被拒绝'
        });
      }

      try {
        // 检查文件是否存在
        await fs.access(requestedFile);
        
        // 获取文件扩展名以设置正确的Content-Type
        const ext = path.extname(requestedFile).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'application/javascript',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
          '.ttf': 'font/ttf',
          '.eot': 'application/vnd.ms-fontobject'
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        // 设置响应头
        reply.type(contentType);
        
        // 如果是HTML文件，添加安全头
        if (ext === '.html') {
          reply.header('X-Frame-Options', 'SAMEORIGIN');
          reply.header('X-Content-Type-Options', 'nosniff');
        }

        // 返回文件内容
        const fileContent = await fs.readFile(requestedFile);
        return reply.send(fileContent);
        
      } catch (fileError) {
        // 如果请求的是目录且没有指定文件，尝试返回index.html
        if (filePath === '' || filePath.endsWith('/')) {
          const indexFile = path.join(requestedFile, 'index.html');
          try {
            await fs.access(indexFile);
            const indexContent = await fs.readFile(indexFile);
            reply.type('text/html');
            reply.header('X-Frame-Options', 'SAMEORIGIN');
            reply.header('X-Content-Type-Options', 'nosniff');
            return reply.send(indexContent);
          } catch (indexError) {
            // 继续到404处理
          }
        }
        
        return reply.status(404).send({
          success: false,
          message: '文件不存在'
        });
      }
      
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: '服务器内部错误'
      });
    }
  });

  // 获取版本的预览链接信息
  fastify.get('/info/:shareCode', async (request, reply) => {
    try {
      const shareCode = request.params.shareCode;

      // 根据share_code查找版本
      const version = await Version.findOne('share_code = ?', [shareCode]);
      if (!version) {
        return reply.status(404).send({
          success: false,
          message: '预览链接不存在或已失效'
        });
      }

      return {
        success: true,
        data: {
          version: version.version,
          created_at: version.created_at,
          file_size: version.file_size
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