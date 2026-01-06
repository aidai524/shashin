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
    
    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.login.title': 'Welcome Back',
    'auth.login.subtitle': 'Sign in to continue creating',
    'auth.login.submit': 'Sign In',
    'auth.register.title': 'Create Account',
    'auth.register.subtitle': 'Join Dream Photo Studio and start your AI journey',
    'auth.register.submit': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.password.confirm': 'Confirm Password',
    'auth.nickname': 'Nickname',
    'auth.no.account': "Don't have an account?",
    'auth.have.account': 'Already have an account?',
    'auth.register.now': 'Sign up now',
    'auth.login.now': 'Sign in now',
    'auth.login.success': 'Welcome back, {name}!',
    'auth.register.success': 'Registration successful! Welcome, {name}!',
    'auth.logout.success': 'Logged out successfully',
    'auth.password.mismatch': 'Passwords do not match',
    
    // User menu
    'user.characters': 'My Characters',
    'user.settings': 'Settings',
    
    // Settings
    'settings.account.title': 'Account Settings',
    'settings.profile': 'Profile',
    'settings.plan': 'Current Plan',
    'settings.password': 'Change Password',
    'settings.save': 'Save',
    'settings.old.password': 'Current Password',
    'settings.new.password': 'New Password',
    'settings.change.password': 'Change Password',
    'settings.update.success': 'Profile updated',
    'settings.password.success': 'Password changed',
    
    // Plans
    'plan.free': 'Free',
    'plan.personal': 'Personal',
    'plan.family': 'Family',
    'plan.limits': '{characters} character(s), {photos} photos each',
    
    // Characters
    'characters.title': 'My Characters',
    'characters.add': 'Add Character',
    'characters.edit': 'Edit Character',
    'characters.name': 'Character Name',
    'characters.description': 'Description (optional)',
    'characters.photos': 'Reference Photos',
    'characters.photos.hint': 'Upload clear photos from different angles to help AI better lock facial features',
    'characters.upload.photo': 'Upload Photo',
    'characters.empty': 'No characters yet',
    'characters.empty.hint': 'Create a character and upload photos to use face-lock feature',
    'characters.limit': '{current}/{max} characters',
    'characters.photo.limit': '{current}/{max} photos',
    'characters.created': 'Character created',
    'characters.updated': 'Character updated',
    'characters.deleted': 'Character deleted',
    'characters.photo.uploaded': 'Photo uploaded',
    'characters.photo.deleted': 'Photo deleted',
    'characters.select': 'Select Character',
    'characters.select.title': 'Select Character',
    'characters.select.desc': 'Select a character with photos for AI face-lock generation',
    'characters.login.required': 'Please login to create characters',
    'characters.empty.notice': 'You have no characters yet',
    'characters.empty.notice.hint': 'Create a character and upload photos to use face-lock feature',
    'characters.required': 'Please select a character with photos',
    'characters.no.photos': 'Selected character has no photos, please upload photos first',
    
    // Common
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
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
    
    // Auth
    'auth.login': '登录',
    'auth.logout': '退出登录',
    'auth.login.title': '欢迎回来',
    'auth.login.subtitle': '登录你的账号继续创作',
    'auth.login.submit': '登录',
    'auth.register.title': '创建账号',
    'auth.register.subtitle': '加入梦想写真馆，开启 AI 创作之旅',
    'auth.register.submit': '注册',
    'auth.email': '邮箱',
    'auth.password': '密码',
    'auth.password.confirm': '确认密码',
    'auth.nickname': '昵称',
    'auth.no.account': '还没有账号？',
    'auth.have.account': '已有账号？',
    'auth.register.now': '立即注册',
    'auth.login.now': '立即登录',
    'auth.login.success': '欢迎回来，{name}！',
    'auth.register.success': '注册成功！欢迎，{name}！',
    'auth.logout.success': '已退出登录',
    'auth.password.mismatch': '两次输入的密码不一致',
    
    // User menu
    'user.characters': '我的角色',
    'user.settings': '账号设置',
    
    // Settings
    'settings.account.title': '账号设置',
    'settings.profile': '个人信息',
    'settings.plan': '当前套餐',
    'settings.password': '修改密码',
    'settings.save': '保存',
    'settings.old.password': '旧密码',
    'settings.new.password': '新密码',
    'settings.change.password': '修改密码',
    'settings.update.success': '资料已更新',
    'settings.password.success': '密码已修改',
    
    // Plans
    'plan.free': '免费版',
    'plan.personal': '个人版',
    'plan.family': '家庭版',
    'plan.limits': '{characters} 个角色，每角色 {photos} 张照片',
    
    // Characters
    'characters.title': '我的角色',
    'characters.add': '添加角色',
    'characters.edit': '编辑角色',
    'characters.name': '角色名称',
    'characters.description': '描述（可选）',
    'characters.photos': '参考照片',
    'characters.photos.hint': '上传不同角度的清晰照片，帮助 AI 更好地锁定面部特征',
    'characters.upload.photo': '上传照片',
    'characters.empty': '还没有角色',
    'characters.empty.hint': '创建角色并上传照片，即可使用锁脸功能',
    'characters.limit': '已创建 {current}/{max} 个角色',
    'characters.photo.limit': '{current}/{max} 张照片',
    'characters.created': '角色创建成功',
    'characters.updated': '角色更新成功',
    'characters.deleted': '角色已删除',
    'characters.photo.uploaded': '照片上传成功',
    'characters.photo.deleted': '照片已删除',
    'characters.select': '选择角色',
    'characters.select.title': '选择角色',
    'characters.select.desc': '选择一个已创建的角色，AI 将使用其照片进行锁脸生成',
    'characters.login.required': '请先登录后创建角色',
    'characters.empty.notice': '你还没有创建角色',
    'characters.empty.notice.hint': '创建角色并上传照片后，即可使用锁脸功能生成图片',
    'characters.required': '请先选择一个角色',
    'characters.no.photos': '所选角色没有照片，请先上传照片',
    
    // Common
    'common.cancel': '取消',
    'common.save': '保存',
    'common.delete': '删除',
    'common.edit': '编辑',
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
  // 页面入场动画
  initPageAnimations();
  
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

// 页面入场动画
function initPageAnimations() {
  // 给各个 section 添加渐入动画
  const sections = document.querySelectorAll('section');
  sections.forEach((section, index) => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    
    setTimeout(() => {
      section.style.opacity = '1';
      section.style.transform = 'translateY(0)';
    }, 100 + index * 120);
  });
  
  // 头部动画
  const header = document.querySelector('header');
  if (header) {
    header.style.opacity = '0';
    header.style.transform = 'translateY(-20px)';
    header.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    setTimeout(() => {
      header.style.opacity = '1';
      header.style.transform = 'translateY(0)';
    }, 50);
  }
}

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
  
  grid.innerHTML = filteredTemplates.map((template, index) => `
    <div class="template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}" 
         data-template-id="${template.id}"
         onclick="selectTemplate('${template.id}')"
         style="animation: cardFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.06}s both;">
      <img src="${template.thumbnail}" alt="${template.name[currentLang]}" loading="lazy" />
      <div class="template-card-info">
        <div class="template-card-name">${template.name[currentLang]}</div>
        <div class="template-card-desc">${template.description[currentLang]}</div>
      </div>
    </div>
  `).join('');
  
  // 添加动画样式（如果尚未添加）
  if (!document.getElementById('cardAnimationStyle')) {
    const style = document.createElement('style');
    style.id = 'cardAnimationStyle';
    style.textContent = `
      @keyframes cardFadeIn {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
    `;
    document.head.appendChild(style);
  }
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

// Toast 提示 - 使用新设计系统
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // 自动移除
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
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

  // 验证角色选择
  if (!currentUser) {
    showToast(t('characters.login.required'), "warning");
    showAuthModal('login');
    return;
  }

  if (!selectedCharacter) {
    showToast(t('characters.required'), "warning");
    document.getElementById('characterSelectGroup')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  if (!selectedCharacter.photos?.length) {
    showToast(t('characters.no.photos'), "warning");
    editCharacter(selectedCharacter.id);
    return;
  }

  // 获取参考图片（角色照片）
  const genReferenceImages = getGenerationReferenceImages();

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
      genReferenceImages,
      selectedAspectRatio,
      selectedResolution,
    );

    if (images.length > 0) {
      displayResults(images);
      saveToHistory(selectedTemplate, selectedModel, images, genReferenceImages);
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
      <button class="btn btn-danger btn-small" onclick="deleteHistoryItem(${record.id})"><i class="ph ph-trash"></i> ${t('history.delete')}</button>
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
    closeAuthModal();
    closeSettingsModal();
    closeCharactersModal();
    closeEditCharacterModal();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      generateImage();
    }
});

// =========================================
// 用户认证系统
// =========================================

// 当前用户状态
let currentUser = null;
let authToken = localStorage.getItem('auth_token');

// 初始化用户状态
async function initAuth() {
  if (authToken) {
    try {
      const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        currentUser = data.user;
        currentUser.planInfo = data.plan;
        updateUserUI();
        // 渲染角色选择器
        renderCharacterSelector();
      } else {
        // Token 无效，清除
        localStorage.removeItem('auth_token');
        authToken = null;
      }
    } catch (e) {
      console.error('Auth check failed:', e);
    }
  }
  updateUserUI();
  renderCharacterSelector();
}

// 更新用户界面
function updateUserUI() {
  const loginBtn = document.getElementById('loginBtn');
  const userDropdown = document.getElementById('userDropdown');
  const userName = document.getElementById('userName');
  const userPlanBadge = document.getElementById('userPlanBadge');
  
  if (currentUser) {
    loginBtn.innerHTML = `<span class="user-avatar-small">${currentUser.nickname?.charAt(0) || '<i class="ph ph-user"></i>'}</span>`;
    loginBtn.onclick = toggleUserDropdown;
    userName.textContent = currentUser.nickname || currentUser.email;
    userPlanBadge.textContent = currentUser.planInfo?.name || t('plan.free');
  } else {
    loginBtn.innerHTML = `<i class="ph ph-user"></i><span data-i18n="auth.login">${t('auth.login')}</span>`;
    loginBtn.onclick = () => showAuthModal('login');
    userDropdown.style.display = 'none';
  }
}

// 切换用户下拉菜单
function toggleUserDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('userDropdown');
  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

// 点击外部关闭下拉菜单
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('userDropdown');
  const userMenu = document.getElementById('userMenu');
  if (dropdown && !userMenu.contains(e.target)) {
    dropdown.style.display = 'none';
  }
});

// 显示认证弹窗
function showAuthModal(type = 'login') {
  const modal = document.getElementById('authModal');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  switchAuthForm(type);
}

// 关闭认证弹窗
function closeAuthModal() {
  const modal = document.getElementById('authModal');
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

// 切换登录/注册表单
function switchAuthForm(type) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (type === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  }
}

// 处理登录
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const submitBtn = document.getElementById('loginSubmitBtn');
  
  submitBtn.disabled = true;
  submitBtn.textContent = '登录中...';
  
  try {
    const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentUser = data.user;
      currentUser.planInfo = data.plan;
      authToken = data.token;
      localStorage.setItem('auth_token', authToken);
      
      closeAuthModal();
      updateUserUI();
      renderCharacterSelector();
      showToast(t('auth.login.success').replace('{name}', currentUser.nickname), 'success');
    } else {
      showToast(data.error || '登录失败', 'error');
    }
  } catch (e) {
    showToast('网络错误，请重试', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = t('auth.login.submit');
  }
}

// 处理注册
async function handleRegister(e) {
  e.preventDefault();
  
  const email = document.getElementById('registerEmail').value;
  const nickname = document.getElementById('registerNickname').value;
  const password = document.getElementById('registerPassword').value;
  const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
  const submitBtn = document.getElementById('registerSubmitBtn');
  
  if (password !== passwordConfirm) {
    showToast(t('auth.password.mismatch'), 'error');
    return;
  }
  
  submitBtn.disabled = true;
  submitBtn.textContent = '注册中...';
  
  try {
    const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nickname })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentUser = data.user;
      currentUser.planInfo = data.plan;
      authToken = data.token;
      localStorage.setItem('auth_token', authToken);
      
      closeAuthModal();
      updateUserUI();
      renderCharacterSelector();
      showToast(t('auth.register.success').replace('{name}', currentUser.nickname), 'success');
    } else {
      showToast(data.error || '注册失败', 'error');
    }
  } catch (e) {
    showToast('网络错误，请重试', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = t('auth.register.submit');
  }
}

// 退出登录
function logout() {
  currentUser = null;
  authToken = null;
  selectedCharacter = null;
  userCharacters = [];
  localStorage.removeItem('auth_token');
  document.getElementById('userDropdown').style.display = 'none';
  updateUserUI();
  renderCharacterSelector();
  showToast(t('auth.logout.success'), 'info');
}

// 显示设置弹窗
function showSettingsModal() {
  if (!currentUser) return;
  
  document.getElementById('userDropdown').style.display = 'none';
  const modal = document.getElementById('settingsModal');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  
  // 填充当前信息
  document.getElementById('settingsNickname').value = currentUser.nickname || '';
  document.getElementById('settingsPlanBadge').textContent = currentUser.planInfo?.name || t('plan.free');
  document.getElementById('settingsPlanLimits').textContent = 
    t('plan.limits')
      .replace('{characters}', currentUser.planInfo?.maxCharacters || 1)
      .replace('{photos}', currentUser.planInfo?.maxPhotosPerCharacter || 3);
}

// 关闭设置弹窗
function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

// 更新个人资料
async function handleUpdateProfile(e) {
  e.preventDefault();
  
  const nickname = document.getElementById('settingsNickname').value;
  
  try {
    const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/auth/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ nickname })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      currentUser = { ...currentUser, ...data.user };
      updateUserUI();
      showToast(t('settings.update.success'), 'success');
    } else {
      showToast(data.error || '更新失败', 'error');
    }
  } catch (e) {
    showToast('网络错误，请重试', 'error');
  }
}

// 修改密码
async function handleChangePassword(e) {
  e.preventDefault();
  
  const oldPassword = document.getElementById('oldPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  
  try {
    const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      document.getElementById('oldPassword').value = '';
      document.getElementById('newPassword').value = '';
      showToast(t('settings.password.success'), 'success');
    } else {
      showToast(data.error || '修改失败', 'error');
    }
  } catch (e) {
    showToast('网络错误，请重试', 'error');
  }
}

// =========================================
// 角色管理系统
// =========================================

let userCharacters = [];
let characterLimits = { maxCharacters: 1, maxPhotosPerCharacter: 3, currentCount: 0 };
let currentEditingCharacter = null;

// 显示角色管理弹窗
async function showCharactersModal() {
  if (!currentUser) {
    showAuthModal('login');
    return;
  }
  
  document.getElementById('userDropdown').style.display = 'none';
  const modal = document.getElementById('charactersModal');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
  
  await loadCharacters();
}

// 关闭角色管理弹窗
function closeCharactersModal() {
  const modal = document.getElementById('charactersModal');
  modal.classList.remove('show');
  document.body.style.overflow = '';
}

// 加载用户的角色
async function loadCharacters() {
  const grid = document.getElementById('charactersGrid');
  const limitText = document.getElementById('charactersLimit');
  const addBtn = document.getElementById('addCharacterBtn');
  
  grid.innerHTML = '<div class="loading-text">加载中...</div>';
  
  try {
    const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/characters`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (!response.ok) throw new Error('Failed to load');
    
    const data = await response.json();
    userCharacters = data.characters;
    characterLimits = data.limits;
    
    // 更新限制提示
    limitText.textContent = t('characters.limit')
      .replace('{current}', characterLimits.currentCount)
      .replace('{max}', characterLimits.maxCharacters);
    
    // 添加按钮状态
    addBtn.disabled = characterLimits.currentCount >= characterLimits.maxCharacters;
    
    renderCharacters();
  } catch (e) {
    console.error('Load characters error:', e);
    grid.innerHTML = '<div class="empty-characters"><p>加载失败，请重试</p></div>';
  }
}

// 渲染角色列表
function renderCharacters() {
  const grid = document.getElementById('charactersGrid');
  
  if (userCharacters.length === 0) {
    grid.innerHTML = `
      <div class="empty-characters" style="grid-column: 1 / -1;">
        <div class="empty-characters-icon"><i class="ph ph-masks-theater"></i></div>
        <p>${t('characters.empty')}</p>
        <p style="font-size: 0.85rem; color: var(--text-muted);">${t('characters.empty.hint')}</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = userCharacters.map((char, index) => {
    const firstPhoto = char.photos?.[0];
    const avatarContent = firstPhoto 
      ? `<img src="data:${firstPhoto.mimeType};base64,${firstPhoto.data}" alt="${char.name}" />`
      : '<i class="ph ph-user"></i>';
    
    return `
      <div class="character-card" data-id="${char.id}" 
           style="animation: cardFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08}s both;">
        <div class="character-avatar">${avatarContent}</div>
        <div class="character-name">${escapeHtml(char.name)}</div>
        <div class="character-meta">${char.photos?.length || 0} 张照片</div>
        <div class="character-actions">
          <button class="btn-edit-char" onclick="editCharacter('${char.id}')"><i class="ph ph-pencil-simple"></i> ${t('common.edit')}</button>
          <button class="btn-delete-char" onclick="deleteCharacter('${char.id}')"><i class="ph ph-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

// 显示添加角色表单
function showAddCharacterForm() {
  currentEditingCharacter = null;
  
  document.getElementById('editCharacterTitle').innerHTML = `<i class="ph ph-plus"></i> <span>${t('characters.add')}</span>`;
  document.getElementById('characterId').value = '';
  document.getElementById('characterName').value = '';
  document.getElementById('characterDesc').value = '';
  document.getElementById('characterPhotosSection').style.display = 'none';
  
  const modal = document.getElementById('editCharacterModal');
  modal.classList.add('show');
}

// 编辑角色
function editCharacter(characterId) {
  const character = userCharacters.find(c => c.id === characterId);
  if (!character) return;
  
  currentEditingCharacter = character;
  
  document.getElementById('editCharacterTitle').innerHTML = `<i class="ph ph-pencil-simple"></i> <span>${t('characters.edit')}</span>`;
  document.getElementById('characterId').value = character.id;
  document.getElementById('characterName').value = character.name;
  document.getElementById('characterDesc').value = character.description || '';
  
  // 显示照片管理区域
  document.getElementById('characterPhotosSection').style.display = 'block';
  renderCharacterPhotos();
  
  const modal = document.getElementById('editCharacterModal');
  modal.classList.add('show');
}

// 渲染角色照片
function renderCharacterPhotos() {
  const grid = document.getElementById('characterPhotosGrid');
  const limitText = document.getElementById('photoLimitText');
  
  if (!currentEditingCharacter) {
    grid.innerHTML = '';
    return;
  }
  
  const photos = currentEditingCharacter.photos || [];
  limitText.textContent = t('characters.photo.limit')
    .replace('{current}', photos.length)
    .replace('{max}', characterLimits.maxPhotosPerCharacter);
  
  if (photos.length === 0) {
    grid.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">暂无照片</p>';
    return;
  }
  
  grid.innerHTML = photos.map(photo => `
    <div class="character-photo-item">
      <img src="data:${photo.mimeType};base64,${photo.data}" alt="Photo" />
      <button class="photo-delete-btn" onclick="deleteCharacterPhoto('${photo.id}')" title="删除"><i class="ph ph-x"></i></button>
    </div>
  `).join('');
}

// 关闭编辑角色弹窗
function closeEditCharacterModal() {
  const modal = document.getElementById('editCharacterModal');
  modal.classList.remove('show');
  currentEditingCharacter = null;
}

// 保存角色
async function handleSaveCharacter(e) {
  e.preventDefault();
  
  const characterId = document.getElementById('characterId').value;
  const name = document.getElementById('characterName').value.trim();
  const description = document.getElementById('characterDesc').value.trim();
  
  if (!name) {
    showToast('请输入角色名称', 'error');
    return;
  }
  
  const saveBtn = document.getElementById('saveCharacterBtn');
  saveBtn.disabled = true;
  
  try {
    const url = characterId 
      ? `${DEFAULT_API_ENDPOINT}/api/characters/${characterId}`
      : `${DEFAULT_API_ENDPOINT}/api/characters`;
    
    const response = await fetch(url, {
      method: characterId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ name, description })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      if (characterId) {
        // 更新本地数据
        const index = userCharacters.findIndex(c => c.id === characterId);
        if (index !== -1) {
          userCharacters[index] = { ...userCharacters[index], ...data.character };
        }
        showToast(t('characters.updated'), 'success');
      } else {
        // 添加到本地数据
        userCharacters.push(data.character);
        characterLimits.currentCount++;
        showToast(t('characters.created'), 'success');
        
        // 如果是新建，切换到编辑模式以添加照片
        currentEditingCharacter = data.character;
        document.getElementById('characterId').value = data.character.id;
        document.getElementById('characterPhotosSection').style.display = 'block';
        document.getElementById('editCharacterTitle').innerHTML = `<i class="ph ph-pencil-simple"></i> <span>${t('characters.edit')}</span>`;
        renderCharacterPhotos();
      }
      
      renderCharacters();
      renderCharacterSelector(); // 刷新生成页面的角色选择器
      document.getElementById('charactersLimit').textContent = t('characters.limit')
        .replace('{current}', characterLimits.currentCount)
        .replace('{max}', characterLimits.maxCharacters);
      
      // 只有更新时才关闭弹窗
      if (characterId) {
        closeEditCharacterModal();
      }
    } else {
      showToast(data.error || '保存失败', 'error');
    }
  } catch (e) {
    showToast('网络错误，请重试', 'error');
  } finally {
    saveBtn.disabled = false;
  }
}

// 删除角色
async function deleteCharacter(characterId) {
  if (!confirm('确定要删除这个角色吗？相关照片也会被删除。')) return;
  
  try {
    const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/characters/${characterId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      // 如果删除的是当前选中的角色，清除选择
      if (selectedCharacter?.id === characterId) {
        selectedCharacter = null;
      }
      userCharacters = userCharacters.filter(c => c.id !== characterId);
      characterLimits.currentCount--;
      renderCharacters();
      renderCharacterSelector(); // 刷新生成页面的角色选择器
      document.getElementById('charactersLimit').textContent = t('characters.limit')
        .replace('{current}', characterLimits.currentCount)
        .replace('{max}', characterLimits.maxCharacters);
      document.getElementById('addCharacterBtn').disabled = false;
      showToast(t('characters.deleted'), 'success');
    } else {
      const data = await response.json();
      showToast(data.error || '删除失败', 'error');
    }
  } catch (e) {
    showToast('网络错误，请重试', 'error');
  }
}

// 上传照片
async function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (!file || !currentEditingCharacter) return;
  
  // 重置 input
  e.target.value = '';
  
  // 检查限制
  if (currentEditingCharacter.photos?.length >= characterLimits.maxPhotosPerCharacter) {
    showToast(`最多上传 ${characterLimits.maxPhotosPerCharacter} 张照片`, 'error');
    return;
  }
  
  // 读取文件
  const reader = new FileReader();
  reader.onload = async (event) => {
    const base64 = event.target.result.split(',')[1];
    const mimeType = file.type;
    
    try {
      const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/characters/${currentEditingCharacter.id}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ photoData: base64, mimeType })
      });
      
      if (response.ok) {
        // 重新加载角色数据
        const charResponse = await fetch(`${DEFAULT_API_ENDPOINT}/api/characters/${currentEditingCharacter.id}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (charResponse.ok) {
          const charData = await charResponse.json();
          currentEditingCharacter = charData;
          const index = userCharacters.findIndex(c => c.id === charData.id);
          if (index !== -1) {
            userCharacters[index] = charData;
          }
          // 如果是当前选中的角色，更新选中数据
          if (selectedCharacter?.id === charData.id) {
            selectedCharacter = charData;
          }
          renderCharacterPhotos();
          renderCharacters();
          renderCharacterSelector(); // 刷新生成页面的角色选择器
        }
        showToast(t('characters.photo.uploaded'), 'success');
      } else {
        const data = await response.json();
        showToast(data.error || '上传失败', 'error');
      }
    } catch (e) {
      showToast('网络错误，请重试', 'error');
    }
  };
  reader.readAsDataURL(file);
}

// 删除照片
async function deleteCharacterPhoto(photoId) {
  if (!currentEditingCharacter) return;
  
  try {
    const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/characters/${currentEditingCharacter.id}/photos/${photoId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      currentEditingCharacter.photos = currentEditingCharacter.photos.filter(p => p.id !== photoId);
      const index = userCharacters.findIndex(c => c.id === currentEditingCharacter.id);
      if (index !== -1) {
        userCharacters[index] = currentEditingCharacter;
      }
      // 如果是当前选中的角色，更新选中数据
      if (selectedCharacter?.id === currentEditingCharacter.id) {
        selectedCharacter = currentEditingCharacter;
      }
      renderCharacterPhotos();
      renderCharacters();
      renderCharacterSelector(); // 刷新生成页面的角色选择器
      showToast(t('characters.photo.deleted'), 'success');
    } else {
      const data = await response.json();
      showToast(data.error || '删除失败', 'error');
    }
  } catch (e) {
    showToast('网络错误，请重试', 'error');
  }
}

// =========================================
// 角色选择器（生成页面使用）
// =========================================

let selectedCharacter = null;

// 渲染角色选择器
async function renderCharacterSelector() {
  const loginNotice = document.getElementById('loginRequiredNotice');
  const group = document.getElementById('characterSelectGroup');
  const noCharNotice = document.getElementById('noCharactersNotice');
  const selector = document.getElementById('characterSelector');
  
  // 未登录状态
  if (!currentUser || !authToken) {
    loginNotice.style.display = 'block';
    group.style.display = 'none';
    noCharNotice.style.display = 'none';
    return;
  }
  
  // 已登录，隐藏登录提示
  loginNotice.style.display = 'none';
  
  // 加载角色
  try {
    const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/characters`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      userCharacters = data.characters;
      characterLimits = data.limits;
      
      // 过滤出有照片的角色
      const charactersWithPhotos = userCharacters.filter(c => c.photos?.length > 0);
      
      if (charactersWithPhotos.length === 0) {
        // 没有有照片的角色
        group.style.display = 'none';
        noCharNotice.style.display = 'block';
        selectedCharacter = null;
        return;
      }
      
      // 有角色，显示选择器
      group.style.display = 'block';
      noCharNotice.style.display = 'none';
      
      // 生成选择器内容
      let html = '';
      
      charactersWithPhotos.forEach(char => {
        const firstPhoto = char.photos[0];
        const thumbContent = `<img src="data:${firstPhoto.mimeType};base64,${firstPhoto.data}" alt="${char.name}" />`;
        
        html += `
          <button type="button" class="character-select-btn ${selectedCharacter?.id === char.id ? 'active' : ''}" onclick="selectCharacter('${char.id}')">
            <span class="char-thumb">${thumbContent}</span>
            <span>${escapeHtml(char.name)}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">(${char.photos.length}张照片)</span>
          </button>
        `;
      });
      
      // 添加没有照片的角色提示
      const charactersWithoutPhotos = userCharacters.filter(c => !c.photos?.length);
      if (charactersWithoutPhotos.length > 0) {
        html += `
          <div style="width: 100%; margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">
            💡 还有 ${charactersWithoutPhotos.length} 个角色没有照片，
            <a href="#" onclick="showCharactersModal(); return false;" style="color: var(--accent-primary);">去上传</a>
          </div>
        `;
      }
      
      selector.innerHTML = html;
      
      // 如果之前没有选择角色，自动选择第一个
      if (!selectedCharacter && charactersWithPhotos.length > 0) {
        selectedCharacter = charactersWithPhotos[0];
        document.querySelector('.character-select-btn')?.classList.add('active');
      }
    }
  } catch (e) {
    console.error('Load characters for selector error:', e);
    loginNotice.style.display = 'none';
    group.style.display = 'none';
    noCharNotice.style.display = 'block';
  }
}

// 选择角色
function selectCharacter(characterId) {
  selectedCharacter = userCharacters.find(c => c.id === characterId) || null;
  
  // 更新按钮状态
  document.querySelectorAll('.character-select-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.closest('.character-select-btn')?.classList.add('active');
}

// 获取生成时使用的参考图片
function getGenerationReferenceImages() {
  if (selectedCharacter && selectedCharacter.photos?.length > 0) {
    // 使用角色的照片
    return selectedCharacter.photos.map(photo => ({
      data: photo.data,
      mimeType: photo.mimeType
    }));
  }
  return [];
}

// 页面加载时初始化认证
initAuth();
