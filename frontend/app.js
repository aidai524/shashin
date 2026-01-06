// =========================================
// Gemini Cosmic Studio - Frontend Logic
// =========================================

// 多语言系统
const i18n = {
  en: {
    // Header
    'site.title': 'Cosmic Studio',
    'site.subtitle': 'Powered by Google Gemini AI · Create Stunning Images',
    
    // Config section
    'config.title': 'API Configuration',
    'config.endpoint': 'Proxy Endpoint',
    'config.endpoint.placeholder': 'https://gemini-proxy.xxx.workers.dev',
    'config.apikey': 'API Key',
    'config.apikey.placeholder': 'Enter your Gemini API Key',
    'config.save': 'Save Configuration',
    
    // Generate section
    'prompt.label': 'Prompt',
    'prompt.placeholder': 'Describe the image you want to create...\n\nExample: A majestic phoenix rising from cosmic flames, surrounded by swirling galaxies and stardust, digital art, cinematic lighting',
    'reference.label': 'Reference Images',
    'reference.optional': '(optional, for style/face reference)',
    'reference.upload': 'Click to upload reference images (max 5)',
    'reference.hint': 'Upload character photos to preserve facial features in generated images',
    'model.label': 'Model',
    'model.gemini3pro': 'Gemini 3 Pro Image (Recommended, 4K)',
    'model.gemini25flash': 'Gemini 2.5 Flash (Fast)',
    'model.gemini20flash': 'Gemini 2.0 Flash Exp',
    'quantity.label': 'Quantity',
    'quantity.1': '1 Image',
    'quantity.2': '2 Images',
    'quantity.4': '4 Images',
    'aspectratio.label': 'Aspect Ratio',
    'aspectratio.1:1': '1:1 (Square)',
    'aspectratio.16:9': '16:9 (Landscape Wide)',
    'aspectratio.9:16': '9:16 (Portrait / Mobile)',
    'aspectratio.4:3': '4:3 (Standard Landscape)',
    'aspectratio.3:4': '3:4 (Standard Portrait)',
    'aspectratio.3:2': '3:2 (Photo Landscape)',
    'aspectratio.2:3': '2:3 (Photo Portrait)',
    'aspectratio.21:9': '21:9 (Ultrawide)',
    'resolution.label': 'Resolution',
    'resolution.1k': '1K (Standard)',
    'resolution.2k': '2K (High Definition)',
    'resolution.4k': '4K (Ultra HD)',
    'resolution.hint.supported': 'Gemini 3 Pro supports 1K/2K/4K resolution',
    'resolution.hint.limited': 'This model only supports 1K resolution',
    'generate.button': 'Generate Image',
    'generate.loading': 'Creating Magic...',
    
    // Result section
    'result.title': '🎨 Generated Results',
    
    // History section
    'history.title': 'History',
    'history.clear': 'Clear All',
    'history.empty': 'No history yet. Start creating!',
    'history.note': '💡 Note: History only saves thumbnail previews. Download full images after generation.',
    'history.reuse': 'Reuse Prompt',
    'history.delete': 'Delete',
    'history.model': 'Model',
    'history.refimages': 'Reference Images:',
    
    // Footer
    'footer.text': 'Built with 💫 using Google Gemini & Cloudflare Workers',
    
    // Loading
    'loading.title': 'Creating your masterpiece...',
    'loading.hint': 'This usually takes 10-30 seconds',
    
    // Modal
    'modal.download': 'Download Image',
    
    // Toast messages
    'toast.config.saved': 'Configuration saved successfully!',
    'toast.max.images': 'Maximum {count} reference images allowed',
    'toast.config.endpoint': 'Please configure proxy endpoint first!',
    'toast.config.apikey': 'Please configure API Key first!',
    'toast.prompt.empty': 'Please enter a prompt!',
    'toast.generate.success': 'Successfully generated {count} image(s)!',
    'toast.generate.failed': 'Generation failed. Please try again.',
    'toast.prompt.loaded': 'Prompt loaded!',
    'toast.record.deleted': 'Record deleted',
    'toast.history.cleared': 'History cleared',
    'toast.download.started': 'Download started!',
    
    // Errors
    'error.parse': 'Response parse error',
    'error.request': 'Request failed',
    'error.no.images': 'No images generated. Please try a different prompt.',
    
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
    
    // Config section
    'config.title': 'API 配置',
    'config.endpoint': '代理地址',
    'config.endpoint.placeholder': 'https://gemini-proxy.xxx.workers.dev',
    'config.apikey': 'API 密钥',
    'config.apikey.placeholder': '输入你的 Gemini API Key',
    'config.save': '保存配置',
    
    // Generate section
    'prompt.label': '提示词',
    'prompt.placeholder': '描述你想创建的图像...\n\n示例：一只雄伟的凤凰从宇宙火焰中升起，周围环绕着旋转的星系和星尘，数字艺术风格，电影级光照',
    'reference.label': '参考图片',
    'reference.optional': '（可选，用于风格/面部参考）',
    'reference.upload': '点击上传参考图片（最多5张）',
    'reference.hint': '上传人物照片以在生成图像中保留面部特征',
    'model.label': '模型',
    'model.gemini3pro': 'Gemini 3 Pro Image（推荐，支持4K）',
    'model.gemini25flash': 'Gemini 2.5 Flash（快速）',
    'model.gemini20flash': 'Gemini 2.0 Flash Exp',
    'quantity.label': '生成数量',
    'quantity.1': '1 张',
    'quantity.2': '2 张',
    'quantity.4': '4 张',
    'aspectratio.label': '宽高比',
    'aspectratio.1:1': '1:1（正方形）',
    'aspectratio.16:9': '16:9（横屏宽幅）',
    'aspectratio.9:16': '9:16（竖屏/手机）',
    'aspectratio.4:3': '4:3（标准横屏）',
    'aspectratio.3:4': '3:4（标准竖屏）',
    'aspectratio.3:2': '3:2（照片横屏）',
    'aspectratio.2:3': '2:3（照片竖屏）',
    'aspectratio.21:9': '21:9（超宽屏）',
    'resolution.label': '分辨率',
    'resolution.1k': '1K（标准）',
    'resolution.2k': '2K（高清）',
    'resolution.4k': '4K（超高清）',
    'resolution.hint.supported': 'Gemini 3 Pro 支持 1K/2K/4K 分辨率',
    'resolution.hint.limited': '此模型仅支持 1K 分辨率',
    'generate.button': '生成图片',
    'generate.loading': '创作中...',
    
    // Result section
    'result.title': '🎨 生成结果',
    
    // History section
    'history.title': '历史记录',
    'history.clear': '清空',
    'history.empty': '暂无历史记录，开始创作吧！',
    'history.note': '💡 提示：历史记录仅保存缩略图预览，生成后请及时下载完整图片。',
    'history.reuse': '复用提示词',
    'history.delete': '删除',
    'history.model': '模型',
    'history.refimages': '参考图片：',
    
    // Footer
    'footer.text': '基于 Google Gemini 和 Cloudflare Workers 构建 💫',
    
    // Loading
    'loading.title': '正在创作你的杰作...',
    'loading.hint': '通常需要 10-30 秒',
    
    // Modal
    'modal.download': '下载图片',
    
    // Toast messages
    'toast.config.saved': '配置保存成功！',
    'toast.max.images': '最多只能上传 {count} 张参考图片',
    'toast.config.endpoint': '请先配置代理地址！',
    'toast.config.apikey': '请先配置 API 密钥！',
    'toast.prompt.empty': '请输入提示词！',
    'toast.generate.success': '成功生成 {count} 张图片！',
    'toast.generate.failed': '生成失败，请重试。',
    'toast.prompt.loaded': '提示词已加载！',
    'toast.record.deleted': '记录已删除',
    'toast.history.cleared': '历史已清空',
    'toast.download.started': '开始下载！',
    
    // Errors
    'error.parse': '响应解析失败',
    'error.request': '请求失败',
    'error.no.images': '未生成图片，请尝试其他提示词。',
    
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
  
  // 更新按钮图标和文字
  if (themeBtn) {
    const icon = currentTheme === 'dark' ? '🌙' : '☀️';
    const label = currentTheme === 'dark' ? 'Dark' : 'Light';
    themeBtn.textContent = `${icon} ${label}`;
  }
  
  // 更新 meta theme-color
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.content = currentTheme === 'light' ? '#f5f5fa' : '#06060f';
  }
}

// 获取翻译文本
function t(key, params = {}) {
  let text = i18n[currentLang]?.[key] || i18n['en'][key] || key;
  // 替换参数
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
  // 更新所有带有 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  
  // 更新所有带有 data-i18n-placeholder 属性的元素
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
  
  // 更新 select 选项 - Model
  const modelSelect = document.getElementById('model');
  if (modelSelect) {
    modelSelect.options[0].textContent = t('model.gemini3pro');
    modelSelect.options[1].textContent = t('model.gemini25flash');
    modelSelect.options[2].textContent = t('model.gemini20flash');
  }
  
  // 更新 select 选项 - Quantity
  const quantitySelect = document.getElementById('imageCount');
  if (quantitySelect) {
    quantitySelect.options[0].textContent = t('quantity.1');
    quantitySelect.options[1].textContent = t('quantity.2');
    quantitySelect.options[2].textContent = t('quantity.4');
  }
  
  // 更新 select 选项 - Aspect Ratio
  const aspectSelect = document.getElementById('aspectRatio');
  if (aspectSelect) {
    aspectSelect.options[0].textContent = t('aspectratio.1:1');
    aspectSelect.options[1].textContent = t('aspectratio.16:9');
    aspectSelect.options[2].textContent = t('aspectratio.9:16');
    aspectSelect.options[3].textContent = t('aspectratio.4:3');
    aspectSelect.options[4].textContent = t('aspectratio.3:4');
    aspectSelect.options[5].textContent = t('aspectratio.3:2');
    aspectSelect.options[6].textContent = t('aspectratio.2:3');
    aspectSelect.options[7].textContent = t('aspectratio.21:9');
  }
  
  // 更新 select 选项 - Resolution
  const resolutionSelect = document.getElementById('imageSize');
  if (resolutionSelect) {
    resolutionSelect.options[0].textContent = t('resolution.1k');
    resolutionSelect.options[1].textContent = t('resolution.2k');
    resolutionSelect.options[2].textContent = t('resolution.4k');
  }
  
  // 更新语言切换按钮
  const langBtn = document.getElementById('langSwitchBtn');
  if (langBtn) {
    langBtn.textContent = t('lang.switch');
  }
  
  // 更新页面标题
  document.title = currentLang === 'zh' 
    ? 'Gemini 梦想写真馆 - AI 图片生成器' 
    : 'Gemini Cosmic Studio - AI Image Generator';
  
  // 更新分辨率提示
  updateResolutionOptions();
  
  // 重新加载历史记录以更新文本
  loadHistory();
}

// 全局状态
let currentModalImage = null;
let referenceImages = []; // 存储参考图片的 base64 数据
let lastGeneratedImages = []; // 临时存储最近生成的完整图片

// 初始化
document.addEventListener("DOMContentLoaded", () => {
  loadConfig();
  // 检查并清理过大的历史记录
  cleanupOldHistory();
  loadHistory();
  // 初始化分辨率选项
  updateResolutionOptions();
  // 初始化无障碍支持
  initAccessibility();
  // 添加入场动画完成后的交互增强
  enhanceInteractions();
  // 应用主题设置
  applyTheme();
  // 应用语言设置
  applyLanguage();
});

// 初始化无障碍支持
function initAccessibility() {
  // 配置面板键盘支持
  const configToggle = document.querySelector('.config-toggle');
  if (configToggle) {
    configToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleConfig();
      }
    });
  }

  // 上传区域键盘支持
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
  // 为表单元素添加聚焦动画
  const inputs = document.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      input.parentElement?.classList.add('focused');
    });
    input.addEventListener('blur', () => {
      input.parentElement?.classList.remove('focused');
    });
  });

  // 拖拽上传支持
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
  // 创建 toast 元素
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

  // 触发动画
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  // 自动移除
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// 清理旧格式的历史记录（包含完整图片的）
function cleanupOldHistory() {
  try {
    const historyStr = localStorage.getItem("gemini_history");
    if (historyStr && historyStr.length > 1000000) {
      // 超过1MB，清空
      localStorage.removeItem("gemini_history");
      console.log("Cleaned up oversized history");
    }
  } catch (e) {
    localStorage.removeItem("gemini_history");
  }
}

// 配置相关
function toggleConfig() {
  const content = document.getElementById("configContent");
  const icon = document.getElementById("configToggleIcon");
  const toggle = document.querySelector('.config-toggle');
  
  const isOpen = content.classList.toggle("show");
  icon.classList.toggle("open");
  
  // 更新 ARIA 属性
  toggle?.setAttribute('aria-expanded', isOpen);
}

function saveConfig() {
  const endpoint = document.getElementById("apiEndpoint").value.trim();
  const apiKey = document.getElementById("apiKey").value.trim();

  localStorage.setItem("gemini_endpoint", endpoint);
  localStorage.setItem("gemini_api_key", apiKey);

  showToast(t('toast.config.saved'), "info");
}

function loadConfig() {
  const endpoint = localStorage.getItem("gemini_endpoint") || "";
  const apiKey = localStorage.getItem("gemini_api_key") || "";

  document.getElementById("apiEndpoint").value = endpoint;
  document.getElementById("apiKey").value = apiKey;
}

function getConfig() {
  return {
    endpoint: localStorage.getItem("gemini_endpoint") || "",
    apiKey: localStorage.getItem("gemini_api_key") || "",
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

  // 清空 input 以便重复选择同一文件
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

  // 添加"添加更多"按钮
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
  const model = document.getElementById("model").value;
  const imageSizeSelect = document.getElementById("imageSize");
  const resolutionHint = document.getElementById("resolutionHint");

  if (model === "gemini-3-pro-image-preview") {
    // Gemini 3 Pro 支持所有分辨率
    imageSizeSelect.disabled = false;
    resolutionHint.textContent = t('resolution.hint.supported');
    resolutionHint.classList.add('success');
    resolutionHint.classList.remove('warning');
  } else {
    // 其他模型只支持 1K
    imageSizeSelect.value = "1K";
    imageSizeSelect.disabled = true;
    resolutionHint.textContent = t('resolution.hint.limited');
    resolutionHint.classList.remove('success');
    resolutionHint.classList.add('warning');
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
  const prompt = document.getElementById("prompt").value.trim();
  const model = document.getElementById("model").value;
  const imageCount = parseInt(document.getElementById("imageCount").value);
  const aspectRatio = document.getElementById("aspectRatio").value;
  const imageSize = document.getElementById("imageSize").value;

  // 验证
  if (!config.endpoint) {
    showToast(t('toast.config.endpoint'), "warning");
    toggleConfig();
    return;
  }
  if (!config.apiKey) {
    showToast(t('toast.config.apikey'), "warning");
    toggleConfig();
    return;
  }
  if (!prompt) {
    showToast(t('toast.prompt.empty'), "warning");
    document.getElementById("prompt").focus();
    return;
  }

  const btn = document.getElementById("generateBtn");
  const btnText = btn.querySelector(".btn-text");
  const btnLoading = btn.querySelector(".btn-loading");

  // 显示加载状态
  btn.disabled = true;
  btnText.style.display = "none";
  btnLoading.style.display = "inline-flex";
  showLoading();

  try {
    const images = await generateWithGemini(
      config,
      prompt,
      model,
      imageCount,
      referenceImages,
      aspectRatio,
      imageSize,
    );

    if (images.length > 0) {
      // 显示结果
      displayResults(images);

      // 保存到历史记录
      saveToHistory(prompt, model, images, referenceImages);
      
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

  // 构建请求内容
  const parts = [];

  // 如果有参考图片，添加到请求中
  if (refImages && refImages.length > 0) {
    // 添加说明文字
    parts.push({
      text: `Please reference the facial features from the following character images and generate an image that matches the requirements. Maintain consistent facial characteristics.\n\nUser request: ${prompt}`,
    });

    // 添加参考图片
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

  // 构建 generationConfig
  const generationConfig = {
    responseModalities: ["TEXT", "IMAGE"],
  };

  // 添加 imageConfig（宽高比和分辨率）
  // 注意：imageSize (2K/4K) 仅 gemini-3-pro-image-preview 支持
  const imageConfig = {
    aspectRatio: aspectRatio || "1:1",
  };

  // 只有 Gemini 3 Pro 支持 imageSize 参数
  if (model === "gemini-3-pro-image-preview" && imageSize) {
    imageConfig.imageSize = imageSize;
  }

  generationConfig.imageConfig = imageConfig;

  const requestBody = {
    contents: [
      {
        parts: parts,
      },
    ],
    generationConfig: generationConfig,
  };

  // 详细日志
  console.log("=== Gemini Image Generation Request ===");
  console.log("URL:", url);
  console.log("Model:", model);
  console.log("Aspect Ratio:", aspectRatio);
  console.log("Image Size:", imageSize);
  console.log("Reference Images:", refImages?.length || 0);
  console.log("Request Body:", JSON.stringify(requestBody, null, 2));

  // Gemini 每次只能生成一张，需要多次请求
  for (let i = 0; i < imageCount; i++) {
    console.log(`--- Request ${i + 1}/${imageCount} ---`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.apiKey,
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

    // 解析 Gemini 返回的图片
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

  // 滚动到结果区域
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
function saveToHistory(prompt, model, images, refImages) {
  const history = getHistory();

  // 保存完整图片到临时变量，用于当前会话查看
  lastGeneratedImages = images;

  // 异步压缩图片后保存
  compressImagesAsync(images).then((thumbnails) => {
    const record = {
      id: Date.now(),
      prompt: prompt,
      model: model,
      thumbnails: thumbnails,
      imageCount: images.length,
      hasRefImages: refImages && refImages.length > 0,
      createdAt: new Date().toISOString(),
    };

    history.unshift(record);

    // 最多保存 20 条记录
    while (history.length > 20) {
      history.pop();
    }

    // 尝试保存
    saveHistoryToStorage(history);
    loadHistory();
  });
}

// 异步压缩图片
async function compressImagesAsync(images) {
  const thumbnails = [];

  for (const img of images) {
    try {
      const compressed = await compressImageAsync(
        img.base64,
        img.mimeType,
        150,
      );
      thumbnails.push(compressed);
    } catch (e) {
      // 压缩失败，使用截断的数据
      thumbnails.push({
        base64: img.base64.substring(0, 2000),
        mimeType: img.mimeType,
      });
    }
  }

  return thumbnails;
}

// 使用 Canvas 异步压缩单张图片
function compressImageAsync(base64, mimeType, maxSize) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // 计算缩放比例
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

      // 转为 JPEG 并降低质量
      const compressedBase64 = canvas
        .toDataURL("image/jpeg", 0.6)
        .split(",")[1];
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

// 保存历史到 localStorage
function saveHistoryToStorage(history) {
  try {
    localStorage.setItem("gemini_history", JSON.stringify(history));
  } catch (e) {
    // 存储空间不足，逐步删除旧记录
    while (history.length > 1) {
      history.pop();
      try {
        localStorage.setItem("gemini_history", JSON.stringify(history));
        return;
      } catch (e2) {
        continue;
      }
    }
    // 仍然失败，清空
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

  // 显示缩略图网格
  container.innerHTML = history
    .map((record, index) => {
      // 兼容旧格式和新格式
      const thumbnails = record.thumbnails || record.images || [];
      const firstImage = thumbnails[0];
      if (!firstImage) return "";

      const imageCount = record.imageCount || thumbnails.length;
      const date = formatTime(record.createdAt);

      return `
      <div class="history-thumb" onclick="showHistoryDetail(${record.id})" style="animation: fadeInUp 0.4s ease backwards; animation-delay: ${index * 0.03}s">
        <img src="data:${firstImage.mimeType};base64,${firstImage.base64}" alt="History" loading="lazy" />
        ${imageCount > 1 ? `<span class="thumb-count">${imageCount}</span>` : ""}
        <span class="thumb-date">${date}</span>
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

  // 使用缩略图显示（历史记录只保存了缩略图）
  const thumbnails = record.thumbnails || record.images || [];
  const imagesHtml = thumbnails
    .map(
      (img, i) => `
    <img
      src="data:${img.mimeType};base64,${img.base64}"
      alt="Generated image ${i + 1}"
      style="cursor: default;"
    />
  `,
    )
    .join("");

  const refImagesHtml =
    record.referenceImages && record.referenceImages.length > 0
      ? `
    <div style="margin-bottom: 16px;">
      <h4 style="margin-bottom: 8px; color: var(--text-secondary);">${t('history.refimages')}</h4>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        ${record.referenceImages
          .map(
            (img) => `
          <img src="data:${img.mimeType};base64,${img.base64}"
               style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-subtle);" />
        `,
          )
          .join("")}
      </div>
    </div>
  `
      : "";

  detail.innerHTML = `
    <div class="history-detail-prompt">${escapeHtml(record.prompt)}</div>
    <div class="history-detail-meta">
      <span>${t('history.model')}: ${record.model}</span>
      <span>${formatTimeDetailed(record.createdAt)}</span>
    </div>
    ${refImagesHtml}
    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 14px;">
      ${t('history.note')}
    </p>
    <div class="history-detail-images">${imagesHtml}</div>
    <div class="history-detail-actions">
      <button class="btn btn-secondary btn-small" onclick="reusePrompt(${record.id})">📝 ${t('history.reuse')}</button>
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

function reusePrompt(id) {
  const history = getHistory();
  const record = history.find((h) => h.id === id);
  if (record) {
    document.getElementById("prompt").value = record.prompt;
    closeHistoryModal();
    document.getElementById("prompt").scrollIntoView({ behavior: "smooth" });
    document.getElementById("prompt").focus();
    showToast(t('toast.prompt.loaded'), "info");
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
function openModal(base64, mimeType, historyId, imageIndex) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");

  // 如果是从历史记录点击，需要获取完整的 base64
  if (historyId !== undefined && imageIndex !== undefined) {
    const history = getHistory();
    const record = history.find((h) => h.id === historyId);
    if (record && record.images[imageIndex]) {
      base64 = record.images[imageIndex].base64;
      mimeType = record.images[imageIndex].mimeType;
    }
  }

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
  link.download = `cosmic-studio-${Date.now()}.png`;
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
    // 中文时间格式
    if (diff < 60000) return "刚刚";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } else {
    // 英文时间格式
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
  // ESC 关闭弹窗
  if (e.key === "Escape") {
    closeModal();
    closeHistoryModal();
  }
  // Ctrl/Cmd + Enter 生成图片
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    const prompt = document.getElementById("prompt");
    if (document.activeElement === prompt) {
      generateImage();
    }
  }
});
