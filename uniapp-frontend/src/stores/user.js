// 简单的用户状态管理（不使用 Vue 响应式，延迟初始化）

// 状态（使用普通变量，延迟初始化）
let _token = ''
let _userInfo = null
let _plan = null
let _initialized = false

// 初始化函数
const init = () => {
  if (_initialized) return
  try {
    _token = uni.getStorageSync('token') || ''
    _userInfo = uni.getStorageSync('userInfo') || null
    _plan = uni.getStorageSync('plan') || null
    _initialized = true
  } catch (e) {
    console.warn('Store init failed:', e)
  }
}

// getters
const isLoggedIn = () => {
  if (!_initialized) init()
  return !!_token
}

const getToken = () => {
  if (!_initialized) init()
  return _token
}

const getUserInfo = () => {
  if (!_initialized) init()
  return _userInfo
}

const getPlan = () => {
  if (!_initialized) init()
  return _plan
}

// actions
const login = async () => {
  const { request } = await import('../utils/request')

  try {
    let code = 'TEST_CODE'

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

    // Call Backend
    const res = await request({
      url: '/api/auth/wechat',
      method: 'POST',
      data: { code }
    })

    // Save State
    _token = res.token
    _userInfo = res.user
    _plan = res.plan
    _initialized = true

    uni.setStorageSync('token', res.token)
    uni.setStorageSync('userInfo', res.user)
    uni.setStorageSync('plan', res.plan)

    return res
  } catch (e) {
    console.error('Login error:', e)
    throw e
  }
}

const fetchUserInfo = async () => {
  if (!getToken()) return
  const { request } = await import('../utils/request')
  try {
    const res = await request({
      url: '/api/auth/me',
      method: 'GET'
    })
    _userInfo = res.user
    _plan = res.plan
    uni.setStorageSync('userInfo', res.user)
    uni.setStorageSync('plan', res.plan)
  } catch (e) {
    logout()
  }
}

const logout = () => {
  _token = ''
  _userInfo = null
  _plan = null
  uni.removeStorageSync('token')
  uni.removeStorageSync('userInfo')
  uni.removeStorageSync('plan')
}

const updateState = () => {
  _token = uni.getStorageSync('token') || ''
  _userInfo = uni.getStorageSync('userInfo') || null
  _plan = uni.getStorageSync('plan') || null
  _initialized = true
}

// 导出
export const userState = {
  get token() { return getToken() },
  get userInfo() { return getUserInfo() },
  get plan() { return getPlan() },
  isLoggedIn
}

export const userActions = {
  login,
  fetchUserInfo,
  logout,
  updateState,
  init
}

// 兼容原有的 useUserStore 接口
export const useUserStore = () => {
  init()
  return {
    get token() { return _token },
    get userInfo() { return _userInfo },
    get plan() { return _plan },
    isLoggedIn: isLoggedIn(),
    login,
    fetchUserInfo,
    logout
  }
}
