"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const template = common_vendor.ref({});
    const characters = common_vendor.ref([]);
    const selectedCharId = common_vendor.ref("");
    const selectedRatio = common_vendor.ref("1:1");
    const selectedModel = common_vendor.ref("gemini-1.5-flash");
    const generating = common_vendor.ref(false);
    const ratios = [
      { value: "1:1", label: "1:1", cls: "square" },
      { value: "3:4", label: "3:4", cls: "portrait" },
      { value: "16:9", label: "16:9", cls: "landscape" }
    ];
    common_vendor.onLoad(async (options) => {
      if (options.id) {
        await fetchTemplate(options.id);
        await fetchCharacters();
      }
    });
    const fetchTemplate = async (id) => {
      try {
        const res = await utils_request.request({ url: `/api/templates/${id}` });
        template.value = res;
      } catch (e) {
        common_vendor.index.showToast({ title: "加载模板失败", icon: "none" });
      }
    };
    const fetchCharacters = async () => {
      if (!userStore.isLoggedIn) return;
      try {
        const res = await utils_request.request({ url: "/api/characters" });
        characters.value = res.characters;
        if (characters.value.length > 0) {
          selectedCharId.value = characters.value[0].id;
        }
      } catch (e) {
      }
    };
    const getCharacterAvatar = (char) => {
      if (char.photos && char.photos.length > 0) {
        return char.photos[0].data || char.photos[0].originalData;
      }
      return "/static/default-avatar.png";
    };
    const navigateToAddCharacter = () => {
      common_vendor.index.navigateTo({ url: "/pages/profile/character-edit" });
    };
    const onModelChange = (e) => {
      selectedModel.value = e.detail.value;
    };
    const startGenerate = async () => {
      if (!userStore.isLoggedIn) {
        return common_vendor.index.showToast({ title: "请先登录", icon: "none" });
      }
      if (!selectedCharId.value) {
        return common_vendor.index.showToast({ title: "请选择一个角色", icon: "none" });
      }
      generating.value = true;
      try {
        const res = await utils_request.request({
          url: "/api/generate",
          method: "POST",
          data: {
            templateId: template.value.id,
            characterId: selectedCharId.value,
            ratio: selectedRatio.value,
            model: selectedModel.value
          }
        });
        common_vendor.index.showToast({ title: "生成指令已发送", icon: "success" });
      } catch (e) {
        common_vendor.index.showToast({ title: "生成失败: " + (e.message || "未知错误"), icon: "none" });
      } finally {
        generating.value = false;
      }
    };
    return (_ctx, _cache) => {
      var _a;
      return {
        a: template.value.thumbnail,
        b: common_vendor.t((_a = template.value.name) == null ? void 0 : _a.zh),
        c: common_vendor.o(navigateToAddCharacter),
        d: common_vendor.f(characters.value, (char, k0, i0) => {
          return {
            a: getCharacterAvatar(char),
            b: common_vendor.t(char.name),
            c: char.id,
            d: common_vendor.n(selectedCharId.value === char.id ? "active" : ""),
            e: common_vendor.o(($event) => selectedCharId.value = char.id, char.id)
          };
        }),
        e: common_vendor.f(ratios, (r, k0, i0) => {
          return {
            a: common_vendor.n(r.cls),
            b: common_vendor.t(r.label),
            c: r.value,
            d: common_vendor.n(selectedRatio.value === r.value ? "active" : ""),
            e: common_vendor.o(($event) => selectedRatio.value = r.value, r.value)
          };
        }),
        f: common_vendor.o(onModelChange),
        g: common_vendor.t(generating.value ? "AI 生成中..." : "立即生成"),
        h: generating.value,
        i: common_vendor.o(startGenerate)
      };
    };
  }
};
wx.createPage(_sfc_main);
