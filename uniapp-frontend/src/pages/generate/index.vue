<template>
  <view class="container">
    <view class="preview-section">
      <image :src="template.thumbnail" mode="aspectFill" class="template-bg" />
      <view class="preview-overlay">
        <text class="template-title">{{ template.name?.zh }}</text>
      </view>
    </view>

    <view class="config-panel">
      <!-- Character Selection -->
      <view class="section">
        <text class="section-title">选择角色</text>
        <scroll-view scroll-x class="char-scroll" :show-scrollbar="false">
          <view class="char-list">
            <view 
              class="char-item add-char" 
              @click="navigateToAddCharacter"
            >
              <text class="plus">+</text>
            </view>
            <view 
              v-for="char in characters" 
              :key="char.id"
              :class="['char-item', selectedCharId === char.id ? 'active' : '']"
              @click="selectedCharId = char.id"
            >
              <image :src="getCharacterAvatar(char)" mode="aspectFill" class="char-avatar" />
              <text class="char-name">{{ char.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- Ratio Selection -->
      <view class="section">
        <text class="section-title">画面比例</text>
        <view class="ratio-grid">
          <view 
            v-for="r in ratios" 
            :key="r.value"
            :class="['ratio-item', selectedRatio === r.value ? 'active' : '']"
            @click="selectedRatio = r.value"
          >
            <view :class="['ratio-box', r.cls]"></view>
            <text>{{ r.label }}</text>
          </view>
        </view>
      </view>

      <!-- Model Selection -->
      <view class="section">
        <text class="section-title">生成模型</text>
        <radio-group @change="onModelChange">
          <label class="radio-label">
            <radio value="gemini-1.5-flash" checked color="#333" />
            <text>Gemini 1.5 Flash (快速)</text>
          </label>
          <label class="radio-label">
            <radio value="gemini-1.5-pro" color="#333" />
            <text>Gemini 1.5 Pro (高质量)</text>
          </label>
        </radio-group>
      </view>

      <!-- Generate Button -->
      <button 
        class="generate-btn" 
        :disabled="generating" 
        @click="startGenerate"
      >
        {{ generating ? 'AI 生成中...' : '立即生成' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request } from '../../utils/request'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()
const template = ref({})
const characters = ref([])
const selectedCharId = ref('')
const selectedRatio = ref('1:1')
const selectedModel = ref('gemini-1.5-flash')
const generating = ref(false)

const ratios = [
  { value: '1:1', label: '1:1', cls: 'square' },
  { value: '3:4', label: '3:4', cls: 'portrait' },
  { value: '16:9', label: '16:9', cls: 'landscape' }
]

onLoad(async (options) => {
  if (options.id) {
    await fetchTemplate(options.id)
    await fetchCharacters()
  }
})

const fetchTemplate = async (id) => {
  try {
    const res = await request({ url: `/api/templates/${id}` })
    template.value = res
  } catch (e) {
    uni.showToast({ title: '加载模板失败', icon: 'none' })
  }
}

const fetchCharacters = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await request({ url: '/api/characters' })
    characters.value = res.characters
    if (characters.value.length > 0) {
      selectedCharId.value = characters.value[0].id
    }
  } catch (e) {}
}

const getCharacterAvatar = (char) => {
  if (char.photos && char.photos.length > 0) {
    return char.photos[0].data || char.photos[0].originalData
  }
  return '/static/default-avatar.png'
}

const navigateToAddCharacter = () => {
  uni.navigateTo({ url: '/pages/profile/character-edit' })
}

const onModelChange = (e) => {
  selectedModel.value = e.detail.value
}

const startGenerate = async () => {
  if (!userStore.isLoggedIn) {
    return uni.showToast({ title: '请先登录', icon: 'none' })
  }
  if (!selectedCharId.value) {
    return uni.showToast({ title: '请选择一个角色', icon: 'none' })
  }

  generating.value = true
  try {
    const res = await request({
      url: '/api/generate',
      method: 'POST',
      data: {
        templateId: template.value.id,
        characterId: selectedCharId.value,
        ratio: selectedRatio.value,
        model: selectedModel.value
      }
    })

    // TODO: Handle generated result (Assume backend returns image URL or Base64)
    // For now, let's assume we get a success message or placeholder
    uni.showToast({ title: '生成指令已发送', icon: 'success' })
    
    // In real scenario, navigate to result page or show modal
    // console.log(res)

  } catch (e) {
    uni.showToast({ title: '生成失败: ' + (e.message || '未知错误'), icon: 'none' })
  } finally {
    generating.value = false
  }
}
</script>

<style>
.container {
  min-height: 100vh;
  background-color: #fff;
  padding-bottom: 40rpx;
}

.preview-section {
  width: 100%;
  height: 500rpx;
  position: relative;
}

.template-bg {
  width: 100%;
  height: 100%;
}

.preview-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 40rpx 30rpx;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
}

.template-title {
  color: #fff;
  font-size: 36rpx;
  font-weight: bold;
}

.config-panel {
  padding: 30rpx;
  background-color: #fff;
  border-radius: 30rpx 30rpx 0 0;
  margin-top: -30rpx;
  position: relative;
}

.section {
  margin-bottom: 40rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  display: block;
}

.char-scroll {
  white-space: nowrap;
}

.char-list {
  display: inline-flex;
}

.char-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 30rpx;
  opacity: 0.5;
  transition: opacity 0.3s;
}

.char-item.active {
  opacity: 1;
}

.char-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 2px solid transparent;
}

.char-item.active .char-avatar {
  border-color: #333;
}

.add-char {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background-color: #f0f0f0;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 1;
}

.plus {
  font-size: 60rpx;
  color: #999;
}

.char-name {
  font-size: 24rpx;
  margin-top: 10rpx;
  color: #333;
}

.ratio-grid {
  display: flex;
  gap: 30rpx;
}

.ratio-item {
  flex: 1;
  background-color: #f8f8f8;
  border-radius: 12rpx;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 1px solid transparent;
}

.ratio-item.active {
  background-color: #fff;
  border-color: #333;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}

.ratio-box {
  border: 2px solid #999;
  margin-bottom: 10rpx;
}

.ratio-item.active .ratio-box {
  border-color: #333;
}

.ratio-box.square { width: 40rpx; height: 40rpx; }
.ratio-box.portrait { width: 30rpx; height: 40rpx; }
.ratio-box.landscape { width: 50rpx; height: 30rpx; }

.radio-label {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.radio-label text {
  margin-left: 10rpx;
  font-size: 28rpx;
}

.generate-btn {
  background-color: #333;
  color: #fff;
  border-radius: 50rpx;
  margin-top: 40rpx;
  font-size: 32rpx;
  font-weight: bold;
}
</style>
