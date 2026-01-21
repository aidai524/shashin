// pages/characters/edit.js
const { request } = require('../../utils/request.js')

Page({
  data: {
    characterId: null,
    name: '',
    description: '',
    photos: [],
    uploading: false,
    maxPhotos: 10
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ characterId: options.id })
      this.loadCharacter(options.id)
    }
  },

  // 加载角色详情
  loadCharacter(id) {
    request({
      url: `/api/characters/${id}`,
      method: 'GET'
    }).then(res => {
      this.setData({
        name: res.name,
        description: res.description || '',
        photos: res.photos || []
      })
    }).catch(e => {
      console.error('加载角色失败:', e)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  // 输入名称
  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  // 输入描述
  onDescInput(e) {
    this.setData({ description: e.detail.value })
  },

  // 添加照片
  handleAddPhoto() {
    const app = getApp()

    if (this.data.photos.length >= this.data.maxPhotos) {
      wx.showToast({
        title: `最多添加${this.data.maxPhotos}张照片`,
        icon: 'none'
      })
      return
    }

    wx.chooseMedia({
      count: this.data.maxPhotos - this.data.photos.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        this.uploadPhotos(res.tempFiles)
      }
    })
  },

  // 上传照片
  uploadPhotos(files) {
    if (files.length === 0) return

    this.setData({ uploading: true })

    const uploadPromises = files.map(file => {
      return new Promise((resolve, reject) => {
        // 压缩图片
        wx.compressImage({
          src: file.tempFilePath,
          quality: 80,
          success: (compressed) => {
            // 读取文件为 base64
            wx.getFileSystemManager().readFile({
              filePath: compressed.tempFilePath,
              encoding: 'base64',
              success: (res) => {
              resolve({
                data: `data:image/jpeg;base64,${res.data}`,
                base64: res.data,
                mimeType: 'image/jpeg',
                thumbnailSize: file.size
              })
            },
            fail: reject
          })
        },
        fail: () => {
          // 压缩失败，直接读取原文件
          wx.getFileSystemManager().readFile({
            filePath: file.tempFilePath,
            encoding: 'base64',
            success: (res) => {
              resolve({
                data: `data:image/jpeg;base64,${res.data}`,
                base64: res.data,
                mimeType: 'image/jpeg',
                thumbnailSize: file.size
              })
            },
            fail: reject
          })
        }
      })
      })
    })

    Promise.all(uploadPromises).then(photos => {
      // 添加到现有照片列表
      const newPhotos = [...this.data.photos, ...photos]
      this.setData({
        photos: newPhotos,
        uploading: false
      })
    }).catch(e => {
      console.error('上传失败:', e)
      this.setData({ uploading: false })
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      })
    })
  },

  // 预览照片
  previewPhoto(e) {
    const { index } = e.currentTarget.dataset
    const urls = this.data.photos.map(p => p.data)
    wx.previewImage({
      current: urls[index],
      urls: urls
    })
  },

  // 删除照片
  deletePhoto(e) {
    const { index } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张照片吗？',
      success: (res) => {
        if (res.confirm) {
          const photos = this.data.photos
          photos.splice(index, 1)
          this.setData({ photos })
        }
      }
    })
  },

  // 保存
  handleSave() {
    if (!this.data.name.trim()) {
      wx.showToast({
        title: '请输入角色名称',
        icon: 'none'
      })
      return
    }

    wx.showLoading({
      title: '保存中...',
      mask: true
    })

    const isNew = !this.data.characterId

    // 先创建或更新角色
    const characterPromise = isNew
      ? request({
        url: '/api/characters',
        method: 'POST',
        data: {
          name: this.data.name,
          description: this.data.description
        }
      })
      : request({
        url: `/api/characters/${this.data.characterId}`,
        method: 'PUT',
        data: {
          name: this.data.name,
          description: this.data.description
        }
      })

    characterPromise.then(res => {
      const characterId = res.character?.id || this.data.characterId

      // 如果是新创建的角色，需要更新 characterId
      if (isNew) {
        this.setData({ characterId })
      }

      // 现在处理照片上传
      // 注意：这里简化处理，实际应该只上传新照片
      // 如果是编辑，后端应该返回已有照片，我们只上传新增的
      this.saveCharacterPhotos(characterId)
    }).catch(e => {
      wx.hideLoading()
      console.error('保存失败:', e)
      wx.showToast({
        title: e.error || '保存失败',
        icon: 'none'
      })
    })
  },

  // 保存角色照片
  saveCharacterPhotos(characterId) {
    // 获取当前服务器上的角色信息，判断哪些照片是新的
    request({
      url: `/api/characters/${characterId}`,
      method: 'GET'
    }).then(res => {
      const existingPhotos = res.photos || []
      const existingPhotoIds = new Set(existingPhotos.map(p => p.id))

      // 找出需要上传的新照片（没有 id 的）
      const newPhotos = this.data.photos.filter(p => !p.id)

      if (newPhotos.length === 0) {
        // 没有新照片需要上传
        wx.hideLoading()
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
        return
      }

      // 逐个上传新照片
      const uploadPromises = newPhotos.map(photo => {
        return request({
          url: `/api/characters/${characterId}/photos`,
          method: 'POST',
          data: {
            photoData: photo.data,
            originalData: photo.data,
            mimeType: photo.mimeType,
            thumbnailSize: photo.thumbnailSize,
            originalSize: photo.thumbnailSize
          }
        })
      })

      Promise.all(uploadPromises).then(() => {
        wx.hideLoading()
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }).catch(e => {
        wx.hideLoading()
        console.error('上传照片失败:', e)
        wx.showToast({
          title: '上传照片失败',
          icon: 'none'
        })
      })
    }).catch(e => {
      wx.hideLoading()
      console.error('获取角色信息失败:', e)
    })
  }
})
