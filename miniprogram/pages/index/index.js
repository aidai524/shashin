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
        // 为前几个模板添加 badge
        let result = { ...tpl }
        if (index === 0) {
          result.badge = 'NEW'
          result.badgeType = 'badge-new'
        } else if (index === 3) {
          result.badge = 'HOT'
          result.badgeType = 'badge-hot'
        }
        return result
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
      // 添加 badge
      if (i === 0) {
        tpl.badge = 'NEW'
        tpl.badgeType = 'badge-new'
      } else if (i === 3) {
        tpl.badge = 'HOT'
        tpl.badgeType = 'badge-hot'
      }
      mockData.push(tpl)
    }
    return mockData
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
