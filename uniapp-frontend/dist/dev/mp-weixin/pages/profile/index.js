"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const handleLogin = async () => {
      try {
        common_vendor.index.showLoading({ title: "登录中..." });
        await userStore.login();
        common_vendor.index.showToast({ title: "登录成功", icon: "success" });
      } catch (e) {
        common_vendor.index.showToast({ title: "登录失败", icon: "none" });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const handleLogout = () => {
      userStore.logout();
    };
    const navigateToCharacters = () => {
      common_vendor.index.navigateTo({ url: "/pages/profile/characters" });
    };
    return (_ctx, _cache) => {
      var _a;
      return common_vendor.e({
        a: common_vendor.unref(userStore).isLoggedIn
      }, common_vendor.unref(userStore).isLoggedIn ? {
        b: common_vendor.unref(userStore).userInfo.avatar || "/static/default-avatar.png",
        c: common_vendor.t(common_vendor.unref(userStore).userInfo.nickname),
        d: common_vendor.t(((_a = common_vendor.unref(userStore).plan) == null ? void 0 : _a.name) || "免费版")
      } : {
        e: common_vendor.o(handleLogin)
      }, {
        f: common_vendor.unref(userStore).isLoggedIn
      }, common_vendor.unref(userStore).isLoggedIn ? {
        g: common_vendor.o(navigateToCharacters),
        h: common_vendor.o(handleLogout)
      } : {});
    };
  }
};
wx.createPage(_sfc_main);
