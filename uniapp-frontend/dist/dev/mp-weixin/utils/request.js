"use strict";
const common_vendor = require("../common/vendor.js");
const utils_config = require("./config.js");
const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = common_vendor.index.getStorageSync("token");
    common_vendor.index.request({
      url: utils_config.config.API_BASE_URL + options.url,
      method: options.method || "GET",
      data: options.data,
      header: {
        "Authorization": token ? `Bearer ${token}` : "",
        "Content-Type": "application/json",
        ...options.header
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          common_vendor.index.removeStorageSync("token");
          common_vendor.index.showToast({
            title: "请重新登录",
            icon: "none"
          });
          reject(res.data);
        } else {
          common_vendor.index.showToast({
            title: res.data.error || "请求失败",
            icon: "none"
          });
          reject(res.data);
        }
      },
      fail: (err) => {
        common_vendor.index.showToast({
          title: "网络错误",
          icon: "none"
        });
        reject(err);
      }
    });
  });
};
exports.request = request;
