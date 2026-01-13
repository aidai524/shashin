// =========================================
// 邀请系统
// =========================================

import { POINTS_CONFIG, POINTS_REASON } from './config.js';
import { grantPoints } from './engine.js';

/**
 * 生成邀请码
 * 格式：BASE36(userId前8位) + 随机4位
 * @param {string} userId - 用户ID
 * @returns {string} 邀请码
 */
function generateReferralCode(userId) {
  const prefix = parseInt(userId.replace(/-/g, '').substring(0, 8), 16).toString(36).toUpperCase();
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${suffix}`.substring(0, 8);
}

/**
 * 获取或创建用户的邀请码
 * @param {D1Database} db - D1 数据库实例
 * @param {string} userId - 用户ID
 * @returns {Promise<{code: string, isNew: boolean}>}
 */
export async function getOrCreateReferralCode(db, userId) {
  try {
    // 检查是否已有邀请码
    const existing = await db.prepare(
      'SELECT code FROM referral_codes WHERE owner_user_id = ?'
    ).bind(userId).first();

    if (existing) {
      return { code: existing.code, isNew: false };
    }

    // 生成新邀请码（确保唯一）
    let code;
    let attempts = 0;
    while (attempts < 10) {
      code = generateReferralCode(userId);
      const exists = await db.prepare(
        'SELECT id FROM referral_codes WHERE code = ?'
      ).bind(code).first();
      
      if (!exists) break;
      attempts++;
    }

    // 保存邀请码
    await db.prepare(
      'INSERT INTO referral_codes (code, owner_user_id) VALUES (?, ?)'
    ).bind(code, userId).run();

    return { code, isNew: true };

  } catch (error) {
    console.error('getOrCreateReferralCode error:', error);
    throw error;
  }
}

/**
 * 获取邀请码的所有者
 * @param {D1Database} db - D1 数据库实例
 * @param {string} code - 邀请码
 * @returns {Promise<string|null>} 所有者用户ID
 */
export async function getReferralCodeOwner(db, code) {
  try {
    const result = await db.prepare(
      'SELECT owner_user_id FROM referral_codes WHERE code = ?'
    ).bind(code.toUpperCase()).first();

    return result?.owner_user_id || null;

  } catch (error) {
    console.error('getReferralCodeOwner error:', error);
    return null;
  }
}

/**
 * 绑定邀请关系（注册时调用）
 * @param {D1Database} db - D1 数据库实例
 * @param {string} inviteeUserId - 被邀请人ID
 * @param {string} referralCode - 邀请码
 * @returns {Promise<{success: boolean, inviterUserId?: string, message?: string}>}
 */
export async function bindReferral(db, inviteeUserId, referralCode) {
  try {
    if (!referralCode) {
      return { success: false, message: '邀请码为空' };
    }

    // 1. 获取邀请码所有者
    const inviterUserId = await getReferralCodeOwner(db, referralCode);
    if (!inviterUserId) {
      return { success: false, message: '无效的邀请码' };
    }

    // 2. 防止自邀
    if (inviterUserId === inviteeUserId) {
      return { success: false, message: '不能使用自己的邀请码' };
    }

    // 3. 检查是否已绑定（一个 invitee 只能绑定一次）
    const existing = await db.prepare(
      'SELECT id FROM referrals WHERE invitee_user_id = ?'
    ).bind(inviteeUserId).first();

    if (existing) {
      return { success: false, message: '已绑定过邀请关系' };
    }

    // 4. 创建邀请关系
    await db.prepare(`
      INSERT INTO referrals (inviter_user_id, invitee_user_id, source_code, rewarded)
      VALUES (?, ?, ?, 0)
    `).bind(inviterUserId, inviteeUserId, referralCode.toUpperCase()).run();

    return {
      success: true,
      inviterUserId,
      message: '邀请关系绑定成功'
    };

  } catch (error) {
    // 唯一约束冲突（已绑定）
    if (error.message?.includes('UNIQUE constraint failed')) {
      return { success: false, message: '已绑定过邀请关系' };
    }
    console.error('bindReferral error:', error);
    return { success: false, message: '绑定失败: ' + error.message };
  }
}

/**
 * 发放邀请奖励（被邀请人首次生成成功时调用）
 * @param {D1Database} db - D1 数据库实例
 * @param {string} inviteeUserId - 被邀请人ID
 * @returns {Promise<{success: boolean, rewarded?: boolean, message?: string}>}
 */
export async function grantReferralReward(db, inviteeUserId) {
  try {
    // 1. 查询该用户是否是 invitee 且 rewarded=0
    const referral = await db.prepare(
      'SELECT * FROM referrals WHERE invitee_user_id = ? AND rewarded = 0'
    ).bind(inviteeUserId).first();

    if (!referral) {
      // 不是被邀请人，或已发放过奖励
      return { success: true, rewarded: false, message: '无需发放奖励' };
    }

    // 2. 给邀请人发放奖励积分
    const idempotencyKey = `referral_reward:${inviteeUserId}`;
    const result = await grantPoints(
      db,
      referral.inviter_user_id,
      POINTS_CONFIG.REFERRAL_BONUS_POINTS,
      POINTS_REASON.REFERRAL_BONUS,
      'referral',
      inviteeUserId,
      idempotencyKey
    );

    if (!result.success) {
      return result;
    }

    // 3. 标记已发放奖励
    const now = new Date().toISOString();
    await db.prepare(
      'UPDATE referrals SET rewarded = 1, rewarded_at = ? WHERE invitee_user_id = ?'
    ).bind(now, inviteeUserId).run();

    return {
      success: true,
      rewarded: true,
      inviterUserId: referral.inviter_user_id,
      points: POINTS_CONFIG.REFERRAL_BONUS_POINTS,
      message: `邀请奖励已发放给邀请人`
    };

  } catch (error) {
    console.error('grantReferralReward error:', error);
    return { success: false, message: '发放奖励失败: ' + error.message };
  }
}

/**
 * 获取用户的邀请统计
 * @param {D1Database} db - D1 数据库实例
 * @param {string} userId - 用户ID
 * @returns {Promise<{code: string, totalInvited: number, totalRewarded: number, totalPoints: number}>}
 */
export async function getReferralStats(db, userId) {
  try {
    // 获取邀请码
    const { code } = await getOrCreateReferralCode(db, userId);

    // 统计邀请人数
    const stats = await db.prepare(`
      SELECT 
        COUNT(*) as total_invited,
        SUM(CASE WHEN rewarded = 1 THEN 1 ELSE 0 END) as total_rewarded
      FROM referrals 
      WHERE inviter_user_id = ?
    `).bind(userId).first();

    const totalRewarded = stats?.total_rewarded || 0;
    const totalPoints = totalRewarded * POINTS_CONFIG.REFERRAL_BONUS_POINTS;

    return {
      code,
      totalInvited: stats?.total_invited || 0,
      totalRewarded,
      totalPoints,
      pointsPerReferral: POINTS_CONFIG.REFERRAL_BONUS_POINTS
    };

  } catch (error) {
    console.error('getReferralStats error:', error);
    return {
      code: '',
      totalInvited: 0,
      totalRewarded: 0,
      totalPoints: 0
    };
  }
}
