// =========================================
// 梦想写真馆 - Frontend Logic
// =========================================

// 默认后端配置 - 使用已部署的 Cloudflare Worker 代理
const DEFAULT_API_ENDPOINT = 'https://iapi.sendto.you';

// =========================================
// 模板数据（从后端 API 加载）
// =========================================
let templates = [];

// 多语言系统
const i18n = {
  en: {
    // Header
    'site.title': 'Dream Photo Studio',
    'site.subtitle': 'Powered by Google Gemini AI · Create Stunning Images',
    
    // Template section
    'template.title': 'Choose Style Template',
    'template.desc': 'Select your favorite style, AI will generate images in this style',
    'template.category.all': 'All',
    'template.category.portrait': 'Portrait',
    'template.category.creative': 'Creative',
    'template.category.scene': 'Scene',
    'template.change': 'Change Template',
    'template.select': 'Please select a template first',
    
    // Reference section
    'reference.title': 'Upload Your Photos',
    'reference.desc': 'Upload clear photos, AI will preserve your facial features',
    'reference.upload': 'Click to upload photos (max 5)',
    'reference.upload.hint': 'Recommend photos from different angles',
    
    // Settings section
    'settings.title': 'Adjust Settings',
    
    // Model
    'model.label': 'Quality',
    'model.premium': 'Premium',
    'model.premium.desc': '4K Ultra HD',
    'model.fast': 'Fast',
    'model.fast.desc': 'Standard',
    
    // Quantity
    'quantity.label': 'Quantity',
    'quantity.time.1': '~30s',
    'quantity.time.2': '~60s',
    'quantity.time.4': '~2min',
    
    // Aspect Ratio
    'aspectratio.label': 'Aspect Ratio',
    
    // Resolution
    'resolution.label': 'Resolution',
    'resolution.hint.supported': 'Premium mode supports 1K/2K/4K resolution',
    'resolution.hint.limited': 'Fast mode only supports 1K resolution',
    
    'generate.button': 'Generate Image',
    'generate.loading': 'Creating Magic...',
    
    // Result section
    'result.title': '🎨 Generated Results',
    
    // History section
    'history.title': 'History',
    'history.clear': 'Clear All',
    'history.empty': 'No history yet. Start creating!',
    'history.note': '💡 Note: History only saves thumbnail previews.',
    'history.reuse': 'Reuse',
    'history.delete': 'Delete',
    'history.model': 'Model',
    'history.template': 'Template',
    
    // Footer
    'footer.text': 'Built with 💫 using Google Gemini & Cloudflare Workers',
    
    // Loading
    'loading.title': 'Creating your masterpiece...',
    'loading.hint': 'This usually takes 10-30 seconds',
    
    // Modal
    'modal.download': 'Download Image',
    
    // Toast messages
    'toast.max.images': 'Maximum {count} images allowed',
    'toast.generate.success': 'Successfully generated {count} image(s)!',
    'toast.generate.failed': 'Generation failed. Please try again.',
    'toast.record.deleted': 'Record deleted',
    'toast.history.cleared': 'History cleared',
    'toast.download.started': 'Download started!',
    'toast.template.selected': 'Template selected: {name}',
    
    // Errors
    'error.parse': 'Response parse error',
    'error.request': 'Request failed',
    'error.no.images': 'No images generated. Please try again.',
    
    // Confirm dialogs
    'confirm.delete': 'Delete this record?',
    'confirm.clear': 'Clear all history?',
    
    // Language
    'lang.switch': '中文',
  },
  zh: {
    // Header
    'site.title': '梦想写真馆',
    'site.subtitle': '由 Google Gemini AI 驱动 · 创造精美图像',
    
    // Template section
    'template.title': '选择风格模板',
    'template.desc': '点击选择你喜欢的风格，AI 将按此风格生成图片',
    'template.category.all': '全部',
    'template.category.portrait': '人像写真',
    'template.category.creative': '创意艺术',
    'template.category.scene': '场景合成',
    'template.change': '更换模板',
    'template.select': '请先选择一个模板',
    
    // Reference section
    'reference.title': '上传你的照片',
    'reference.desc': '上传清晰的人物照片，AI 将保留你的面部特征',
    'reference.upload': '点击上传参考图片（最多5张）',
    'reference.upload.hint': '建议上传不同角度的清晰照片',
    
    // Settings section
    'settings.title': '调整设置',
    
    // Model
    'model.label': '生成质量',
    'model.premium': '高级',
    'model.premium.desc': '4K 高清',
    'model.fast': '快速',
    'model.fast.desc': '标准画质',
    
    // Quantity
    'quantity.label': '生成数量',
    'quantity.time.1': '~30秒',
    'quantity.time.2': '~60秒',
    'quantity.time.4': '~2分钟',
    
    // Aspect Ratio
    'aspectratio.label': '宽高比',
    
    // Resolution
    'resolution.label': '画质',
    'resolution.hint.supported': '高级模式支持 1K/2K/4K 分辨率',
    'resolution.hint.limited': '快速模式仅支持 1K 分辨率',
    
    'generate.button': '生成图片',
    'generate.loading': '创作中...',
    
    // Result section
    'result.title': '🎨 生成结果',
    
    // History section
    'history.title': '历史记录',
    'history.clear': '清空',
    'history.empty': '暂无历史记录，开始创作吧！',
    'history.note': '💡 提示：历史记录仅保存缩略图预览。',
    'history.reuse': '再次生成',
    'history.delete': '删除',
    'history.model': '模型',
    'history.template': '模板',
    
    // Footer
    'footer.text': '基于 Google Gemini 和 Cloudflare Workers 构建 💫',
    
    // Loading
    'loading.title': '正在创作你的杰作...',
    'loading.hint': '通常需要 10-30 秒',
    
    // Modal
    'modal.download': '下载图片',
    
    // Toast messages
    'toast.max.images': '最多只能上传 {count} 张图片',
    'toast.generate.success': '成功生成 {count} 张图片！',
    'toast.generate.failed': '生成失败，请重试。',
    'toast.record.deleted': '记录已删除',
    'toast.history.cleared': '历史已清空',
    'toast.download.started': '开始下载！',
    'toast.template.selected': '已选择模板：{name}',
    
    // Errors
    'error.parse': '响应解析失败',
    'error.request': '请求失败',
    'error.no.images': '未生成图片，请重试。',
    
    // Confirm dialogs
    'confirm.delete': '确定删除这条记录？',
    'confirm.clear': '确定清空所有历史记录？',
    
    // Language
    'lang.switch': 'EN',
  }
};

// 当前语言（默认中文）
let currentLang = localStorage.getItem('gemini_lang') || 'zh';

// 当前主题（默认深色）
let currentTheme = localStorage.getItem('gemini_theme') || 'dark';

// 当前选择状态
let selectedTemplate = null;
let selectedModel = 'gemini-3-pro-image-preview';
let selectedAspectRatio = '1:1';
let selectedQuantity = 1;
let selectedResolution = '4K';
let selectedCategory = 'all';

// 切换主题
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('gemini_theme', currentTheme);
  applyTheme();
}

// 应用主题
function applyTheme() {
  const html = document.documentElement;
  const themeBtn = document.getElementById('themeSwitchBtn');
  
  html.setAttribute('data-theme', currentTheme);
  
  if (themeBtn) {
    const icon = currentTheme === 'dark' ? '🌙' : '☀️';
    const label = currentTheme === 'dark' ? 'Dark' : 'Light';
    themeBtn.textContent = `${icon} ${label}`;
  }
  
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.content = currentTheme === 'light' ? '#f5f5fa' : '#06060f';
  }
}

// 获取翻译文本
function t(key, params = {}) {
  let text = i18n[currentLang]?.[key] || i18n['en'][key] || key;
  Object.keys(params).forEach(param => {
    text = text.replace(`{${param}}`, params[param]);
  });
  return text;
}

// 切换语言
function switchLanguage() {
  currentLang = currentLang === 'en' ? 'zh' : 'en';
  localStorage.setItem('gemini_lang', currentLang);
  applyLanguage();
}

// 应用语言到界面
function applyLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
  
  const langBtn = document.getElementById('langSwitchBtn');
  if (langBtn) {
    langBtn.textContent = t('lang.switch');
  }
  
  document.title = currentLang === 'zh' 
    ? '梦想写真馆 - AI 图片生成器' 
    : 'Dream Photo Studio - AI Image Generator';
  
  updateQuantityLabels();
  updateResolutionOptions();
  renderTemplates();
  loadHistory();
}

// 更新数量按钮标签
function updateQuantityLabels() {
  const times = {
    1: t('quantity.time.1'),
    2: t('quantity.time.2'),
    4: t('quantity.time.4')
  };
  
  document.querySelectorAll('.quantity-btn').forEach(btn => {
    const count = btn.dataset.count;
    const timeEl = btn.querySelector('.quantity-time');
    if (timeEl && times[count]) {
      timeEl.textContent = times[count];
    }
  });
}

// 全局状态
let currentModalImage = null;
let referenceImages = [];
let lastGeneratedImages = [];

// 初始化
document.addEventListener("DOMContentLoaded", async () => {
  cleanupOldHistory();
  loadHistory();
  initSelectors();
  await loadTemplatesFromAPI();
  initTemplateSystem();
  updateResolutionOptions();
  initAccessibility();
  enhanceInteractions();
  applyTheme();
  applyLanguage();
});

// 从后端 API 加载模板
async function loadTemplatesFromAPI() {
  try {
    const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/templates`);
    if (response.ok) {
      templates = await response.json();
      console.log(`✅ 已加载 ${templates.length} 个模板`);
    } else {
      console.error('Failed to load templates:', response.status);
      // 使用默认空模板
      templates = [];
    }
  } catch (error) {
    console.error('Error loading templates:', error);
    templates = [];
  }
}

// 初始化模板系统
function initTemplateSystem() {
  // 渲染模板
  renderTemplates();
  
  // 分类切换
  const categoryContainer = document.getElementById('templateCategories');
  if (categoryContainer) {
    categoryContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.category-btn');
      if (btn) {
        categoryContainer.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCategory = btn.dataset.category;
        renderTemplates();
      }
    });
  }
}

// 渲染模板网格
function renderTemplates() {
  const grid = document.getElementById('templateGrid');
  if (!grid) return;
  
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);
  
  grid.innerHTML = filteredTemplates.map(template => `
    <div class="template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}" 
         data-template-id="${template.id}"
         onclick="selectTemplate('${template.id}')">
      <div class="template-thumbnail">
        <img src="${template.thumbnail}" alt="${template.name[currentLang]}" loading="lazy" />
        <div class="template-overlay">
          <span class="template-select-icon">✓</span>
        </div>
      </div>
      <div class="template-info">
        <h3>${template.name[currentLang]}</h3>
        <p>${template.description[currentLang]}</p>
      </div>
    </div>
  `).join('');
}

// 选择模板
function selectTemplate(templateId) {
  const template = templates.find(t => t.id === templateId);
  if (!template) return;
  
  selectedTemplate = template;
  
  // 更新UI
  document.querySelectorAll('.template-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.templateId === templateId);
  });
  
  // 显示已选模板详情
  const selectedSection = document.getElementById('selectedTemplate');
  const selectedImg = document.getElementById('selectedTemplateImg');
  const selectedName = document.getElementById('selectedTemplateName');
  const selectedDesc = document.getElementById('selectedTemplateDesc');
  
  if (selectedSection && selectedImg && selectedName && selectedDesc) {
    selectedImg.src = template.thumbnail;
    selectedName.textContent = template.name[currentLang];
    selectedDesc.textContent = template.description[currentLang];
    selectedSection.style.display = 'flex';
  }
  
  showToast(t('toast.template.selected', { name: template.name[currentLang] }), 'info');
}

// 清除模板选择
function clearTemplateSelection() {
  selectedTemplate = null;
  document.querySelectorAll('.template-card').forEach(card => {
    card.classList.remove('selected');
  });
  const selectedSection = document.getElementById('selectedTemplate');
  if (selectedSection) {
    selectedSection.style.display = 'none';
  }
}

// 初始化所有选择器
function initSelectors() {
  // 宽高比选择器
  const aspectGrid = document.getElementById('aspectRatioGrid');
  if (aspectGrid) {
    aspectGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.aspect-btn');
      if (btn) {
        aspectGrid.querySelectorAll('.aspect-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedAspectRatio = btn.dataset.ratio;
      }
    });
  }
  
  // 模型选择器
  const modelToggle = document.getElementById('modelToggle');
  if (modelToggle) {
    modelToggle.addEventListener('click', (e) => {
      const btn = e.target.closest('.model-btn');
      if (btn) {
        modelToggle.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedModel = btn.dataset.model;
        updateResolutionOptions();
      }
    });
  }
  
  // 数量选择器
  const quantitySelector = document.getElementById('quantitySelector');
  if (quantitySelector) {
    quantitySelector.addEventListener('click', (e) => {
      const btn = e.target.closest('.quantity-btn');
      if (btn) {
        quantitySelector.querySelectorAll('.quantity-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedQuantity = parseInt(btn.dataset.count);
      }
    });
  }
  
  // 分辨率选择器
  const resolutionSelector = document.getElementById('resolutionSelector');
  if (resolutionSelector) {
    resolutionSelector.addEventListener('click', (e) => {
      const btn = e.target.closest('.resolution-btn');
      if (btn && !btn.disabled) {
        resolutionSelector.querySelectorAll('.resolution-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedResolution = btn.dataset.size;
      }
    });
  }
}

// 初始化无障碍支持
function initAccessibility() {
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  if (uploadPlaceholder) {
    uploadPlaceholder.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        document.getElementById('referenceImages').click();
      }
    });
  }
}

// 增强交互效果
function enhanceInteractions() {
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.parentElement?.classList.add('focused');
    });
    input.addEventListener('blur', () => {
      input.parentElement?.classList.remove('focused');
    });
  });

  const uploadArea = document.getElementById('referenceUploadArea');
  if (uploadArea) {
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = 'var(--accent-primary)';
      uploadArea.style.background = 'rgba(0, 229, 192, 0.05)';
    });

    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      uploadArea.style.background = '';
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.style.borderColor = '';
      uploadArea.style.background = '';
      
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length > 0) {
        handleDroppedFiles(files);
      }
    });
  }
}

// 处理拖拽上传的文件
function handleDroppedFiles(files) {
  const maxImages = 5;
  
  if (referenceImages.length + files.length > maxImages) {
    showToast(t('toast.max.images', { count: maxImages }), 'warning');
    return;
  }

  files.forEach((file) => {
    if (referenceImages.length >= maxImages) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(",")[1];
      const mimeType = file.type;
      referenceImages.push({ base64, mimeType, name: file.name });
      renderReferencePreview();
    };
    reader.readAsDataURL(file);
  });
}

// 简易 Toast 提示
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: ${type === 'warning' ? 'rgba(255, 179, 71, 0.95)' : type === 'error' ? 'rgba(255, 107, 107, 0.95)' : 'rgba(0, 229, 192, 0.95)'};
    color: #000;
    padding: 14px 28px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.9rem;
    z-index: 3000;
    opacity: 0;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// 清理旧格式的历史记录
function cleanupOldHistory() {
  try {
    const historyStr = localStorage.getItem("gemini_history");
    if (historyStr && historyStr.length > 1000000) {
      localStorage.removeItem("gemini_history");
      console.log("Cleaned up oversized history");
    }
  } catch (e) {
    localStorage.removeItem("gemini_history");
  }
}

// 获取配置
function getConfig() {
  return {
    endpoint: DEFAULT_API_ENDPOINT,
  };
}

// 参考图片处理
function handleReferenceImages(event) {
  const files = Array.from(event.target.files);
  const maxImages = 5;

  if (referenceImages.length + files.length > maxImages) {
    showToast(t('toast.max.images', { count: maxImages }), 'warning');
    return;
  }

  files.forEach((file) => {
    if (referenceImages.length >= maxImages) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(",")[1];
      const mimeType = file.type;
      referenceImages.push({ base64, mimeType, name: file.name });
      renderReferencePreview();
    };
    reader.readAsDataURL(file);
  });

  event.target.value = "";
}

function renderReferencePreview() {
  const preview = document.getElementById("referencePreview");
  const placeholder = document.getElementById("uploadPlaceholder");

  if (referenceImages.length === 0) {
    preview.innerHTML = "";
    placeholder.classList.remove("hidden");
    return;
  }

  placeholder.classList.add("hidden");

  let html = referenceImages
    .map(
      (img, index) => `
    <div class="reference-item" style="animation: fadeInUp 0.3s ease backwards; animation-delay: ${index * 0.05}s">
      <img src="data:${img.mimeType};base64,${img.base64}" alt="Reference ${index + 1}" />
      <button class="remove-btn" onclick="removeReferenceImage(${index})" aria-label="Remove image">×</button>
    </div>
  `,
    )
    .join("");

  if (referenceImages.length < 5) {
    html += `
      <label for="referenceImages" class="add-more-btn" aria-label="Add more images">+</label>
    `;
  }

  preview.innerHTML = html;
}

function removeReferenceImage(index) {
  referenceImages.splice(index, 1);
  renderReferencePreview();
}

// 根据模型更新分辨率选项
function updateResolutionOptions() {
  const resolutionSelector = document.getElementById("resolutionSelector");
  const resolutionHint = document.getElementById("resolutionHint");
  const resolutionGroup = document.getElementById("resolutionGroup");

  if (selectedModel === "gemini-3-pro-image-preview") {
    if (resolutionGroup) resolutionGroup.style.display = 'block';
    resolutionSelector?.querySelectorAll('.resolution-btn').forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('disabled');
    });
    if (resolutionHint) {
      resolutionHint.textContent = t('resolution.hint.supported');
      resolutionHint.classList.add('success');
      resolutionHint.classList.remove('warning');
    }
  } else {
    if (resolutionGroup) resolutionGroup.style.display = 'none';
    selectedResolution = "1K";
  }
}

// 显示/隐藏加载动画
function showLoading() {
  document.getElementById("loadingOverlay").classList.add("show");
  document.body.style.overflow = 'hidden';
}

function hideLoading() {
  document.getElementById("loadingOverlay").classList.remove("show");
  document.body.style.overflow = '';
}

// 图片生成
async function generateImage() {
  const config = getConfig();

  // 验证模板选择
  if (!selectedTemplate) {
    showToast(t('template.select'), "warning");
    document.getElementById('templateGrid')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const btn = document.getElementById("generateBtn");
  const btnText = btn.querySelector(".btn-text");
  const btnLoading = btn.querySelector(".btn-loading");

  btn.disabled = true;
  btnText.style.display = "none";
  btnLoading.style.display = "inline-flex";
  showLoading();

  try {
    const images = await generateWithGemini(
      config,
      selectedTemplate.prompt,
      selectedModel,
      selectedQuantity,
      referenceImages,
      selectedAspectRatio,
      selectedResolution,
    );

    if (images.length > 0) {
      displayResults(images);
      saveToHistory(selectedTemplate, selectedModel, images, referenceImages);
      showToast(t('toast.generate.success', { count: images.length }), "info");
    }
  } catch (error) {
    console.error("Generation failed:", error);
    showError(error.message);
    showToast(t('toast.generate.failed'), "error");
  } finally {
    btn.disabled = false;
    btnText.style.display = "inline";
    btnLoading.style.display = "none";
    hideLoading();
  }
}

// 使用 Gemini 模型生成图片
async function generateWithGemini(
  config,
  prompt,
  model,
  imageCount,
  refImages,
  aspectRatio,
  imageSize,
) {
  const endpoint = config.endpoint.replace(/\/$/, "");
  const url = `${endpoint}/v1beta/models/${model}:generateContent`;

  const images = [];
  const parts = [];

  // 如果有参考图片，添加锁脸提示
  if (refImages && refImages.length > 0) {
    parts.push({
      text: `Please reference the facial features from the following character images and generate an image that matches the requirements. Maintain consistent facial characteristics, face shape, and key features.\n\nStyle requirement: ${prompt}`,
    });

    refImages.forEach((img) => {
      parts.push({
        inline_data: {
          mime_type: img.mimeType,
          data: img.base64,
        },
      });
    });
  } else {
    parts.push({ text: prompt });
  }

  const generationConfig = {
    responseModalities: ["TEXT", "IMAGE"],
  };

  const imageConfig = {
    aspectRatio: aspectRatio || "1:1",
  };

  if (model === "gemini-3-pro-image-preview" && imageSize) {
    imageConfig.imageSize = imageSize;
  }

  generationConfig.imageConfig = imageConfig;

  const requestBody = {
    contents: [{ parts: parts }],
    generationConfig: generationConfig,
  };

  console.log("=== Gemini Image Generation Request ===");
  console.log("URL:", url);
  console.log("Model:", model);
  console.log("Template:", selectedTemplate?.id);
  console.log("Aspect Ratio:", aspectRatio);
  console.log("Image Size:", imageSize);
  console.log("Reference Images:", refImages?.length || 0);

  for (let i = 0; i < imageCount; i++) {
    console.log(`--- Request ${i + 1}/${imageCount} ---`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Response Status:", response.status);

    const responseText = await response.text();
    console.log("Response Body:", responseText.substring(0, 1000));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("JSON parse error:", e);
      throw new Error(`${t('error.parse')}: ${responseText.substring(0, 200)}`);
    }

    if (!response.ok) {
      console.error("Request failed:", data);
      throw new Error(data.error?.message || `${t('error.request')}: ${response.status}`);
    }

    if (data.candidates) {
      for (const candidate of data.candidates) {
        if (candidate.content?.parts) {
          for (const part of candidate.content.parts) {
            if (part.inlineData) {
              images.push({
                base64: part.inlineData.data,
                mimeType: part.inlineData.mimeType || "image/png",
              });
            }
          }
        }
      }
    }
  }

  console.log("Total images generated:", images.length);

  if (images.length === 0) {
    throw new Error(t('error.no.images'));
  }

  return images;
}

// 显示生成结果
function displayResults(images) {
  const section = document.getElementById("resultSection");
  const container = document.getElementById("resultImages");

  section.style.display = "block";
  container.innerHTML = "";

  images.forEach((img, index) => {
    const div = document.createElement("div");
    div.className = "result-image";
    div.style.animationDelay = `${index * 0.1}s`;
    div.onclick = () => openModal(img.base64, img.mimeType);

    const imgEl = document.createElement("img");
    imgEl.src = `data:${img.mimeType};base64,${img.base64}`;
    imgEl.alt = `Generated image ${index + 1}`;
    imgEl.loading = "lazy";

    div.appendChild(imgEl);
    container.appendChild(div);
  });

  setTimeout(() => {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);
}

// 显示错误
function showError(message) {
  const section = document.getElementById("resultSection");
  const container = document.getElementById("resultImages");

  section.style.display = "block";
  container.innerHTML = `<div class="error-message">❌ ${message}</div>`;
}

// 历史记录相关
function saveToHistory(template, model, images, refImages) {
  const history = getHistory();
  lastGeneratedImages = images;

  compressImagesAsync(images).then((thumbnails) => {
    const record = {
      id: Date.now(),
      templateId: template.id,
      templateName: template.name,
      model: model,
      thumbnails: thumbnails,
      imageCount: images.length,
      hasRefImages: refImages && refImages.length > 0,
      createdAt: new Date().toISOString(),
    };

    history.unshift(record);

    while (history.length > 20) {
      history.pop();
    }

    saveHistoryToStorage(history);
    loadHistory();
  });
}

// 异步压缩图片
async function compressImagesAsync(images) {
  const thumbnails = [];

  for (const img of images) {
    try {
      const compressed = await compressImageAsync(img.base64, img.mimeType, 150);
      thumbnails.push(compressed);
    } catch (e) {
      thumbnails.push({
        base64: img.base64.substring(0, 2000),
        mimeType: img.mimeType,
      });
    }
  }

  return thumbnails;
}

function compressImageAsync(base64, mimeType, maxSize) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
      resolve({
        base64: compressedBase64,
        mimeType: "image/jpeg",
      });
    };

    img.onerror = () => {
      resolve({
        base64: base64.substring(0, 2000),
        mimeType: mimeType,
      });
    };

    img.src = `data:${mimeType};base64,${base64}`;
  });
}

function saveHistoryToStorage(history) {
  try {
    localStorage.setItem("gemini_history", JSON.stringify(history));
  } catch (e) {
    while (history.length > 1) {
      history.pop();
      try {
        localStorage.setItem("gemini_history", JSON.stringify(history));
        return;
      } catch (e2) {
        continue;
      }
    }
    localStorage.removeItem("gemini_history");
    console.warn("History storage full, cleared");
  }
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("gemini_history") || "[]");
  } catch {
    return [];
  }
}

function loadHistory() {
  const history = getHistory();
  const container = document.getElementById("historyGrid");

  if (history.length === 0) {
    container.innerHTML = `<p class="empty-tip">${t('history.empty')}</p>`;
    return;
  }

  container.innerHTML = history
    .map((record, index) => {
      const thumbnails = record.thumbnails || record.images || [];
      const firstImage = thumbnails[0];
      if (!firstImage) return "";

      const imageCount = record.imageCount || thumbnails.length;
      const date = formatTime(record.createdAt);
      const templateName = record.templateName?.[currentLang] || record.prompt?.substring(0, 20) || 'Unknown';

      return `
      <div class="history-thumb" onclick="showHistoryDetail(${record.id})" style="animation: fadeInUp 0.4s ease backwards; animation-delay: ${index * 0.03}s">
        <img src="data:${firstImage.mimeType};base64,${firstImage.base64}" alt="History" loading="lazy" />
        ${imageCount > 1 ? `<span class="thumb-count">${imageCount}</span>` : ""}
        <span class="thumb-date">${date}</span>
        <span class="thumb-template">${templateName}</span>
      </div>
    `;
    })
    .join("");
}

function showHistoryDetail(id) {
  const history = getHistory();
  const record = history.find((h) => h.id === id);
  if (!record) return;

  const modal = document.getElementById("historyModal");
  const detail = document.getElementById("historyDetail");

  const thumbnails = record.thumbnails || record.images || [];
  const imagesHtml = thumbnails
    .map((img, i) => `
    <img src="data:${img.mimeType};base64,${img.base64}" alt="Generated image ${i + 1}" style="cursor: default;" />
  `)
    .join("");

  const templateName = record.templateName?.[currentLang] || record.prompt?.substring(0, 50) || 'Unknown';
  const modelName = record.model === 'gemini-3-pro-image-preview' 
    ? (currentLang === 'zh' ? '高级' : 'Premium')
    : (currentLang === 'zh' ? '快速' : 'Fast');

  detail.innerHTML = `
    <div class="history-detail-prompt">${t('history.template')}: ${templateName}</div>
    <div class="history-detail-meta">
      <span>${t('history.model')}: ${modelName}</span>
      <span>${formatTimeDetailed(record.createdAt)}</span>
    </div>
    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 14px;">
      ${t('history.note')}
    </p>
    <div class="history-detail-images">${imagesHtml}</div>
    <div class="history-detail-actions">
      <button class="btn btn-secondary btn-small" onclick="reuseTemplate('${record.templateId}')">🔄 ${t('history.reuse')}</button>
      <button class="btn btn-danger btn-small" onclick="deleteHistoryItem(${record.id})">🗑️ ${t('history.delete')}</button>
    </div>
  `;

  modal.classList.add("show");
  document.body.style.overflow = 'hidden';
}

function closeHistoryModal() {
  document.getElementById("historyModal").classList.remove("show");
  document.body.style.overflow = '';
}

function reuseTemplate(templateId) {
  const template = templates.find(t => t.id === templateId);
  if (template) {
    selectTemplate(templateId);
    closeHistoryModal();
    document.getElementById('templateGrid')?.scrollIntoView({ behavior: 'smooth' });
  }
}

function deleteHistoryItem(id) {
  if (!confirm(t('confirm.delete'))) return;

  const history = getHistory().filter((item) => item.id !== id);
  localStorage.setItem("gemini_history", JSON.stringify(history));
  closeHistoryModal();
  loadHistory();
  showToast(t('toast.record.deleted'), "info");
}

function clearHistory() {
  if (!confirm(t('confirm.clear'))) return;

  localStorage.removeItem("gemini_history");
  loadHistory();
  showToast(t('toast.history.cleared'), "info");
}

// 弹窗相关
function openModal(base64, mimeType) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");

  currentModalImage = { base64, mimeType };
  modalImg.src = `data:${mimeType};base64,${base64}`;
  modal.classList.add("show");
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById("imageModal");
  modal.classList.remove("show");
  document.body.style.overflow = '';
  currentModalImage = null;
}

function downloadImage() {
  if (!currentModalImage) return;

  const link = document.createElement("a");
  link.href = `data:${currentModalImage.mimeType};base64,${currentModalImage.base64}`;
  link.download = `dream-photo-${Date.now()}.png`;
  link.click();
  
  showToast(t('toast.download.started'), "info");
}

// 工具函数
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;

  if (currentLang === 'zh') {
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } else {
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
}

function formatTimeDetailed(isoString) {
  const date = new Date(isoString);
  const locale = currentLang === 'zh' ? 'zh-CN' : 'en-US';
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 键盘事件
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
    closeHistoryModal();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    generateImage();
  }
});
