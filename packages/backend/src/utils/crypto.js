import crypto from 'crypto';

/**
 * 生成MD5哈希值
 * @param {string} data - 要哈希的数据
 * @returns {string} MD5哈希值
 */
export function generateMD5(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * 为版本生成唯一的share_code
 * @param {number} projectId - 项目ID
 * @param {string} version - 版本号
 * @param {string} filePath - 文件路径
 * @returns {string} 32位MD5哈希值
 */
export function generateShareCode(projectId, version, filePath) {
  const data = `${projectId}-${version}-${filePath}-${Date.now()}`;
  return generateMD5(data);
}

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
export function generateRandomString(length = 32) {
  return crypto.randomBytes(length / 2).toString('hex');
}