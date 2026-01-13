<template>
  <view class="container">
    <view class="character-list">
      <view v-for="char in characters" :key="char.id" class="character-card" @click="editCharacter(char.id)">
        <image 
          class="char-avatar" 
          :src="getCharacterAvatar(char)" 
          mode="aspectFill"
        />
        <view class="char-info">
          <text class="char-name">{{ char.name }}</text>
          <text class="char-desc">{{ char.description || '暂无描述' }}</text>
        </view>
        <view class="arrow">></view>
      </view>
      
      <!-- Add Button -->
      <view class="add-btn" @click="addCharacter">
        <text class="plus">+</text>
        <text>新建角色</text>
      </view>
    </view>
    
    <view v-if="loading" class="loading">加载中...</view>
    <view v-else-if="characters.length === 0" class="empty">
      <text>还没有角色，快去创建一个吧</text>
    </view>
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
    characters.value = res.characters
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const getCharacterAvatar = (char) => {
  if (char.photos && char.photos.length > 0) {
    // 优先使用缩略图
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

<style>
.container {
  padding: 20rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.character-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.character-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
}

.char-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background-color: #eee;
  margin-right: 20rpx;
}

.char-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.char-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.char-desc {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
}

.arrow {
  color: #ccc;
}

.add-btn {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #3cc51f;
  font-size: 30rpx;
  border: 1px dashed #3cc51f;
}

.plus {
  font-size: 40rpx;
  margin-right: 10rpx;
  line-height: 1;
}

.loading, .empty {
  text-align: center;
  color: #999;
  padding: 40rpx;
}
</style>
