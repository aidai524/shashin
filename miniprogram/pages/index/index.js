// pages/index/index.js
const { request } = require('../../utils/request.js')

Page({
  data: {
    templates: [],
    filteredTemplates: [],
    loading: true,
    currentCat: 'all',
    pressedCat: null,
    pressedCard: null,
    scrollLeft: 0,
    categories: [
      { id: 'all', name: '全部' },
      { id: 'portrait', name: '人像' },
      { id: 'creative', name: '创意' },
      { id: 'scene', name: '场景' }
    ]
  },

  onLoad() {
    this.fetchTemplates()
  },

  onShow() {
    // 每次显示页面时刷新数据
    // this.fetchTemplates()
  },

  // 获取模板列表
  fetchTemplates() {
    this.setData({ loading: true })

    request({
      url: '/api/templates',
      method: 'GET'
    }).then(res => {
      const templates = (res || []).map((tpl, index) => {
        return this.assignSmartLayout(tpl, index)
      })
      this.setData({
        templates,
        loading: false
      })
      this.updateFilteredTemplates()
    }).catch(e => {
      console.error('获取模板失败:', e)
      // 使用模拟数据
      this.setData({
        templates: this.generateMockTemplates(),
        loading: false
      })
      this.updateFilteredTemplates()
    })
  },

  // 更新筛选后的模板列表
  updateFilteredTemplates() {
    const { templates, currentCat } = this.data
    let filtered = templates
    if (currentCat !== 'all') {
      filtered = templates.filter(t => t.category === currentCat)
    }
    this.setData({ filteredTemplates: filtered })
  },

  // 智能分配布局
  assignSmartLayout(tpl, index) {
    const patterns = [
      ['small', 'small', 'small'],
      ['large'],
      ['xlarge'],
      ['small', 'large'],
      ['medium', 'medium', 'small']
    ]

    const patternIndex = Math.floor(index / 3) % patterns.length
    const pattern = patterns[patternIndex]
    const sizeIndex = index % pattern.length
    const size = pattern[sizeIndex]

    const result = {
      ...tpl,
      size
    }

    if (size === 'small') {
      result.ratio = '1:1'
      result.badge = index === 0 ? 'NEW' : null
    } else if (size === 'medium') {
      result.ratio = '3:4'
    } else if (size === 'large') {
      result.ratio = '16:9'
      result.showTitleOverlay = true
      result.badge = index === 3 ? 'HOT' : null
    } else if (size === 'xlarge') {
      result.ratio = '16:9'
      result.showTitleOverlay = true
    }

    if (result.badge) {
      result.badgeType = result.badge === 'NEW' ? 'badge-new' : 'badge-hot'
    }

    return result
  },

  // 生成模拟数据
  generateMockTemplates() {
    const mockData = []
    const categories = ['portrait', 'creative', 'scene']

    for (let i = 0; i < 15; i++) {
      const tpl = {
        id: i + 1,
        name: { zh: `模板 ${i + 1}` },
        thumbnail: 'https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=Template',
        category: categories[i % categories.length]
      }
      mockData.push(this.assignSmartLayout(tpl, i))
    }
    return mockData
  },

  // 获取骨架屏类型
  getSkeletonType(index) {
    const patterns = [
      ['small', 'small', 'small'],
      ['large'],
      ['xlarge'],
      ['small', 'large'],
      ['medium', 'medium', 'small']
    ]

    const patternIndex = Math.floor((index - 1) / 3) % patterns.length
    const pattern = patterns[patternIndex]
    const sizeIndex = (index - 1) % pattern.length
    return pattern[sizeIndex]
  },

  // 点击分类
  handleCategoryTap(e) {
    const catId = e.currentTarget.dataset.id
    this.setData({ pressedCat: catId })
    setTimeout(() => {
      this.setData({
        currentCat: catId,
        pressedCat: null
      })
      this.updateFilteredTemplates()
    }, 150)
  },

  // 点击卡片
  handleCardTap(e) {
    const templateId = e.currentTarget.dataset.id
    // 跳转到生成页面
    wx.navigateTo({
      url: `/pages/generate/generate?id=${templateId}`
    })
  },

  // 按下开始
  pressedCardStart(e) {
    const templateId = e.currentTarget.dataset.id
    this.setData({ pressedCard: templateId })
  },

  // 按下结束
  pressedCardEnd() {
    this.setData({ pressedCard: null })
  },

  loadMore() {
    console.log('加载更多模板')
  }
})
