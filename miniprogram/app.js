// app.js
App({
  globalData: {
    token: '',
    userInfo: null,
    plan: null,
    API_BASE_URL: 'https://miniapp-api.sendto.you'
  },

  onLaunch() {
    console.log('App Launch')

    // 读取本地存储的登录信息
    const token = wx.getStorageSync('token') || ''
    const userInfo = wx.getStorageSync('userInfo') || null
    const plan = wx.getStorageSync('plan') || null

    this.globalData.token = token
    this.globalData.userInfo = userInfo
    this.globalData.plan = plan
  },

  // 检查登录状态
  checkLogin() {
    return !!this.globalData.token
  },

  // 获取 token
  getToken() {
    return this.globalData.token
  },

  // 更新用户信息
  updateUserInfo(userInfo, plan) {
    this.globalData.userInfo = userInfo
    this.globalData.plan = plan
    if (userInfo) {
      wx.setStorageSync('userInfo', userInfo)
    }
    if (plan) {
      wx.setStorageSync('plan', plan)
    }
  },

  // 登录
  login(token, userInfo, plan) {
    this.globalData.token = token
    this.globalData.userInfo = userInfo
    this.globalData.plan = plan
    wx.setStorageSync('token', token)
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('plan', plan)
  },

  // 退出登录
  logout() {
    this.globalData.token = ''
    this.globalData.userInfo = null
    this.globalData.plan = null
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('plan')
  }
})
