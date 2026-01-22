// pages/history/history.js
const { request } = require('../../utils/request.js')

Page({
  data: {
    records: [],
    loading: true,
    refreshing: false,
    hasMore: true,
    apiBaseUrl: ''
  },

  onLoad() {
    const app = getApp()
    this.setData({ apiBaseUrl: app.globalData.API_BASE_URL })
    this.checkLoginAndLoad()
  },

  onShow() {
    // 每次显示页面时刷新数据
    if (this.data.records.length > 0) {
      this.fetchHistory()
    }
  },

  // 检查登录状态并加载历史
  checkLoginAndLoad() {
    const app = getApp()
    if (!app.checkLogin()) {
      wx.showModal({
        title: '提示',
        content: '请先登录查看历史记录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/profile/profile'
            })
          } else {
            wx.navigateBack()
          }
        }
      })
      return
    }
    this.fetchHistory()
  },

  // 获取历史记录
  fetchHistory() {
    const app = getApp()
    const token = app.getToken()

    request({
      url: '/api/history',
      method: 'GET'
    }).then(res => {
      // 为每个缩略图key生成完整的URL（包含token参数），用于图片加载认证
      const records = (res.records || []).map(record => ({
        ...record,
        thumbUrls: record.thumbKeys.map(key =>
          `${app.globalData.API_BASE_URL}/api/history/image/${encodeURIComponent(key)}?token=${token}`
        )
      }))

      this.setData({
        records: records,
        loading: false,
        refreshing: false
      })
    }).catch(e => {
      console.error('获取历史失败:', e)
      wx.showToast({
        title: e.error || '加载失败',
        icon: 'none'
      })
      this.setData({
        loading: false,
        refreshing: false
      })
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ refreshing: true })
    this.fetchHistory()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // 点击查看历史记录详情
  handleRecordTap(e) {
    const record = e.currentTarget.dataset.record

    // 预览图片，使用已生成的完整 URL（包含 token 参数）
    const urls = record.thumbUrls || []

    if (urls.length > 0) {
      wx.previewImage({
        current: urls[0],
        urls: urls
      })
    }
  },

  // 删除单条记录
  handleDelete(e) {
    const { id, index } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteRecord(id, index)
        }
      }
    })
  },

  // 删除记录
  deleteRecord(id, index) {
    request({
      url: `/api/history/${id}`,
      method: 'DELETE'
    }).then(() => {
      const records = this.data.records
      records.splice(index, 1)
      this.setData({ records })
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
    }).catch(e => {
      console.error('删除失败:', e)
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      })
    })
  },

  // 清空所有历史
  handleClearAll() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？此操作不可恢复。',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          this.clearAllHistory()
        }
      }
    })
  },

  // 清空历史
  clearAllHistory() {
    request({
      url: '/api/history',
      method: 'DELETE'
    }).then(() => {
      this.setData({ records: [] })
      wx.showToast({
        title: '清空成功',
        icon: 'success'
      })
    }).catch(e => {
      console.error('清空失败:', e)
      wx.showToast({
        title: '清空失败',
        icon: 'none'
      })
    })
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

    return `${date.getMonth() + 1}/${date.getDate()}`
  },

  // 跳转到创作页面
  gotoCreate() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
