// =========================================
// 积分系统 API 路由
// =========================================

// 导出所有模块
export * from './config.js';
export * from './engine.js';
export * from './referral.js';
export * from './promo.js';
export * from './prepaid.js';
export * from './orders.js';

// 导入具体函数
import { getUserWallet, getPointsTransactions, grantSignupBonus, consumePoints } from './engine.js';
import { getOrCreateReferralCode, bindReferral, grantReferralReward, getReferralStats } from './referral.js';
import { validatePromoCode, calculateDiscountedPrice, createPromoCode } from './promo.js';
import { redeemPrepaidCard, createPrepaidCardBatch, queryPrepaidCard } from './prepaid.js';
import { createOrder, handlePaymentSuccess, getOrder, getUserOrders, getProductPrice } from './orders.js';
import { SUBSCRIPTION_PLANS, POINTS_CONFIG } from './config.js';

/**
 * 处理积分系统 API 请求
 * @param {Request} request - 请求对象
 * @param {object} env - 环境变量
 * @param {string} pathname - 路径
 * @param {object} user - 当前用户（可能为 null）
 * @returns {Promise<Response>}
 */
export async function handlePointsAPI(request, env, pathname, user) {
  const method = request.method;
  const db = env.DB; // D1 数据库

  // =========================================
  // 钱包相关
  // =========================================

  // GET /api/wallet/me - 获取我的钱包信息
  if (pathname === '/api/wallet/me' && method === 'GET') {
    if (!user) {
      return errorResponse('未登录', 401);
    }
    const wallet = await getUserWallet(db, user.id);
    return jsonResponse({ success: true, wallet });
  }

  // GET /api/wallet/transactions - 获取积分流水
  if (pathname === '/api/wallet/transactions' && method === 'GET') {
    if (!user) {
      return errorResponse('未登录', 401);
    }
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const transactions = await getPointsTransactions(db, user.id, limit, offset);
    return jsonResponse({ success: true, transactions });
  }

  // =========================================
  // 邀请系统
  // =========================================

  // GET /api/referral/me - 获取我的邀请码和统计
  if (pathname === '/api/referral/me' && method === 'GET') {
    if (!user) {
      return errorResponse('未登录', 401);
    }
    const stats = await getReferralStats(db, user.id);
    return jsonResponse({ success: true, ...stats });
  }

  // =========================================
  // 优惠码
  // =========================================

  // POST /api/promo/validate - 校验优惠码
  if (pathname === '/api/promo/validate' && method === 'POST') {
    try {
      const body = await request.json();
      const { code, product_type, product_id } = body;
      
      const result = await validatePromoCode(db, code, product_type, product_id);
      
      if (result.valid) {
        // 计算折后价格
        const product = getProductPrice(product_type, product_id);
        if (product) {
          const priceInfo = calculateDiscountedPrice(product.price, result.discount);
          return jsonResponse({
            success: true,
            valid: true,
            discount: result.discount,
            price: priceInfo,
            message: result.message
          });
        }
      }
      
      return jsonResponse({
        success: true,
        valid: result.valid,
        message: result.message
      });
    } catch (e) {
      return errorResponse('请求格式错误', 400);
    }
  }

  // =========================================
  // 点卡兑换
  // =========================================

  // POST /api/prepaid/redeem - 兑换点卡
  if (pathname === '/api/prepaid/redeem' && method === 'POST') {
    if (!user) {
      return errorResponse('未登录', 401);
    }
    try {
      const body = await request.json();
      const { code } = body;
      
      const result = await redeemPrepaidCard(db, user.id, code);
      return jsonResponse(result);
    } catch (e) {
      return errorResponse('请求格式错误', 400);
    }
  }

  // POST /api/prepaid/query - 查询点卡信息
  if (pathname === '/api/prepaid/query' && method === 'POST') {
    try {
      const body = await request.json();
      const { code } = body;
      
      const result = await queryPrepaidCard(db, code);
      return jsonResponse({ success: true, ...result });
    } catch (e) {
      return errorResponse('请求格式错误', 400);
    }
  }

  // =========================================
  // 订单
  // =========================================

  // POST /api/orders/create - 创建订单
  if (pathname === '/api/orders/create' && method === 'POST') {
    if (!user) {
      return errorResponse('未登录', 401);
    }
    try {
      const body = await request.json();
      const result = await createOrder(db, user.id, body);
      return jsonResponse(result);
    } catch (e) {
      return errorResponse('请求格式错误', 400);
    }
  }

  // GET /api/orders - 获取我的订单列表
  if (pathname === '/api/orders' && method === 'GET') {
    if (!user) {
      return errorResponse('未登录', 401);
    }
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const orders = await getUserOrders(db, user.id, limit, offset);
    return jsonResponse({ success: true, orders });
  }

  // POST /api/webhook/payment - 支付回调（需要验签，这里简化处理）
  if (pathname === '/api/webhook/payment' && method === 'POST') {
    try {
      const body = await request.json();
      const { order_no, provider, provider_tx_id, signature } = body;
      
      // TODO: 验证签名
      // if (!verifyPaymentSignature(body, env.PAYMENT_SECRET)) {
      //   return errorResponse('签名验证失败', 403);
      // }
      
      const result = await handlePaymentSuccess(db, order_no, provider, provider_tx_id);
      return jsonResponse(result);
    } catch (e) {
      return errorResponse('请求格式错误', 400);
    }
  }

  // =========================================
  // 套餐信息
  // =========================================

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

  // =========================================
  // 管理员接口
  // =========================================

  // POST /api/admin/prepaid/create_batch - 批量生成点卡
  if (pathname === '/api/admin/prepaid/create_batch' && method === 'POST') {
    // TODO: 添加管理员权限校验
    // if (!user || !user.isAdmin) {
    //   return errorResponse('无权限', 403);
    // }
    try {
      const body = await request.json();
      const result = await createPrepaidCardBatch(db, body);
      return jsonResponse(result);
    } catch (e) {
      return errorResponse('请求格式错误', 400);
    }
  }

  // POST /api/admin/promo/create - 创建优惠码
  if (pathname === '/api/admin/promo/create' && method === 'POST') {
    // TODO: 添加管理员权限校验
    try {
      const body = await request.json();
      const result = await createPromoCode(db, body);
      return jsonResponse(result);
    } catch (e) {
      return errorResponse('请求格式错误', 400);
    }
  }

  return errorResponse('Not found', 404);
}

// 辅助函数
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

function errorResponse(message, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}
