"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_request = require("../../utils/request.js");
const _sfc_main = {
  __name: "character-edit",
  setup(__props) {
    const isEdit = common_vendor.ref(false);
    const characterId = common_vendor.ref("");
    const saving = common_vendor.ref(false);
    const maxPhotos = common_vendor.ref(10);
    const form = common_vendor.reactive({
      name: "",
      description: ""
    });
    const photos = common_vendor.ref([]);
    common_vendor.onLoad(async (options) => {
      if (options.id) {
        isEdit.value = true;
        characterId.value = options.id;
        common_vendor.index.setNavigationBarTitle({ title: "编辑角色" });
        await fetchCharacterDetails(options.id);
      } else {
        common_vendor.index.setNavigationBarTitle({ title: "新建角色" });
      }
    });
    const fetchCharacterDetails = async (id) => {
      try {
        const res = await utils_request.request({ url: `/api/characters/${id}` });
        form.name = res.name;
        form.description = res.description;
        photos.value = res.photos.map((p) => ({
          ...p,
          uploaded: true
        }));
      } catch (e) {
        console.error("获取详情失败:", e);
        common_vendor.index.showToast({ title: "获取详情失败", icon: "none" });
      }
    };
    const chooseImage = () => {
      common_vendor.index.chooseMedia({
        count: maxPhotos.value - photos.value.length,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
        success: async (res) => {
          if (!isEdit.value) {
            if (!form.name) {
              common_vendor.index.showToast({ title: "请先输入角色名称", icon: "none" });
              return;
            }
            try {
              const newChar = await createCharacter();
              isEdit.value = true;
              characterId.value = newChar.character.id;
            } catch (e) {
              return;
            }
          }
          for (const file of res.tempFiles) {
            const photoItem = {
              tempFilePath: file.tempFilePath,
              uploading: true,
              uploaded: false
            };
            photos.value.push(photoItem);
            uploadPhoto(file, photoItem);
          }
        }
      });
    };
    const fileToBase64 = (filePath) => {
      return new Promise((resolve, reject) => {
        const fs = common_vendor.index.getFileSystemManager();
        fs.readFile({
          filePath,
          encoding: "base64",
          success: (res) => {
            resolve("data:image/jpeg;base64," + res.data);
          },
          fail: reject
        });
      });
    };
    const uploadPhoto = async (file, photoItem) => {
      try {
        const base64 = await fileToBase64(file.tempFilePath);
        const res = await utils_request.request({
          url: `/api/characters/${characterId.value}/photos`,
          method: "POST",
          data: {
            photoData: base64,
            originalData: base64,
            mimeType: "image/jpeg"
          }
        });
        Object.assign(photoItem, {
          ...res.photo,
          uploading: false,
          uploaded: true
        });
      } catch (e) {
        console.error("上传失败:", e);
        photoItem.uploading = false;
        common_vendor.index.showToast({ title: "图片上传失败", icon: "none" });
        const index = photos.value.indexOf(photoItem);
        if (index > -1) photos.value.splice(index, 1);
      }
    };
    const deletePhoto = async (index) => {
      const photo = photos.value[index];
      if (photo.uploaded && photo.id) {
        common_vendor.index.showModal({
          title: "提示",
          content: "确定删除这张照片吗？",
          success: async (res) => {
            if (res.confirm) {
              try {
                await utils_request.request({
                  url: `/api/characters/${characterId.value}/photos/${photo.id}`,
                  method: "DELETE"
                });
                photos.value.splice(index, 1);
              } catch (e) {
                common_vendor.index.showToast({ title: "删除失败", icon: "none" });
              }
            }
          }
        });
      } else {
        photos.value.splice(index, 1);
      }
    };
    const previewPhoto = (index) => {
      const urls = photos.value.map((p) => p.tempFilePath || p.data);
      common_vendor.index.previewImage({
        urls,
        current: index
      });
    };
    const createCharacter = async () => {
      saving.value = true;
      try {
        const res = await utils_request.request({
          url: "/api/characters",
          method: "POST",
          data: form
        });
        return res;
      } catch (e) {
        common_vendor.index.showToast({ title: "创建失败", icon: "none" });
        throw e;
      } finally {
        saving.value = false;
      }
    };
    const updateCharacter = async () => {
      saving.value = true;
      try {
        await utils_request.request({
          url: `/api/characters/${characterId.value}`,
          method: "PUT",
          data: form
        });
        common_vendor.index.showToast({ title: "保存成功", icon: "success" });
        setTimeout(() => common_vendor.index.navigateBack(), 1500);
      } catch (e) {
        common_vendor.index.showToast({ title: "保存失败", icon: "none" });
      } finally {
        saving.value = false;
      }
    };
    const saveCharacter = async () => {
      if (!form.name) {
        return common_vendor.index.showToast({ title: "请输入角色名称", icon: "none" });
      }
      if (isEdit.value) {
        await updateCharacter();
      } else {
        try {
          await createCharacter();
          common_vendor.index.showToast({ title: "创建成功", icon: "success" });
          setTimeout(() => common_vendor.index.navigateBack(), 1500);
        } catch (e) {
        }
      }
    };
    const deleteCharacter = () => {
      common_vendor.index.showModal({
        title: "警告",
        content: "确定要删除这个角色吗？此操作无法撤销。",
        confirmColor: "#FF6B6B",
        success: async (res) => {
          if (res.confirm) {
            try {
              await utils_request.request({
                url: `/api/characters/${characterId.value}`,
                method: "DELETE"
              });
              common_vendor.index.showToast({ title: "删除成功", icon: "success" });
              setTimeout(() => common_vendor.index.navigateBack(), 1500);
            } catch (e) {
              common_vendor.index.showToast({ title: "删除失败", icon: "none" });
            }
          }
        }
      });
    };
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.t(isEdit.value ? "编辑角色" : "新建角色"),
        b: common_vendor.t(isEdit.value ? "修改角色信息" : "创建新的AI角色"),
        c: form.name,
        d: common_vendor.o(($event) => form.name = $event.detail.value),
        e: form.description,
        f: common_vendor.o(($event) => form.description = $event.detail.value),
        g: common_vendor.t(photos.value.length),
        h: common_vendor.t(maxPhotos.value),
        i: common_vendor.f(photos.value, (photo, index, i0) => {
          return common_vendor.e({
            a: photo.tempFilePath || photo.data,
            b: common_vendor.o(($event) => previewPhoto(index), index),
            c: common_vendor.o(($event) => deletePhoto(index), index),
            d: photo.uploading
          }, photo.uploading ? {} : {}, {
            e: index
          });
        }),
        j: photos.value.length < maxPhotos.value
      }, photos.value.length < maxPhotos.value ? {
        k: common_vendor.o(chooseImage)
      } : {}, {
        l: !saving.value
      }, !saving.value ? {} : {}, {
        m: common_vendor.n({
          loading: saving.value
        }),
        n: common_vendor.o(saveCharacter),
        o: isEdit.value
      }, isEdit.value ? {
        p: common_vendor.o(deleteCharacter)
      } : {});
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-6a9b2529"]]);
wx.createPage(MiniProgramPage);
