// =========================================
// 订单系统
// =========================================

import { SUBSCRIPTION_PLANS, ORDER_STATUS, POINTS_REASON, SUBSCRIPTION_SOURCE } from './config.js';
import { grantPoints, grantSubscription } from './engine.js';
import { validatePromoCode, calculateDiscountedPrice, usePromoCode } from './promo.js';

/**
 * 生成订单号
 * 格式：ORD + 时间戳 + 随机数
 * @returns {string}
 */
function generateOrderNo() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD${timestamp}${random}`;
}

/**
 * 获取产品价格
 * @param {string} productType - 产品类型
 * @param {string} productId - 产品ID
 * @returns {{price: number, name: string} | null}
 */
export function getProductPrice(productType, productId) {
  if (productType === 'subscription') {
    const plan = SUBSCRIPTION_PLANS[productId];
    if (plan) {
      return { price: plan.price, name: plan.name };
    }
  }
  // 可扩展：积分包等其他产品
  return null;
}

/**
 * 创建订单
 * @param {D1Database} db - D1 数据库实例
 * @param {string} userId - 用户ID
 * @param {object} params - 订单参数
 * @returns {Promise<{success: boolean, order?: object, message?: string}>}
 */
export async function createOrder(db, userId, params) {
  try {
    const { product_type, product_id, promo_code } = params;

    // 1. 获取产品价格
    const product = getProductPrice(product_type, product_id);
    if (!product) {
      return { success: false, message: '无效的产品' };
    }

    // 2. 校验优惠码（如果有）
    let discount = null;
    if (promo_code) {
      const promoResult = await validatePromoCode(db, promo_code, product_type, product_id);
      if (promoResult.valid) {
        discount = promoResult.discount;
      } else {
        return { success: false, message: promoResult.message };
      }
    }

    // 3. 计算价格
    const priceInfo = calculateDiscountedPrice(product.price, discount);

    // 4. 创建订单
    const orderNo = generateOrderNo();
    const now = new Date().toISOString();

    const result = await db.prepare(`
      INSERT INTO orders (order_no, user_id, product_type, product_id, original_amount, discount_amount, final_amount, promo_code, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).bind(
      orderNo,
      userId,
      product_type,
      product_id,
      priceInfo.originalAmount,
      priceInfo.discountAmount,
      priceInfo.finalAmount,
      promo_code?.toUpperCase() || null,
      now,
      now
    ).run();

    return {
      success: true,
      order: {
        id: result.meta.last_row_id,
        order_no: orderNo,
        product_type,
        product_id,
        product_name: product.name,
        original_amount: priceInfo.originalAmount,
        discount_amount: priceInfo.discountAmount,
        final_amount: priceInfo.finalAmount,
        promo_code: promo_code?.toUpperCase() || null,
        status: ORDER_STATUS.PENDING
      },
      message: '订单创建成功'
    };

  } catch (error) {
    console.error('createOrder error:', error);
    return { success: false, message: '创建订单失败: ' + error.message };
  }
}

/**
 * 处理支付成功回调
 * @param {D1Database} db - D1 数据库实例
 * @param {string} orderNo - 订单号
 * @param {string} provider - 支付渠道
 * @param {string} providerTxId - 支付渠道交易ID
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function handlePaymentSuccess(db, orderNo, provider, providerTxId) {
  try {
    // 1. 查询订单
    const order = await db.prepare(
      'SELECT * FROM orders WHERE order_no = ?'
    ).bind(orderNo).first();

    if (!order) {
      return { success: false, message: '订单不存在' };
    }

    // 2. 幂等检查：已支付的订单不重复处理
    if (order.status === ORDER_STATUS.PAID) {
      return { success: true, message: '订单已处理（幂等）', idempotent: true };
    }

    // 3. 检查订单状态
    if (order.status !== ORDER_STATUS.PENDING) {
      return { success: false, message: '订单状态异常' };
    }

    const now = new Date().toISOString();

    // 4. 更新订单状态
    await db.prepare(
      'UPDATE orders SET status = ?, paid_at = ?, provider = ?, provider_tx_id = ?, updated_at = ? WHERE order_no = ?'
    ).bind(ORDER_STATUS.PAID, now, provider, providerTxId, now, orderNo).run();

    // 5. 发放权益
    if (order.product_type === 'subscription') {
      await grantSubscription(
        db,
        order.user_id,
        order.product_id,
        SUBSCRIPTION_PLANS[order.product_id]?.duration_days || 365,
        SUBSCRIPTION_SOURCE.PAYMENT,
        orderNo
      );
    } else if (order.product_type === 'points_pack') {
      // 积分包：根据 product_id 发放对应积分
      // 这里可以扩展积分包产品定义
      const pointsAmount = parseInt(order.product_id.replace('pack_', '')) || 0;
      if (pointsAmount > 0) {
        await grantPoints(
          db,
          order.user_id,
          pointsAmount,
          POINTS_REASON.PURCHASE,
          'order',
          orderNo,
          `purchase:${orderNo}`
        );
      }
    }

    // 6. 更新优惠码使用次数
    if (order.promo_code) {
      await usePromoCode(db, order.promo_code);
    }

    return {
      success: true,
      message: '支付成功，权益已发放'
    };

  } catch (error) {
    console.error('handlePaymentSuccess error:', error);
    return { success: false, message: '处理支付回调失败: ' + error.message };
  }
}

/**
 * 查询订单
 * @param {D1Database} db - D1 数据库实例
 * @param {string} orderNo - 订单号
 * @param {string} userId - 用户ID（用于权限校验）
 * @returns {Promise<object | null>}
 */
export async function getOrder(db, orderNo, userId) {
  try {
    const order = await db.prepare(
      'SELECT * FROM orders WHERE order_no = ? AND user_id = ?'
    ).bind(orderNo, userId).first();

    return order;

  } catch (error) {
    console.error('getOrder error:', error);
    return null;
  }
}

/**
 * 获取用户订单列表
 * @param {D1Database} db - D1 数据库实例
 * @param {string} userId - 用户ID
 * @param {number} limit - 返回数量
 * @param {number} offset - 偏移量
 * @returns {Promise<Array>}
 */
export async function getUserOrders(db, userId, limit = 20, offset = 0) {
  try {
    const orders = await db.prepare(`
      SELECT * FROM orders 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all();

    return orders.results || [];

  } catch (error) {
    console.error('getUserOrders error:', error);
    return [];
  }
}
