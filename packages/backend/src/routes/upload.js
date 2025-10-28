import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yauzl from 'yauzl';
import { promisify } from 'util';
import { Project, Version } from '../utils/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// 解压ZIP文件
const extractZip = async (zipPath, extractPath) => {
  return new Promise((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);

      zipfile.readEntry();
      zipfile.on('entry', async (entry) => {
        if (/\/$/.test(entry.fileName)) {
          // 目录
          const dirPath = path.join(extractPath, entry.fileName);
          try {
            await fs.mkdir(dirPath, { recursive: true });
          } catch (error) {
            console.error('创建目录失败:', error);
          }
          zipfile.readEntry();
        } else {
          // 文件
          zipfile.openReadStream(entry, async (err, readStream) => {
            if (err) return reject(err);

            const filePath = path.join(extractPath, entry.fileName);
            const fileDir = path.dirname(filePath);
            
            try {
              await fs.mkdir(fileDir, { recursive: true });
              const writeStream = await fs.open(filePath, 'w');
              const stream = writeStream.createWriteStream();
              
              readStream.pipe(stream);
              stream.on('close', () => {
                writeStream.close();
                zipfile.readEntry();
              });
            } catch (error) {
              console.error('写入文件失败:', error);
              zipfile.readEntry();
            }
          });
        }
      });

      zipfile.on('end', () => {
        resolve();
      });

      zipfile.on('error', (err) => {
        reject(err);
      });
    });
  });
};

export default async function uploadRoutes(fastify, options) {
  // 上传ZIP文件并创建版本
  fastify.post('/', {
    preHandler: authenticate
  }, async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.status(400).send({
          success: false,
          message: '请选择要上传的文件'
        });
      }

      const { projectId, versionName } = data.fields;
      
      if (!projectId || !versionName) {
        return reply.status(400).send({
          success: false,
          message: '项目ID和版本名称不能为空'
        });
      }

      const userId = request.user.id;
      const userRole = request.user.role;

      // 检查项目是否存在
      const project = Project.findById(projectId.value);
      if (!project) {
        return reply.status(404).send({
          success: false,
          message: '项目不存在'
        });
      }

      // 检查权限：管理员或项目所有者可以上传
      if (userRole !== 'admin' && project.user_id !== userId) {
        return reply.status(403).send({
          success: false,
          message: '无权限上传到此项目'
        });
      }

      // 检查文件类型
      if (!data.filename.endsWith('.zip')) {
        return reply.status(400).send({
          success: false,
          message: '只支持ZIP格式文件'
        });
      }

      // 创建上传目录
      const uploadsDir = path.join(__dirname, '../../uploads');
      const staticDir = path.join(__dirname, '../../static');
      await fs.mkdir(uploadsDir, { recursive: true });
      await fs.mkdir(staticDir, { recursive: true });

      // 保存上传的文件
      const timestamp = Date.now();
      const filename = `${timestamp}-${data.filename}`;
      const filePath = path.join(uploadsDir, filename);
      
      const buffer = await data.toBuffer();
      await fs.writeFile(filePath, buffer);

      // 创建解压目录
      const extractDir = path.join(staticDir, project.name, versionName.value);
      await fs.mkdir(extractDir, { recursive: true });

      try {
        // 解压文件
        await extractZip(filePath, extractDir);

        // 创建版本记录
        const versionId = Version.create({
          project_id: projectId.value,
          version: versionName.value,
          file_path: path.relative(path.join(__dirname, '../..'), extractDir),
          file_size: buffer.length
        });
        
        console.log('版本创建成功，ID:', versionId);

        // 删除临时ZIP文件
        await fs.unlink(filePath);

        return {
          success: true,
          message: '文件上传成功',
          data: {
            versionId,
            staticUrl: `/static/${project.name}/${versionName.value}/`
          }
        };
      } catch (error) {
        // 清理文件
        try {
          await fs.unlink(filePath);
          await fs.rmdir(extractDir, { recursive: true });
        } catch (cleanupError) {
          console.error('清理文件失败:', cleanupError);
        }
        throw error;
      }
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        success: false,
        message: '文件上传失败: ' + error.message
      });
    }
  });
}