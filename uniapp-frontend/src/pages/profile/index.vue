<template>
  <view class="page">
    <text class="title">我的</text>
    <button @tap="handleLogin">登录</button>
  </view>
</template>

<script>
export default {
  data() {
    return {}
  },
  methods: {
    handleLogin() {
      uni.showToast({ title: '登录功能开发中', icon: 'none' })
    }
  }
}
</script>

<style scoped>
.page {
  padding: 40rpx;
}
.title {
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 40rpx;
}
</style>
