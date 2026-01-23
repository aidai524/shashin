// pages/tasks/tasks.js
const { request } = require('../../utils/request.js')

Page({
  data: {
    tasks: [],
    loading: false,
    pollTimer: null,
    statusText: {
      pending: '等待中',
      processing: '生成中',
      completed: '已完成',
      failed: '失败'
    },
    qualityText: {
      premium: '高级',
      fast: '快速'
    }
  },

  onLoad() {
    const app = getApp()
    if (!app.checkLogin()) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
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
    this.loadTasks()
  },

  onShow() {
    this.loadTasks()
  },

  onUnload() {
    // 清除轮询定时器
    if (this.data.pollTimer) {
      clearInterval(this.data.pollTimer)
    }
  },

  onHide() {
    // 页面隐藏时暂停轮询
    if (this.data.pollTimer) {
      clearInterval(this.data.pollTimer)
      this.setData({ pollTimer: null })
    }
  },

  // 加载任务列表
  async loadTasks() {
    this.setData({ loading: true })

    try {
      const res = await request({
        url: '/api/tasks',
        method: 'GET'
      })

      this.setData({
        tasks: res.tasks || [],
        loading: false
      })

      // 如果有进行中的任务，开始轮询
      const hasPendingTasks = res.tasks?.some(t => t.status === 'pending' || t.status === 'processing')
      if (hasPendingTasks && !this.data.pollTimer) {
        this.startPolling()
      }
    } catch (e) {
      console.error('加载任务失败:', e)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    }
  },

  // 开始轮询任务状态
  startPolling() {
    // 每3秒轮询一次
    const timer = setInterval(() => {
      this.loadTasks()
    }, 3000)

    this.setData({ pollTimer: timer })
  },

  // 点击任务卡片
  handleTaskTap(e) {
    const { id, recordId } = e.currentTarget.dataset

    if (recordId) {
      // 任务已完成，跳转到历史记录详情
      wx.navigateTo({
        url: `/pages/history/history`
      })

      // 这里可以优化：直接跳转到详情页并高亮对应记录
      // 但由于历史页面没有单独查看记录的功能，暂时跳转到历史列表
    } else {
      // 任务未完成，刷新单个任务状态
      this.refreshTask(id)
    }
  },

  // 刷新单个任务状态
  async refreshTask(taskId) {
    try {
      const res = await request({
        url: `/api/tasks/${taskId}`,
        method: 'GET'
      })

      // 更新任务列表中的对应任务
      const tasks = this.data.tasks.map(t => {
        if (t.id === taskId) {
          return res
        }
        return t
      })

      this.setData({ tasks })
    } catch (e) {
      console.error('刷新任务失败:', e)
    }
  },

  // 跳转到创作页面
  gotoCreate() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
