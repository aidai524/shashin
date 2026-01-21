<template>
  <view class="page">
    <text class="title">测试页面</text>
    <text>如果你能看到这个页面，说明代码可以正常运行</text>
  </view>
</template>

<script>
export default {
  data() {
    return {}
  },
  onLoad() {
    console.log('Page loaded')
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
  margin-bottom: 20rpx;
}
</style>
