<template>
  <view class="page">
    <!-- Page Header -->
    <view class="page-header">
      <text class="page-title">History</text>
      <text class="page-subtitle">Your generated images</text>
    </view>

    <!-- History Grid -->
    <scroll-view scroll-y class="content-scroll">
      <view v-if="loading" class="skeleton-grid">
        <view v-for="n in 6" :key="n" class="skeleton-item">
          <view class="skeleton-image">
            <view class="shimmer"></view>
          </view>
          <view class="skeleton-text"></view>
        </view>
      </view>

      <view v-else class="history-grid">
        <view
          v-for="item in historyList"
          :key="item.id"
          class="history-item"
          @tap="previewImage(item)"
        >
          <image
            :src="getImageUrl(item)"
            mode="aspectFill"
            class="history-img"
          />
          <view class="history-info">
            <text class="history-time">{{ formatDate(item.createdAt) }}</text>
          </view>
        </view>
      </view>

      <view v-if="!loading && historyList.length === 0" class="empty-state">
        <text class="empty-icon">📷</text>
        <text class="empty-text">暂无生成记录</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { request } from '../../utils/request'
import { config } from '../../utils/config'

const historyList = ref([])
const loading = ref(true)

const fetchHistory = async () => {
  loading.value = true
  try {
    const res = await request({ url: '/api/history' })
    historyList.value = res.records || []
  } catch (e) {
    console.error('加载历史失败:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const getImageUrl = (item) => {
  if (item.thumbKeys && item.thumbKeys.length > 0) {
    return `${config.API_BASE_URL}/api/history/image/${encodeURIComponent(item.thumbKeys[0])}`
  }
  if (item.thumbnails && item.thumbnails.length > 0) {
    return item.thumbnails[0].data
  }
  return ''
}

const getOriginalUrl = (item) => {
  if (item.imageKeys && item.imageKeys.length > 0) {
    return `${config.API_BASE_URL}/api/history/image/${encodeURIComponent(item.imageKeys[0])}`
  }
  return ''
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

const previewImage = (item) => {
  const url = getOriginalUrl(item) || getImageUrl(item)
  if (url) {
    uni.previewImage({
      urls: [url]
    })
  }
}

onShow(() => {
  fetchHistory()
})
</script>

<style scoped>
/* ========== Page Container ========== */
.page {
  min-height: 100vh;
  background-color: #F6F7F9;
}

/* ========== Page Header ========== */
.page-header {
  padding: 32rpx 32rpx 24rpx;
}

.page-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #111111;
  line-height: 1.3;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
}

.page-subtitle {
  display: block;
  font-size: 24rpx;
  font-weight: 400;
  color: #111111;
  opacity: 0.6;
  margin-top: 4rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
}

/* ========== Content Scroll ========== */
.content-scroll {
  height: calc(100vh - 140rpx);
  padding: 0 32rpx 32rpx;
}

/* ========== Skeleton Grid ========== */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

.skeleton-item {
  background-color: #FFFFFF;
  border-radius: 32rpx;
  overflow: hidden;
  padding: 16rpx;
}

.skeleton-image {
  width: 100%;
  height: 340rpx;
  background-color: #F0F0F0;
  border-radius: 24rpx;
  position: relative;
  overflow: hidden;
  margin-bottom: 16rpx;
}

.shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-text {
  width: 60%;
  height: 32rpx;
  background-color: #F0F0F0;
  border-radius: 8rpx;
}

/* ========== History Grid ========== */
.history-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}

/* ========== History Item ========== */
.history-item {
  background-color: #FFFFFF;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.10);
  transition: all 0.2s ease;
}

.history-item:active {
  transform: scale(0.98);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.history-img {
  width: 100%;
  height: 340rpx;
  background-color: #F0F0F0;
  display: block;
}

.history-info {
  padding: 24rpx;
}

.history-time {
  font-size: 24rpx;
  color: #666666;
  opacity: 0.7;
  font-weight: 500;
}

/* ========== Empty State ========== */
.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}
</style>
