<template>
  <view class="container">
    <!-- Category Filter -->
    <scroll-view scroll-x class="category-scroll" :show-scrollbar="false">
      <view class="category-list">
        <view 
          v-for="cat in categories" 
          :key="cat.id"
          :class="['category-item', currentCat === cat.id ? 'active' : '']"
          @click="currentCat = cat.id"
        >
          {{ cat.name }}
        </view>
      </view>
    </scroll-view>

    <!-- Template List -->
    <view class="template-grid">
      <!-- Sticker Entry -->
      <view class="template-card sticker-entry" @click="navigateToSticker">
        <view class="sticker-bg">
          <text class="sticker-icon">🤪</text>
        </view>
        <view class="tpl-info">
          <text class="tpl-name">表情包生成</text>
        </view>
      </view>

      <view 
        v-for="tpl in filteredTemplates" 
        :key="tpl.id" 
        class="template-card"
        @click="selectTemplate(tpl)"
      >
        <image :src="tpl.thumbnail" mode="aspectFill" class="tpl-thumb" />
        <view class="tpl-info">
          <text class="tpl-name">{{ tpl.name.zh }}</text>
        </view>
      </view>
    </view>
    
    <view v-if="loading" class="loading">加载中...</view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { request } from '../../utils/request'

const templates = ref([])
const loading = ref(true)
const currentCat = ref('all')

const categories = [
  { id: 'all', name: '全部' },
  { id: 'portrait', name: '人像' },
  { id: 'creative', name: '创意' },
  { id: 'scene', name: '场景' }
]

const filteredTemplates = computed(() => {
  if (currentCat.value === 'all') return templates.value
  return templates.value.filter(t => t.category === currentCat.value)
})

const fetchTemplates = async () => {
  try {
    const res = await request({ url: '/api/templates' })
    templates.value = res
  } catch (e) {
    uni.showToast({ title: '获取模板失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const selectTemplate = (tpl) => {
  uni.navigateTo({
    url: `/pages/generate/index?id=${tpl.id}`
  })
}

const navigateToSticker = () => {
  uni.navigateTo({ url: '/pages/sticker/index' })
}

onMounted(() => {
  fetchTemplates()
})
</script>

<style>
.container {
  min-height: 100vh;
  background-color: #f8f8f8;
}

.category-scroll {
  background-color: #fff;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid #eee;
}

.category-list {
  display: inline-flex;
  padding: 20rpx;
}

.category-item {
  padding: 10rpx 30rpx;
  background-color: #f0f0f0;
  border-radius: 30rpx;
  margin-right: 20rpx;
  font-size: 28rpx;
  color: #666;
}

.category-item.active {
  background-color: #333;
  color: #fff;
}

.template-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 20rpx;
  justify-content: space-between;
}

.template-card {
  width: 48%;
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
}

.sticker-bg {
  width: 100%;
  height: 340rpx;
  background-color: #FFEB3B;
  display: flex;
  justify-content: center;
  align-items: center;
}

.sticker-icon {
  font-size: 100rpx;
}

.tpl-thumb {
  width: 100%;
  height: 340rpx;
  background-color: #eee;
}

.tpl-info {
  padding: 20rpx;
}

.tpl-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.loading {
  text-align: center;
  padding: 40rpx;
  color: #999;
}
</style>
