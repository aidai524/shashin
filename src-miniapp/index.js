/**
 * Gemini API Proxy + Template Management API + User Authentication
 * Cloudflare Workers
 */

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com";

// CORS 头
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-goog-api-key, x-admin-key",
};

// 用户权限等级（已移除角色数量限制）
const USER_PLANS = {
  FREE: { name: '免费版', maxCharacters: 9999, maxPhotosPerCharacter: 10 },
  PERSONAL: { name: '个人版', maxCharacters: 9999, maxPhotosPerCharacter: 10 },
  FAMILY: { name: '家庭版', maxCharacters: 9999, maxPhotosPerCharacter: 10 }
};

// 默认模板数据（初始化用）
const defaultTemplates = [
  {
    id: 'professional-portrait',
    category: 'portrait',
    name: { zh: '职业形象照', en: 'Professional Portrait' },
    description: { zh: '商务风格的专业形象照，适合简历和社交媒体', en: 'Professional business portrait for resume and social media' },
    thumbnail: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    prompt: 'Professional corporate headshot portrait, wearing formal business attire, clean neutral background, soft studio lighting, confident and approachable expression, high-end photography style, sharp focus on face, subtle color grading',
    order: 1,
    active: true
  },
  {
    id: 'artistic-portrait',
    category: 'portrait',
    name: { zh: '艺术人像', en: 'Artistic Portrait' },
    description: { zh: '富有艺术感的人像摄影风格', en: 'Artistic portrait photography style' },
    thumbnail: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop',
    prompt: 'Artistic portrait photography, dramatic lighting with shadows, moody atmosphere, cinematic color grading, fine art photography style, ethereal and dreamy quality, professional retouching',
    order: 2,
    active: true
  },
  {
    id: 'casual-lifestyle',
    category: 'portrait',
    name: { zh: '休闲生活照', en: 'Casual Lifestyle' },
    description: { zh: '自然放松的生活方式照片', en: 'Natural and relaxed lifestyle photography' },
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    prompt: 'Casual lifestyle portrait, natural outdoor lighting, relaxed and genuine smile, candid moment, warm color tones, bokeh background, natural environment setting, authentic and approachable',
    order: 3,
    active: true
  },
  {
    id: 'vintage-film',
    category: 'creative',
    name: { zh: '复古胶片', en: 'Vintage Film' },
    description: { zh: '怀旧的胶片相机美学风格', en: 'Nostalgic film camera aesthetic' },
    thumbnail: 'https://images.unsplash.com/photo-1516914943479-89db7d9ae7f2?w=400&h=400&fit=crop',
    prompt: 'Vintage film photography style portrait, 35mm film grain texture, warm faded colors, soft vignette, nostalgic 1970s aesthetic, natural film bokeh, slightly overexposed highlights, authentic analog look',
    order: 4,
    active: true
  },
  {
    id: 'cyberpunk',
    category: 'creative',
    name: { zh: '赛博朋克', en: 'Cyberpunk' },
    description: { zh: '未来科幻风格的霓虹美学', en: 'Futuristic sci-fi neon aesthetics' },
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop',
    prompt: 'Cyberpunk style portrait, neon lights in pink and blue, futuristic urban background, rain-soaked streets, holographic elements, high contrast dramatic lighting, sci-fi aesthetic, blade runner inspired',
    order: 5,
    active: true
  },
  {
    id: 'anime-style',
    category: 'creative',
    name: { zh: '动漫风格', en: 'Anime Style' },
    description: { zh: '日式动漫插画风格', en: 'Japanese anime illustration style' },
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=400&fit=crop',
    prompt: 'Anime style portrait illustration, vibrant colors, clean line art, big expressive eyes, soft cel shading, beautiful detailed background, studio ghibli inspired, high quality digital art',
    order: 6,
    active: true
  },
  {
    id: 'fantasy-world',
    category: 'scene',
    name: { zh: '奇幻世界', en: 'Fantasy World' },
    description: { zh: '魔法奇幻场景中的人物', en: 'Character in magical fantasy setting' },
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop',
    prompt: 'Fantasy portrait in magical world, ethereal lighting, mystical forest background, floating particles of light, elvish aesthetic, dramatic atmosphere, fantasy movie poster style, epic and magical',
    order: 7,
    active: true
  },
  {
    id: 'beach-sunset',
    category: 'scene',
    name: { zh: '海边日落', en: 'Beach Sunset' },
    description: { zh: '浪漫的海边黄昏场景', en: 'Romantic beach sunset scene' },
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop',
    prompt: 'Portrait at beach during golden hour sunset, warm orange and pink sky, gentle ocean waves, silhouette lighting, romantic atmosphere, summer vibes, professional vacation photography',
    order: 8,
    active: true
  },
  {
    id: 'urban-street',
    category: 'scene',
    name: { zh: '都市街拍', en: 'Urban Street' },
    description: { zh: '时尚的城市街头风格', en: 'Fashionable urban street style' },
    thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=400&fit=crop',
    prompt: 'Urban street style portrait, modern city background, fashion photography, natural street lighting, trendy and stylish pose, contemporary architecture backdrop, magazine editorial style',
    order: 9,
    active: true
  },
  {
    id: 'chinese-ancient',
    category: 'creative',
    name: { zh: '古风汉服', en: 'Chinese Traditional' },
    description: { zh: '中国古典汉服风格', en: 'Traditional Chinese Hanfu style' },
    thumbnail: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=400&h=400&fit=crop',
    prompt: 'Chinese traditional Hanfu portrait, elegant ancient Chinese costume, classical garden background, soft natural lighting, graceful pose, traditional Chinese painting aesthetic, flowing silk fabric, cultural heritage photography',
    order: 10,
    active: true
  },
  {
    id: 'minimalist',
    category: 'portrait',
    name: { zh: '极简主义', en: 'Minimalist' },
    description: { zh: '简洁干净的极简风格', en: 'Clean and simple minimalist style' },
    thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    prompt: 'Minimalist portrait photography, clean white background, simple composition, soft diffused lighting, modern and elegant, negative space, high-key photography, contemporary art style',
    order: 11,
    active: true
  },
  {
    id: 'oil-painting',
    category: 'creative',
    name: { zh: '油画风格', en: 'Oil Painting' },
    description: { zh: '经典油画艺术风格', en: 'Classic oil painting art style' },
    thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop',
    prompt: 'Classical oil painting style portrait, Renaissance master technique, rich warm colors, dramatic chiaroscuro lighting, visible brushstroke texture, museum quality fine art, timeless elegance',
    order: 12,
    active: true
  }
];

// =========================================
// 辅助函数
// =========================================

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

function isAdmin(request, env) {
  const adminKey = request.headers.get("x-admin-key");
  return adminKey && adminKey === env.ADMIN_KEY;
    }

// =========================================
// 密码加密（使用 Web Crypto API）
// =========================================

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// =========================================
// JWT 实现（使用 Web Crypto API）
// =========================================

function base64UrlEncode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

async function createJWT(payload, secret, expiresIn = 7 * 24 * 60 * 60) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(tokenPayload));
  const message = `${headerB64}.${payloadB64}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const signatureB64 = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));

  return `${message}.${signatureB64}`;
}

async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const message = `${headerB64}.${payloadB64}`;

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureArray = Uint8Array.from(base64UrlDecode(signatureB64), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signatureArray, encoder.encode(message));

    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecode(payloadB64));
    
    // 检查过期时间
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (e) {
    console.error('JWT verification error:', e);
    return null;
  }
}

// 从请求中获取用户
async function getUserFromRequest(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const payload = await verifyJWT(token, env.JWT_SECRET);
  
  if (!payload || !payload.userId) {
    return null;
  }

  // 从 KV 获取用户信息
  const userData = await env.USERS_KV.get(`user:${payload.userId}`);
  if (!userData) {
    return null;
  }

  return JSON.parse(userData);
}

// =========================================
// 用户认证 API
// =========================================

async function handleAuthAPI(request, env, pathname) {
  const method = request.method;

  // POST /api/auth/register - 注册
  if (pathname === '/api/auth/register' && method === 'POST') {
    return await registerUser(request, env);
  }

  // POST /api/auth/login - 登录
  if (pathname === '/api/auth/login' && method === 'POST') {
    return await loginUser(request, env);
  }

  // GET /api/auth/me - 获取当前用户信息
  if (pathname === '/api/auth/me' && method === 'GET') {
    return await getCurrentUser(request, env);
  }

  // PUT /api/auth/me - 更新用户信息
  if (pathname === '/api/auth/me' && method === 'PUT') {
    return await updateCurrentUser(request, env);
  }

  // POST /api/auth/change-password - 修改密码
  if (pathname === '/api/auth/change-password' && method === 'POST') {
    return await changePassword(request, env);
  }

  // POST /api/auth/wechat - 微信登录
  if (pathname === '/api/auth/wechat' && method === 'POST') {
    return await wechatLogin(request, env);
  }

  return errorResponse('Not found', 404);
}

// 微信登录
async function wechatLogin(request, env) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return errorResponse('Missing code parameter');
    }

    // 检查环境变量（如果未配置则返回错误）
    if (!env.WX_APP_ID || !env.WX_APP_SECRET) {
      // 开发环境下如果没配置，可以使用模拟数据（仅供测试）
      // return errorResponse('WeChat configuration missing', 500);
      console.warn('WX_APP_ID or WX_APP_SECRET not set');
    }

    let openid;
    
    // 调用微信 API
    if (env.WX_APP_ID && env.WX_APP_SECRET) {
      const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${env.WX_APP_ID}&secret=${env.WX_APP_SECRET}&js_code=${code}&grant_type=authorization_code`;
      const wxResp = await fetch(wxUrl);
      const wxData = await wxResp.json();

      if (wxData.errcode) {
        return errorResponse(`WeChat Error: ${wxData.errmsg}`, 400);
      }
      openid = wxData.openid;
    } else {
      // 仅用于本地开发测试，生产环境必须配置
      if (code === 'TEST_CODE') {
        openid = 'test_openid_123456';
      } else {
        return errorResponse('WeChat configuration missing', 500);
      }
    }

    // 检查用户是否存在
    let userId = await env.USERS_KV.get(`wechat:${openid}`);
    let user;

    if (userId) {
      const userData = await env.USERS_KV.get(`user:${userId}`);
      if (userData) {
        user = JSON.parse(userData);
      }
    }

    if (!user) {
      // 创建新用户
      userId = crypto.randomUUID();
      user = {
        id: userId,
        email: `${openid}@wechat.local`, // 占位邮箱
        nickname: `微信用户${openid.substring(0, 4)}`,
        openid: openid,
        passwordHash: '', // 微信登录无密码
        plan: 'FREE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await env.USERS_KV.put(`user:${userId}`, JSON.stringify(user));
      await env.USERS_KV.put(`wechat:${openid}`, userId);
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date().toISOString();
    await env.USERS_KV.put(`user:${userId}`, JSON.stringify(user));

    // 生成 JWT token
    const token = await createJWT({ userId: user.id, openid: user.openid }, env.JWT_SECRET);

    // 返回用户信息
    const { passwordHash: _, ...safeUser } = user;
    return jsonResponse({
      success: true,
      message: '登录成功',
      user: safeUser,
      token,
      plan: USER_PLANS[user.plan]
    });

  } catch (e) {
    console.error('WeChat login error:', e);
    return errorResponse('WeChat login failed: ' + e.message, 500);
  }
}

// 注册用户
async function registerUser(request, env) {
  try {
    const body = await request.json();
    const { email, password, nickname } = body;

    // 验证必填字段
    if (!email || !password) {
      return errorResponse('邮箱和密码为必填项');
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse('邮箱格式不正确');
    }

    // 验证密码长度
    if (password.length < 6) {
      return errorResponse('密码长度至少6位');
    }

    // 检查邮箱是否已注册
    const existingUser = await env.USERS_KV.get(`email:${email.toLowerCase()}`);
    if (existingUser) {
      return errorResponse('该邮箱已被注册');
    }

    // 生成用户 ID
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    // 创建用户数据
    const user = {
      id: userId,
      email: email.toLowerCase(),
      nickname: nickname || email.split('@')[0],
      passwordHash,
      plan: 'FREE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 保存用户数据
    await env.USERS_KV.put(`user:${userId}`, JSON.stringify(user));
    await env.USERS_KV.put(`email:${email.toLowerCase()}`, userId);

    // 生成 JWT token
    const token = await createJWT({ userId: user.id, email: user.email }, env.JWT_SECRET);

    // 返回用户信息（不包含密码）
    const { passwordHash: _, ...safeUser } = user;
    return jsonResponse({
      success: true,
      message: '注册成功',
      user: safeUser,
      token,
      plan: USER_PLANS[user.plan]
    }, 201);

  } catch (e) {
    console.error('Register error:', e);
    return errorResponse('注册失败: ' + e.message, 500);
  }
}

// 用户登录
async function loginUser(request, env) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('邮箱和密码为必填项');
    }

    // 查找用户
    const userId = await env.USERS_KV.get(`email:${email.toLowerCase()}`);
    if (!userId) {
      return errorResponse('邮箱或密码错误', 401);
    }

    const userData = await env.USERS_KV.get(`user:${userId}`);
    if (!userData) {
      return errorResponse('用户不存在', 401);
    }

    const user = JSON.parse(userData);

    // 验证密码
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return errorResponse('邮箱或密码错误', 401);
    }

    // 更新最后登录时间
    user.lastLoginAt = new Date().toISOString();
    await env.USERS_KV.put(`user:${userId}`, JSON.stringify(user));

    // 生成 JWT token
    const token = await createJWT({ userId: user.id, email: user.email }, env.JWT_SECRET);

    // 返回用户信息（不包含密码）
    const { passwordHash: _, ...safeUser } = user;
    return jsonResponse({
      success: true,
      message: '登录成功',
      user: safeUser,
      token,
      plan: USER_PLANS[user.plan]
    });

  } catch (e) {
    console.error('Login error:', e);
    return errorResponse('登录失败: ' + e.message, 500);
  }
}

// 获取当前用户信息
async function getCurrentUser(request, env) {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return errorResponse('未登录或登录已过期', 401);
  }

  const { passwordHash: _, ...safeUser } = user;
  return jsonResponse({
    user: safeUser,
    plan: USER_PLANS[user.plan]
  });
}

// 更新用户信息
async function updateCurrentUser(request, env) {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return errorResponse('未登录或登录已过期', 401);
  }

  try {
    const body = await request.json();
    const { nickname, avatar } = body;

    // 更新允许修改的字段
    if (nickname !== undefined) user.nickname = nickname;
    if (avatar !== undefined) user.avatar = avatar;
    user.updatedAt = new Date().toISOString();

    await env.USERS_KV.put(`user:${user.id}`, JSON.stringify(user));

    const { passwordHash: _, ...safeUser } = user;
    return jsonResponse({
      success: true,
      message: '更新成功',
      user: safeUser
    });

  } catch (e) {
    console.error('Update user error:', e);
    return errorResponse('更新失败: ' + e.message, 500);
  }
}

// 修改密码
async function changePassword(request, env) {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return errorResponse('未登录或登录已过期', 401);
  }

  try {
    const body = await request.json();
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return errorResponse('请输入旧密码和新密码');
    }

    if (newPassword.length < 6) {
      return errorResponse('新密码长度至少6位');
    }

    // 验证旧密码
    const isValid = await verifyPassword(oldPassword, user.passwordHash);
    if (!isValid) {
      return errorResponse('旧密码不正确', 401);
    }

    // 更新密码
    user.passwordHash = await hashPassword(newPassword);
    user.updatedAt = new Date().toISOString();

    await env.USERS_KV.put(`user:${user.id}`, JSON.stringify(user));

    return jsonResponse({
      success: true,
      message: '密码修改成功'
    });

  } catch (e) {
    console.error('Change password error:', e);
    return errorResponse('修改密码失败: ' + e.message, 500);
  }
}

// =========================================
// 用户管理 API（管理员）
// =========================================

async function handleUsersAdminAPI(request, env, pathname) {
  if (!isAdmin(request, env)) {
    return errorResponse('Unauthorized', 401);
  }

  const method = request.method;

  // GET /api/admin/users - 获取所有用户
  if (pathname === '/api/admin/users' && method === 'GET') {
    return await listUsers(env);
  }

  // PUT /api/admin/users/:id/plan - 更新用户权限
  const planMatch = pathname.match(/^\/api\/admin\/users\/([^\/]+)\/plan$/);
  if (planMatch && method === 'PUT') {
    return await updateUserPlan(request, env, planMatch[1]);
  }
  
  return errorResponse('Not found', 404);
}

// 列出所有用户
async function listUsers(env) {
  try {
    const users = [];
    const list = await env.USERS_KV.list({ prefix: 'user:' });
    
    for (const key of list.keys) {
      const userData = await env.USERS_KV.get(key.name);
      if (userData) {
        const user = JSON.parse(userData);
        const { passwordHash: _, ...safeUser } = user;
        users.push(safeUser);
      }
    }

    return jsonResponse({
      users,
      total: users.length
    });
  } catch (e) {
    console.error('List users error:', e);
    return errorResponse('获取用户列表失败', 500);
  }
}

// 更新用户权限
async function updateUserPlan(request, env, userId) {
  try {
    const body = await request.json();
    const { plan } = body;

    if (!USER_PLANS[plan]) {
      return errorResponse('无效的权限等级');
    }

    const userData = await env.USERS_KV.get(`user:${userId}`);
    if (!userData) {
      return errorResponse('用户不存在', 404);
    }

    const user = JSON.parse(userData);
    user.plan = plan;
    user.updatedAt = new Date().toISOString();

    await env.USERS_KV.put(`user:${userId}`, JSON.stringify(user));

    const { passwordHash: _, ...safeUser } = user;
    return jsonResponse({
      success: true,
      message: '权限更新成功',
      user: safeUser,
      plan: USER_PLANS[plan]
    });

  } catch (e) {
    console.error('Update user plan error:', e);
    return errorResponse('更新权限失败: ' + e.message, 500);
  }
}


// =========================================
// 模板 API 处理
// =========================================

async function handleTemplatesAPI(request, env, pathname) {
  const method = request.method;
  
  // GET /api/templates - 获取所有模板
  if (pathname === "/api/templates" && method === "GET") {
    return await getTemplates(env);
  }
  
  // GET /api/templates/:id - 获取单个模板
  const getMatch = pathname.match(/^\/api\/templates\/([^\/]+)$/);
  if (getMatch && method === "GET") {
    return await getTemplate(env, getMatch[1]);
  }
  
  // POST /api/templates - 创建模板
  if (pathname === "/api/templates" && method === "POST") {
    if (!isAdmin(request, env)) {
      return errorResponse("Unauthorized", 401);
    }
    const body = await request.json();
    return await createTemplate(env, body);
  }
  
  // PUT /api/templates/:id - 更新模板
  const putMatch = pathname.match(/^\/api\/templates\/([^\/]+)$/);
  if (putMatch && method === "PUT") {
    if (!isAdmin(request, env)) {
      return errorResponse("Unauthorized", 401);
    }
    const body = await request.json();
    return await updateTemplate(env, putMatch[1], body);
  }
  
  // DELETE /api/templates/:id - 删除模板
  const deleteMatch = pathname.match(/^\/api\/templates\/([^\/]+)$/);
  if (deleteMatch && method === "DELETE") {
    if (!isAdmin(request, env)) {
      return errorResponse("Unauthorized", 401);
    }
    return await deleteTemplate(env, deleteMatch[1]);
  }
  
  // POST /api/templates/init - 初始化默认模板
  if (pathname === "/api/templates/init" && method === "POST") {
    if (!isAdmin(request, env)) {
      return errorResponse("Unauthorized", 401);
    }
    return await initTemplates(env);
  }
  
  // POST /api/upload/image - 上传图片到 R2
  if (pathname === "/api/upload/image" && method === "POST") {
    if (!isAdmin(request, env)) {
      return errorResponse("Unauthorized", 401);
    }
    return await uploadImage(request, env);
  }
  
  return errorResponse("Not found", 404);
}

// 获取所有模板
async function getTemplates(env) {
  try {
    if (env.TEMPLATES_KV) {
      const templatesJson = await env.TEMPLATES_KV.get("templates");
      if (templatesJson) {
        const templates = JSON.parse(templatesJson);
        const activeTemplates = templates
          .filter(t => t.active !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        return jsonResponse(activeTemplates);
      }
    }
    return jsonResponse(defaultTemplates);
  } catch (e) {
    console.error("Error getting templates:", e);
    return jsonResponse(defaultTemplates);
  }
}

// 获取单个模板
async function getTemplate(env, id) {
  try {
    if (env.TEMPLATES_KV) {
      const templatesJson = await env.TEMPLATES_KV.get("templates");
      if (templatesJson) {
        const templates = JSON.parse(templatesJson);
        const template = templates.find(t => t.id === id);
        if (template) {
          return jsonResponse(template);
        }
      }
    }
    const template = defaultTemplates.find(t => t.id === id);
    if (template) {
      return jsonResponse(template);
    }
    return errorResponse("Template not found", 404);
  } catch (e) {
    console.error("Error getting template:", e);
    return errorResponse("Internal error", 500);
  }
}

// 创建模板
async function createTemplate(env, data) {
  if (!data.id || !data.name || !data.prompt) {
    return errorResponse("Missing required fields: id, name, prompt");
  }
  
  try {
    let templates = defaultTemplates;
    
    if (env.TEMPLATES_KV) {
      const templatesJson = await env.TEMPLATES_KV.get("templates");
      if (templatesJson) {
        templates = JSON.parse(templatesJson);
      }
    }
    
    if (templates.find(t => t.id === data.id)) {
      return errorResponse("Template ID already exists");
    }
    
    const newTemplate = {
      id: data.id,
      category: data.category || 'creative',
      name: data.name,
      description: data.description || { zh: '', en: '' },
      thumbnail: data.thumbnail || '',
      prompt: data.prompt,
      order: data.order || templates.length + 1,
      active: data.active !== false,
      createdAt: new Date().toISOString()
    };
    
    templates.push(newTemplate);
    
    if (env.TEMPLATES_KV) {
      await env.TEMPLATES_KV.put("templates", JSON.stringify(templates));
    }
    
    return jsonResponse(newTemplate, 201);
  } catch (e) {
    console.error("Error creating template:", e);
    return errorResponse("Internal error", 500);
  }
}

// 更新模板
async function updateTemplate(env, id, data) {
  try {
    let templates = defaultTemplates;
    
    if (env.TEMPLATES_KV) {
      const templatesJson = await env.TEMPLATES_KV.get("templates");
      if (templatesJson) {
        templates = JSON.parse(templatesJson);
      }
    }
    
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) {
      return errorResponse("Template not found", 404);
    }
    
    const updated = {
      ...templates[index],
      ...data,
      id: id,
      updatedAt: new Date().toISOString()
    };
    
    templates[index] = updated;
    
    if (env.TEMPLATES_KV) {
      await env.TEMPLATES_KV.put("templates", JSON.stringify(templates));
    }
    
    return jsonResponse(updated);
  } catch (e) {
    console.error("Error updating template:", e);
    return errorResponse("Internal error", 500);
  }
}

// 删除模板
async function deleteTemplate(env, id) {
  try {
    let templates = defaultTemplates;
    
    if (env.TEMPLATES_KV) {
      const templatesJson = await env.TEMPLATES_KV.get("templates");
      if (templatesJson) {
        templates = JSON.parse(templatesJson);
      }
    }
    
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) {
      return errorResponse("Template not found", 404);
    }
    
    templates.splice(index, 1);
    
    if (env.TEMPLATES_KV) {
      await env.TEMPLATES_KV.put("templates", JSON.stringify(templates));
    }
    
    return jsonResponse({ success: true, message: "Template deleted" });
  } catch (e) {
    console.error("Error deleting template:", e);
    return errorResponse("Internal error", 500);
  }
}

// 初始化默认模板
async function initTemplates(env) {
  try {
    if (env.TEMPLATES_KV) {
      await env.TEMPLATES_KV.put("templates", JSON.stringify(defaultTemplates));
      return jsonResponse({ success: true, message: "Templates initialized", count: defaultTemplates.length });
    }
    return errorResponse("KV not available", 500);
  } catch (e) {
    console.error("Error initializing templates:", e);
    return errorResponse("Internal error", 500);
  }
}

// =========================================
// 图片上传到 R2
// =========================================

// 上传图片
async function uploadImage(request, env) {
  try {
    if (!env.IMAGES_BUCKET) {
      return errorResponse("R2 bucket not configured", 500);
    }
    
    const contentType = request.headers.get('content-type') || '';
    
    // 支持 FormData 或 JSON 格式
    let imageData, filename, mimeType;
    
    if (contentType.includes('multipart/form-data')) {
      // FormData 格式上传
      const formData = await request.formData();
      const file = formData.get('image');
      
      if (!file || !(file instanceof File)) {
        return errorResponse("No image file provided", 400);
      }
      
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        return errorResponse("Invalid file type. Allowed: JPEG, PNG, GIF, WEBP", 400);
      }
      
      // 验证文件大小 (最大 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return errorResponse("File too large. Maximum size: 5MB", 400);
      }
      
      imageData = await file.arrayBuffer();
      mimeType = file.type;
      
      // 生成文件名
      const ext = mimeType.split('/')[1] || 'jpg';
      filename = `${Date.now()}-${crypto.randomUUID().substring(0, 8)}.${ext}`;
      
    } else if (contentType.includes('application/json')) {
      // JSON 格式（Base64）上传
      const body = await request.json();
      
      if (!body.image) {
        return errorResponse("No image data provided", 400);
      }
      
      // 解析 Base64 数据
      const base64Match = body.image.match(/^data:image\/(jpeg|png|gif|webp);base64,(.+)$/);
      if (!base64Match) {
        return errorResponse("Invalid image data format. Expected: data:image/xxx;base64,xxx", 400);
      }
      
      mimeType = `image/${base64Match[1]}`;
      const base64Data = base64Match[2];
      
      // 将 Base64 转换为 ArrayBuffer
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      imageData = bytes.buffer;
      
      // 验证文件大小
      if (imageData.byteLength > 5 * 1024 * 1024) {
        return errorResponse("File too large. Maximum size: 5MB", 400);
      }
      
      // 生成文件名
      const ext = base64Match[1];
      filename = body.filename || `${Date.now()}-${crypto.randomUUID().substring(0, 8)}.${ext}`;
      
    } else {
      return errorResponse("Unsupported content type", 400);
    }
    
    // 上传到 R2
    const key = `templates/${filename}`;
    await env.IMAGES_BUCKET.put(key, imageData, {
      httpMetadata: {
        contentType: mimeType,
      },
    });
    
    // 返回图片 URL
    // 使用 Worker 作为代理访问图片
    const imageUrl = `/api/images/${filename}`;
    
    return jsonResponse({
      success: true,
      url: imageUrl,
      filename: filename,
      size: imageData.byteLength,
      mimeType: mimeType
    });
    
  } catch (e) {
    console.error("Error uploading image:", e);
    return errorResponse("Failed to upload image: " + e.message, 500);
  }
}

// 获取图片
async function getImage(env, filename) {
  try {
    if (!env.IMAGES_BUCKET) {
      return errorResponse("R2 bucket not configured", 500);
    }
    
    const key = `templates/${filename}`;
    const object = await env.IMAGES_BUCKET.get(key);
    
    if (!object) {
      return errorResponse("Image not found", 404);
    }
    
    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=31536000'); // 缓存 1 年
    headers.set('Access-Control-Allow-Origin', '*');
    
    return new Response(object.body, { headers });
    
  } catch (e) {
    console.error("Error getting image:", e);
    return errorResponse("Failed to get image", 500);
  }
}

// =========================================
// Gemini API 代理
// =========================================

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleGeminiProxy(request, env, url) {
    console.log('=== Gemini Proxy ===');
    console.log('Request URL:', url.pathname);

    // 优先从 x-goog-api-key header 获取（用于直接调用）
    let apiKey = request.headers.get("x-goog-api-key");
    console.log('API key from x-goog-api-key header:', apiKey ? 'Yes' : 'No');

    // 如果没有，直接使用环境变量中的 API key（小程序场景）
    // 不再尝试从 Authorization header 提取，因为那是给 JWT token 用的
    if (!apiKey && env.GEMINI_API_KEY) {
      apiKey = env.GEMINI_API_KEY;
      console.log('API key from env.GEMINI_API_KEY:', apiKey ? 'Yes (' + apiKey.substring(0, 10) + '...)' : 'No');
    }

    console.log('Final API key:', apiKey ? 'Set (' + apiKey.substring(0, 10) + '...)' : 'Not set');

    if (!apiKey) {
    return errorResponse("API key is required", 401);
    }

    const targetUrl = new URL(url.pathname + url.search, GEMINI_API_BASE);
    targetUrl.searchParams.set("key", apiKey);

    const headers = new Headers();
  headers.set("Content-Type", request.headers.get("Content-Type") || "application/json");
    headers.set("Accept-Language", "en-US,en;q=0.9");

    let body = null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.arrayBuffer();
    }

  const colo = request.cf?.colo || "unknown";
  const country = request.cf?.country || "unknown";

  // 重试配置
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [2000, 4000, 8000]; // 指数退避：2秒、4秒、8秒

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      let response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: headers,
        body: body,
      });

      // 检查是否是 overloaded 错误（需要重试）
      if (response.status === 503 || response.status === 429) {
        const responseText = await response.text();
        if (responseText.includes("overloaded") || responseText.includes("RESOURCE_EXHAUSTED")) {
          if (attempt < MAX_RETRIES) {
            console.log(`Model overloaded, retry ${attempt + 1}/${MAX_RETRIES} after ${RETRY_DELAYS[attempt]}ms`);
            await delay(RETRY_DELAYS[attempt]);
            continue;
          }
          // 所有重试都失败了
          return jsonResponse({
            error: "Model overloaded",
            message: "模型当前负载过高，请稍后重试",
            retried: MAX_RETRIES,
          }, 503);
        }
        return new Response(responseText, {
          status: response.status,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      if (response.status === 400 || response.status === 403) {
        const responseText = await response.text();
        if (
          responseText.includes("User location is not supported") ||
          responseText.includes("unsupported_country_region_territory")
        ) {
        headers.set("X-Forwarded-For", "8.8.8.8");
          headers.set("CF-IPCountry", "US");

          response = await fetch(targetUrl.toString(), {
            method: request.method,
            headers: headers,
            body: body,
          });

          if (response.status === 400 || response.status === 403) {
            const retryText = await response.text();
            if (
              retryText.includes("User location is not supported") ||
              retryText.includes("unsupported_country_region_territory")
            ) {
            return jsonResponse({
                  error: "Region restriction detected",
              message: `Google API 检测到请求来自不支持的地区。当前数据中心: ${colo} (${country})`,
              suggestion: "请尝试使用 VPN 或等待 Cloudflare 路由到其他数据中心",
            }, 403);
            }
            return new Response(retryText, {
              status: response.status,
            headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
        } else {
          return new Response(responseText, {
            status: response.status,
            headers: {
            "Content-Type": response.headers.get("Content-Type") || "application/json",
              ...corsHeaders,
            },
          });
        }
      }

      const responseHeaders = new Headers(response.headers);
      Object.keys(corsHeaders).forEach((key) => {
        responseHeaders.set(key, corsHeaders[key]);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      // 网络错误也尝试重试
      if (attempt < MAX_RETRIES) {
        console.log(`Network error, retry ${attempt + 1}/${MAX_RETRIES} after ${RETRY_DELAYS[attempt]}ms`);
        await delay(RETRY_DELAYS[attempt]);
        continue;
      }
    return jsonResponse({
          error: "Proxy request failed",
          message: error.message,
          datacenter: colo,
          country: country,
    }, 500);
    }
  }
}

// =========================================
// 角色管理 API
// =========================================

async function handleCharactersAPI(request, env, pathname) {
  const method = request.method;
  const user = await getUserFromRequest(request, env);
  
  if (!user) {
    return errorResponse('请先登录', 401);
  }

  // GET /api/characters - 获取用户的所有角色
  if (pathname === '/api/characters' && method === 'GET') {
    return await getUserCharacters(env, user);
  }

  // GET /api/characters/:id - 获取单个角色详情
  const getMatch = pathname.match(/^\/api\/characters\/([^\/]+)$/);
  if (getMatch && method === 'GET') {
    return await getCharacter(env, user, getMatch[1]);
  }

  // POST /api/characters - 创建角色
  if (pathname === '/api/characters' && method === 'POST') {
    return await createCharacter(request, env, user);
  }

  // PUT /api/characters/:id - 更新角色
  const putMatch = pathname.match(/^\/api\/characters\/([^\/]+)$/);
  if (putMatch && method === 'PUT') {
    return await updateCharacter(request, env, user, putMatch[1]);
  }

  // DELETE /api/characters/:id - 删除角色
  const deleteMatch = pathname.match(/^\/api\/characters\/([^\/]+)$/);
  if (deleteMatch && method === 'DELETE') {
    return await deleteCharacter(env, user, deleteMatch[1]);
  }

  // POST /api/characters/:id/photos - 添加照片
  const photosMatch = pathname.match(/^\/api\/characters\/([^\/]+)\/photos$/);
  if (photosMatch && method === 'POST') {
    return await addCharacterPhoto(request, env, user, photosMatch[1]);
  }

  // DELETE /api/characters/:id/photos/:photoId - 删除照片
  const deletePhotoMatch = pathname.match(/^\/api\/characters\/([^\/]+)\/photos\/([^\/]+)$/);
  if (deletePhotoMatch && method === 'DELETE') {
    return await deleteCharacterPhoto(env, user, deletePhotoMatch[1], deletePhotoMatch[2]);
  }

  return errorResponse('Not found', 404);
}

// 获取用户的所有角色
async function getUserCharacters(env, user) {
  try {
    const charactersJson = await env.CHARACTERS_KV.get(`user:${user.id}:characters`);
    const characters = charactersJson ? JSON.parse(charactersJson) : [];
    
    // 获取用户权限限制
    const plan = USER_PLANS[user.plan] || USER_PLANS.FREE;
    
    return jsonResponse({
      characters,
      limits: {
        maxCharacters: plan.maxCharacters,
        maxPhotosPerCharacter: plan.maxPhotosPerCharacter,
        currentCount: characters.length
      }
    });
  } catch (e) {
    console.error('Get characters error:', e);
    return errorResponse('获取角色列表失败', 500);
  }
}

// 获取单个角色详情
async function getCharacter(env, user, characterId) {
  try {
    const charactersJson = await env.CHARACTERS_KV.get(`user:${user.id}:characters`);
    const characters = charactersJson ? JSON.parse(charactersJson) : [];
    
    const character = characters.find(c => c.id === characterId);
    if (!character) {
      return errorResponse('角色不存在', 404);
    }
    
    return jsonResponse(character);
  } catch (e) {
    console.error('Get character error:', e);
    return errorResponse('获取角色失败', 500);
  }
}

// 创建角色
async function createCharacter(request, env, user) {
  try {
    const body = await request.json();
    const { name, description } = body;
    
    if (!name) {
      return errorResponse('角色名称不能为空');
    }
    
    // 获取现有角色
    const charactersJson = await env.CHARACTERS_KV.get(`user:${user.id}:characters`);
    const characters = charactersJson ? JSON.parse(charactersJson) : [];
    
    // 检查权限限制
    const plan = USER_PLANS[user.plan] || USER_PLANS.FREE;
    if (characters.length >= plan.maxCharacters) {
      return errorResponse(`${plan.name}最多创建 ${plan.maxCharacters} 个角色，请升级套餐`);
    }
    
    // 创建新角色
    const character = {
      id: crypto.randomUUID(),
      name,
      description: description || '',
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    characters.push(character);
    await env.CHARACTERS_KV.put(`user:${user.id}:characters`, JSON.stringify(characters));
    
    return jsonResponse({
      success: true,
      message: '角色创建成功',
      character
    }, 201);
  } catch (e) {
    console.error('Create character error:', e);
    return errorResponse('创建角色失败: ' + e.message, 500);
  }
}

// 更新角色
async function updateCharacter(request, env, user, characterId) {
  try {
    const body = await request.json();
    const { name, description } = body;
    
    const charactersJson = await env.CHARACTERS_KV.get(`user:${user.id}:characters`);
    const characters = charactersJson ? JSON.parse(charactersJson) : [];
    
    const index = characters.findIndex(c => c.id === characterId);
    if (index === -1) {
      return errorResponse('角色不存在', 404);
    }
    
    // 更新字段
    if (name !== undefined) characters[index].name = name;
    if (description !== undefined) characters[index].description = description;
    characters[index].updatedAt = new Date().toISOString();
    
    await env.CHARACTERS_KV.put(`user:${user.id}:characters`, JSON.stringify(characters));
    
    return jsonResponse({
      success: true,
      message: '角色更新成功',
      character: characters[index]
    });
  } catch (e) {
    console.error('Update character error:', e);
    return errorResponse('更新角色失败: ' + e.message, 500);
  }
}

// 删除角色
async function deleteCharacter(env, user, characterId) {
  try {
    const charactersJson = await env.CHARACTERS_KV.get(`user:${user.id}:characters`);
    const characters = charactersJson ? JSON.parse(charactersJson) : [];
    
    const index = characters.findIndex(c => c.id === characterId);
    if (index === -1) {
      return errorResponse('角色不存在', 404);
    }
    
    characters.splice(index, 1);
    await env.CHARACTERS_KV.put(`user:${user.id}:characters`, JSON.stringify(characters));
    
    return jsonResponse({
      success: true,
      message: '角色已删除'
    });
  } catch (e) {
    console.error('Delete character error:', e);
    return errorResponse('删除角色失败: ' + e.message, 500);
  }
}

// 添加照片到角色
async function addCharacterPhoto(request, env, user, characterId) {
  try {
    const body = await request.json();
    const { photoData, originalData, mimeType, description, thumbnailSize, originalSize } = body;
    
    if (!photoData) {
      return errorResponse('照片数据不能为空');
    }
    
    const charactersJson = await env.CHARACTERS_KV.get(`user:${user.id}:characters`);
    const characters = charactersJson ? JSON.parse(charactersJson) : [];
    
    const index = characters.findIndex(c => c.id === characterId);
    if (index === -1) {
      return errorResponse('角色不存在', 404);
    }
    
    // 检查照片数量限制
    const plan = USER_PLANS[user.plan] || USER_PLANS.FREE;
    if (characters[index].photos.length >= plan.maxPhotosPerCharacter) {
      return errorResponse(`${plan.name}每个角色最多上传 ${plan.maxPhotosPerCharacter} 张照片`);
    }
    
    // 添加照片（支持双版本）
    const photo = {
      id: crypto.randomUUID(),
      data: photoData,                    // 缩略图 Base64（预览用）
      originalData: originalData || photoData,  // 原图 Base64（下载用，如果没有则使用缩略图）
      mimeType: mimeType || 'image/jpeg',
      description: description || '',
      thumbnailSize: thumbnailSize || 0,  // 缩略图大小
      originalSize: originalSize || 0,    // 原图大小
      createdAt: new Date().toISOString()
    };
    
    characters[index].photos.push(photo);
    characters[index].updatedAt = new Date().toISOString();
    
    await env.CHARACTERS_KV.put(`user:${user.id}:characters`, JSON.stringify(characters));
    
    // 返回时不包含完整的 base64 数据
    const photoResponse = { 
      ...photo, 
      data: undefined, 
      originalData: undefined,
      hasData: true,
      hasThumbnail: !!photoData,
      hasOriginal: !!originalData
    };
    
    return jsonResponse({
      success: true,
      message: '照片上传成功',
      photo: photoResponse
    }, 201);
  } catch (e) {
    console.error('Add photo error:', e);
    return errorResponse('上传照片失败: ' + e.message, 500);
    }
}

// 删除角色的照片
async function deleteCharacterPhoto(env, user, characterId, photoId) {
  try {
    const charactersJson = await env.CHARACTERS_KV.get(`user:${user.id}:characters`);
    const characters = charactersJson ? JSON.parse(charactersJson) : [];
    
    const charIndex = characters.findIndex(c => c.id === characterId);
    if (charIndex === -1) {
      return errorResponse('角色不存在', 404);
    }
    
    const photoIndex = characters[charIndex].photos.findIndex(p => p.id === photoId);
    if (photoIndex === -1) {
      return errorResponse('照片不存在', 404);
    }
    
    characters[charIndex].photos.splice(photoIndex, 1);
    characters[charIndex].updatedAt = new Date().toISOString();
    
    await env.CHARACTERS_KV.put(`user:${user.id}:characters`, JSON.stringify(characters));
    
    return jsonResponse({
      success: true,
      message: '照片已删除'
    });
  } catch (e) {
    console.error('Delete photo error:', e);
    return errorResponse('删除照片失败: ' + e.message, 500);
  }
}

// =========================================
// 历史记录 API
// =========================================

async function handleHistoryAPI(request, env, pathname) {
  const method = request.method;
  
  // 验证用户登录
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  // GET /api/history - 获取用户的历史记录
  if (pathname === '/api/history' && method === 'GET') {
    return await getUserHistory(env, user);
  }

  // POST /api/history - 保存历史记录
  if (pathname === '/api/history' && method === 'POST') {
    return await saveHistoryRecord(request, env, user);
  }
  
  // GET /api/history/image/:key - 从 R2 获取历史记录原图
  const imageMatch = pathname.match(/^\/api\/history\/image\/(.+)$/);
  if (imageMatch && method === 'GET') {
    return await getHistoryImage(env, user, decodeURIComponent(imageMatch[1]));
  }

  // DELETE /api/history/:id - 删除单条历史记录
  const deleteMatch = pathname.match(/^\/api\/history\/([^\/]+)$/);
  if (deleteMatch && method === 'DELETE') {
    return await deleteHistoryRecord(env, user, deleteMatch[1]);
  }

  // DELETE /api/history - 清空所有历史记录
  if (pathname === '/api/history' && method === 'DELETE') {
    return await clearUserHistory(env, user);
  }

  return errorResponse('Not found', 404);
}

// 从 R2 获取历史记录原图
async function getHistoryImage(env, user, r2Key) {
  try {
    // 验证 R2 key 的用户 ID 与当前用户匹配，防止未授权访问
    const keyParts = r2Key.split('/');
    if (keyParts.length < 4 || keyParts[0] !== 'history' || keyParts[1] !== user.id) {
      return errorResponse('Forbidden', 403);
    }
    
    const object = await env.IMAGES_BUCKET.get(r2Key);
    if (!object) {
      return errorResponse('Image not found', 404);
    }
    
    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
    headers.set('Cache-Control', 'private, max-age=31536000');
    // 添加 CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return new Response(object.body, { headers });
  } catch (e) {
    console.error('Get history image error:', e);
    return errorResponse('Failed to get image: ' + e.message, 500);
  }
}

// 获取用户历史记录
async function getUserHistory(env, user) {
  try {
    const key = `history:${user.id}`;
    const data = await env.HISTORY_KV.get(key, 'json');
    return jsonResponse(data || { records: [], images: {} });
  } catch (e) {
    console.error('Get history error:', e);
    return errorResponse('Failed to get history', 500);
  }
}

// 保存历史记录
async function saveHistoryRecord(request, env, user) {
  try {
    const body = await request.json();
    const { record, originalImages } = body;
    
    if (!record || !record.id) {
      return errorResponse('Invalid record data', 400);
    }

    const key = `history:${user.id}`;
    let data = await env.HISTORY_KV.get(key, 'json') || { records: [] };
    
    // 保存原图到 R2（如果有）
    if (originalImages && originalImages.length > 0) {
      const imageKeys = [];
      for (let i = 0; i < originalImages.length; i++) {
        const img = originalImages[i];
        const r2Key = `history/${user.id}/${record.id}/original_${i}.${img.mimeType.split('/')[1] || 'jpg'}`;

        // 清理 base64 数据（移除可能的 data URI 前缀）
        let base64Data = img.base64;
        if (base64Data.includes(',')) {
          base64Data = base64Data.split(',')[1];
        }

        // 将 base64 转换为 ArrayBuffer 并存储到 R2
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }

        await env.IMAGES_BUCKET.put(r2Key, bytes.buffer, {
          httpMetadata: { contentType: img.mimeType }
        });

        imageKeys.push(r2Key);
      }
      // 在 record 中存储 R2 原图 keys
      record.imageKeys = imageKeys;
    }
    
    // 保存缩略图到 R2（如果有）
    if (record.thumbnails && record.thumbnails.length > 0) {
      const thumbKeys = [];
      for (let i = 0; i < record.thumbnails.length; i++) {
        const thumb = record.thumbnails[i];
        const r2Key = `history/${user.id}/${record.id}/thumb_${i}.${thumb.mimeType.split('/')[1] || 'jpg'}`;

        // 清理 base64 数据（移除可能的 data URI 前缀）
        let base64Data = thumb.base64;
        if (base64Data.includes(',')) {
          base64Data = base64Data.split(',')[1];
        }

        // 将 base64 转换为 ArrayBuffer 并存储到 R2
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }

        await env.IMAGES_BUCKET.put(r2Key, bytes.buffer, {
          httpMetadata: { contentType: thumb.mimeType }
        });

        thumbKeys.push(r2Key);
      }
      // 在 record 中存储 R2 缩略图 keys，删除原始 base64 数据
      record.thumbKeys = thumbKeys;
      delete record.thumbnails;
    }
    
    // 添加新记录到开头
    data.records.unshift(record);
    
    // 限制历史记录数量为 50 条
    while (data.records.length > 50) {
      const removed = data.records.pop();
      // 删除 R2 中的原图和缩略图
      if (removed) {
        const keysToDelete = [...(removed.imageKeys || []), ...(removed.thumbKeys || [])];
        for (const key of keysToDelete) {
          try {
            await env.IMAGES_BUCKET.delete(key);
          } catch (e) {
            console.error('Failed to delete R2 image:', key, e);
          }
        }
      }
    }
    
    await env.HISTORY_KV.put(key, JSON.stringify(data));
    
    return jsonResponse({ success: true, recordId: record.id });
  } catch (e) {
    console.error('Save history error:', e);
    return errorResponse('Failed to save history: ' + e.message, 500);
  }
}

// 删除单条历史记录
async function deleteHistoryRecord(env, user, recordId) {
  try {
    const key = `history:${user.id}`;
    let data = await env.HISTORY_KV.get(key, 'json');
    
    if (!data) {
      return errorResponse('History not found', 404);
    }
    
    const id = parseInt(recordId);
    data.records = data.records.filter(r => r.id !== id);
    
    // 删除对应的原图
    if (data.images[id]) {
      delete data.images[id];
    }
    
    await env.HISTORY_KV.put(key, JSON.stringify(data));
    
    return jsonResponse({ success: true });
  } catch (e) {
    console.error('Delete history error:', e);
    return errorResponse('Failed to delete history', 500);
  }
}

// 清空用户历史记录
async function clearUserHistory(env, user) {
  try {
    const key = `history:${user.id}`;
    await env.HISTORY_KV.delete(key);
    return jsonResponse({ success: true });
  } catch (e) {
    console.error('Clear history error:', e);
    return errorResponse('Failed to clear history', 500);
  }
}

// =========================================
// 主入口
// =========================================

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // 健康检查
    if (pathname === "/" || pathname === "/health") {
      return jsonResponse({
        status: "ok",
        message: "Gemini API Proxy + Template API + User Auth + Characters + History",
        endpoints: {
          templates: "/api/templates",
          auth: "/api/auth/*",
          characters: "/api/characters/*",
          history: "/api/history/*",
          admin: "/api/admin/*",
          gemini: "/v1beta/models/{model}:generateContent",
        },
      });
    }

    // 用户认证 API
    if (pathname.startsWith("/api/auth/")) {
      return await handleAuthAPI(request, env, pathname);
    }

    // 历史记录 API
    if (pathname.startsWith("/api/history")) {
      return await handleHistoryAPI(request, env, pathname);
    }

    // 角色管理 API
    if (pathname.startsWith("/api/characters")) {
      return await handleCharactersAPI(request, env, pathname);
    }

    // 用户管理 API（管理员）
    if (pathname.startsWith("/api/admin/")) {
      return await handleUsersAdminAPI(request, env, pathname);
    }

    // 模板 API（包括图片上传）
    if (pathname.startsWith("/api/templates") || pathname === "/api/upload/image") {
      return await handleTemplatesAPI(request, env, pathname);
    }
    
    // 获取图片（公开访问，不需要认证）
    const imageMatch = pathname.match(/^\/api\/images\/(.+)$/);
    if (imageMatch) {
      return await getImage(env, imageMatch[1]);
    }

    // // POST /api/generate - 生成图片（代理 Gemini）
  if (pathname === '/api/generate' && method === 'POST') {
    return await handleGenerate(request, env);
  }

  // Gemini API 代理
  if (pathname.startsWith("/v1beta/")) {
    return await handleGeminiProxy(request, env, url);
  }

  return errorResponse("Not found", 404);
  },
};

// =========================================
// 图片生成处理 (Wrapper for Gemini)
// =========================================

async function handleGenerate(request, env) {
  const user = await getUserFromRequest(request, env);
  if (!user) {
    return errorResponse('请先登录', 401);
  }

  try {
    const body = await request.json();
    const { model, templateId, characterId, ratio, width, height } = body;

    // 🔍 打印请求入参
    console.log('=== Generate Request ===');
    console.log('User ID:', user.id);
    console.log('Request body:', JSON.stringify(body));
    console.log('model:', model);
    console.log('templateId:', templateId);
    console.log('characterId:', characterId);
    console.log('ratio:', ratio);
    console.log('width:', width, 'height:', height);

    // 1. 获取模板信息
    let template;
    if (env.TEMPLATES_KV) {
      const templatesJson = await env.TEMPLATES_KV.get("templates");
      if (templatesJson) {
        const templates = JSON.parse(templatesJson);
        template = templates.find(t => t.id === templateId);
      }
    }
    if (!template) {
      template = defaultTemplates.find(t => t.id === templateId);
    }
    if (!template) {
      return errorResponse('模板不存在', 404);
    }

    console.log('Template found:', template.id, template.name?.zh || template.name);

    // 2. 获取角色信息 (如果有)
    let characterPrompt = '';
    let characterImage = null;

    if (characterId) {
      const charactersJson = await env.CHARACTERS_KV.get(`user:${user.id}:characters`);
      const characters = charactersJson ? JSON.parse(charactersJson) : [];
      const character = characters.find(c => c.id === characterId);
      
      if (character) {
        // 构建角色 Prompt
        characterPrompt = `Subject is a specific person: ${character.name}. ${character.description || ''}. `;
        
        // 获取第一张照片作为参考图 (Base64)
        if (character.photos && character.photos.length > 0) {
          // 优先使用原图，如果没有则使用缩略图
          // 注意：这里我们需要完整的 base64 数据传给 Gemini
          // 现在的实现中，photos 数组里存的是 base64 字符串
          characterImage = character.photos[0].originalData || character.photos[0].data;
        }
      }
    }

    // 3. 构建 Gemini 请求
    // 合并 Prompt: 角色描述 + 模板 Prompt
    const finalPrompt = `${characterPrompt}${template.prompt}. Aspect ratio ${ratio || '1:1'}. High quality, detailed.`;

    console.log('Final prompt:', finalPrompt);
    console.log('Has character image:', !!characterImage);

    // 调用 Gemini API
    const geminiUrl = `${GEMINI_API_BASE}/v1beta/models/${model || 'gemini-3-pro-image-preview'}:generateContent?key=${env.GEMINI_API_KEY}`;

    console.log('Gemini URL:', geminiUrl.replace(env.GEMINI_API_KEY, '***REDACTED***'));

    const contents = [];
    const parts = [{ text: finalPrompt }];

    // 如果有参考图，添加到请求中
    if (characterImage) {
      // 移除 data:image/jpeg;base64, 前缀
      const base64Data = characterImage.replace(/^data:image\/\w+;base64,/, "");
      console.log('Character image base64 length:', base64Data.length);
      parts.push({
        inlineData: {  // 使用驼峰命名
          mimeType: "image/jpeg",
          data: base64Data
        }
      });
    }

    contents.push({ parts });

    const requestBody = { contents };
    console.log('Request to Gemini:', JSON.stringify(requestBody, null, 2));

    const geminiResp = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    console.log('Gemini response status:', geminiResp.status);

    const geminiData = await geminiResp.json();

    // 🔍 详细打印 Gemini 响应
    console.log('=== Gemini API Response ===');
    console.log('Full response:', JSON.stringify(geminiData, null, 2));

    // 检查响应结构
    if (geminiData.candidates) {
      console.log('Has candidates:', geminiData.candidates.length);
      geminiData.candidates.forEach((candidate, idx) => {
        console.log(`Candidate ${idx}:`, JSON.stringify(candidate, null, 2));
        if (candidate.content?.parts) {
          console.log(`Parts count:`, candidate.content.parts.length);
          candidate.content.parts.forEach((part, pIdx) => {
            console.log(`Part ${pIdx}:`, Object.keys(part));
            if (part.inlineData) {
              console.log(`  Has inlineData: YES, mimeType=${part.inlineData.mimeType}, data length=${part.inlineData.data?.length}`);
            } else if (part.text) {
              console.log(`  Has text: YES, length=${part.text.length}, preview=${part.text.substring(0, 100)}`);
            }
          });
        }
      });
    }

    if (geminiData.error) {
      throw new Error(geminiData.error.message);
    }

    // 4. 直接返回 Gemini 的原始响应
    console.log('=== Returning response to frontend ===');
    return jsonResponse(geminiData);

  } catch (e) {
    console.error('Generate error:', e);
    return errorResponse('生成失败: ' + e.message, 500);
  }
}
