// =========================================
// 点卡系统
// =========================================

import { SUBSCRIPTION_PLANS, PREPAID_STATUS, POINTS_REASON, SUBSCRIPTION_SOURCE } from './config.js';
import { grantPoints, grantSubscription } from './engine.js';

/**
 * 生成点卡码
 * 格式：XXXX-XXXX-XXXX-XXXX
 * @returns {string}
 */
function generateCardCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除容易混淆的字符
  let code = '';
  for (let i = 0; i < 16; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 兑换点卡
 * @param {D1Database} db - D1 数据库实例
 * @param {string} userId - 用户ID
 * @param {string} code - 点卡码
 * @returns {Promise<{success: boolean, card?: object, message?: string}>}
 */
export async function redeemPrepaidCard(db, userId, code) {
  try {
    if (!code) {
      return { success: false, message: '点卡码为空' };
    }

    // 格式化点卡码（去除空格和横线，统一大写）
    const formattedCode = code.replace(/[\s-]/g, '').toUpperCase();
    
    // 查询点卡（支持带横线和不带横线的格式）
    let card = await db.prepare(
      'SELECT * FROM prepaid_cards WHERE REPLACE(code, "-", "") = ?'
    ).bind(formattedCode).first();

    if (!card) {
      return { success: false, message: '点卡码不存在' };
    }

    // 检查状态
    if (card.status !== PREPAID_STATUS.UNUSED) {
      if (card.status === PREPAID_STATUS.REDEEMED) {
        return { success: false, message: '点卡已被兑换' };
      }
      return { success: false, message: '点卡已失效' };
    }

    // 检查过期时间
    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      return { success: false, message: '点卡已过期' };
    }

    const now = new Date().toISOString();

    // 根据点卡类型发放权益
    let grantResult;
    if (card.card_type === 'subscription') {
      // 订阅卡：发放订阅
      grantResult = await grantSubscription(
        db,
        userId,
        card.plan_id,
        SUBSCRIPTION_PLANS[card.plan_id]?.duration_days || 365,
        SUBSCRIPTION_SOURCE.PREPAID,
        card.code
      );
    } else if (card.card_type === 'points') {
      // 积分卡：发放积分
      const idempotencyKey = `prepaid:${card.code}`;
      grantResult = await grantPoints(
        db,
        userId,
        card.points_amount,
        POINTS_REASON.PREPAID,
        'prepaid_card',
        card.code,
        idempotencyKey
      );
    } else {
      return { success: false, message: '未知的点卡类型' };
    }

    if (!grantResult.success) {
      return grantResult;
    }

    // 标记点卡已兑换
    await db.prepare(
      'UPDATE prepaid_cards SET status = ?, redeemed_by = ?, redeemed_at = ? WHERE id = ?'
    ).bind(PREPAID_STATUS.REDEEMED, userId, now, card.id).run();

    return {
      success: true,
      card: {
        code: card.code,
        card_type: card.card_type,
        plan_id: card.plan_id,
        points_amount: card.points_amount
      },
      grant: grantResult,
      message: card.card_type === 'subscription' 
        ? `成功兑换 ${SUBSCRIPTION_PLANS[card.plan_id]?.name} 订阅` 
        : `成功兑换 ${card.points_amount} 积分`
    };

  } catch (error) {
    console.error('redeemPrepaidCard error:', error);
    return { success: false, message: '兑换失败: ' + error.message };
  }
}

/**
 * 批量生成点卡（管理员接口）
 * @param {D1Database} db - D1 数据库实例
 * @param {object} params - 生成参数
 * @returns {Promise<{success: boolean, cards?: Array, message?: string}>}
 */
export async function createPrepaidCardBatch(db, params) {
  try {
    const {
      card_type,        // 'subscription' | 'points'
      plan_id,          // 套餐ID（若 subscription）
      points_amount,    // 积分数量（若 points）
      quantity,         // 生成数量
      expires_at = null // 过期时间
    } = params;

    // 参数校验
    if (!card_type || !quantity || quantity < 1 || quantity > 1000) {
      return { success: false, message: '参数错误' };
    }

    if (card_type === 'subscription' && !plan_id) {
      return { success: false, message: '订阅卡需要指定套餐ID' };
    }

    if (card_type === 'points' && (!points_amount || points_amount < 1)) {
      return { success: false, message: '积分卡需要指定积分数量' };
    }

    // 生成批次ID
    const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const now = new Date().toISOString();

    // 批量生成点卡
    const cards = [];
    const usedCodes = new Set();

    for (let i = 0; i < quantity; i++) {
      // 生成唯一码
      let code;
      do {
        code = generateCardCode();
      } while (usedCodes.has(code));
      usedCodes.add(code);

      cards.push({
        code,
        card_type,
        plan_id: card_type === 'subscription' ? plan_id : null,
        points_amount: card_type === 'points' ? points_amount : null,
        expires_at,
        batch_id: batchId
      });
    }

    // 批量插入数据库
    const stmt = db.prepare(`
      INSERT INTO prepaid_cards (code, card_type, plan_id, points_amount, status, expires_at, batch_id, created_at)
      VALUES (?, ?, ?, ?, 'unused', ?, ?, ?)
    `);

    const batch = cards.map(card => 
      stmt.bind(
        card.code,
        card.card_type,
        card.plan_id,
        card.points_amount,
        card.expires_at,
        card.batch_id,
        now
      )
    );

    await db.batch(batch);

    return {
      success: true,
      batch_id: batchId,
      cards: cards.map(c => c.code),
      quantity: cards.length,
      message: `成功生成 ${cards.length} 张点卡`
    };

  } catch (error) {
    console.error('createPrepaidCardBatch error:', error);
    return { success: false, message: '生成失败: ' + error.message };
  }
}

/**
 * 查询点卡信息（不含敏感信息）
 * @param {D1Database} db - D1 数据库实例
 * @param {string} code - 点卡码
 * @returns {Promise<{exists: boolean, card?: object}>}
 */
export async function queryPrepaidCard(db, code) {
  try {
    const formattedCode = code.replace(/[\s-]/g, '').toUpperCase();
    
    const card = await db.prepare(
      'SELECT card_type, plan_id, points_amount, status, expires_at FROM prepaid_cards WHERE REPLACE(code, "-", "") = ?'
    ).bind(formattedCode).first();

    if (!card) {
      return { exists: false };
    }

    return {
      exists: true,
      card: {
        card_type: card.card_type,
        plan_id: card.plan_id,
        points_amount: card.points_amount,
        status: card.status,
        expires_at: card.expires_at,
        is_available: card.status === PREPAID_STATUS.UNUSED && 
          (!card.expires_at || new Date(card.expires_at) > new Date())
      }
    };

  } catch (error) {
    console.error('queryPrepaidCard error:', error);
    return { exists: false };
  }
}
