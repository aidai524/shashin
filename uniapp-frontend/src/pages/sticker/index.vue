<template>
  <view class="page">
    <!-- Header -->
    <view class="header">
      <text class="title">AI 表情包制作</text>
      <text class="subtitle">选择角色，生成专属 Q 版表情包</text>
    </view>

    <!-- Content -->
    <scroll-view scroll-y class="content-scroll">
      <!-- Character Selection Section -->
      <view class="section">
        <text class="section-title">选择主角</text>
        <scroll-view scroll-x class="char-scroll" :show-scrollbar="false">
          <view class="char-list">
            <view
              v-for="char in characters"
              :key="char.id"
              :class="['char-item', { active: selectedCharId === char.id }]"
              @tap="selectedCharId = char.id"
            >
              <image
                :src="getCharacterAvatar(char)"
                mode="aspectFill"
                class="char-avatar"
              />
              <text class="char-name">{{ char.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- Generate Button Section -->
      <view class="action-section">
        <view
          :class="['generate-btn', { pressed: isButtonPressed, loading: generating, disabled: !selectedCharId }]"
          @tap="handleGenerate"
          @touchstart="isButtonPressed = true"
          @touchend="isButtonPressed = false"
          @touchcancel="isButtonPressed = false"
        >
          <text v-if="!generating" class="btn-text">生成表情包 (一套9个)</text>
          <text v-else class="btn-text">AI 正在绘制中...</text>
        </view>
      </view>

      <!-- Result Area -->
      <view v-if="resultImage" class="result-section">
        <text class="result-title">生成结果</text>
        <image
          :src="resultImage"
          mode="widthFix"
          class="result-img"
          @tap="previewResult"
        />
        <text class="tips">提示：长按图片保存到相册，或使用截屏工具裁剪使用</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { request } from '../../utils/request'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const characters = ref([])
const selectedCharId = ref('')
const generating = ref(false)
const resultImage = ref('')
const isButtonPressed = ref(false)

onMounted(() => {
  fetchCharacters()
})

const fetchCharacters = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await request({ url: '/api/characters' })
    characters.value = res.characters || []
    if (characters.value.length > 0) {
      selectedCharId.value = characters.value[0].id
    }
  } catch (e) {
    console.error('获取角色失败:', e)
  }
}

const getCharacterAvatar = (char) => {
  if (char.photos && char.photos.length > 0) {
    return char.photos[0].data || char.photos[0].originalData
  }
  return '/static/default-avatar.png'
}

const handleGenerate = async () => {
  if (!userStore.isLoggedIn) {
    return uni.showToast({ title: '请先登录', icon: 'none' })
  }
  if (!selectedCharId.value) {
    return uni.showToast({ title: '请选择角色', icon: 'none' })
  }

  generating.value = true

  try {
    const res = await request({
      url: '/api/generate',
      method: 'POST',
      data: {
        templateId: 'anime-style',
        characterId: selectedCharId.value,
        ratio: '1:1',
        model: 'gemini-1.5-pro'
      }
    })

    uni.showToast({ title: '生成指令已发送', icon: 'success' })

  } catch (e) {
    console.error('生成失败:', e)
    uni.showToast({ title: '生成失败', icon: 'none' })
  } finally {
    generating.value = false
  }
}

const previewResult = () => {
  if (resultImage.value) {
    uni.previewImage({ urls: [resultImage.value] })
  }
}
</script>

<style scoped>
/* ========== Page Container ========== */
.page {
  min-height: 100vh;
  background-color: #FFFFFF;
}

/* ========== Header ========== */
.header {
  padding: 48rpx 32rpx 32rpx;
}

.title {
  display: block;
  font-size: 44rpx;
  font-weight: 600;
  color: #111111;
  line-height: 1.3;
  margin-bottom: 12rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #666666;
  opacity: 0.7;
  line-height: 1.4;
}

/* ========== Content Scroll ========== */
.content-scroll {
  height: calc(100vh - 200rpx);
  padding: 0 32rpx 32rpx;
}

/* ========== Section ========== */
.section {
  margin-bottom: 48rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #111111;
  margin-bottom: 24rpx;
}

/* ========== Character Scroll ========== */
.char-scroll {
  width: 100%;
  white-space: nowrap;
}

.char-list {
  display: inline-flex;
  gap: 24rpx;
}

.char-item {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0.4;
  transition: all 0.3s ease;
}

.char-item.active {
  opacity: 1;
  transform: scale(1.05);
}

.char-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 70rpx;
  border: 4rpx solid transparent;
  background-color: #F0F0F0;
  transition: border-color 0.3s ease;
}

.char-item.active .char-avatar {
  border-color: #111111;
}

.char-name {
  font-size: 26rpx;
  margin-top: 16rpx;
  color: #111111;
  font-weight: 500;
}

/* ========== Action Section ========== */
.action-section {
  margin-bottom: 48rpx;
}

.generate-btn {
  width: 100%;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #111111;
  border-radius: 48rpx;
  transition: all 0.2s ease;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
}

.generate-btn.pressed {
  transform: scale(0.98);
  opacity: 0.9;
}

.generate-btn.loading {
  opacity: 0.6;
}

.generate-btn.disabled {
  opacity: 0.3;
  box-shadow: none;
}

.btn-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #FFFFFF;
  letter-spacing: 0.5rpx;
}

/* ========== Result Section ========== */
.result-section {
  padding: 32rpx;
  background-color: #F6F7F9;
  border-radius: 32rpx;
}

.result-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #111111;
  margin-bottom: 24rpx;
}

.result-img {
  width: 100%;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.10);
  display: block;
  margin-bottom: 20rpx;
}

.tips {
  display: block;
  font-size: 24rpx;
  color: #666666;
  opacity: 0.7;
  text-align: center;
  line-height: 1.6;
}
</style>
