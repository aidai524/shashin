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

  // 智能压缩图片到指定大小以内
  compressImageToSize(filePath, maxSize) {
    const MAX_WIDTH = 800 // 最大宽度800px，足够识别人脸
    const MIN_QUALITY = 30 // 最低质量30%
    const INITIAL_QUALITY = 60 // 初始质量60%

    return new Promise((resolve, reject) => {
      // 第一步：获取图片信息
      wx.getImageInfo({
        src: filePath,
        success: (imgInfo) => {
          // 计算目标尺寸（保持宽高比，最大宽度800px）
          let targetWidth = imgInfo.width
          let targetHeight = imgInfo.height

          if (targetWidth > MAX_WIDTH) {
            targetHeight = Math.round(targetHeight * (MAX_WIDTH / targetWidth))
            targetWidth = MAX_WIDTH
          }

          // 第二步：先调整尺寸
          const tempFilePath = imgInfo.path
          this.compressWithQuality(tempFilePath, targetWidth, targetHeight, INITIAL_QUALITY, maxSize, resolve, reject)
        },
        fail: (err) => {
          console.error('获取图片信息失败:', err)
          reject(err)
        }
      })
    })
  },

  // 使用指定质量压缩，如果超过大小则降低质量重试
  compressWithQuality(filePath, width, height, quality, maxSize, resolve, reject) {
    wx.compressImage({
      src: filePath,
      quality: quality,
      success: (res) => {
        // 读取压缩后的文件大小
        wx.getFileSystemManager().stat({
          path: res.tempFilePath,
          success: (stat) => {
            const fileSize = stat.size

            console.log(`压缩尝试: 质量=${quality}%, 大小=${Math.round(fileSize / 1024)}KB`)

            if (fileSize <= maxSize || quality <= 30) {
              // 大小满足要求或已达到最低质量，读取base64并返回
              wx.getFileSystemManager().readFile({
                filePath: res.tempFilePath,
                encoding: 'base64',
                success: (readRes) => {
                  resolve({
                    base64: readRes.data,
                    size: fileSize,
                    quality: quality
                  })
                },
                fail: reject
              })
            } else {
              // 继续降低质量压缩
              const newQuality = Math.max(30, quality - 10)
              this.compressWithQuality(filePath, width, height, newQuality, maxSize, resolve, reject)
            }
          },
          fail: (err) => {
            console.error('获取文件大小失败:', err)
            // 无法获取大小，直接读取base64
            wx.getFileSystemManager().readFile({
              filePath: res.tempFilePath,
              encoding: 'base64',
              success: (readRes) => {
                resolve({
                  base64: readRes.data,
                  size: 0,
                  quality: quality
                })
              },
              fail: reject
            })
          }
        })
      },
      fail: (err) => {
        console.error('压缩失败:', err)
        reject(err)
      }
    })
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
      wx.showLoading({
        title: '正在压缩图片...',
        mask: true
      })

      return this.compressImageToSize(file.tempFilePath, 50 * 1024) // 50KB
        .then(compressed => {
          wx.hideLoading()
          const sizeKB = Math.round(compressed.size / 1024)
          console.log(`✅ 图片压缩完成: ${sizeKB}KB (质量: ${compressed.quality}%)`)

          // 如果压缩后仍然大于50KB，提示用户
          if (compressed.size > 50 * 1024) {
            wx.showToast({
              title: `图片已压缩至${sizeKB}KB（已达最低质量）`,
              icon: 'none',
              duration: 2000
            })
          } else {
            wx.showToast({
              title: `图片已压缩至${sizeKB}KB`,
              icon: 'success',
              duration: 1500
            })
          }

          return {
            data: `data:image/jpeg;base64,${compressed.base64}`,
            base64: compressed.base64,
            mimeType: 'image/jpeg',
            thumbnailSize: compressed.size
          }
        })
        .catch(err => {
          wx.hideLoading()
          console.error('压缩失败:', err)
          // 压缩失败，返回原始文件
          return new Promise((resolve, reject) => {
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
