"use strict";
const common_vendor = require("../common/vendor.js");
const utils_request = require("../utils/request.js");
const useUserStore = common_vendor.defineStore("user", {
  state: () => ({
    token: common_vendor.index.getStorageSync("token") || "",
    userInfo: common_vendor.index.getStorageSync("userInfo") || null,
    plan: null
  }),
  getters: {
    isLoggedIn: (state) => !!state.token
  },
  actions: {
    async login() {
      try {
        let code = "TEST_CODE";
        try {
          const loginRes = await new Promise((resolve, reject) => {
            common_vendor.index.login({
              provider: "weixin",
              success: resolve,
              fail: reject
            });
          });
          if (loginRes.code) {
            code = loginRes.code;
          }
        } catch (e) {
          console.warn("WeChat login failed, falling back to TEST_CODE", e);
        }
        const res = await utils_request.request({
          url: "/api/auth/wechat",
          method: "POST",
          data: {
            code
          }
        });
        this.token = res.token;
        this.userInfo = res.user;
        this.plan = res.plan;
        common_vendor.index.setStorageSync("token", res.token);
        common_vendor.index.setStorageSync("userInfo", res.user);
        return res;
      } catch (e) {
        console.error("Login error:", e);
        throw e;
      }
    },
    async fetchUserInfo() {
      if (!this.token) return;
      try {
        const res = await utils_request.request({
          url: "/api/auth/me",
          method: "GET"
        });
        this.userInfo = res.user;
        this.plan = res.plan;
        common_vendor.index.setStorageSync("userInfo", res.user);
      } catch (e) {
        this.logout();
      }
    },
    logout() {
      this.token = "";
      this.userInfo = null;
      this.plan = null;
      common_vendor.index.removeStorageSync("token");
      common_vendor.index.removeStorageSync("userInfo");
    }
  }
});
exports.useUserStore = useUserStore;
