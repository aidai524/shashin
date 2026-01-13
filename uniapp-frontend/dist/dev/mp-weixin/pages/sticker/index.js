"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const stores_user = require("../../stores/user.js");
const _sfc_main = {
  __name: "index",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const characters = common_vendor.ref([]);
    const selectedCharId = common_vendor.ref("");
    const generating = common_vendor.ref(false);
    const resultImage = common_vendor.ref("");
    common_vendor.onMounted(() => {
      fetchCharacters();
    });
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
    const generateStickers = async () => {
      if (!userStore.isLoggedIn) {
        return common_vendor.index.showToast({ title: "请先登录", icon: "none" });
      }
      generating.value = true;
      resultImage.value = "";
      try {
        const res = await utils_request.request({
          url: "/api/generate",
          method: "POST",
          data: {
            templateId: "anime-style",
            // Fallback for now, ideally 'sticker-pack'
            characterId: selectedCharId.value,
            ratio: "1:1",
            model: "gemini-1.5-pro"
          }
        });
        common_vendor.index.showToast({ title: "生成指令已发送", icon: "success" });
      } catch (e) {
        common_vendor.index.showToast({ title: "生成失败", icon: "none" });
      } finally {
        generating.value = false;
      }
    };
    const previewResult = () => {
      if (resultImage.value) {
        common_vendor.index.previewImage({ urls: [resultImage.value] });
      }
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(characters.value, (char, k0, i0) => {
          return {
            a: getCharacterAvatar(char),
            b: common_vendor.t(char.name),
            c: char.id,
            d: common_vendor.n(selectedCharId.value === char.id ? "active" : ""),
            e: common_vendor.o(($event) => selectedCharId.value = char.id, char.id)
          };
        }),
        b: common_vendor.t(generating.value ? "AI 正在绘制中..." : "生成表情包 (一套9个)"),
        c: generating.value || !selectedCharId.value,
        d: common_vendor.o(generateStickers),
        e: resultImage.value
      }, resultImage.value ? {
        f: resultImage.value,
        g: common_vendor.o(previewResult)
      } : {});
    };
  }
};
wx.createPage(_sfc_main);
