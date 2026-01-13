-- =========================================
-- 积分系统数据库迁移
-- 版本: 0001
-- 描述: 创建积分系统所需的所有表
-- =========================================

-- 用户钱包表
CREATE TABLE IF NOT EXISTS user_wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT UNIQUE NOT NULL,
  points_balance INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_wallets_user ON user_wallets(user_id);

-- 积分账本表
CREATE TABLE IF NOT EXISTS points_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reason TEXT NOT NULL,
  ref_type TEXT,
  ref_id TEXT,
  idempotency_key TEXT UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_points_ledger_user ON points_ledger(user_id);
CREATE INDEX IF NOT EXISTS idx_points_ledger_reason ON points_ledger(reason);
CREATE INDEX IF NOT EXISTS idx_points_ledger_idempotency ON points_ledger(idempotency_key);

-- 订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  last_monthly_grant_at TEXT,
  source TEXT,
  source_ref_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end ON subscriptions(end_at);

-- 优惠码表
CREATE TABLE IF NOT EXISTS promo_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT DEFAULT 'percent',
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  applicable_products TEXT DEFAULT 'all',
  expires_at TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_status ON promo_codes(status);

-- 点卡表
CREATE TABLE IF NOT EXISTS prepaid_cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  card_type TEXT NOT NULL,
  plan_id TEXT,
  points_amount INTEGER,
  status TEXT DEFAULT 'unused',
  redeemed_by TEXT,
  redeemed_at TEXT,
  expires_at TEXT,
  batch_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prepaid_cards_code ON prepaid_cards(code);
CREATE INDEX IF NOT EXISTS idx_prepaid_cards_status ON prepaid_cards(status);
CREATE INDEX IF NOT EXISTS idx_prepaid_cards_batch ON prepaid_cards(batch_id);

-- 邀请码表
CREATE TABLE IF NOT EXISTS referral_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  owner_user_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_owner ON referral_codes(owner_user_id);

-- 邀请关系表
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inviter_user_id TEXT NOT NULL,
  invitee_user_id TEXT UNIQUE NOT NULL,
  source_code TEXT NOT NULL,
  rewarded INTEGER DEFAULT 0,
  rewarded_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON referrals(inviter_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_invitee ON referrals(invitee_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_rewarded ON referrals(rewarded);

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  product_type TEXT NOT NULL,
  product_id TEXT NOT NULL,
  original_amount INTEGER NOT NULL,
  discount_amount INTEGER DEFAULT 0,
  final_amount INTEGER NOT NULL,
  promo_code TEXT,
  status TEXT DEFAULT 'pending',
  paid_at TEXT,
  provider TEXT,
  provider_tx_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_provider_tx ON orders(provider_tx_id);

-- 生成任务表（用于追踪首次生成，触发邀请奖励）
CREATE TABLE IF NOT EXISTS generation_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  job_type TEXT DEFAULT 'image',
  status TEXT DEFAULT 'pending',
  points_consumed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_user ON generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);
