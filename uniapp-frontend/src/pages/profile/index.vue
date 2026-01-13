<template>
  <view class="container">
    <!-- User Info Section -->
    <view class="user-card">
      <view v-if="userStore.isLoggedIn" class="user-info">
        <image class="avatar" :src="userStore.userInfo.avatar || '/static/default-avatar.png'" mode="aspectFill" />
        <view class="info">
          <text class="nickname">{{ userStore.userInfo.nickname }}</text>
          <text class="plan-badge">{{ userStore.plan?.name || '免费版' }}</text>
        </view>
      </view>
      <view v-else class="login-btn-container">
        <button class="login-btn" type="primary" @click="handleLogin">微信一键登录</button>
      </view>
    </view>

    <!-- Menu List -->
    <view class="menu-list" v-if="userStore.isLoggedIn">
      <view class="menu-item" @click="navigateToCharacters">
        <text class="menu-text">我的角色</text>
        <text class="arrow">></text>
      </view>
      <view class="menu-item">
        <text class="menu-text">使用帮助</text>
        <text class="arrow">></text>
      </view>
       <view class="menu-item" @click="handleLogout">
        <text class="menu-text">退出登录</text>
        <text class="arrow">></text>
      </view>
    </view>
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
    uni.showToast({ title: '登录失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const handleLogout = () => {
  userStore.logout()
}

const navigateToCharacters = () => {
  uni.navigateTo({ url: '/pages/profile/characters' })
}
</script>

<style>
.container {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 20rpx;
}

.user-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  width: 100%;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background-color: #eee;
  margin-right: 30rpx;
}

.info {
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.plan-badge {
  font-size: 24rpx;
  color: #fff;
  background-color: #ff9800;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  align-self: flex-start;
}

.login-btn-container {
  width: 100%;
}

.login-btn {
  width: 100%;
  border-radius: 40rpx;
}

.menu-list {
  background-color: #fff;
  border-radius: 20rpx;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 40rpx;
  border-bottom: 1px solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-text {
  font-size: 30rpx;
  color: #333;
}

.arrow {
  color: #999;
}
</style>
