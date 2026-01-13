// =========================================
// 优惠码系统
// =========================================

import { SUBSCRIPTION_PLANS, PROMO_STATUS } from './config.js';

/**
 * 校验优惠码
 * @param {D1Database} db - D1 数据库实例
 * @param {string} code - 优惠码
 * @param {string} productType - 产品类型 (subscription/points_pack)
 * @param {string} productId - 产品ID (standard/pro/pack_100)
 * @returns {Promise<{valid: boolean, discount?: object, message?: string}>}
 */
export async function validatePromoCode(db, code, productType, productId) {
  try {
    if (!code) {
      return { valid: false, message: '优惠码为空' };
    }

    // 查询优惠码
    const promo = await db.prepare(
      'SELECT * FROM promo_codes WHERE code = ?'
    ).bind(code.toUpperCase()).first();

    if (!promo) {
      return { valid: false, message: '优惠码不存在' };
    }

    // 检查状态
    if (promo.status !== PROMO_STATUS.ACTIVE) {
      return { valid: false, message: '优惠码已失效' };
    }

    // 检查过期时间
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return { valid: false, message: '优惠码已过期' };
    }

    // 检查使用次数
    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
      return { valid: false, message: '优惠码已达使用上限' };
    }

    // 检查适用产品
    if (promo.applicable_products !== 'all') {
      const applicableList = promo.applicable_products.split(',');
      const isApplicable = applicableList.some(item => {
        return item === productType || item === productId;
      });
      if (!isApplicable) {
        return { valid: false, message: '优惠码不适用于此产品' };
      }
    }

    // 计算折扣
    let discount = {
      type: promo.discount_type,
      value: promo.discount_value,
      code: promo.code
    };

    return {
      valid: true,
      discount,
      message: promo.discount_type === 'percent' 
        ? `优惠 ${promo.discount_value}%` 
        : `减免 ${promo.discount_value / 100} 元`
    };

  } catch (error) {
    console.error('validatePromoCode error:', error);
    return { valid: false, message: '校验失败: ' + error.message };
  }
}

/**
 * 计算折后价格
 * @param {number} originalAmount - 原价（分）
 * @param {object} discount - 折扣信息 {type, value}
 * @returns {{originalAmount: number, discountAmount: number, finalAmount: number}}
 */
export function calculateDiscountedPrice(originalAmount, discount) {
  if (!discount) {
    return {
      originalAmount,
      discountAmount: 0,
      finalAmount: originalAmount
    };
  }

  let discountAmount = 0;

  if (discount.type === 'percent') {
    // 百分比折扣：value=20 表示减 20%（即 8 折）
    discountAmount = Math.floor(originalAmount * discount.value / 100);
  } else if (discount.type === 'fixed') {
    // 固定金额折扣
    discountAmount = Math.min(discount.value, originalAmount);
  }

  return {
    originalAmount,
    discountAmount,
    finalAmount: originalAmount - discountAmount
  };
}

/**
 * 使用优惠码（增加使用次数）
 * @param {D1Database} db - D1 数据库实例
 * @param {string} code - 优惠码
 * @returns {Promise<boolean>}
 */
export async function usePromoCode(db, code) {
  try {
    const now = new Date().toISOString();
    await db.prepare(
      'UPDATE promo_codes SET used_count = used_count + 1, updated_at = ? WHERE code = ?'
    ).bind(now, code.toUpperCase()).run();
    return true;
  } catch (error) {
    console.error('usePromoCode error:', error);
    return false;
  }
}

/**
 * 创建优惠码（管理员接口）
 * @param {D1Database} db - D1 数据库实例
 * @param {object} params - 优惠码参数
 * @returns {Promise<{success: boolean, promo?: object, message?: string}>}
 */
export async function createPromoCode(db, params) {
  try {
    const {
      code,
      discount_type = 'percent',
      discount_value,
      max_uses = null,
      applicable_products = 'all',
      expires_at = null
    } = params;

    if (!code || !discount_value) {
      return { success: false, message: '缺少必填参数' };
    }

    // 检查是否已存在
    const existing = await db.prepare(
      'SELECT id FROM promo_codes WHERE code = ?'
    ).bind(code.toUpperCase()).first();

    if (existing) {
      return { success: false, message: '优惠码已存在' };
    }

    const now = new Date().toISOString();
    const result = await db.prepare(`
      INSERT INTO promo_codes (code, discount_type, discount_value, max_uses, applicable_products, expires_at, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `).bind(
      code.toUpperCase(),
      discount_type,
      discount_value,
      max_uses,
      applicable_products,
      expires_at,
      now,
      now
    ).run();

    return {
      success: true,
      promo: {
        id: result.meta.last_row_id,
        code: code.toUpperCase(),
        discount_type,
        discount_value,
        max_uses,
        applicable_products,
        expires_at
      },
      message: '优惠码创建成功'
    };

  } catch (error) {
    console.error('createPromoCode error:', error);
    return { success: false, message: '创建失败: ' + error.message };
  }
}
