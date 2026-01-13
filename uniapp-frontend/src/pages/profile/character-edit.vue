<template>
  <view class="container">
    <!-- Basic Info -->
    <view class="form-group">
      <view class="form-item">
        <text class="label">角色名称</text>
        <input class="input" v-model="form.name" placeholder="例如：本人、女朋友" />
      </view>
      <view class="form-item">
        <text class="label">描述</text>
        <input class="input" v-model="form.description" placeholder="简单的描述（可选）" />
      </view>
    </view>

    <!-- Photos -->
    <view class="section-title">参考照片 ({{ photos.length }}/{{ maxPhotos }})</view>
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
          @click="previewPhoto(index)"
        />
        <view class="delete-btn" @click.stop="deletePhoto(index)">×</view>
        <view v-if="photo.uploading" class="upload-mask">
          <text>上传中...</text>
        </view>
      </view>
      
      <!-- Upload Button -->
      <view v-if="photos.length < maxPhotos" class="upload-btn" @click="chooseImage">
        <text class="plus">+</text>
      </view>
    </view>

    <!-- Save Button -->
    <view class="footer">
      <button class="save-btn" type="primary" @click="saveCharacter" :loading="saving">保存</button>
      <button v-if="isEdit" class="delete-btn-main" type="warn" @click="deleteCharacter">删除角色</button>
    </view>
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
      uploaded: true // Mark as already uploaded
    }))
  } catch (e) {
    uni.showToast({ title: '获取详情失败', icon: 'none' })
  }
}

// Choose and Upload Image
const chooseImage = () => {
  uni.chooseMedia({
    count: maxPhotos.value - photos.value.length,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      // If creating new character, save it first
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
          return // Stop if creation failed
        }
      }
      
      // Process selected images
      for (const file of res.tempFiles) {
        const photoItem = {
          tempFilePath: file.tempFilePath,
          uploading: true,
          uploaded: false
        }
        photos.value.push(photoItem)
        
        // Upload immediately
        uploadPhoto(file, photoItem)
      }
    }
  })
}

// Convert File to Base64 (UniApp specific)
const fileToBase64 = (filePath) => {
  return new Promise((resolve, reject) => {
    // For H5
    // #ifdef H5
    uni.request({
      url: filePath,
      responseType: 'arraybuffer',
      success: (res) => {
        const base64 = uni.arrayBufferToBase64(res.data)
        resolve('data:image/jpeg;base64,' + base64)
      },
      fail: reject
    })
    // #endif

    // For MiniProgram
    // #ifndef H5
    const fs = uni.getFileSystemManager()
    fs.readFile({
      filePath: filePath,
      encoding: 'base64',
      success: (res) => {
        resolve('data:image/jpeg;base64,' + res.data)
      },
      fail: reject
    })
    // #endif
  })
}

const uploadPhoto = async (file, photoItem) => {
  try {
    // 1. Convert to Base64 for Cloudflare Worker upload (Since we use KV/R2 direct via API)
    // Note: Ideally, use uni.uploadFile but our backend expects JSON with base64 for 'addCharacterPhoto' endpoint structure
    // Let's check backend implementation: It expects `photoData` (base64) in JSON body.
    
    const base64 = await fileToBase64(file.tempFilePath)
    
    const res = await request({
      url: `/api/characters/${characterId.value}/photos`,
      method: 'POST',
      data: {
        photoData: base64, // Thumbnail
        originalData: base64, // Original (For now same, in real app should compress on client)
        mimeType: 'image/jpeg'
      }
    })
    
    // Update photo item with server response
    Object.assign(photoItem, {
      ...res.photo,
      uploading: false,
      uploaded: true
    })
    
  } catch (e) {
    console.error(e)
    photoItem.uploading = false
    uni.showToast({ title: '图片上传失败', icon: 'none' })
    // Remove failed photo
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
    uni.showToast({ title: '保存成功' })
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
      uni.showToast({ title: '创建成功' })
      setTimeout(() => uni.navigateBack(), 1500)
    } catch (e) {}
  }
}

const deleteCharacter = () => {
  uni.showModal({
    title: '警告',
    content: '确定要删除这个角色吗？此操作无法撤销。',
    confirmColor: '#e64340',
    success: async (res) => {
      if (res.confirm) {
        try {
          await request({
            url: `/api/characters/${characterId.value}`,
            method: 'DELETE'
          })
          uni.navigateBack()
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}
</script>

<style>
.container {
  padding: 30rpx;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.form-group {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 0 30rpx;
  margin-bottom: 30rpx;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1px solid #eee;
}

.form-item:last-child {
  border-bottom: none;
}

.label {
  width: 160rpx;
  font-size: 30rpx;
  color: #333;
}

.input {
  flex: 1;
  font-size: 30rpx;
}

.section-title {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
  margin-left: 10rpx;
}

.photo-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-bottom: 100rpx;
}

.photo-item, .upload-btn {
  width: 220rpx;
  height: 220rpx;
  border-radius: 12rpx;
  position: relative;
  overflow: hidden;
}

.upload-btn {
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px dashed #ccc;
}

.plus {
  font-size: 60rpx;
  color: #ccc;
}

.photo-img {
  width: 100%;
  height: 100%;
}

.delete-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 40rpx;
  height: 40rpx;
  background-color: rgba(0,0,0,0.5);
  color: #fff;
  text-align: center;
  line-height: 40rpx;
  border-bottom-left-radius: 12rpx;
}

.upload-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.upload-mask text {
  color: #fff;
  font-size: 24rpx;
}

.footer {
  margin-top: 50rpx;
}

.save-btn {
  margin-bottom: 30rpx;
}
</style>
