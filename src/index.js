/**
 * Gemini API Proxy + Template Management API + User Authentication
 * Cloudflare Workers
 */

import { createWechatPayClient } from './wechat-pay/client.js';

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

  return errorResponse('Not found', 404);
}

// 注册用户（支持邀请码绑定 + 新人积分奖励）
async function registerUser(request, env) {
  try {
    const body = await request.json();
    const { email, password, nickname, ref } = body; // ref 为邀请码

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

    // =========================================
    // 积分系统集成（如果 D1 数据库可用）
    // =========================================
    let pointsInfo = null;
    let referralInfo = null;
    
    if (env.DB) {
      try {
        // 1. 发放新人注册奖励（100 积分）
        const signupResult = await grantSignupBonusPoints(env.DB, userId);
        if (signupResult.success) {
          pointsInfo = {
            bonus: signupResult.delta,
            balance: signupResult.balance,
            message: '获得新人注册奖励 100 积分'
          };
        }

        // 2. 绑定邀请关系（如果有邀请码）
        if (ref) {
          const bindResult = await bindReferralRelation(env.DB, userId, ref);
          if (bindResult.success) {
            referralInfo = {
              inviterUserId: bindResult.inviterUserId,
              message: '邀请关系绑定成功'
            };
          }
        }
      } catch (pointsError) {
        console.error('Points system error:', pointsError);
        // 积分系统错误不影响注册流程
      }
    }

    // 返回用户信息（不包含密码）
    const { passwordHash: _, ...safeUser } = user;
    return jsonResponse({
      success: true,
      message: '注册成功',
      user: safeUser,
      token,
      plan: USER_PLANS[user.plan],
      points: pointsInfo,
      referral: referralInfo
    }, 201);

  } catch (e) {
    console.error('Register error:', e);
    return errorResponse('注册失败: ' + e.message, 500);
  }
}

// =========================================
// 积分系统辅助函数（内联实现，避免 ES Module 导入问题）
// =========================================

// 积分配置
const POINTS_CONFIG = {
  POINTS_PER_IMAGE: 10,
  SIGNUP_BONUS_POINTS: 100,
  REFERRAL_BONUS_POINTS: 100,
};

// 发放新人注册奖励
async function grantSignupBonusPoints(db, userId) {
  const idempotencyKey = `signup_bonus:${userId}`;
  return await grantPointsInternal(db, userId, POINTS_CONFIG.SIGNUP_BONUS_POINTS, 'signup_bonus', 'user', userId, idempotencyKey);
}

// 绑定邀请关系
async function bindReferralRelation(db, inviteeUserId, referralCode) {
  try {
    if (!referralCode) return { success: false };

    // 获取邀请码所有者
    const codeRecord = await db.prepare(
      'SELECT owner_user_id FROM referral_codes WHERE code = ?'
    ).bind(referralCode.toUpperCase()).first();

    if (!codeRecord) return { success: false, message: '无效的邀请码' };

    const inviterUserId = codeRecord.owner_user_id;
    if (inviterUserId === inviteeUserId) return { success: false, message: '不能使用自己的邀请码' };

    // 检查是否已绑定
    const existing = await db.prepare(
      'SELECT id FROM referrals WHERE invitee_user_id = ?'
    ).bind(inviteeUserId).first();

    if (existing) return { success: false, message: '已绑定过邀请关系' };

    // 创建邀请关系
    await db.prepare(`
      INSERT INTO referrals (inviter_user_id, invitee_user_id, source_code, rewarded)
      VALUES (?, ?, ?, 0)
    `).bind(inviterUserId, inviteeUserId, referralCode.toUpperCase()).run();

    return { success: true, inviterUserId };
  } catch (error) {
    console.error('bindReferralRelation error:', error);
    return { success: false };
  }
}

// 统一积分发放（内部实现）
async function grantPointsInternal(db, userId, delta, reason, refType, refId, idempotencyKey) {
  try {
    // 幂等检查
    if (idempotencyKey) {
      const existing = await db.prepare(
        'SELECT balance_after FROM points_ledger WHERE idempotency_key = ?'
      ).bind(idempotencyKey).first();
      if (existing) {
        return { success: true, balance: existing.balance_after, idempotent: true };
      }
    }

    // 获取或创建钱包
    let wallet = await db.prepare('SELECT * FROM user_wallets WHERE user_id = ?').bind(userId).first();
    if (!wallet) {
      await db.prepare('INSERT INTO user_wallets (user_id, points_balance) VALUES (?, 0)').bind(userId).run();
      wallet = { points_balance: 0 };
    }

    const newBalance = wallet.points_balance + delta;
    if (delta < 0 && newBalance < 0) {
      return { success: false, message: '积分余额不足' };
    }

    const now = new Date().toISOString();
    await db.prepare('UPDATE user_wallets SET points_balance = ?, updated_at = ? WHERE user_id = ?')
      .bind(newBalance, now, userId).run();
    await db.prepare(`
      INSERT INTO points_ledger (user_id, delta, balance_after, reason, ref_type, ref_id, idempotency_key, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(userId, delta, newBalance, reason, refType, refId, idempotencyKey, now).run();

    return { success: true, balance: newBalance, delta };
  } catch (error) {
    console.error('grantPointsInternal error:', error);
    return { success: false, message: error.message };
  }
}

// 套餐定义
const SUBSCRIPTION_PLANS = {
  standard: { id: 'standard', name: 'Standard', price: 19900, monthly_points: 1000, duration_days: 365 },
  pro: { id: 'pro', name: 'Pro', price: 59900, monthly_points: 5000, duration_days: 365 }
};

// =========================================
// 微信支付 API 处理
// =========================================
async function handleWechatPayAPI(request, env, pathname, user) {
  const method = request.method;
  const db = env.DB;

  if (!db) {
    return jsonResponse({ success: false, error: '支付系统未启用' }, 503);
  }

  // POST /api/payment/wechat/create - 创建微信支付订单
  if (pathname === '/api/payment/wechat/create' && method === 'POST') {
    if (!user) return errorResponse('未登录', 401);

    try {
      const body = await request.json();
      const { order_no } = body;

      if (!order_no) {
        return jsonResponse({ success: false, error: '缺少订单号' }, 400);
      }

      // 查询订单
      const order = await db.prepare('SELECT * FROM orders WHERE order_no = ?').bind(order_no).first();

      if (!order) {
        return jsonResponse({ success: false, error: '订单不存在' }, 404);
      }

      if (order.user_id !== user.id) {
        return jsonResponse({ success: false, error: '无权操作此订单' }, 403);
      }

      if (order.status !== 'pending') {
        return jsonResponse({ success: false, error: `订单状态不正确: ${order.status}` }, 400);
      }

      // 创建微信支付客户端
      const wechatPay = createWechatPayClient(env);

      // 调用微信支付 Native 下单 API
      const payResult = await wechatPay.nativePay({
        description: `Dream Photo Studio - ${order.product_type}`,
        outTradeNo: order_no,
        total: Math.round(order.final_amount), // 转换为分
        clientIp: request.headers.get('CF-Connecting-IP') || '127.0.0.1'
      });

      if (payResult.code_url) {
        // 更新订单，保存微信支付相关数据
        await db.prepare(`
          UPDATE orders
          SET wechat_code_url = ?, wechat_pay_params = ?, updated_at = ?
          WHERE order_no = ?
        `).bind(
          payResult.code_url,
          JSON.stringify(payResult),
          new Date().toISOString(),
          order_no
        ).run();

        return jsonResponse({
          success: true,
          code_url: payResult.code_url,
          order_no: order_no,
          amount: order.final_amount
        });
      } else {
        console.error('Wechat Pay Error:', payResult);
        return jsonResponse({
          success: false,
          error: '创建支付订单失败',
          details: payResult
        }, 500);
      }
    } catch (e) {
      console.error('Create Wechat Pay Error:', e);
      return errorResponse('创建支付订单失败: ' + e.message, 500);
    }
  }

  // POST /api/payment/wechat/notify - 微信支付回调
  if (pathname === '/api/payment/wechat/notify' && method === 'POST') {
    try {
      const body = await request.text();
      const data = JSON.parse(body);

      // 创建微信支付客户端
      const wechatPay = createWechatPayClient(env);

      // 验证签名
      const timestamp = request.headers.get('Wechatpay-Timestamp');
      const nonce = request.headers.get('Wechatpay-Nonce');
      const signature = request.headers.get('Wechatpay-Signature');
      const serial = request.headers.get('Wechatpay-Serial');

      if (!wechatPay.verifySignature(timestamp, nonce, body, signature, serial)) {
        return jsonResponse({
          code: 'FAIL',
          message: '签名验证失败'
        }, 401);
      }

      // 解密回调数据
      const resource = data.resource;
      const decrypted = await wechatPay.decryptCallback(
        resource.ciphertext,
        resource.associated_data,
        resource.nonce
      );

      const outTradeNo = decrypted.out_trade_no;
      const transactionId = decrypted.transaction_id;
      const tradeState = decrypted.trade_state;

      // 查询订单
      const order = await db.prepare('SELECT * FROM orders WHERE order_no = ?').bind(outTradeNo).first();

      if (!order) {
        console.error('Order not found:', outTradeNo);
        return jsonResponse({ code: 'FAIL', message: '订单不存在' }, 404);
      }

      // 更新订单状态
      if (tradeState === 'SUCCESS') {
        await db.prepare('BEGIN TRANSACTION').run();

        try {
          // 更新订单状态
          await db.prepare(`
            UPDATE orders
            SET status = 'paid', paid_at = ?, provider_tx_id = ?, wechat_transaction_id = ?, updated_at = ?
            WHERE order_no = ?
          `).bind(
            new Date().toISOString(),
            transactionId,
            transactionId,
            new Date().toISOString(),
            outTradeNo
          ).run();

          // 发放订阅权益
          await grantSubscriptionBenefits(db, order);

          await db.prepare('COMMIT').run();

          return jsonResponse({ code: 'SUCCESS', message: '成功' });
        } catch (error) {
          await db.prepare('ROLLBACK').run();
          throw error;
        }
      } else {
        console.error('Payment failed:', tradeState);
        return jsonResponse({
          code: 'FAIL',
          message: `支付失败: ${tradeState}`
        }, 400);
      }
    } catch (e) {
      console.error('Wechat Pay Notify Error:', e);
      return jsonResponse({
        code: 'FAIL',
        message: '处理失败'
      }, 500);
    }
  }

  // POST /api/payment/wechat/query - 查询支付结果
  if (pathname === '/api/payment/wechat/query' && method === 'POST') {
    if (!user) return errorResponse('未登录', 401);

    try {
      const body = await request.json();
      const { order_no } = body;

      const order = await db.prepare('SELECT * FROM orders WHERE order_no = ? AND user_id = ?')
        .bind(order_no, user.id)
        .first();

      if (!order) {
        return jsonResponse({ success: false, error: '订单不存在' }, 404);
      }

      // 如果订单已支付，直接返回
      if (order.status === 'paid') {
        return jsonResponse({
          success: true,
          status: 'paid',
          order: order
        });
      }

      // 查询微信支付状态
      const wechatPay = createWechatPayClient(env);
      const result = await wechatPay.queryOrder(order_no);

      if (result.trade_state === 'SUCCESS') {
        // 更新订单状态
        await db.prepare('BEGIN TRANSACTION').run();

        try {
          await db.prepare(`
            UPDATE orders
            SET status = 'paid', paid_at = ?, wechat_transaction_id = ?, updated_at = ?
            WHERE order_no = ?
          `).bind(
            new Date().toISOString(),
            result.transaction_id,
            new Date().toISOString(),
            order_no
          ).run();

          // 发放订阅权益
          await grantSubscriptionBenefits(db, order);

          await db.prepare('COMMIT').run();

          return jsonResponse({
            success: true,
            status: 'paid',
            order: { ...order, status: 'paid' }
          });
        } catch (error) {
          await db.prepare('ROLLBACK').run();
          throw error;
        }
      } else if (result.trade_state === 'NOTPAY') {
        return jsonResponse({
          success: true,
          status: 'pending',
          message: '等待支付'
        });
      } else if (result.trade_state === 'CLOSED') {
        return jsonResponse({
          success: true,
          status: 'closed',
          message: '订单已关闭'
        });
      } else {
        return jsonResponse({
          success: true,
          status: result.trade_state,
          message: result.trade_state_desc || '未知状态'
        });
      }
    } catch (e) {
      console.error('Query Wechat Pay Error:', e);
      return errorResponse('查询支付状态失败: ' + e.message, 500);
    }
  }

  return errorResponse('Not found', 404);
}

// =========================================
// 积分系统 API 处理
// =========================================
async function handlePointsAPI(request, env, pathname, user) {
  const method = request.method;
  const db = env.DB;

  // 检查数据库是否可用
  if (!db) {
    return jsonResponse({ success: false, error: '积分系统未启用' }, 503);
  }

  // GET /api/wallet/me - 获取我的钱包信息
  if (pathname === '/api/wallet/me' && method === 'GET') {
    if (!user) return errorResponse('未登录', 401);
    
    let wallet = await db.prepare('SELECT * FROM user_wallets WHERE user_id = ?').bind(user.id).first();
    if (!wallet) wallet = { user_id: user.id, points_balance: 0 };
    
    const subscription = await db.prepare(
      "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' AND end_at > datetime('now') ORDER BY end_at DESC LIMIT 1"
    ).bind(user.id).first();

    return jsonResponse({
      success: true,
      wallet: {
        points_balance: wallet.points_balance,
        subscription: subscription ? {
          plan_id: subscription.plan_id,
          plan_name: SUBSCRIPTION_PLANS[subscription.plan_id]?.name,
          end_at: subscription.end_at,
          monthly_points: SUBSCRIPTION_PLANS[subscription.plan_id]?.monthly_points
        } : null
      }
    });
  }

  // GET /api/wallet/transactions - 获取积分流水
  if (pathname === '/api/wallet/transactions' && method === 'GET') {
    if (!user) return errorResponse('未登录', 401);
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const transactions = await db.prepare(
      'SELECT * FROM points_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(user.id, limit, offset).all();
    return jsonResponse({ success: true, transactions: transactions.results || [] });
  }

  // GET /api/referral/me - 获取我的邀请码和统计
  if (pathname === '/api/referral/me' && method === 'GET') {
    if (!user) return errorResponse('未登录', 401);
    
    // 获取或创建邀请码
    let codeRecord = await db.prepare('SELECT code FROM referral_codes WHERE owner_user_id = ?').bind(user.id).first();
    if (!codeRecord) {
      const code = generateReferralCode(user.id);
      await db.prepare('INSERT INTO referral_codes (code, owner_user_id) VALUES (?, ?)').bind(code, user.id).run();
      codeRecord = { code };
    }
    
    // 统计邀请人数
    const stats = await db.prepare(`
      SELECT COUNT(*) as total_invited, SUM(CASE WHEN rewarded = 1 THEN 1 ELSE 0 END) as total_rewarded
      FROM referrals WHERE inviter_user_id = ?
    `).bind(user.id).first();

    return jsonResponse({
      success: true,
      code: codeRecord.code,
      totalInvited: stats?.total_invited || 0,
      totalRewarded: stats?.total_rewarded || 0,
      totalPoints: (stats?.total_rewarded || 0) * POINTS_CONFIG.REFERRAL_BONUS_POINTS,
      pointsPerReferral: POINTS_CONFIG.REFERRAL_BONUS_POINTS
    });
  }

  // POST /api/promo/validate - 校验优惠码
  if (pathname === '/api/promo/validate' && method === 'POST') {
    try {
      const body = await request.json();
      const { code, product_type, product_id } = body;
      
      const promo = await db.prepare('SELECT * FROM promo_codes WHERE code = ?').bind(code?.toUpperCase()).first();
      if (!promo) return jsonResponse({ success: true, valid: false, message: '优惠码不存在' });
      if (promo.status !== 'active') return jsonResponse({ success: true, valid: false, message: '优惠码已失效' });
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) return jsonResponse({ success: true, valid: false, message: '优惠码已过期' });
      if (promo.max_uses !== null && promo.used_count >= promo.max_uses) return jsonResponse({ success: true, valid: false, message: '优惠码已达使用上限' });

      const product = SUBSCRIPTION_PLANS[product_id];
      if (!product) return jsonResponse({ success: true, valid: false, message: '无效的产品' });

      const discountAmount = Math.floor(product.price * promo.discount_value / 100);
      return jsonResponse({
        success: true,
        valid: true,
        discount: { type: promo.discount_type, value: promo.discount_value },
        price: { originalAmount: product.price, discountAmount, finalAmount: product.price - discountAmount },
        message: `优惠 ${promo.discount_value}%`
      });
    } catch (e) {
      return errorResponse('请求格式错误', 400);
    }
  }

  // POST /api/prepaid/redeem - 兑换点卡
  if (pathname === '/api/prepaid/redeem' && method === 'POST') {
    if (!user) return errorResponse('未登录', 401);
    try {
      const body = await request.json();
      const formattedCode = body.code?.replace(/[\s-]/g, '').toUpperCase();
      
      const card = await db.prepare('SELECT * FROM prepaid_cards WHERE REPLACE(code, "-", "") = ?').bind(formattedCode).first();
      if (!card) return jsonResponse({ success: false, message: '点卡码不存在' });
      if (card.status !== 'unused') return jsonResponse({ success: false, message: card.status === 'redeemed' ? '点卡已被兑换' : '点卡已失效' });
      if (card.expires_at && new Date(card.expires_at) < new Date()) return jsonResponse({ success: false, message: '点卡已过期' });

      const now = new Date().toISOString();
      
      if (card.card_type === 'points') {
        const idempotencyKey = `prepaid:${card.code}`;
        await grantPointsInternal(db, user.id, card.points_amount, 'prepaid', 'prepaid_card', card.code, idempotencyKey);
      } else if (card.card_type === 'subscription') {
        // 简化版订阅发放
        const plan = SUBSCRIPTION_PLANS[card.plan_id];
        if (plan) {
          const endAt = new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString();
          await db.prepare(`
            INSERT INTO subscriptions (user_id, plan_id, status, start_at, end_at, source, source_ref_id, created_at, updated_at)
            VALUES (?, ?, 'active', ?, ?, 'prepaid', ?, ?, ?)
          `).bind(user.id, card.plan_id, now, endAt, card.code, now, now).run();
          // 发放当月积分
          await grantPointsInternal(db, user.id, plan.monthly_points, 'monthly_grant', 'subscription', card.code, `monthly:${user.id}:${now.substring(0,7)}`);
        }
      }

      await db.prepare('UPDATE prepaid_cards SET status = ?, redeemed_by = ?, redeemed_at = ? WHERE id = ?')
        .bind('redeemed', user.id, now, card.id).run();

      return jsonResponse({
        success: true,
        message: card.card_type === 'subscription' ? `成功兑换 ${SUBSCRIPTION_PLANS[card.plan_id]?.name} 订阅` : `成功兑换 ${card.points_amount} 积分`
      });
    } catch (e) {
      return errorResponse('兑换失败: ' + e.message, 500);
    }
  }

  // GET /api/plans - 获取套餐列表
  if (pathname === '/api/plans' && method === 'GET') {
    const plans = Object.values(SUBSCRIPTION_PLANS).map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      price_display: `¥${(plan.price / 100).toFixed(0)}/年`,
      monthly_points: plan.monthly_points,
      duration_days: plan.duration_days
    }));
    return jsonResponse({ success: true, plans, points_per_image: POINTS_CONFIG.POINTS_PER_IMAGE });
  }

  // POST /api/admin/prepaid/create_batch - 批量生成点卡（管理员）
  if (pathname === '/api/admin/prepaid/create_batch' && method === 'POST') {
    if (!isAdmin(request, env)) return errorResponse('无权限', 403);
    try {
      const body = await request.json();
      const { card_type, plan_id, points_amount, quantity, expires_at } = body;
      if (!card_type || !quantity || quantity < 1 || quantity > 1000) return errorResponse('参数错误');

      const batchId = `BATCH-${Date.now()}`;
      const now = new Date().toISOString();
      const cards = [];

      for (let i = 0; i < quantity; i++) {
        const code = generatePrepaidCode();
        cards.push(code);
        await db.prepare(`
          INSERT INTO prepaid_cards (code, card_type, plan_id, points_amount, status, expires_at, batch_id, created_at)
          VALUES (?, ?, ?, ?, 'unused', ?, ?, ?)
        `).bind(code, card_type, plan_id || null, points_amount || null, expires_at || null, batchId, now).run();
      }

      return jsonResponse({ success: true, batch_id: batchId, cards, quantity: cards.length });
    } catch (e) {
      return errorResponse('生成失败: ' + e.message, 500);
    }
  }

  // POST /api/admin/promo/create - 创建优惠码（管理员）
  if (pathname === '/api/admin/promo/create' && method === 'POST') {
    if (!isAdmin(request, env)) return errorResponse('无权限', 403);
    try {
      const body = await request.json();
      const { code, discount_type = 'percent', discount_value, max_uses, applicable_products = 'all', expires_at } = body;
      if (!code || !discount_value) return errorResponse('缺少必填参数');

      const now = new Date().toISOString();
      await db.prepare(`
        INSERT INTO promo_codes (code, discount_type, discount_value, max_uses, applicable_products, expires_at, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
      `).bind(code.toUpperCase(), discount_type, discount_value, max_uses || null, applicable_products, expires_at || null, now, now).run();

      return jsonResponse({ success: true, message: '优惠码创建成功', code: code.toUpperCase() });
    } catch (e) {
      return errorResponse('创建失败: ' + e.message, 500);
    }
  }

  // POST /api/generation/pre-check - 生成前检查积分并预扣
  if (pathname === '/api/generation/pre-check' && method === 'POST') {
    if (!user) return errorResponse('未登录', 401);
    try {
      const body = await request.json();
      const imageCount = body.image_count || 1;
      const pointsNeeded = imageCount * POINTS_CONFIG.POINTS_PER_IMAGE;

      // 获取用户钱包
      let wallet = await db.prepare('SELECT * FROM user_wallets WHERE user_id = ?').bind(user.id).first();
      const currentBalance = wallet?.points_balance || 0;

      if (currentBalance < pointsNeeded) {
        return jsonResponse({
          success: false,
          error: 'insufficient_points',
          message: `积分不足，需要 ${pointsNeeded} 积分，当前余额 ${currentBalance} 积分`,
          points_needed: pointsNeeded,
          points_balance: currentBalance
        });
      }

      // 生成任务ID用于后续确认
      const jobId = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10分钟过期

      // 记录生成任务（预扣状态）
      await db.prepare(`
        INSERT INTO generation_jobs (id, user_id, points_cost, status, created_at, expires_at)
        VALUES (?, ?, ?, 'pending', ?, ?)
      `).bind(jobId, user.id, pointsNeeded, now, expiresAt).run();

      return jsonResponse({
        success: true,
        job_id: jobId,
        points_cost: pointsNeeded,
        points_balance: currentBalance,
        message: '积分检查通过，可以开始生成'
      });
    } catch (e) {
      return errorResponse('检查失败: ' + e.message, 500);
    }
  }

  // POST /api/generation/confirm - 确认生成完成，扣除积分
  if (pathname === '/api/generation/confirm' && method === 'POST') {
    if (!user) return errorResponse('未登录', 401);
    try {
      const body = await request.json();
      const { job_id, success: genSuccess, images_generated } = body;

      if (!job_id) return errorResponse('缺少 job_id', 400);

      // 查找任务
      const job = await db.prepare('SELECT * FROM generation_jobs WHERE id = ? AND user_id = ?').bind(job_id, user.id).first();
      if (!job) return jsonResponse({ success: false, message: '任务不存在' });
      if (job.status !== 'pending') return jsonResponse({ success: false, message: '任务已处理' });

      const now = new Date().toISOString();

      if (genSuccess && images_generated > 0) {
        // 生成成功，扣除积分
        const actualCost = images_generated * POINTS_CONFIG.POINTS_PER_IMAGE;
        const idempotencyKey = `gen:${job_id}`;
        
        const result = await grantPointsInternal(db, user.id, -actualCost, 'consume', 'generation', job_id, idempotencyKey);
        
        if (result.success) {
          // 更新任务状态
          await db.prepare('UPDATE generation_jobs SET status = ?, completed_at = ?, images_count = ? WHERE id = ?')
            .bind('completed', now, images_generated, job_id).run();

          // 检查是否是首次生成，触发邀请奖励
          await checkAndGrantReferralReward(db, user.id);

          return jsonResponse({
            success: true,
            points_deducted: actualCost,
            new_balance: result.newBalance,
            message: `成功扣除 ${actualCost} 积分`
          });
        } else {
          return jsonResponse({ success: false, message: result.message || '扣除积分失败' });
        }
      } else {
        // 生成失败，取消任务
        await db.prepare('UPDATE generation_jobs SET status = ?, completed_at = ? WHERE id = ?')
          .bind('cancelled', now, job_id).run();

        return jsonResponse({ success: true, message: '任务已取消，未扣除积分' });
      }
    } catch (e) {
      return errorResponse('确认失败: ' + e.message, 500);
    }
  }

  // GET /api/generation/status - 获取用户生成状态（积分余额等）
  if (pathname === '/api/generation/status' && method === 'GET') {
    if (!user) return errorResponse('未登录', 401);
    
    let wallet = await db.prepare('SELECT * FROM user_wallets WHERE user_id = ?').bind(user.id).first();
    const balance = wallet?.points_balance || 0;
    const canGenerate = balance >= POINTS_CONFIG.POINTS_PER_IMAGE;
    const maxImages = Math.floor(balance / POINTS_CONFIG.POINTS_PER_IMAGE);

    return jsonResponse({
      success: true,
      points_balance: balance,
      points_per_image: POINTS_CONFIG.POINTS_PER_IMAGE,
      can_generate: canGenerate,
      max_images: maxImages
    });
  }

  // POST /api/orders/create - 创建订单
  if (pathname === '/api/orders/create' && method === 'POST') {
    if (!user) return errorResponse('未登录', 401);

    try {
      const body = await request.json();
      const { product_type, product_id, promo_code } = body;

      // 验证产品
      const plan = SUBSCRIPTION_PLANS[product_id];
      if (!plan) {
        return jsonResponse({ success: false, error: '产品不存在' }, 400);
      }

      let finalAmount = plan.price;
      let originalAmount = plan.price;
      let discountAmount = 0;

      // 应用优惠码
      if (promo_code) {
        const promo = await db.prepare('SELECT * FROM promo_codes WHERE code = ? AND status = "active"')
          .bind(promo_code.toUpperCase()).first();

        if (!promo) {
          return jsonResponse({ success: false, error: '优惠码无效' }, 400);
        }

        // 检查优惠码是否过期
        if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
          return jsonResponse({ success: false, error: '优惠码已过期' }, 400);
        }

        // 检查使用次数
        if (promo.max_uses && promo.used_count >= promo.max_uses) {
          return jsonResponse({ success: false, error: '优惠码已用完' }, 400);
        }

        // 计算折扣
        if (promo.discount_type === 'percent') {
          discountAmount = Math.floor(plan.price * promo.discount_value / 100);
        } else if (promo.discount_type === 'fixed') {
          discountAmount = promo.discount_value;
        }

        finalAmount = plan.price - discountAmount;
        if (finalAmount < 0) finalAmount = 0;
      }

      // 生成订单号
      const orderNo = `ORD${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // 创建订单
      await db.prepare(`
        INSERT INTO orders (
          order_no, user_id, product_type, product_id,
          original_amount, discount_amount, final_amount,
          promo_code, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `).bind(
        orderNo, user.id, product_type, product_id,
        originalAmount, discountAmount, finalAmount,
        promo_code ? promo_code.toUpperCase() : null,
        new Date().toISOString(),
        new Date().toISOString()
      ).run();

      return jsonResponse({
        success: true,
        order_no: orderNo,
        amount: finalAmount
      });
    } catch (e) {
      console.error('Create order error:', e);
      return errorResponse('创建订单失败: ' + e.message, 500);
    }
  }

  // GET /api/orders/:orderNo - 查询订单详情
  if (pathname.startsWith('/api/orders/') && method === 'GET') {
    if (!user) return errorResponse('未登录', 401);

    const orderNo = pathname.split('/').pop();

    try {
      const order = await db.prepare('SELECT * FROM orders WHERE order_no = ? AND user_id = ?')
        .bind(orderNo, user.id)
        .first();

      if (!order) {
        return jsonResponse({ success: false, error: '订单不存在' }, 404);
      }

      return jsonResponse({
        success: true,
        order: order
      });
    } catch (e) {
      console.error('Query order error:', e);
      return errorResponse('查询订单失败: ' + e.message, 500);
    }
  }

  return errorResponse('Not found', 404);
}

// 生成邀请码
function generateReferralCode(userId) {
  const prefix = parseInt(userId.replace(/-/g, '').substring(0, 8), 16).toString(36).toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${suffix}`.substring(0, 8);
}

// 生成点卡码
function generatePrepaidCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 检查并发放邀请奖励（被邀请人首次生成后触发）
async function checkAndGrantReferralReward(db, userId) {
  try {
    // 查找邀请关系
    const referral = await db.prepare(
      'SELECT * FROM referrals WHERE invitee_user_id = ? AND rewarded = 0'
    ).bind(userId).first();
    
    if (!referral) return; // 没有邀请关系或已发放奖励

    // 检查是否是首次生成（只有一个已完成的任务）
    const jobCount = await db.prepare(
      "SELECT COUNT(*) as count FROM generation_jobs WHERE user_id = ? AND status = 'completed'"
    ).bind(userId).first();
    
    if (jobCount?.count !== 1) return; // 不是首次生成

    // 发放邀请奖励给邀请人
    const idempotencyKey = `referral_reward:${referral.inviter_user_id}:${userId}`;
    await grantPointsInternal(
      db, 
      referral.inviter_user_id, 
      POINTS_CONFIG.REFERRAL_BONUS_POINTS, 
      'referral_bonus', 
      'referral', 
      userId, 
      idempotencyKey
    );

    // 标记为已发放奖励
    await db.prepare('UPDATE referrals SET rewarded = 1, rewarded_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), referral.id).run();

    console.log(`Referral reward granted: inviter=${referral.inviter_user_id}, invitee=${userId}`);
  } catch (e) {
    console.error('Failed to grant referral reward:', e);
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

  // POST /api/admin/users/:id/grant-points - 给单个用户添加积分
  const grantMatch = pathname.match(/^\/api\/admin\/users\/([^\/]+)\/grant-points$/);
  if (grantMatch && method === 'POST') {
    return await grantPointsToUser(request, env, grantMatch[1]);
  }

  // POST /api/admin/grant-points-all - 给所有用户充值积分
  if (pathname === '/api/admin/grant-points-all' && method === 'POST') {
    return await grantPointsToAllUsers(request, env);
  }

  return errorResponse('Not found', 404);
}

// 给单个用户添加积分
async function grantPointsToUser(request, env, userId) {
  try {
    const body = await request.json();
    const { amount, reason } = body;

    if (!amount || amount <= 0) {
      return errorResponse('积分数量必须大于0');
    }

    const db = env.DB;
    if (!db) {
      return jsonResponse({ success: false, error: '积分系统未启用' }, 503);
    }

    // 验证用户存在
    const userData = await env.USERS_KV.get(`user:${userId}`);
    if (!userData) {
      return errorResponse('用户不存在', 404);
    }

    const user = JSON.parse(userData);
    const idempotencyKey = `admin_grant:${userId}:${Date.now()}`;

    // 调用积分发放函数
    const result = await grantPointsInternal(
      db,
      userId,
      amount,
      reason || 'admin_grant',
      'admin',
      'manual_grant',
      idempotencyKey
    );

    if (result.success) {
      return jsonResponse({
        success: true,
        message: `成功为用户 ${user.email || user.nickname} 添加 ${amount} 积分`,
        userId,
        amount,
        newBalance: result.balance,
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname
        }
      });
    } else {
      return jsonResponse({
        success: false,
        error: result.message || '添加积分失败'
      }, 400);
    }
  } catch (e) {
    console.error('Grant points to user error:', e);
    return errorResponse('添加积分失败: ' + e.message, 500);
  }
}

// 给所有用户充值积分
async function grantPointsToAllUsers(request, env) {
  try {
    const body = await request.json();
    const amount = body.amount || 10000;
    const reason = body.reason || 'admin_grant';
    
    const db = env.DB;
    const results = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      details: []
    };
    
    // 获取所有用户
    const list = await env.USERS_KV.list({ prefix: 'user:' });
    results.total = list.keys.length;
    
    for (const key of list.keys) {
      const userData = await env.USERS_KV.get(key.name);
      if (!userData) continue;
      
      const user = JSON.parse(userData);
      const userId = user.id;
      const idempotencyKey = `admin_grant:${userId}:${Date.now()}`;
      
      try {
        const grantResult = await grantPointsInternal(
          db, 
          userId, 
          amount, 
          reason, 
          'admin', 
          'batch_grant', 
          idempotencyKey
        );
        
        if (grantResult.success) {
          results.success++;
          results.details.push({
            userId,
            email: user.email,
            status: 'success',
            newBalance: grantResult.balance
          });
        } else {
          results.failed++;
          results.details.push({
            userId,
            email: user.email,
            status: 'failed',
            error: grantResult.message
          });
        }
      } catch (e) {
        results.failed++;
        results.details.push({
          userId,
          email: user.email,
          status: 'error',
          error: e.message
        });
      }
    }
    
    return jsonResponse({
      success: true,
      message: `充值完成: ${results.success} 成功, ${results.failed} 失败`,
      amount,
      results
    });
    
  } catch (e) {
    console.error('Grant points to all users error:', e);
    return errorResponse('批量充值失败: ' + e.message, 500);
  }
}

// 列出所有用户（包含积分信息）
async function listUsers(env) {
  try {
    const users = [];
    const list = await env.USERS_KV.list({ prefix: 'user:' });
    const db = env.DB;

    for (const key of list.keys) {
      const userData = await env.USERS_KV.get(key.name);
      if (userData) {
        const user = JSON.parse(userData);
        const { passwordHash: _, ...safeUser } = user;

        // 如果有 D1 数据库，查询积分信息
        if (db) {
          try {
            const wallet = await db.prepare('SELECT points_balance FROM user_wallets WHERE user_id = ?')
              .bind(user.id)
              .first();

            safeUser.points_balance = wallet?.points_balance || 0;
          } catch (dbError) {
            console.error('Query wallet error:', dbError);
            safeUser.points_balance = 0;
          }
        } else {
          safeUser.points_balance = 0;
        }

        users.push(safeUser);
      }
    }

    // 按最后登录时间排序（如果有）
    users.sort((a, b) => {
      const aTime = a.lastLoginAt || a.createdAt;
      const bTime = b.lastLoginAt || b.createdAt;
      return new Date(bTime) - new Date(aTime);
    });

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
    let apiKey = request.headers.get("x-goog-api-key");
    if (!apiKey) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        apiKey = authHeader.substring(7);
      }
    }
    if (!apiKey && env.GEMINI_API_KEY) {
      apiKey = env.GEMINI_API_KEY;
    }

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
        
        // 将 base64 转换为 ArrayBuffer 并存储到 R2
        const binaryString = atob(img.base64);
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
        
        // 将 base64 转换为 ArrayBuffer 并存储到 R2
        const binaryString = atob(thumb.base64);
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

    // 积分系统 API（钱包、邀请、优惠码、点卡、订单、套餐、生成积分检查）
    if (pathname.startsWith("/api/wallet") ||
        pathname.startsWith("/api/referral") ||
        pathname.startsWith("/api/promo") ||
        pathname.startsWith("/api/prepaid") ||
        pathname.startsWith("/api/orders") ||
        pathname.startsWith("/api/plans") ||
        pathname.startsWith("/api/generation") ||
        pathname === "/api/webhook/payment") {
      const user = await getUserFromRequest(request, env);
      return await handlePointsAPI(request, env, pathname, user);
    }

    // 微信支付 API
    if (pathname.startsWith("/api/payment/wechat")) {
      const user = await getUserFromRequest(request, env);
      return await handleWechatPayAPI(request, env, pathname, user);
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

    // Gemini API 代理
    if (pathname.startsWith("/v1beta/")) {
      return await handleGeminiProxy(request, env, url);
    }

    return errorResponse("Not found", 404);
  },
};
