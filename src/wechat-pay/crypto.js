/**
 * 微信支付加密工具
 * 用于 API v3 的签名、加密、解密
 */

/**
 * SHA256 签名
 * @param {string} data - 待签名数据
 * @returns {Promise<string>} 十六进制签名字符串
 */
export async function sha256Sign(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * HMAC-SHA256 签名
 * @param {string} data - 待签名数据
 * @param {string} key - 密钥
 * @returns {Promise<string>} 十六进制签名字符串
 */
export async function hmacSha256(data, key) {
  const encoder = new TextEncoder();
  const keyBuffer = encoder.encode(key);
  const dataBuffer = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    dataBuffer
  );

  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度
 * @returns {string} 随机字符串
 */
export function generateNonceStr(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成时间戳
 * @returns {string} 秒级时间戳
 */
export function generateTimestamp() {
  return Math.floor(Date.now() / 1000).toString();
}

/**
 * AES-256-GCM 解密
 * @param {string} ciphertext - 密文（Base64）
 * @param {string} key - 密钥（Base64）
 * @param {string} nonce - nonce（Base64）
 * @param {string} associatedData - 附加数据
 * @returns {Promise<string>} 解密后的文本
 */
export async function aes256GcmDecrypt(ciphertext, key, nonce, associatedData) {
  const encoder = new TextEncoder();

  // Base64 解码
  const ciphertextBuffer = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const keyBuffer = Uint8Array.from(atob(key), c => c.charCodeAt(0));
  const nonceBuffer = Uint8Array.from(atob(nonce), c => c.charCodeAt(0));
  const adBuffer = encoder.encode(associatedData);

  // 导入密钥
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // 解密
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: nonceBuffer,
      additionalData: adBuffer
    },
    cryptoKey,
    ciphertextBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * RSA 签名（使用商户私钥）
 * @param {string} data - 待签名数据
 * @param {string} privateKey - 私钥（PEM 格式）
 * @returns {Promise<string>} Base64 编码的签名
 */
export async function rsaSign(data, privateKey) {
  // 移除 PEM 头尾和换行
  const pem = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryDerString = atob(pem);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    dataBuffer
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * 构建待签名字符串
 * @param {string} method - HTTP 方法
 * @param {string} url - 请求 URL
 * @param {object} queryParams - 查询参数
 * @param {object} body - 请求体
 * @returns {string} 待签名字符串
 */
export function buildSignMessage(method, url, queryParams = {}, body = null) {
  const urlObj = new URL(url);

  // 构建查询字符串（按字典序排序）
  const sortedQuery = [...urlObj.searchParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // 构建请求体
  let bodyStr = '';
  if (body) {
    bodyStr = JSON.stringify(body);
  }

  return `${method}\n${urlObj.pathname}\n${sortedQuery ? sortedQuery + '\n' : ''}${bodyStr}`;
}
