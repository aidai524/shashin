// 封装的请求函数
const request = (options) => {
  const app = getApp()

  return new Promise((resolve, reject) => {
    wx.request({
      url: app.globalData.API_BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Authorization': app.globalData.token ? `Bearer ${app.globalData.token}` : '',
        'Content-Type': 'application/json',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token')
          app.globalData.token = ''
          wx.showToast({ title: '请重新登录', icon: 'none' })
          reject(res.data)
        } else {
          wx.showToast({ title: res.data.error || '请求失败', icon: 'none' })
          reject(res.data)
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      }
    })
  })
}

module.exports = {
  request
}
