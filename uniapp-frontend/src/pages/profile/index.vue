<template>
  <view class="page">
    <!-- User Card -->
    <scroll-view scroll-y class="content-scroll">
      <view v-if="userStore.isLoggedIn" class="user-card">
        <image
          class="avatar"
          :src="userStore.userInfo.avatar || '/static/default-avatar.png'"
          mode="aspectFill"
        />
        <view class="user-info">
          <text class="nickname">{{ userStore.userInfo.nickname }}</text>
          <view class="plan-badge">
            <text class="plan-text">{{ userStore.plan?.name || '免费版' }}</text>
          </view>
        </view>
      </view>

      <view v-else class="login-card">
        <text class="login-title">欢迎使用</text>
        <text class="login-subtitle">登录以享受更多功能</text>
        <view class="login-btn" @tap="handleLogin">
          <text class="login-btn-text">微信一键登录</text>
        </view>
      </view>

      <!-- Menu List -->
      <view v-if="userStore.isLoggedIn" class="menu-list">
        <view class="menu-item" @tap="navigateToCharacters">
          <text class="menu-text">我的角色</text>
          <view class="menu-arrow">→</view>
        </view>
        <view class="menu-item">
          <text class="menu-text">使用帮助</text>
          <view class="menu-arrow">→</view>
        </view>
        <view class="menu-item" @tap="handleLogout">
          <text class="menu-text logout">退出登录</text>
          <view class="menu-arrow">→</view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()

const handleLogin = async () => {
  try {
    uni.showLoading({ title: '登录中...' })
    await userStore.login()
    uni.showToast({ title: '登录成功', icon: 'success' })
  } catch (e) {
    console.error('登录失败:', e)
    uni.showToast({ title: '登录失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.showToast({ title: '已退出登录', icon: 'success' })
      }
    }
  })
}

const navigateToCharacters = () => {
  uni.navigateTo({ url: '/pages/profile/characters' })
}
</script>

<style scoped>
/* ========== Page Container ========== */
.page {
  min-height: 100vh;
  background-color: #F6F7F9;
}

/* ========== Content Scroll ========== */
.content-scroll {
  height: 100vh;
  padding: 32rpx;
}

/* ========== User Card ========== */
.user-card {
  background-color: #FFFFFF;
  border-radius: 32rpx;
  padding: 48rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.10);
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background-color: #F0F0F0;
  margin-right: 32rpx;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.nickname {
  font-size: 36rpx;
  font-weight: 600;
  color: #111111;
  line-height: 1.3;
}

.plan-badge {
  display: inline-flex;
  align-self: flex-start;
  padding: 8rpx 20rpx;
  background: linear-gradient(135deg, #FF6B6B, #FFA500);
  border-radius: 20rpx;
}

.plan-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #FFFFFF;
}

/* ========== Login Card ========== */
.login-card {
  background-color: #FFFFFF;
  border-radius: 32rpx;
  padding: 80rpx 48rpx;
  margin-bottom: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.10);
}

.login-title {
  font-size: 44rpx;
  font-weight: 600;
  color: #111111;
  margin-bottom: 12rpx;
  text-align: center;
}

.login-subtitle {
  font-size: 28rpx;
  color: #666666;
  opacity: 0.7;
  margin-bottom: 48rpx;
  text-align: center;
}

.login-btn {
  width: 100%;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #111111;
  border-radius: 48rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.login-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.login-btn-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #FFFFFF;
}

/* ========== Menu List ========== */
.menu-list {
  background-color: #FFFFFF;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.10);
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s ease;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:active {
  background-color: #FAFAFA;
}

.menu-text {
  font-size: 30rpx;
  color: #111111;
  font-weight: 500;
}

.menu-text.logout {
  color: #FF6B6B;
}

.menu-arrow {
  font-size: 32rpx;
  color: #CCCCCC;
  font-weight: 300;
}
</style>
