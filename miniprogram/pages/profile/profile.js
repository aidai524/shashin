// pages/profile/profile.js
const { request } = require('../../utils/request.js')

Page({
  data: {
    userInfo: null,
    plan: null,
    hasLogin: false
  },

  onLoad() {
    // 页面加载时检查登录状态
    this.checkLoginStatus()
  },

  onShow() {
    // 每次显示页面时刷新登录状态
    this.checkLoginStatus()
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp()
    const hasLogin = app.checkLogin()
    const userInfo = app.globalData.userInfo
    const plan = app.globalData.plan

    this.setData({
      hasLogin,
      userInfo,
      plan
    })
  },

  // 微信登录
  handleWechatLogin() {
    const app = getApp()

    wx.showLoading({
      title: '登录中...',
      mask: true
    })

    // 获取微信登录code
    wx.login({
      success: (res) => {
        if (res.code) {
          // 调用后端接口
          request({
            url: '/api/auth/wechat',
            method: 'POST',
            data: { code: res.code }
          }).then(result => {
            wx.hideLoading()

            // 保存登录信息
            app.login(
              result.token,
              result.user,
              result.plan
            )

            // 更新页面状态
            this.setData({
              hasLogin: true,
              userInfo: result.user,
              plan: result.plan
            })

            wx.showToast({
              title: '登录成功',
              icon: 'success'
            })
          }).catch(e => {
            wx.hideLoading()
            console.error('登录失败:', e)
            wx.showToast({
              title: e.error || '登录失败',
              icon: 'none',
              duration: 2000
            })
          })
        } else {
          wx.hideLoading()
          wx.showToast({
            title: '获取授权码失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({
          title: '微信登录失败',
          icon: 'none'
        })
      }
    })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          app.logout()

          this.setData({
            hasLogin: false,
            userInfo: null,
            plan: null
          })

          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  // 跳转到角色管理
  gotoCharacters() {
    if (!this.data.hasLogin) {
      this.showLoginTip()
      return
    }
    wx.navigateTo({
      url: '/pages/characters/characters'
    })
  },

  // 跳转到设置
  gotoSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 显示登录提示
  showLoginTip() {
    wx.showModal({
      title: '提示',
      content: '请先登录',
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          this.handleWechatLogin()
        }
      }
    })
  },

  // 跳转到首页
  gotoHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
