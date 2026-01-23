// pages/generate/generate.js
const { request } = require('../../utils/request.js')

Page({
  data: {
    templateId: null,
    template: null,
    characters: [],
    selectedCharacter: null,
    ratio: '1:1',
    ratios: [
      { value: '1:1', label: '1:1', className: 'ratio-1-1' },
      { value: '16:9', label: '16:9', className: 'ratio-16-9' },
      { value: '9:16', label: '9:16', className: 'ratio-9-16' },
      { value: '4:3', label: '4:3', className: 'ratio-4-3' },
      { value: '3:4', label: '3:4', className: 'ratio-3-4' },
      { value: '3:2', label: '3:2', className: 'ratio-3-2' },
      { value: '2:3', label: '2:3', className: 'ratio-2-3' },
      { value: '21:9', label: '21:9', className: 'ratio-21-9' }
    ],
    quality: 'premium', // premium（高级）, fast（快速）
    qualities: [
      { value: 'premium', label: '高级', desc: '4K 高清' },
      { value: 'fast', label: '快速', desc: '标准画质' }
    ],
    count: 1, // 生成数量
    counts: [
      { value: 1, label: '1张', desc: '~30秒' },
      { value: 2, label: '2张', desc: '~60秒' },
      { value: 4, label: '4张', desc: '~2分钟' }
    ],
    resolution: '4K', // 1K, 2K, 4K
    resolutions: [
      { value: '1K', label: '标准', desc: '1K' },
      { value: '2K', label: '高清', desc: '2K' },
      { value: '4K', label: '超清', desc: '4K' }
    ],
    generating: false
  },

  onLoad(options) {
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

    if (options.id) {
      this.setData({ templateId: options.id })
      this.loadTemplate(options.id)
      this.loadCharacters()
    }
  },

  // 加载模板
  loadTemplate(id) {
    request({
      url: `/api/templates/${id}`,
      method: 'GET'
    }).then(res => {
      this.setData({ template: res })
    }).catch(e => {
      console.error('加载模板失败:', e)
      wx.showToast({
        title: '加载模板失败',
        icon: 'none'
      })
    })
  },

  // 加载角色列表
  loadCharacters() {
    request({
      url: '/api/characters',
      method: 'GET'
    }).then(res => {
      this.setData({ characters: res.characters || [] })
    }).catch(e => {
      console.error('加载角色失败:', e)
    })
  },

  // 选择比例
  selectRatio(e) {
    const ratio = e.currentTarget.dataset.value
    this.setData({ ratio })
  },

  // 选择生成质量
  selectQuality(e) {
    const quality = e.currentTarget.dataset.value
    this.setData({ quality })
  },

  // 选择生成数量
  selectCount(e) {
    const count = parseInt(e.currentTarget.dataset.value)
    this.setData({ count })
  },

  // 选择画质
  selectResolution(e) {
    const resolution = e.currentTarget.dataset.value
    this.setData({ resolution })
  },

  // 选择角色
  selectCharacter(e) {
    const id = e.currentTarget.dataset.id
    const character = this.data.characters.find(c => c.id === id)
    this.setData({
      selectedCharacter: this.data.selectedCharacter?.id === id ? null : character
    })
  },

  // 开始生成
  handleGenerate() {
    if (this.data.generating) return

    wx.showLoading({
      title: '创建任务中...',
      mask: true
    })

    this.setData({ generating: true })

    // 构建任务请求数据
    const taskData = {
      templateId: this.data.templateId,
      characterId: this.data.selectedCharacter?.id || null,
      ratio: this.data.ratio,
      quality: this.data.quality,
      count: this.data.count,
      resolution: this.data.resolution
    }

    // 创建异步任务
    request({
      url: '/api/tasks',
      method: 'POST',
      data: taskData
    }).then(res => {
      wx.hideLoading()

      // 提示任务创建成功
      wx.showToast({
        title: '任务已创建',
        icon: 'success',
        duration: 1500
      })

      // 跳转到任务列表页面
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/tasks/tasks'
        })
      }, 1500)
    }).catch(e => {
      wx.hideLoading()
      this.setData({ generating: false })
      console.error('创建任务失败:', e)
      wx.showModal({
        title: '创建任务失败',
        content: e.error || '创建任务失败，请重试',
        showCancel: false
      })
    })
  }
})
