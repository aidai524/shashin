// pages/detail/detail.js
const { request } = require('../../utils/request.js')

Page({
  data: {
    images: [],           // 所有图片列表
    currentImageIndex: 0, // 当前显示的图片索引
    currentImage: {},     // 当前显示的图片对象
    recordId: '',         // 记录ID
    thumbScrollId: '',    // 缩略图滚动位置
    showMoreMenu: false,  // 是否显示更多菜单
    loading: false        // 加载状态
  },

  onLoad(options) {
    const { recordData, imageIndex } = options

    try {
      console.log('接收到的数据:', { recordData, imageIndex })

      // 解析传递过来的记录数据
      const record = JSON.parse(decodeURIComponent(recordData))
      console.log('解析的记录:', record)

      const index = parseInt(imageIndex) || 0

      // 使用 thumbUrls 作为图片列表（因为历史页面只有 thumbUrls）
      const images = (record.thumbUrls || []).map((url, i) => {
        return {
          fullUrl: url,  // 缩略图URL也用作完整图片URL
          thumbUrl: url,
          key: record.thumbKeys?.[i] || `image_${i}`
        }
      })

      console.log('生成的图片列表:', images)
      console.log('当前索引:', index, '图片数量:', images.length)

      if (images.length === 0) {
        throw new Error('没有可显示的图片')
      }

      // 确保索引在有效范围内
      const validIndex = Math.min(Math.max(0, index), images.length - 1)

      this.setData({
        images: images,
        currentImage: images[validIndex],
        currentImageIndex: validIndex,
        recordId: record.id,
        thumbScrollId: `thumb-${validIndex}`,
        loading: false
      })

      console.log('设置的数据:', {
        imagesCount: images.length,
        currentIndex: validIndex,
        currentImage: images[validIndex]
      })
    } catch (e) {
      console.error('解析记录数据失败:', e)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      // 加载失败后返回上一页
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 点击缩略图
  handleThumbnailTap(e) {
    const index = parseInt(e.currentTarget.dataset.index)
    this.setData({
      currentImageIndex: index,
      currentImage: this.data.images[index],
      thumbScrollId: `thumb-${index}`
    })
  },

  // 点击主图片
  handleImageTap() {
    // 可以在这里实现全屏预览
  },

  // 切换更多菜单
  toggleMoreMenu() {
    this.setData({
      showMoreMenu: !this.data.showMoreMenu
    })
  },

  // 分享图片
  handleShare() {
    const { currentImage } = this.data

    wx.showLoading({
      title: '加载中...'
    })

    // 先下载图片到本地临时路径
    wx.downloadFile({
      url: currentImage.fullUrl,
      success: (res) => {
        wx.hideLoading()
        if (res.statusCode === 200) {
          // 调用图片分享 API
          wx.showShareImageMenu({
            path: res.tempFilePath,
            success: () => {
              console.log('分享成功')
            },
            fail: (err) => {
              console.error('分享失败:', err)
              wx.showToast({
                title: '分享失败',
                icon: 'none'
              })
            }
          })
        } else {
          wx.showToast({
            title: '图片加载失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('下载图片失败:', err)
        wx.showToast({
          title: '图片加载失败',
          icon: 'none'
        })
      }
    })

    this.toggleMoreMenu()
  },

  // 下载图片
  handleDownload() {
    const { currentImage } = this.data

    wx.showLoading({
      title: '下载中...'
    })

    wx.downloadFile({
      url: currentImage.fullUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading()
              wx.showToast({
                title: '已保存到相册',
                icon: 'success'
              })
              this.toggleMoreMenu()
            },
            fail: (err) => {
              wx.hideLoading()
              if (err.errMsg.includes('auth deny')) {
                wx.showModal({
                  title: '提示',
                  content: '需要您授权保存相册权限',
                  showCancel: false
                })
              } else {
                wx.showToast({
                  title: '保存失败',
                  icon: 'none'
                })
              }
            }
          })
        } else {
          wx.hideLoading()
          wx.showToast({
            title: '下载失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          title: '下载失败',
          icon: 'none'
        })
      }
    })
  },

  // 删除当前记录
  handleDelete() {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          this.deleteRecord()
        }
        this.toggleMoreMenu()
      }
    })
  },

  // 删除记录
  deleteRecord() {
    request({
      url: `/api/history/${this.data.recordId}`,
      method: 'DELETE'
    }).then(() => {
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }).catch(e => {
      console.error('删除失败:', e)
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      })
    })
  },

  // 分享给朋友
  onShareAppMessage() {
    const { currentImage } = this.data
    return {
      title: 'Shashin AI - AI生成的图片',
      path: '/pages/index/index',
      imageUrl: currentImage.thumbUrl
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { currentImage } = this.data
    return {
      title: 'Shashin AI - AI生成的图片',
      imageUrl: currentImage.thumbUrl
    }
  }
})
