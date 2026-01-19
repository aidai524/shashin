<template>
  <view class="page">
    <!-- Page Header -->
    <view class="page-header">
      <text class="page-title">My Characters</text>
      <text class="page-subtitle">Manage your AI characters</text>
    </view>

    <!-- Character List -->
    <scroll-view scroll-y class="content-scroll">
      <view v-if="loading" class="skeleton-list">
        <view v-for="n in 3" :key="n" class="skeleton-item">
          <view class="skeleton-avatar"></view>
          <view class="skeleton-content">
            <view class="skeleton-line"></view>
            <view class="skeleton-line short"></view>
          </view>
        </view>
      </view>

      <view v-else class="character-list">
        <view
          v-for="char in characters"
          :key="char.id"
          class="character-card"
          @tap="editCharacter(char.id)"
        >
          <image
            class="char-avatar"
            :src="getCharacterAvatar(char)"
            mode="aspectFill"
          />
          <view class="char-info">
            <text class="char-name">{{ char.name }}</text>
            <text class="char-desc">{{ char.description || '暂无描述' }}</text>
          </view>
          <view class="arrow">→</view>
        </view>

        <!-- Add Button -->
        <view class="add-card" @tap="addCharacter">
          <view class="add-icon">+</view>
          <text class="add-text">新建角色</text>
        </view>
      </view>

      <view v-if="!loading && characters.length === 0" class="empty-state">
        <text class="empty-icon">👤</text>
        <text class="empty-text">还没有角色，快去创建一个吧</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { request } from '../../utils/request'
import { onShow } from '@dcloudio/uni-app'

const characters = ref([])
const loading = ref(true)

const fetchCharacters = async () => {
  loading.value = true
  try {
    const res = await request({
      url: '/api/characters',
      method: 'GET'
    })
    characters.value = res.characters || []
  } catch (e) {
    console.error('加载角色失败:', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const getCharacterAvatar = (char) => {
  if (char.photos && char.photos.length > 0) {
    return char.photos[0].data || char.photos[0].originalData
  }
  return '/static/default-avatar.png'
}

const addCharacter = () => {
  uni.navigateTo({ url: '/pages/profile/character-edit' })
}

const editCharacter = (id) => {
  uni.navigateTo({ url: `/pages/profile/character-edit?id=${id}` })
}

onShow(() => {
  fetchCharacters()
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

/* ========== Skeleton List ========== */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.skeleton-item {
  background-color: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.skeleton-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background-color: #F0F0F0;
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.skeleton-line {
  height: 32rpx;
  background-color: #F0F0F0;
  border-radius: 8rpx;
  width: 100%;
}

.skeleton-line.short {
  width: 60%;
}

/* ========== Character List ========== */
.character-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* ========== Character Card ========== */
.character-card {
  background-color: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.10);
  transition: all 0.2s ease;
}

.character-card:active {
  transform: scale(0.98);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.char-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background-color: #F0F0F0;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.char-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.char-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #111111;
  line-height: 1.3;
}

.char-desc {
  font-size: 24rpx;
  color: #666666;
  opacity: 0.7;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arrow {
  font-size: 32rpx;
  color: #CCCCCC;
  font-weight: 300;
  margin-left: 16rpx;
}

/* ========== Add Card ========== */
.add-card {
  background-color: #FFFFFF;
  border-radius: 32rpx;
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2rpx dashed rgba(0, 0, 0, 0.15);
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.10);
  transition: all 0.2s ease;
}

.add-card:active {
  transform: scale(0.98);
  background-color: #FAFAFA;
}

.add-icon {
  font-size: 72rpx;
  color: #111111;
  font-weight: 200;
  line-height: 1;
  margin-bottom: 16rpx;
}

.add-text {
  font-size: 28rpx;
  color: #111111;
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
  text-align: center;
  line-height: 1.6;
}
</style>
