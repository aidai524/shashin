"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const templates = common_vendor.ref([]);
    const loading = common_vendor.ref(true);
    const currentCat = common_vendor.ref("all");
    const categories = [
      { id: "all", name: "全部" },
      { id: "portrait", name: "人像" },
      { id: "creative", name: "创意" },
      { id: "scene", name: "场景" }
    ];
    const filteredTemplates = common_vendor.computed(() => {
      if (currentCat.value === "all") return templates.value;
      return templates.value.filter((t) => t.category === currentCat.value);
    });
    const fetchTemplates = async () => {
      try {
        const res = await utils_request.request({ url: "/api/templates" });
        templates.value = res;
      } catch (e) {
        common_vendor.index.showToast({ title: "获取模板失败", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const selectTemplate = (tpl) => {
      common_vendor.index.navigateTo({
        url: `/pages/generate/index?id=${tpl.id}`
      });
    };
    const navigateToSticker = () => {
      common_vendor.index.navigateTo({ url: "/pages/sticker/index" });
    };
    common_vendor.onMounted(() => {
      fetchTemplates();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(categories, (cat, k0, i0) => {
          return {
            a: common_vendor.t(cat.name),
            b: cat.id,
            c: common_vendor.n(currentCat.value === cat.id ? "active" : ""),
            d: common_vendor.o(($event) => currentCat.value = cat.id, cat.id)
          };
        }),
        b: common_vendor.o(navigateToSticker),
        c: common_vendor.f(filteredTemplates.value, (tpl, k0, i0) => {
          return {
            a: tpl.thumbnail,
            b: common_vendor.t(tpl.name.zh),
            c: tpl.id,
            d: common_vendor.o(($event) => selectTemplate(tpl), tpl.id)
          };
        }),
        d: loading.value
      }, loading.value ? {} : {});
    };
  }
};
wx.createPage(_sfc_main);
