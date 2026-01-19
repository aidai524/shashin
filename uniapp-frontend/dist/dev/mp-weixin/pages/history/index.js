"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const utils_config = require("../../utils/config.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const historyList = common_vendor.ref([]);
    const loading = common_vendor.ref(true);
    const fetchHistory = async () => {
      loading.value = true;
      try {
        const res = await utils_request.request({ url: "/api/history" });
        historyList.value = res.records || [];
      } catch (e) {
        console.error("加载历史失败:", e);
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const getImageUrl = (item) => {
      if (item.thumbKeys && item.thumbKeys.length > 0) {
        return `${utils_config.config.API_BASE_URL}/api/history/image/${encodeURIComponent(item.thumbKeys[0])}`;
      }
      if (item.thumbnails && item.thumbnails.length > 0) {
        return item.thumbnails[0].data;
      }
      return "";
    };
    const getOriginalUrl = (item) => {
      if (item.imageKeys && item.imageKeys.length > 0) {
        return `${utils_config.config.API_BASE_URL}/api/history/image/${encodeURIComponent(item.imageKeys[0])}`;
      }
      return "";
    };
    const formatDate = (isoString) => {
      if (!isoString) return "";
      const date = new Date(isoString);
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
    };
    const previewImage = (item) => {
      const url = getOriginalUrl(item) || getImageUrl(item);
      if (url) {
        common_vendor.index.previewImage({
          urls: [url]
        });
      }
    };
    common_vendor.onShow(() => {
      fetchHistory();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: loading.value
      }, loading.value ? {
        b: common_vendor.f(6, (n, k0, i0) => {
          return {
            a: n
          };
        })
      } : {
        c: common_vendor.f(historyList.value, (item, k0, i0) => {
          return {
            a: getImageUrl(item),
            b: common_vendor.t(formatDate(item.createdAt)),
            c: item.id,
            d: common_vendor.o(($event) => previewImage(item), item.id)
          };
        })
      }, {
        d: !loading.value && historyList.value.length === 0
      }, !loading.value && historyList.value.length === 0 ? {} : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-530ef1ab"]]);
wx.createPage(MiniProgramPage);
