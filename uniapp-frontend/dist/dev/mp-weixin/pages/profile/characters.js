"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const _sfc_main = {
  __name: "characters",
  setup(__props) {
    const characters = common_vendor.ref([]);
    const loading = common_vendor.ref(true);
    const fetchCharacters = async () => {
      loading.value = true;
      try {
        const res = await utils_request.request({
          url: "/api/characters",
          method: "GET"
        });
        characters.value = res.characters;
      } catch (e) {
        common_vendor.index.showToast({ title: "加载失败", icon: "none" });
      } finally {
        loading.value = false;
      }
    };
    const getCharacterAvatar = (char) => {
      if (char.photos && char.photos.length > 0) {
        return char.photos[0].data || char.photos[0].originalData;
      }
      return "/static/default-avatar.png";
    };
    const addCharacter = () => {
      common_vendor.index.navigateTo({ url: "/pages/profile/character-edit" });
    };
    const editCharacter = (id) => {
      common_vendor.index.navigateTo({ url: `/pages/profile/character-edit?id=${id}` });
    };
    common_vendor.onShow(() => {
      fetchCharacters();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.f(characters.value, (char, k0, i0) => {
          return {
            a: getCharacterAvatar(char),
            b: common_vendor.t(char.name),
            c: common_vendor.t(char.description || "暂无描述"),
            d: char.id,
            e: common_vendor.o(($event) => editCharacter(char.id), char.id)
          };
        }),
        b: common_vendor.o(addCharacter),
        c: loading.value
      }, loading.value ? {} : characters.value.length === 0 ? {} : {}, {
        d: characters.value.length === 0
      });
    };
  }
};
wx.createPage(_sfc_main);
