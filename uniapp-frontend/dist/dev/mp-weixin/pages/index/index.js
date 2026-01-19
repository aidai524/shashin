"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const templates = common_vendor.ref([]);
    const loading = common_vendor.ref(true);
    const currentCat = common_vendor.ref("all");
    const pressedCat = common_vendor.ref(null);
    const pressedCard = common_vendor.ref(null);
    const scrollLeft = common_vendor.ref(0);
    const categories = [
      { id: "all", name: "全部" },
      { id: "portrait", name: "人像" },
      { id: "creative", name: "创意" },
      { id: "scene", name: "场景" },
      { id: "art", name: "艺术" },
      { id: "anime", name: "动漫" }
    ];
    const filteredTemplates = common_vendor.computed(() => {
      if (currentCat.value === "all") return templates.value;
      return templates.value.filter((t) => t.category === currentCat.value);
    });
    const fetchTemplates = async () => {
      try {
        loading.value = true;
        const res = await utils_request.request({ url: "/api/templates" });
        templates.value = (res || []).map((tpl, index) => {
          return assignSmartLayout(tpl, index);
        });
      } catch (e) {
        console.error("获取模板失败:", e);
        templates.value = generateMockTemplates();
      } finally {
        loading.value = false;
      }
    };
    const assignSmartLayout = (tpl, index) => {
      const patterns = [
        // 模式1: 3个小卡片 (1+1+1=3)
        ["small", "small", "small"],
        // 模式2: 1个大卡片 (2)
        ["large"],
        // 模式3: 1个超大卡片 (3)
        ["xlarge"],
        // 模式4: 1个小 + 1个大 (1+2=3)
        ["small", "large"],
        // 模式5: 1个中 + 1个中 + 1个小 (1+1+1=3)
        ["medium", "medium", "small"]
      ];
      const patternIndex = Math.floor(index / 3) % patterns.length;
      const pattern = patterns[patternIndex];
      const sizeIndex = index % pattern.length;
      const size = pattern[sizeIndex];
      const result = {
        ...tpl,
        size
      };
      if (size === "small") {
        result.ratio = "1:1";
        result.badge = index === 0 ? "NEW" : null;
      } else if (size === "medium") {
        result.ratio = "3:4";
      } else if (size === "large") {
        result.ratio = "16:9";
        result.showTitleOverlay = true;
        result.badge = index === 3 ? "HOT" : null;
      } else if (size === "xlarge") {
        result.ratio = "16:9";
        result.showTitleOverlay = true;
      }
      if (result.badge) {
        result.badgeType = result.badge === "NEW" ? "badge-new" : "badge-hot";
      }
      return result;
    };
    const generateMockTemplates = () => {
      const mockData = [];
      const categories2 = ["portrait", "creative", "scene", "art", "anime"];
      for (let i = 0; i < 15; i++) {
        const tpl = {
          id: i + 1,
          name: { zh: `模板 ${i + 1}` },
          thumbnail: "https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=Template",
          category: categories2[i % categories2.length]
        };
        mockData.push(assignSmartLayout(tpl, i));
      }
      return mockData;
    };
    const getSkeletonType = (index) => {
      const patterns = [
        ["small", "small", "small"],
        ["large"],
        ["xlarge"],
        ["small", "large"],
        ["medium", "medium", "small"]
      ];
      const patternIndex = Math.floor((index - 1) / 3) % patterns.length;
      const pattern = patterns[patternIndex];
      const sizeIndex = (index - 1) % pattern.length;
      return pattern[sizeIndex];
    };
    const handleCategoryTap = (categoryId) => {
      pressedCat.value = categoryId;
      setTimeout(() => {
        currentCat.value = categoryId;
        pressedCat.value = null;
      }, 150);
    };
    const handleCardTap = (tpl) => {
      common_vendor.index.navigateTo({
        url: `/pages/generate/index?id=${tpl.id}`
      });
    };
    const loadMore = () => {
      console.log("加载更多模板");
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
            c: common_vendor.n({
              active: currentCat.value === cat.id,
              pressed: pressedCat.value === cat.id
            }),
            d: common_vendor.o(($event) => handleCategoryTap(cat.id), cat.id)
          };
        }),
        b: scrollLeft.value,
        c: loading.value
      }, loading.value ? {
        d: common_vendor.f(9, (n, k0, i0) => {
          return {
            a: n,
            b: common_vendor.n(getSkeletonType(n))
          };
        })
      } : {
        e: common_vendor.f(filteredTemplates.value, (tpl, k0, i0) => {
          return common_vendor.e({
            a: tpl.thumbnail,
            b: tpl.badge
          }, tpl.badge ? {
            c: common_vendor.t(tpl.badge),
            d: common_vendor.n(tpl.badgeType)
          } : {}, {
            e: tpl.showTitleOverlay
          }, tpl.showTitleOverlay ? {
            f: common_vendor.t(tpl.name.zh || tpl.name)
          } : {}, {
            g: !tpl.showTitleOverlay
          }, !tpl.showTitleOverlay ? {
            h: common_vendor.t(tpl.name.zh || tpl.name)
          } : {}, {
            i: tpl.id,
            j: common_vendor.n(tpl.size || "small"),
            k: common_vendor.n({
              pressed: pressedCard.value === tpl.id
            }),
            l: common_vendor.o(($event) => handleCardTap(tpl), tpl.id),
            m: common_vendor.o(($event) => pressedCard.value = tpl.id, tpl.id),
            n: common_vendor.o(($event) => pressedCard.value = null, tpl.id),
            o: common_vendor.o(($event) => pressedCard.value = null, tpl.id)
          });
        })
      }, {
        f: !loading.value && filteredTemplates.value.length === 0
      }, !loading.value && filteredTemplates.value.length === 0 ? {} : {}, {
        g: common_vendor.o(loadMore)
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-83a5a03c"]]);
wx.createPage(MiniProgramPage);
