// pages/generate/generate.js
const { request } = require('../../utils/request.js')

Page({
  data: {
    templateId: null,
    template: null,
    characters: [],
    selectedCharacter: null,
    ratio: '1:1',
    ratios: [
      { value: '1:1', label: '1:1', className: 'ratio-1-1' },
      { value: '16:9', label: '16:9', className: 'ratio-16-9' },
      { value: '9:16', label: '9:16', className: 'ratio-9-16' },
      { value: '4:3', label: '4:3', className: 'ratio-4-3' },
      { value: '3:4', label: '3:4', className: 'ratio-3-4' },
      { value: '3:2', label: '3:2', className: 'ratio-3-2' },
      { value: '2:3', label: '2:3', className: 'ratio-2-3' },
      { value: '21:9', label: '21:9', className: 'ratio-21-9' }
    ],
    quality: 'premium', // premium（高级）, fast（快速）
    qualities: [
      { value: 'premium', label: '高级', desc: '4K 高清' },
      { value: 'fast', label: '快速', desc: '标准画质' }
    ],
    count: 1, // 生成数量
    counts: [
      { value: 1, label: '1张', desc: '~30秒' },
      { value: 2, label: '2张', desc: '~60秒' },
      { value: 4, label: '4张', desc: '~2分钟' }
    ],
    resolution: '4K', // 1K, 2K, 4K
    resolutions: [
      { value: '1K', label: '标准', desc: '1K' },
      { value: '2K', label: '高清', desc: '2K' },
      { value: '4K', label: '超清', desc: '4K' }
    ],
    generating: false,
    generatedImages: []
  },

  onLoad(options) {
    const app = getApp()
    if (!app.checkLogin()) {
      wx.showModal({
        title: '提示',
        content: '请先登录',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/profile/profile'
            })
          } else {
            wx.navigateBack()
          }
        }
      })
      return
    }

    if (options.id) {
      this.setData({ templateId: options.id })
      this.loadTemplate(options.id)
      this.loadCharacters()
    }
  },

  // 加载模板
  loadTemplate(id) {
    request({
      url: `/api/templates/${id}`,
      method: 'GET'
    }).then(res => {
      this.setData({ template: res })
    }).catch(e => {
      console.error('加载模板失败:', e)
      wx.showToast({
        title: '加载模板失败',
        icon: 'none'
      })
    })
  },

  // 加载角色列表
  loadCharacters() {
    request({
      url: '/api/characters',
      method: 'GET'
    }).then(res => {
      this.setData({ characters: res.characters || [] })
    }).catch(e => {
      console.error('加载角色失败:', e)
    })
  },

  // 选择比例
  selectRatio(e) {
    const ratio = e.currentTarget.dataset.value
    this.setData({ ratio })
  },

  // 选择生成质量
  selectQuality(e) {
    const quality = e.currentTarget.dataset.value
    this.setData({ quality })
  },

  // 选择生成数量
  selectCount(e) {
    const count = parseInt(e.currentTarget.dataset.value)
    this.setData({ count })
  },

  // 选择画质
  selectResolution(e) {
    const resolution = e.currentTarget.dataset.value
    this.setData({ resolution })
  },

  // 选择角色
  selectCharacter(e) {
    const id = e.currentTarget.dataset.id
    const character = this.data.characters.find(c => c.id === id)
    this.setData({
      selectedCharacter: this.data.selectedCharacter?.id === id ? null : character
    })
  },

  // 获取模板和角色信息
  getTemplateAndCharacter() {
    return Promise.all([
      // 获取模板
      new Promise((resolve) => {
        if (this.data.template) {
          resolve(this.data.template)
        } else {
          request({
            url: `/api/templates/${this.data.templateId}`,
            method: 'GET'
          }).then(res => resolve(res))
        }
      }),
      // 获取角色
      new Promise((resolve) => {
        if (!this.data.selectedCharacter) {
          resolve(null)
          return
        }
        request({
          url: `/api/characters`,
          method: 'GET'
        }).then(res => {
          const character = res.characters.find(c => c.id === this.data.selectedCharacter.id)
          resolve(character || null)
        })
      })
    ]).then(([template, character]) => ({ template, character }))
  },

  // 开始生成
  handleGenerate() {
    if (this.data.generating) return

    wx.showLoading({
      title: '生成中...',
      mask: true
    })

    this.setData({ generating: true })

    // 根据质量和数量决定模型和API调用次数
    const isPremium = this.data.quality === 'premium'
    const model = isPremium ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image'
    const count = this.data.count

    // 获取模板和角色信息
    this.getTemplateAndCharacter().then(({ template, character }) => {
      // 构建所有生成请求
      const requests = []

      for (let i = 0; i < count; i++) {
        // 构建 Prompt
        let prompt = template.prompt
        if (character) {
          prompt = `Subject is a specific person: ${character.name}. ${character.description || ''}. ${template.prompt}`
        }
        prompt += `. Aspect ratio ${this.data.ratio}. High quality, detailed.`

        // 构建请求体
        const requestBody = {
          contents: [{
            parts: [{ text: prompt }]
          }]
        }

        // 如果有角色图片，添加到请求中
        if (character && character.photos && character.photos.length > 0) {
          const photo = character.photos[0]
          const base64Data = photo.originalData ? photo.originalData.replace(/^data:image\/\w+;base64,/, '') : photo.data.replace(/^data:image\/\w+;base64,/, '')

          requestBody.contents[0].parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          })
        }

        // 添加生成配置
        requestBody.generationConfig = {
          responseModalities: ["IMAGE"],
          imageConfig: {
            aspectRatio: this.data.ratio
          }
        }

        requests.push(
          request({
            url: `/v1beta/models/${model}:generateContent`,
            method: 'POST',
            data: requestBody
          })
        )
      }

      // 并发执行所有请求
      Promise.all(requests).then(responses => {
        wx.hideLoading()

        const allImages = []

        // 收集所有响应中的图片
        responses.forEach((res, index) => {
          console.log(`Response ${index + 1}:`, res)

          if (res.candidates && res.candidates[0]?.content?.parts) {
            const parts = res.candidates[0].content.parts

            for (const part of parts) {
              if (part.inlineData) {
                allImages.push({
                  mimeType: part.inlineData.mimeType || 'image/png',
                  data: part.inlineData.data
                })
              }
            }
          }
        })

        console.log(`Total images generated: ${allImages.length}`)

        if (allImages.length > 0) {
          this.saveToHistory(allImages)
        } else {
          wx.showModal({
            title: '生成失败',
            content: '模型未返回图片数据',
            showCancel: false
          })
          this.setData({ generating: false })
        }
      }).catch(e => {
        wx.hideLoading()
        this.setData({ generating: false })
        console.error('生成失败:', e)
        wx.showModal({
          title: '生成失败',
          content: e.error || '生成失败，请重试',
          showCancel: false
        })
      })
    })
  },

  // 保存到历史
  saveToHistory(images) {
    const record = {
      id: Date.now(),
      templateId: this.data.templateId,
      templateName: this.data.template?.name?.zh || this.data.template?.name || '未知模板',
      characterId: this.data.selectedCharacter?.id || null,
      ratio: this.data.ratio,
      createdAt: new Date().toISOString(),
      thumbnails: images.map(img => ({
        mimeType: img.mimeType,
        base64: `data:${img.mimeType};base64,${img.data}`
      })),
      originalImages: images
    }

    request({
      url: '/api/history',
      method: 'POST',
      data: {
        record,
        originalImages: images.map(img => ({
          base64: img.data,
          mimeType: img.mimeType
        }))
      }
    }).then(() => {
      this.setData({ generatedImages: images })
      wx.showToast({
        title: '生成成功',
        icon: 'success'
      })
      // 跳转到历史页面
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/history/history'
        })
      }, 1500)
    }).catch(e => {
      console.error('保存历史失败:', e)
      // 即使保存失败也显示图片
      this.setData({ generatedImages: images })
      wx.showToast({
        title: '生成成功',
        icon: 'success'
      })
    })
  },

  // 预览生成的图片
  previewImage(e) {
    const { index } = e.currentTarget.dataset
    const urls = this.data.generatedImages.map(img =>
      `data:${img.mimeType};base64,${img.data}`
    )
    wx.previewImage({
      current: urls[index],
      urls: urls
    })
  }
})
