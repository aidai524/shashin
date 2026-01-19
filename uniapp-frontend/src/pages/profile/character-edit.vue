<template>
  <view class="page">
    <!-- Header -->
    <view class="page-header">
      <text class="page-title">{{ isEdit ? '编辑角色' : '新建角色' }}</text>
      <text class="page-subtitle">{{ isEdit ? '修改角色信息' : '创建新的AI角色' }}</text>
    </view>

    <!-- Content -->
    <scroll-view scroll-y class="content-scroll">
      <!-- Basic Info Form -->
      <view class="form-section">
        <view class="form-item">
          <text class="form-label">角色名称</text>
          <input
            class="form-input"
            v-model="form.name"
            placeholder="例如：本人、女朋友"
            placeholder-class="placeholder"
          />
        </view>
        <view class="form-item last">
          <text class="form-label">描述</text>
          <input
            class="form-input"
            v-model="form.description"
            placeholder="简单的描述（可选）"
            placeholder-class="placeholder"
          />
        </view>
      </view>

      <!-- Photos Section -->
      <view class="photos-section">
        <text class="section-title">参考照片 ({{ photos.length }}/{{ maxPhotos }})</text>
        <view class="photo-grid">
          <view
            v-for="(photo, index) in photos"
            :key="index"
            class="photo-item"
          >
            <image
              :src="photo.tempFilePath || photo.data"
              mode="aspectFill"
              class="photo-img"
              @tap="previewPhoto(index)"
            />
            <view class="delete-btn" @tap.stop="deletePhoto(index)">×</view>
            <view v-if="photo.uploading" class="upload-mask">
              <text class="upload-text">上传中...</text>
            </view>
          </view>

          <!-- Upload Button -->
          <view v-if="photos.length < maxPhotos" class="upload-btn" @tap="chooseImage">
            <view class="plus-icon">+</view>
            <text class="upload-text">添加照片</text>
          </view>
        </view>
        <text class="photo-tip">建议上传3-10张清晰照片以获得更好效果</text>
      </view>

      <!-- Action Buttons -->
      <view class="action-section">
        <view
          :class="['save-btn', { loading: saving }]"
          @tap="saveCharacter"
        >
          <text v-if="!saving" class="btn-text">保存角色</text>
          <text v-else class="btn-text">保存中...</text>
        </view>

        <view
          v-if="isEdit"
          class="delete-btn-main"
          @tap="deleteCharacter"
        >
          <text class="delete-text">删除角色</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request } from '../../utils/request'
import { config } from '../../utils/config'

const isEdit = ref(false)
const characterId = ref('')
const saving = ref(false)
const maxPhotos = ref(10)

const form = reactive({
  name: '',
  description: ''
})

const photos = ref([])

onLoad(async (options) => {
  if (options.id) {
    isEdit.value = true
    characterId.value = options.id
    uni.setNavigationBarTitle({ title: '编辑角色' })
    await fetchCharacterDetails(options.id)
  } else {
    uni.setNavigationBarTitle({ title: '新建角色' })
  }
})

const fetchCharacterDetails = async (id) => {
  try {
    const res = await request({ url: `/api/characters/${id}` })
    form.name = res.name
    form.description = res.description
    photos.value = res.photos.map(p => ({
      ...p,
      uploaded: true
    }))
  } catch (e) {
    console.error('获取详情失败:', e)
    uni.showToast({ title: '获取详情失败', icon: 'none' })
  }
}

const chooseImage = () => {
  uni.chooseMedia({
    count: maxPhotos.value - photos.value.length,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      if (!isEdit.value) {
        if (!form.name) {
          uni.showToast({ title: '请先输入角色名称', icon: 'none' })
          return
        }
        try {
          const newChar = await createCharacter()
          isEdit.value = true
          characterId.value = newChar.character.id
        } catch (e) {
          return
        }
      }

      for (const file of res.tempFiles) {
        const photoItem = {
          tempFilePath: file.tempFilePath,
          uploading: true,
          uploaded: false
        }
        photos.value.push(photoItem)
        uploadPhoto(file, photoItem)
      }
    }
  })
}

const fileToBase64 = (filePath) => {
  return new Promise((resolve, reject) => {
    const fs = uni.getFileSystemManager()
    fs.readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (res) => {
        resolve('data:image/jpeg;base64,' + res.data)
      },
      fail: reject
    })
  })
}

const uploadPhoto = async (file, photoItem) => {
  try {
    const base64 = await fileToBase64(file.tempFilePath)

    const res = await request({
      url: `/api/characters/${characterId.value}/photos`,
      method: 'POST',
      data: {
        photoData: base64,
        originalData: base64,
        mimeType: 'image/jpeg'
      }
    })

    Object.assign(photoItem, {
      ...res.photo,
      uploading: false,
      uploaded: true
    })

  } catch (e) {
    console.error('上传失败:', e)
    photoItem.uploading = false
    uni.showToast({ title: '图片上传失败', icon: 'none' })
    const index = photos.value.indexOf(photoItem)
    if (index > -1) photos.value.splice(index, 1)
  }
}

const deletePhoto = async (index) => {
  const photo = photos.value[index]
  if (photo.uploaded && photo.id) {
    uni.showModal({
      title: '提示',
      content: '确定删除这张照片吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request({
              url: `/api/characters/${characterId.value}/photos/${photo.id}`,
              method: 'DELETE'
            })
            photos.value.splice(index, 1)
          } catch (e) {
            uni.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  } else {
    photos.value.splice(index, 1)
  }
}

const previewPhoto = (index) => {
  const urls = photos.value.map(p => p.tempFilePath || p.data)
  uni.previewImage({
    urls: urls,
    current: index
  })
}

const createCharacter = async () => {
  saving.value = true
  try {
    const res = await request({
      url: '/api/characters',
      method: 'POST',
      data: form
    })
    return res
  } catch (e) {
    uni.showToast({ title: '创建失败', icon: 'none' })
    throw e
  } finally {
    saving.value = false
  }
}

const updateCharacter = async () => {
  saving.value = true
  try {
    await request({
      url: `/api/characters/${characterId.value}`,
      method: 'PUT',
      data: form
    })
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch (e) {
    uni.showToast({ title: '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

const saveCharacter = async () => {
  if (!form.name) {
    return uni.showToast({ title: '请输入角色名称', icon: 'none' })
  }

  if (isEdit.value) {
    await updateCharacter()
  } else {
    try {
      await createCharacter()
      uni.showToast({ title: '创建成功', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 1500)
    } catch (e) {}
  }
}

const deleteCharacter = () => {
  uni.showModal({
    title: '警告',
    content: '确定要删除这个角色吗？此操作无法撤销。',
    confirmColor: '#FF6B6B',
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({
            url: `/api/characters/${characterId.value}`,
            method: 'DELETE'
          })
          uni.showToast({ title: '删除成功', icon: 'success' })
          setTimeout(() => uni.navigateBack(), 1500)
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}
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

/* ========== Form Section ========== */
.form-section {
  background-color: #FFFFFF;
  border-radius: 32rpx;
  padding: 0 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.10);
}

.form-item {
  display: flex;
  align-items: center;
  padding: 32rpx 0;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
}

.form-item.last {
  border-bottom: none;
}

.form-label {
  width: 160rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #111111;
  flex-shrink: 0;
}

.form-input {
  flex: 1;
  font-size: 28rpx;
  color: #111111;
}

.placeholder {
  color: #CCCCCC;
}

/* ========== Photos Section ========== */
.photos-section {
  background-color: #FFFFFF;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.10);
}

.section-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #111111;
  margin-bottom: 24rpx;
}

.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.photo-item, .upload-btn {
  width: calc((100% - 32rpx) / 3);
  aspect-ratio: 1;
  border-radius: 24rpx;
  position: relative;
  overflow: hidden;
}

.upload-btn {
  background-color: #FAFAFA;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2rpx dashed rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.upload-btn:active {
  background-color: #F0F0F0;
  transform: scale(0.98);
}

.plus-icon {
  font-size: 56rpx;
  color: #999999;
  font-weight: 200;
  line-height: 1;
  margin-bottom: 8rpx;
}

.upload-text {
  font-size: 22rpx;
  color: #999999;
  font-weight: 500;
}

.photo-img {
  width: 100%;
  height: 100%;
  display: block;
}

.delete-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 48rpx;
  height: 48rpx;
  background-color: rgba(0, 0, 0, 0.6);
  color: #FFFFFF;
  text-align: center;
  line-height: 48rpx;
  border-bottom-left-radius: 24rpx;
  font-size: 32rpx;
  font-weight: 300;
}

.upload-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}

.upload-mask .upload-text {
  color: #FFFFFF;
  font-size: 24rpx;
  font-weight: 500;
}

.photo-tip {
  display: block;
  font-size: 24rpx;
  color: #666666;
  opacity: 0.7;
  text-align: center;
  margin-top: 16rpx;
}

/* ========== Action Section ========== */
.action-section {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.save-btn {
  width: 100%;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #111111;
  border-radius: 48rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.save-btn:active {
  transform: scale(0.98);
  opacity: 0.9;
}

.save-btn.loading {
  opacity: 0.6;
}

.btn-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #FFFFFF;
  letter-spacing: 0.5rpx;
}

.delete-btn-main {
  width: 100%;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #FFFFFF;
  border-radius: 48rpx;
  border: 2rpx solid #FF6B6B;
  transition: all 0.2s ease;
}

.delete-btn-main:active {
  transform: scale(0.98);
  background-color: #FFF5F5;
}

.delete-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #FF6B6B;
}
</style>
