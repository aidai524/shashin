// =========================================
// 积分系统配置常量
// =========================================

// 积分规则
export const POINTS_CONFIG = {
  POINTS_PER_IMAGE: 10,           // 每张图片消耗积分
  SIGNUP_BONUS_POINTS: 100,       // 新人注册赠送积分
  REFERRAL_BONUS_POINTS: 100,     // 邀请奖励积分（邀请人获得）
};

// 套餐定义（年费）
export const SUBSCRIPTION_PLANS = {
  standard: {
    id: 'standard',
    name: 'Standard',
    price: 19900,                 // 年费价格（分）199元
    monthly_points: 1000,         // 每月发放积分
    duration_days: 365,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 59900,                 // 年费价格（分）599元
    monthly_points: 5000,         // 每月发放积分
    duration_days: 365,
  }
};

// 优惠码折扣配置
export const PROMO_CONFIG = {
  DEFAULT_PERCENT_OFF: 20,        // 默认 8 折（即减 20%）
};

// 邀请奖励配置
export const REFERRAL_CONFIG = {
  TRIGGER: 'first_generation',    // 首次生成成功时触发奖励
  // 可选值: 'first_generation' | 'first_payment'
};

// 积分变动原因枚举
export const POINTS_REASON = {
  SIGNUP_BONUS: 'signup_bonus',       // 新人注册奖励
  REFERRAL_BONUS: 'referral_bonus',   // 邀请奖励
  MONTHLY_GRANT: 'monthly_grant',     // 月度发放
  PREPAID: 'prepaid',                 // 点卡兑换
  PURCHASE: 'purchase',               // 购买积分
  CONSUME: 'consume',                 // 消耗（生成图片）
  REFUND: 'refund',                   // 退款
  ADMIN_ADJUST: 'admin_adjust',       // 管理员调整
};

// 订阅来源枚举
export const SUBSCRIPTION_SOURCE = {
  PAYMENT: 'payment',
  PREPAID: 'prepaid',
  ADMIN: 'admin',
};

// 订单状态枚举
export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// 点卡状态枚举
export const PREPAID_STATUS = {
  UNUSED: 'unused',
  REDEEMED: 'redeemed',
  VOID: 'void',
};

// 优惠码状态枚举
export const PROMO_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
  EXPIRED: 'expired',
};
