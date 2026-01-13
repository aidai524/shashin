import { defineStore } from 'pinia'
import { request } from '../utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: uni.getStorageSync('token') || '',
    userInfo: uni.getStorageSync('userInfo') || null,
    plan: null
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token
  },
  
  actions: {
    async login() {
      try {
        let code = 'TEST_CODE' // Default to test code for development
        
        // Try to get real WeChat code if possible
        try {
          const loginRes = await new Promise((resolve, reject) => {
            uni.login({
              provider: 'weixin',
              success: resolve,
              fail: reject
            })
          })
          if (loginRes.code) {
            code = loginRes.code
          }
        } catch (e) {
          console.warn('WeChat login failed, falling back to TEST_CODE', e)
        }
        
        // 2. Call Backend
        const res = await request({
          url: '/api/auth/wechat',
          method: 'POST',
          data: {
            code: code
          }
        })
        
        // 3. Save State
        this.token = res.token
        this.userInfo = res.user
        this.plan = res.plan
        
        uni.setStorageSync('token', res.token)
        uni.setStorageSync('userInfo', res.user)
        
        return res
      } catch (e) {
        console.error('Login error:', e)
        throw e
      }
    },
    
    async fetchUserInfo() {
      if (!this.token) return
      try {
        const res = await request({
          url: '/api/auth/me',
          method: 'GET'
        })
        this.userInfo = res.user
        this.plan = res.plan
        uni.setStorageSync('userInfo', res.user)
      } catch (e) {
        // If 401, logout
        this.logout()
      }
    },
    
    logout() {
      this.token = ''
      this.userInfo = null
      this.plan = null
      uni.removeStorageSync('token')
      uni.removeStorageSync('userInfo')
    }
  }
})
