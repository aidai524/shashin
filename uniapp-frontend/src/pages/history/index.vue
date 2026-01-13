<template>
  <view class="container">
    <view class="history-grid">
      <view 
        v-for="item in historyList" 
        :key="item.id" 
        class="history-item"
        @click="previewImage(item)"
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
    
    <view v-if="loading" class="loading">加载中...</view>
    <view v-else-if="historyList.length === 0" class="empty">
      <text>暂无生成记录</text>
    </view>
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
    historyList.value = res.records
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const getImageUrl = (item) => {
  // 优先使用缩略图 keys (R2)，如果没有则尝试 base64 (旧数据)
  if (item.thumbKeys && item.thumbKeys.length > 0) {
    // 假设后端有一个代理接口或者 R2 是公开的
    // 根据后端代码：GET /api/history/image/:key
    return `${config.API_BASE_URL}/api/history/image/${encodeURIComponent(item.thumbKeys[0])}`
  }
  // 兼容旧数据
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

<style>
.container {
  padding: 20rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.history-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.history-item {
  width: 48%;
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.05);
}

.history-img {
  width: 100%;
  height: 340rpx;
  background-color: #eee;
}

.history-info {
  padding: 16rpx;
}

.history-time {
  font-size: 24rpx;
  color: #999;
}

.loading, .empty {
  text-align: center;
  padding: 40rpx;
  color: #999;
}
</style>
