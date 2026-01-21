// pages/characters/characters.js
const { request } = require('../../utils/request.js')

Page({
  data: {
    characters: [],
    loading: true,
    limits: {
      maxCharacters: 9999,
      maxPhotosPerCharacter: 10,
      currentCount: 0
    }
  },

  onLoad() {
    this.loadCharacters()
  },

  onShow() {
    // 从编辑页返回时刷新列表
    if (this.data.characters.length > 0 || !this.data.loading) {
      this.loadCharacters()
    }
  },

  // 加载角色列表
  loadCharacters() {
    this.setData({ loading: true })

    request({
      url: '/api/characters',
      method: 'GET'
    }).then(res => {
      this.setData({
        characters: res.characters || [],
        limits: res.limits || this.data.limits,
        loading: false
      })
    }).catch(e => {
      console.error('加载角色失败:', e)
      wx.showToast({
        title: e.error || '加载失败',
        icon: 'none'
      })
      this.setData({ loading: false })
    })
  },

  // 添加新角色
  handleAdd() {
    if (this.data.characters.length >= this.data.limits.maxCharacters) {
      wx.showToast({
        title: `最多创建${this.data.limits.maxCharacters}个角色`,
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '/pages/characters/edit'
    })
  },

  // 编辑角色
  handleEdit(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/characters/edit?id=${id}`
    })
  },

  // 删除角色
  handleDelete(e) {
    const { id, index } = e.currentTarget.dataset
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个角色吗？删除后不可恢复。',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          this.deleteCharacter(id, index)
        }
      }
    })
  },

  // 删除角色请求
  deleteCharacter(id, index) {
    request({
      url: `/api/characters/${id}`,
      method: 'DELETE'
    }).then(() => {
      const characters = this.data.characters
      characters.splice(index, 1)
      this.setData({ characters })
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

  // 预览角色照片
  previewPhotos(e) {
    const { photos } = e.currentTarget.dataset
    if (!photos || photos.length === 0) return

    const urls = photos.map(p => p.data || `data:${p.mimeType};base64,${p.data}`)
    wx.previewImage({
      current: urls[0],
      urls: urls
    })
  }
})
