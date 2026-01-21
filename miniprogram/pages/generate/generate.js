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
      { value: '1:1', label: '1:1', className: '1-1', width: 512, height: 512 },
      { value: '3:4', label: '3:4', className: '3-4', width: 512, height: 682 },
      { value: '16:9', label: '16:9', className: '16-9', width: 768, height: 432 }
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

    const selectedRatio = this.data.ratios.find(r => r.value === this.data.ratio)

    // 获取模板和角色信息
    this.getTemplateAndCharacter().then(({ template, character }) => {
      // 构建 Prompt
      let prompt = template.prompt
      if (character) {
        prompt = `Subject is a specific person: ${character.name}. ${character.description || ''}. ${template.prompt}`
      }
      prompt += `. Aspect ratio ${this.data.ratio || '1:1'}. High quality, detailed.`

      // 构建请求体（与网页端完全一致）
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
          aspectRatio: this.data.ratio === '16:9' ? '16:9' : this.data.ratio === '3:4' ? '3:4' : '1:1'
        }
      }

      console.log('Request body:', JSON.stringify(requestBody, null, 2))

      // 直接调用 Gemini API 代理（高级模式）
      request({
        url: `/v1beta/models/gemini-3-pro-image-preview:generateContent`,
        method: 'POST',
        data: requestBody
      }).then(res => {
        wx.hideLoading()

        // 🔍 打印完整响应
        console.log('=== API Response ===')
        console.log('Full response:', res)
        console.log('Typeof response:', typeof res)
        console.log('Has candidates:', !!res.candidates)

        // 处理 Gemini 返回的结果
        // Gemini 2.0 Flash Image Generation 返回图片数据
        if (res.candidates && res.candidates[0]?.content?.parts) {
          const parts = res.candidates[0].content.parts
          console.log('Parts count:', parts.length)
          console.log('Parts:', parts)

          const images = []

          for (const part of parts) {
            console.log('Processing part:', JSON.stringify(part, null, 2))
            console.log('Has inlineData:', !!part.inlineData)
            console.log('Has text:', !!part.text)

            if (part.inlineData) {
              console.log('Found inlineData!')
              console.log('  mimeType:', part.inlineData.mimeType)
              console.log('  data length:', part.inlineData.data?.length)

              images.push({
                mimeType: part.inlineData.mimeType || 'image/png',
                data: part.inlineData.data
              })
            }
          }

          console.log('Total images found:', images.length)

          if (images.length > 0) {
            this.saveToHistory(images)
          } else {
            // 没有图片数据，显示错误
            wx.showModal({
              title: '生成失败',
              content: '模型未返回图片数据',
              showCancel: false
            })
          }
        }

        this.setData({ generating: false })
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
