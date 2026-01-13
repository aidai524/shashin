import { config } from './config'

export const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')
    
    uni.request({
      url: config.API_BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(res.data)
        } else if (res.statusCode === 401) {
          // Token expired or invalid
          uni.removeStorageSync('token')
          uni.showToast({
            title: '请重新登录',
            icon: 'none'
          })
          // Optionally redirect to login or trigger re-login
          reject(res.data)
        } else {
          uni.showToast({
            title: res.data.error || '请求失败',
            icon: 'none'
          })
          reject(res.data)
        }
      },
      fail: (err) => {
        uni.showToast({
          title: '网络错误',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}
