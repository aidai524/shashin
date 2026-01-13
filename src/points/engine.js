// =========================================
// 统一权益发放引擎
// 所有积分/订阅发放都必须通过这里，确保幂等性
// =========================================

import { POINTS_CONFIG, SUBSCRIPTION_PLANS, POINTS_REASON } from './config.js';

/**
 * 发放积分（统一入口）
 * @param {D1Database} db - D1 数据库实例
 * @param {string} userId - 用户ID
 * @param {number} delta - 变动数量（正=增加，负=消耗）
 * @param {string} reason - 原因类型（见 POINTS_REASON）
 * @param {string} refType - 关联类型
 * @param {string} refId - 关联ID
 * @param {string} idempotencyKey - 幂等键（防重复发放）
 * @returns {Promise<{success: boolean, balance: number, message?: string}>}
 */
export async function grantPoints(db, userId, delta, reason, refType, refId, idempotencyKey) {
  try {
    // 1. 检查幂等性：若 idempotencyKey 已存在，直接返回成功
    if (idempotencyKey) {
      const existing = await db.prepare(
        'SELECT id, balance_after FROM points_ledger WHERE idempotency_key = ?'
      ).bind(idempotencyKey).first();
      
      if (existing) {
        return {
          success: true,
          balance: existing.balance_after,
          message: '已处理（幂等）',
          idempotent: true
        };
      }
    }

    // 2. 获取或创建用户钱包
    let wallet = await db.prepare(
      'SELECT * FROM user_wallets WHERE user_id = ?'
    ).bind(userId).first();

    if (!wallet) {
      await db.prepare(
        'INSERT INTO user_wallets (user_id, points_balance) VALUES (?, 0)'
      ).bind(userId).run();
      wallet = { user_id: userId, points_balance: 0 };
    }

    // 3. 计算新余额
    const newBalance = wallet.points_balance + delta;
    
    // 检查余额是否足够（消耗时）
    if (delta < 0 && newBalance < 0) {
      return {
        success: false,
        balance: wallet.points_balance,
        message: '积分余额不足'
      };
    }

    // 4. 事务：更新余额 + 写入账本
    const now = new Date().toISOString();
    
    // 更新钱包余额
    await db.prepare(
      'UPDATE user_wallets SET points_balance = ?, updated_at = ? WHERE user_id = ?'
    ).bind(newBalance, now, userId).run();

    // 写入账本记录
    await db.prepare(`
      INSERT INTO points_ledger (user_id, delta, balance_after, reason, ref_type, ref_id, idempotency_key, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(userId, delta, newBalance, reason, refType, refId, idempotencyKey, now).run();

    return {
      success: true,
      balance: newBalance,
      delta: delta,
      message: delta > 0 ? `获得 ${delta} 积分` : `消耗 ${Math.abs(delta)} 积分`
    };

  } catch (error) {
    console.error('grantPoints error:', error);
    return {
      success: false,
      message: '积分操作失败: ' + error.message
    };
  }
}

/**
 * 发放订阅（统一入口）
 * @param {D1Database} db - D1 数据库实例
 * @param {string} userId - 用户ID
 * @param {string} planId - 套餐ID (standard/pro)
 * @param {number} durationDays - 订阅时长（天），默认365
 * @param {string} source - 来源 (payment/prepaid/admin)
 * @param {string} sourceRefId - 来源关联ID
 * @returns {Promise<{success: boolean, subscription?: object, message?: string}>}
 */
export async function grantSubscription(db, userId, planId, durationDays = 365, source, sourceRefId) {
  try {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return {
        success: false,
        message: '无效的套餐ID'
      };
    }

    const now = new Date();
    const nowStr = now.toISOString();

    // 1. 检查用户是否有 active 订阅
    const existingSub = await db.prepare(
      "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' ORDER BY end_at DESC LIMIT 1"
    ).bind(userId).first();

    let subscription;
    let startAt, endAt;

    if (existingSub) {
      // 有活跃订阅：延长 end_at
      const currentEnd = new Date(existingSub.end_at);
      const newEnd = new Date(currentEnd.getTime() + durationDays * 24 * 60 * 60 * 1000);
      
      await db.prepare(
        'UPDATE subscriptions SET end_at = ?, updated_at = ? WHERE id = ?'
      ).bind(newEnd.toISOString(), nowStr, existingSub.id).run();

      subscription = {
        ...existingSub,
        end_at: newEnd.toISOString(),
        extended: true
      };
      startAt = existingSub.start_at;
      endAt = newEnd.toISOString();
    } else {
      // 无活跃订阅：创建新订阅
      startAt = nowStr;
      endAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      const result = await db.prepare(`
        INSERT INTO subscriptions (user_id, plan_id, status, start_at, end_at, source, source_ref_id, created_at, updated_at)
        VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?)
      `).bind(userId, planId, startAt, endAt, source, sourceRefId, nowStr, nowStr).run();

      subscription = {
        id: result.meta.last_row_id,
        user_id: userId,
        plan_id: planId,
        status: 'active',
        start_at: startAt,
        end_at: endAt,
        source,
        source_ref_id: sourceRefId,
        created: true
      };
    }

    // 2. 立即发放当月积分（提升用户体验）
    const monthlyPoints = plan.monthly_points;
    const idempotencyKey = `monthly_grant:${userId}:${now.getFullYear()}-${now.getMonth() + 1}`;
    
    await grantPoints(
      db,
      userId,
      monthlyPoints,
      POINTS_REASON.MONTHLY_GRANT,
      'subscription',
      subscription.id?.toString(),
      idempotencyKey
    );

    // 更新 last_monthly_grant_at
    await db.prepare(
      'UPDATE subscriptions SET last_monthly_grant_at = ? WHERE user_id = ? AND status = ?'
    ).bind(nowStr, userId, 'active').run();

    return {
      success: true,
      subscription,
      plan,
      message: existingSub ? `订阅已延长至 ${endAt}` : `订阅已开通，有效期至 ${endAt}`
    };

  } catch (error) {
    console.error('grantSubscription error:', error);
    return {
      success: false,
      message: '订阅操作失败: ' + error.message
    };
  }
}

/**
 * 获取用户钱包信息
 * @param {D1Database} db - D1 数据库实例
 * @param {string} userId - 用户ID
 * @returns {Promise<{points_balance: number, subscription?: object}>}
 */
export async function getUserWallet(db, userId) {
  try {
    // 获取钱包
    let wallet = await db.prepare(
      'SELECT * FROM user_wallets WHERE user_id = ?'
    ).bind(userId).first();

    if (!wallet) {
      wallet = { user_id: userId, points_balance: 0 };
    }

    // 获取活跃订阅
    const subscription = await db.prepare(
      "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' AND end_at > datetime('now') ORDER BY end_at DESC LIMIT 1"
    ).bind(userId).first();

    // 获取本月消耗
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthlyConsumed = await db.prepare(`
      SELECT COALESCE(SUM(ABS(delta)), 0) as total
      FROM points_ledger 
      WHERE user_id = ? AND reason = 'consume' AND created_at >= ?
    `).bind(userId, monthStart.toISOString()).first();

    return {
      points_balance: wallet.points_balance,
      subscription: subscription ? {
        plan_id: subscription.plan_id,
        plan_name: SUBSCRIPTION_PLANS[subscription.plan_id]?.name,
        status: subscription.status,
        end_at: subscription.end_at,
        monthly_points: SUBSCRIPTION_PLANS[subscription.plan_id]?.monthly_points
      } : null,
      monthly_consumed: monthlyConsumed?.total || 0
    };

  } catch (error) {
    console.error('getUserWallet error:', error);
    return {
      points_balance: 0,
      subscription: null,
      monthly_consumed: 0
    };
  }
}

/**
 * 获取用户积分流水
 * @param {D1Database} db - D1 数据库实例
 * @param {string} userId - 用户ID
 * @param {number} limit - 返回数量
 * @param {number} offset - 偏移量
 * @returns {Promise<Array>}
 */
export async function getPointsTransactions(db, userId, limit = 20, offset = 0) {
  try {
    const transactions = await db.prepare(`
      SELECT * FROM points_ledger 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all();

    return transactions.results || [];

  } catch (error) {
    console.error('getPointsTransactions error:', error);
    return [];
  }
}

/**
 * 消耗积分（生成图片时调用）
 * @param {D1Database} db - D1 数据库实例
 * @param {string} userId - 用户ID
 * @param {number} imageCount - 生成图片数量
 * @param {string} jobId - 任务ID
 * @returns {Promise<{success: boolean, balance?: number, message?: string}>}
 */
export async function consumePoints(db, userId, imageCount, jobId) {
  const pointsToConsume = imageCount * POINTS_CONFIG.POINTS_PER_IMAGE;
  const idempotencyKey = `consume:${jobId}`;

  return await grantPoints(
    db,
    userId,
    -pointsToConsume,
    POINTS_REASON.CONSUME,
    'generation',
    jobId,
    idempotencyKey
  );
}

/**
 * 发放新人注册奖励
 * @param {D1Database} db - D1 数据库实例
 * @param {string} userId - 用户ID
 * @returns {Promise<{success: boolean, balance?: number}>}
 */
export async function grantSignupBonus(db, userId) {
  const idempotencyKey = `signup_bonus:${userId}`;

  return await grantPoints(
    db,
    userId,
    POINTS_CONFIG.SIGNUP_BONUS_POINTS,
    POINTS_REASON.SIGNUP_BONUS,
    'user',
    userId,
    idempotencyKey
  );
}
