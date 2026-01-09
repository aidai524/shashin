// =========================================
// Q版表情包生成器 - Sticker Generator
// =========================================

// 默认后端配置
const DEFAULT_API_ENDPOINT = 'https://iapi.sendto.you';

// Q版表情包专用提示词
// 注意：Gemini/Imagen API 不支持生成真正的透明背景，我们要求纯白背景，后期用算法移除
const STICKER_PROMPT = `为图中人物绘制Q版的LINE风格的半身像表情包，彩色手绘风格，使用6x6布局（共36个表情），涵盖各种各样的常用聊天语句，或是一些有关的娱乐 meme，所有标注为手写简体中文。

重要要求：
1. 【必须】背景必须是纯白色（#FFFFFF），不要有任何渐变、阴影或纹理
2. 【必须】每个表情之间用纯白色区域分隔，确保边界清晰
3. 保持人物面部特征一致
4. 表情要丰富多样，包括开心、难过、生气、惊讶、困惑、得意等
5. 人物和文字不要使用白色，避免与背景混淆

Background must be pure white (#FFFFFF) with no gradients or shadows.`;

// 固定参数设置
const FIXED_SETTINGS = {
    aspectRatio: '1:1',
    model: 'gemini-3-pro-image-preview',
    resolution: '4K',
    quantity: 1
};

// 当前主题
let currentTheme = localStorage.getItem('gemini_theme') || 'light';

// 用户状态
let currentUser = null;
let authToken = localStorage.getItem('auth_token');

// 角色相关
let userCharacters = [];
let characterLimits = { maxCharacters: 1, maxPhotosPerCharacter: 3, currentCount: 0 };
let currentEditingCharacter = null;
let selectedCharacter = null;

// 生成结果
let generatedStickerImage = null;
let splitStickers = [];
let currentModalImage = null;

// 历史记录
let stickerHistory = [];
const HISTORY_STORAGE_KEY = 'sticker_history';
const MAX_HISTORY_ITEMS = 20;

// =========================================
// 初始化
// =========================================
document.addEventListener("DOMContentLoaded", async () => {
    applyTheme();
    initFancySelect();
    await initAuth();
    loadStickerHistory();
    hideInitLoading();
});

function hideInitLoading() {
    const overlay = document.getElementById('initLoadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        setTimeout(() => overlay.remove(), 300);
    }
}

// =========================================
// 主题切换
// =========================================
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('gemini_theme', currentTheme);
    applyTheme();
}

function applyTheme() {
    const html = document.documentElement;
    const themeBtn = document.getElementById('themeSwitchBtn');
    
    html.setAttribute('data-theme', currentTheme);
    
    if (themeBtn) {
        const iconClass = currentTheme === 'dark' ? 'ph-moon' : 'ph-sun';
        themeBtn.innerHTML = `<i class="ph ${iconClass}"></i>`;
    }
    
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.content = currentTheme === 'dark' ? '#0F172A' : '#FAFAFA';
    }
}

// =========================================
// Toast 提示
// =========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

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

// =========================================
// 用户认证系统
// =========================================
function clearAuth() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    
    if (typeof clearUserCache === 'function') clearUserCache();
    if (typeof clearCharactersCache === 'function') clearCharactersCache();
    
    updateUserUI();
    renderCharacterSelector();
}

function handleAuthError(response) {
    if (response.status === 401) {
        clearAuth();
        showToast('登录已过期，请重新登录', 'warning');
        return true;
    }
    return false;
}

async function initAuth() {
    authToken = localStorage.getItem('auth_token');
    
    if (authToken) {
        const cachedUserInfo = typeof getCachedUserInfo === 'function' ? getCachedUserInfo() : null;
        
        if (cachedUserInfo) {
            currentUser = cachedUserInfo;
            updateUserUI();
            renderCharacterSelector();
        }
        
        try {
            const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                currentUser = data.user;
                currentUser.planInfo = data.plan;
                
                if (typeof cacheUserInfo === 'function') {
                    cacheUserInfo(currentUser);
                } else {
                    localStorage.setItem('user_info', JSON.stringify(currentUser));
                }
                
                updateUserUI();
                renderCharacterSelector();
            } else if (response.status === 401) {
                clearAuth();
            }
        } catch (e) {
            console.error('[Auth] Error:', e);
        }
    } else {
        currentUser = null;
        updateUserUI();
        renderCharacterSelector();
    }
}

function updateUserUI() {
    const loginBtn = document.getElementById('loginBtn');
    const userDropdown = document.getElementById('userDropdown');
    const userName = document.getElementById('userName');
    const userPlanBadge = document.getElementById('userPlanBadge');
    
    if (currentUser) {
        loginBtn.innerHTML = `<span class="user-avatar-small">${currentUser.nickname?.charAt(0) || '<i class="ph ph-user"></i>'}</span>`;
        loginBtn.onclick = toggleUserDropdown;
        userName.textContent = currentUser.nickname || currentUser.email;
        userPlanBadge.textContent = currentUser.planInfo?.name || '免费版';
    } else {
        loginBtn.innerHTML = `<i class="ph ph-user"></i><span>登录</span>`;
        loginBtn.onclick = () => showAuthModal('login');
        userDropdown.classList.remove('show');
    }
}

function toggleUserDropdown(e) {
    e.stopPropagation();
    document.getElementById('userDropdown').classList.toggle('show');
}

document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('userDropdown');
    const userMenu = document.getElementById('userMenu');
    if (dropdown && userMenu && !userMenu.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// =========================================
// 认证弹窗
// =========================================
function showAuthModal(type = 'login') {
    document.getElementById('authModal').classList.add('show');
    document.body.style.overflow = 'hidden';
    switchAuthForm(type);
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('show');
    document.body.style.overflow = '';
}

function switchAuthForm(type) {
    document.getElementById('loginForm').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = type === 'register' ? 'block' : 'none';
}

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
            localStorage.setItem('user_info', JSON.stringify(currentUser));
            
            closeAuthModal();
            updateUserUI();
            renderCharacterSelector();
            showToast(`欢迎回来，${currentUser.nickname}！`, 'success');
        } else {
            showToast(data.error || '登录失败', 'error');
        }
    } catch (e) {
        showToast('网络错误，请重试', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '登录';
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const nickname = document.getElementById('registerNickname').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const submitBtn = document.getElementById('registerSubmitBtn');
    
    if (password !== passwordConfirm) {
        showToast('两次输入的密码不一致', 'error');
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
            localStorage.setItem('user_info', JSON.stringify(currentUser));
            
            closeAuthModal();
            updateUserUI();
            renderCharacterSelector();
            showToast(`注册成功！欢迎，${currentUser.nickname}！`, 'success');
        } else {
            showToast(data.error || '注册失败', 'error');
        }
    } catch (e) {
        showToast('网络错误，请重试', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '注册';
    }
}

function logout() {
    currentUser = null;
    authToken = null;
    selectedCharacter = null;
    userCharacters = [];
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    document.getElementById('userDropdown').classList.remove('show');
    updateUserUI();
    renderCharacterSelector();
    showToast('已退出登录', 'info');
}

// =========================================
// 角色管理
// =========================================
async function showCharactersModal() {
    if (!currentUser) {
        showAuthModal('login');
        return;
    }
    
    document.getElementById('userDropdown').classList.remove('show');
    document.getElementById('charactersModal').classList.add('show');
    document.body.style.overflow = 'hidden';
    
    await loadCharacters();
}

function closeCharactersModal() {
    document.getElementById('charactersModal').classList.remove('show');
    document.body.style.overflow = '';
}

async function loadCharacters(forceRefresh = false) {
    const grid = document.getElementById('charactersGrid');
    const limitText = document.getElementById('charactersLimit');
    const addBtn = document.getElementById('addCharacterBtn');
    
    if (!forceRefresh && typeof getCachedCharacters === 'function') {
        const cached = getCachedCharacters();
        if (cached) {
            userCharacters = cached.characters;
            characterLimits = cached.limits;
            limitText.textContent = `已创建 ${characterLimits.currentCount}/${characterLimits.maxCharacters} 个角色`;
            addBtn.disabled = characterLimits.currentCount >= characterLimits.maxCharacters;
            renderCharacters();
            loadCharactersFromServer(false);
            return;
        }
    }
    
    grid.innerHTML = '<div class="loading-text">加载中...</div>';
    await loadCharactersFromServer(true);
}

async function loadCharactersFromServer(showLoading = true) {
    const grid = document.getElementById('charactersGrid');
    const limitText = document.getElementById('charactersLimit');
    const addBtn = document.getElementById('addCharacterBtn');
    
    try {
        const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/characters`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (handleAuthError(response)) return;
        if (!response.ok) throw new Error('Failed to load');
        
        const data = await response.json();
        userCharacters = data.characters;
        characterLimits = data.limits;
        
        if (typeof cacheCharacters === 'function') {
            cacheCharacters(data.characters, data.limits);
        }
        
        limitText.textContent = `已创建 ${characterLimits.currentCount}/${characterLimits.maxCharacters} 个角色`;
        addBtn.disabled = characterLimits.currentCount >= characterLimits.maxCharacters;
        
        renderCharacters();
    } catch (e) {
        console.error('[Characters] Load error:', e);
        if (showLoading) {
            grid.innerHTML = '<div class="empty-characters"><p>加载失败，请重试</p></div>';
        }
    }
}

function renderCharacters() {
    const grid = document.getElementById('charactersGrid');
    
    if (userCharacters.length === 0) {
        grid.innerHTML = `
            <div class="empty-characters" style="grid-column: 1 / -1;">
                <div class="empty-characters-icon"><i class="ph ph-masks-theater"></i></div>
                <p>还没有角色</p>
                <p style="font-size: 0.85rem; color: var(--text-muted);">创建角色并上传照片，即可使用锁脸功能</p>
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
                <div class="character-card-thumb">${avatarContent}</div>
                <div class="character-card-info">
                    <div class="character-card-name">${escapeHtml(char.name)}</div>
                    <div class="character-card-meta">${char.photos?.length || 0} 张照片</div>
                </div>
                <div class="character-card-actions">
                    <button onclick="editCharacter('${char.id}')"><i class="ph ph-pencil-simple"></i></button>
                    <button class="delete-btn" onclick="deleteCharacter('${char.id}')"><i class="ph ph-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

// =========================================
// 角色编辑
// =========================================
function showAddCharacterForm() {
    currentEditingCharacter = null;
    
    document.getElementById('editCharacterTitle').innerHTML = `<i class="ph ph-plus"></i> <span>添加角色</span>`;
    document.getElementById('characterId').value = '';
    resetFancySelect();
    document.getElementById('characterDesc').value = '';
    document.getElementById('characterPhotosSection').style.display = 'none';
    
    document.getElementById('editCharacterModal').classList.add('show');
}

function editCharacter(characterId) {
    const character = userCharacters.find(c => c.id === characterId);
    if (!character) return;
    
    currentEditingCharacter = character;
    
    document.getElementById('editCharacterTitle').innerHTML = `<i class="ph ph-pencil-simple"></i> <span>编辑角色</span>`;
    document.getElementById('characterId').value = character.id;
    setFancySelectValue(character.name);
    document.getElementById('characterDesc').value = character.description || '';
    
    document.getElementById('characterPhotosSection').style.display = 'block';
    renderCharacterPhotos();
    
    document.getElementById('editCharacterModal').classList.add('show');
}

function closeEditCharacterModal() {
    document.getElementById('editCharacterModal').classList.remove('show');
    currentEditingCharacter = null;
}

function renderCharacterPhotos() {
    const grid = document.getElementById('characterPhotosGrid');
    const limitText = document.getElementById('photoLimitText');
    
    if (!currentEditingCharacter) {
        grid.innerHTML = '';
        return;
    }
    
    const photos = currentEditingCharacter.photos || [];
    limitText.textContent = `${photos.length}/${characterLimits.maxPhotosPerCharacter} 张照片`;
    
    if (photos.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">暂无照片</p>';
        return;
    }
    
    grid.innerHTML = photos.map((photo) => `
        <div class="character-photo-item">
            <img src="data:${photo.mimeType};base64,${photo.data}" alt="Photo" />
            <button class="photo-delete-btn" onclick="deleteCharacterPhoto('${photo.id}')" title="删除">
                <i class="ph ph-trash"></i>
            </button>
        </div>
    `).join('');
}

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
        
        if (handleAuthError(response)) {
            saveBtn.disabled = false;
            return;
        }
        
        if (response.ok) {
            if (characterId) {
                const index = userCharacters.findIndex(c => c.id === characterId);
                if (index !== -1) {
                    userCharacters[index] = { ...userCharacters[index], ...data.character };
                }
                showToast('角色更新成功', 'success');
            } else {
                userCharacters.push(data.character);
                characterLimits.currentCount++;
                showToast('角色创建成功', 'success');
                
                currentEditingCharacter = data.character;
                document.getElementById('characterId').value = data.character.id;
                document.getElementById('characterPhotosSection').style.display = 'block';
                document.getElementById('editCharacterTitle').innerHTML = `<i class="ph ph-pencil-simple"></i> <span>编辑角色</span>`;
                renderCharacterPhotos();
            }
            
            renderCharacters();
            renderCharacterSelector();
            document.getElementById('charactersLimit').textContent = `已创建 ${characterLimits.currentCount}/${characterLimits.maxCharacters} 个角色`;
            
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

async function deleteCharacter(characterId) {
    if (!confirm('确定要删除这个角色吗？相关照片也会被删除。')) return;
    
    try {
        const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/characters/${characterId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (handleAuthError(response)) return;
        
        if (response.ok) {
            if (selectedCharacter?.id === characterId) {
                selectedCharacter = null;
            }
            userCharacters = userCharacters.filter(c => c.id !== characterId);
            characterLimits.currentCount--;
            renderCharacters();
            renderCharacterSelector();
            document.getElementById('charactersLimit').textContent = `已创建 ${characterLimits.currentCount}/${characterLimits.maxCharacters} 个角色`;
            document.getElementById('addCharacterBtn').disabled = false;
            showToast('角色已删除', 'success');
        } else {
            const data = await response.json();
            showToast(data.error || '删除失败', 'error');
        }
    } catch (e) {
        showToast('网络错误，请重试', 'error');
    }
}

// =========================================
// 照片上传
// =========================================
async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file || !currentEditingCharacter) return;
    
    e.target.value = '';
    
    if (currentEditingCharacter.photos?.length >= characterLimits.maxPhotosPerCharacter) {
        showToast(`最多上传 ${characterLimits.maxPhotosPerCharacter} 张照片`, 'error');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showToast('请上传图片文件', 'error');
        return;
    }
    
    try {
        showToast('正在处理图片...', 'info');
        
        const thumbnail = await compressCharacterPhoto(file);
        const original = await compressImageForDownload(file);
        
        const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/characters/${currentEditingCharacter.id}/photos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ 
                photoData: thumbnail.base64,
                originalData: original.base64,
                mimeType: thumbnail.mimeType,
                thumbnailSize: thumbnail.compressedSize,
                originalSize: original.compressedSize
            })
        });
        
        if (handleAuthError(response)) return;
        
        if (response.ok) {
            const charResponse = await fetch(`${DEFAULT_API_ENDPOINT}/api/characters/${currentEditingCharacter.id}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (handleAuthError(charResponse)) return;
            if (charResponse.ok) {
                const charData = await charResponse.json();
                currentEditingCharacter = charData;
                const index = userCharacters.findIndex(c => c.id === charData.id);
                if (index !== -1) {
                    userCharacters[index] = charData;
                }
                if (selectedCharacter?.id === charData.id) {
                    selectedCharacter = charData;
                }
                renderCharacterPhotos();
                renderCharacters();
                renderCharacterSelector();
            }
            showToast('照片上传成功', 'success');
        } else {
            const data = await response.json();
            showToast(data.error || '上传失败', 'error');
        }
    } catch (e) {
        console.error('[Upload] Error:', e);
        showToast('上传失败，请重试', 'error');
    }
}

async function deleteCharacterPhoto(photoId) {
    if (!currentEditingCharacter) return;
    
    if (!confirm('确定要删除这张照片吗？')) return;
    
    try {
        const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/characters/${currentEditingCharacter.id}/photos/${photoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (handleAuthError(response)) return;
        
        if (response.ok) {
            const reloadResponse = await fetch(`${DEFAULT_API_ENDPOINT}/api/characters/${currentEditingCharacter.id}`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            if (reloadResponse.ok) {
                const updatedCharacter = await reloadResponse.json();
                const index = userCharacters.findIndex(c => c.id === currentEditingCharacter.id);
                if (index !== -1) {
                    userCharacters[index] = updatedCharacter;
                }
                currentEditingCharacter = updatedCharacter;
                if (selectedCharacter?.id === currentEditingCharacter.id) {
                    selectedCharacter = updatedCharacter;
                }
                renderCharacterPhotos();
                renderCharacters();
                renderCharacterSelector();
                showToast('照片已删除', 'success');
            }
        } else {
            const data = await response.json();
            showToast(data.error || '删除失败', 'error');
        }
    } catch (e) {
        showToast('网络错误，请重试', 'error');
    }
}

// =========================================
// 图片压缩工具
// =========================================
async function compressCharacterPhoto(file) {
    const MAX_RESOLUTION = 1024;
    const MAX_SIZE_KB = 500;
    const MAX_SIZE_BYTES = MAX_SIZE_KB * 1024;
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > MAX_RESOLUTION || height > MAX_RESOLUTION) {
                        if (width > height) {
                            height = Math.round((height * MAX_RESOLUTION) / width);
                            width = MAX_RESOLUTION;
                        } else {
                            width = Math.round((width * MAX_RESOLUTION) / height);
                            height = MAX_RESOLUTION;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    let quality = 0.90;
                    let compressedBase64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];
                    let compressedSize = Math.ceil(compressedBase64.length * 0.75);
                    
                    while (compressedSize > MAX_SIZE_BYTES && quality > 0.5) {
                        quality -= 0.05;
                        compressedBase64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];
                        compressedSize = Math.ceil(compressedBase64.length * 0.75);
                    }
                    
                    resolve({
                        base64: compressedBase64,
                        mimeType: 'image/jpeg',
                        compressedSize: compressedSize
                    });
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function compressImageForDownload(file) {
    const MAX_SIZE_MB = 2;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    
    if (file.size <= MAX_SIZE_BYTES) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64 = e.target.result.split(',')[1];
                resolve({
                    base64: base64,
                    mimeType: file.type,
                    compressedSize: file.size
                });
            };
            reader.readAsDataURL(file);
        });
    }
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    let quality = 0.95;
                    let compressedBase64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];
                    let compressedSize = Math.ceil(compressedBase64.length * 0.75);
                    
                    while (compressedSize > MAX_SIZE_BYTES && quality > 0.7) {
                        quality -= 0.05;
                        compressedBase64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];
                        compressedSize = Math.ceil(compressedBase64.length * 0.75);
                    }
                    
                    resolve({
                        base64: compressedBase64,
                        mimeType: 'image/jpeg',
                        compressedSize: compressedSize
                    });
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// =========================================
// 自定义下拉组件
// =========================================
function toggleFancySelect() {
    document.getElementById('characterSelect').classList.toggle('open');
}

function selectFancyOption(value) {
    const select = document.getElementById('characterSelect');
    const valueSpan = select.querySelector('.fancy-select-value');
    const hiddenInput = document.getElementById('characterName');
    
    valueSpan.textContent = value;
    valueSpan.classList.remove('placeholder');
    hiddenInput.value = value;
    
    select.querySelectorAll('.fancy-select-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.value === value);
    });
    
    select.classList.remove('open');
}

function resetFancySelect() {
    const select = document.getElementById('characterSelect');
    const valueSpan = select.querySelector('.fancy-select-value');
    const hiddenInput = document.getElementById('characterName');
    
    valueSpan.textContent = '请选择角色';
    valueSpan.classList.add('placeholder');
    hiddenInput.value = '';
    
    select.querySelectorAll('.fancy-select-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    select.classList.remove('open');
}

function setFancySelectValue(value) {
    const select = document.getElementById('characterSelect');
    const valueSpan = select.querySelector('.fancy-select-value');
    const hiddenInput = document.getElementById('characterName');
    
    if (value) {
        valueSpan.textContent = value;
        valueSpan.classList.remove('placeholder');
        hiddenInput.value = value;
        
        select.querySelectorAll('.fancy-select-option').forEach(opt => {
            opt.classList.toggle('selected', opt.dataset.value === value);
        });
    } else {
        resetFancySelect();
    }
}

function initFancySelect() {
    const select = document.getElementById('characterSelect');
    if (!select) return;
    
    select.querySelectorAll('.fancy-select-option').forEach(opt => {
        opt.addEventListener('click', () => {
            selectFancyOption(opt.dataset.value);
        });
    });
    
    document.addEventListener('click', (e) => {
        if (!select.contains(e.target)) {
            select.classList.remove('open');
        }
    });
}

// =========================================
// 角色选择器（生成页面）
// =========================================
async function renderCharacterSelector() {
    const loginNotice = document.getElementById('loginRequiredNotice');
    const group = document.getElementById('characterSelectGroup');
    const noCharNotice = document.getElementById('noCharactersNotice');
    const selector = document.getElementById('characterSelector');
    const generateBtn = document.getElementById('generateBtn');
    
    if (!currentUser || !authToken) {
        loginNotice.style.display = 'block';
        group.style.display = 'none';
        noCharNotice.style.display = 'none';
        generateBtn.disabled = true;
        return;
    }
    
    loginNotice.style.display = 'none';
    
    try {
        const response = await fetch(`${DEFAULT_API_ENDPOINT}/api/characters`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (handleAuthError(response)) return;
        
        if (response.ok) {
            const data = await response.json();
            userCharacters = data.characters;
            characterLimits = data.limits;
            
            const charactersWithPhotos = userCharacters.filter(c => c.photos?.length > 0);
            
            if (charactersWithPhotos.length === 0) {
                group.style.display = 'none';
                noCharNotice.style.display = 'block';
                selectedCharacter = null;
                generateBtn.disabled = true;
                return;
            }
            
            group.style.display = 'block';
            noCharNotice.style.display = 'none';
            
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
            
            if (!selectedCharacter && charactersWithPhotos.length > 0) {
                selectedCharacter = charactersWithPhotos[0];
                document.querySelector('.character-select-btn')?.classList.add('active');
            }
            
            generateBtn.disabled = !selectedCharacter;
        }
    } catch (e) {
        console.error('Load characters for selector error:', e);
        loginNotice.style.display = 'none';
        group.style.display = 'none';
        noCharNotice.style.display = 'block';
        generateBtn.disabled = true;
    }
}

function selectCharacter(characterId) {
    selectedCharacter = userCharacters.find(c => c.id === characterId) || null;
    
    document.querySelectorAll('.character-select-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.character-select-btn')?.classList.add('active');
    
    document.getElementById('generateBtn').disabled = !selectedCharacter;
}

// =========================================
// 表情包生成核心逻辑
// =========================================
async function generateSticker() {
    if (!currentUser) {
        showToast('请先登录', 'warning');
        showAuthModal('login');
        return;
    }

    if (!selectedCharacter) {
        showToast('请先选择一个角色', 'warning');
        return;
    }

    if (!selectedCharacter.photos?.length) {
        showToast('所选角色没有照片，请先上传照片', 'warning');
        editCharacter(selectedCharacter.id);
        return;
    }

    const btn = document.getElementById('generateBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');

    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';
    showLoading();

    try {
        const refImages = selectedCharacter.photos.map(photo => ({
            base64: photo.data,
            mimeType: photo.mimeType
        }));

        const image = await generateWithGemini(refImages);

        if (image) {
            generatedStickerImage = image;
            displayStickerPreview(image);
            updateStepIndicators(2);
            showToast('表情包生成成功！', 'success');
        }
    } catch (error) {
        console.error('Generation failed:', error);
        showToast('生成失败：' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        hideLoading();
    }
}

async function generateWithGemini(refImages) {
    const endpoint = DEFAULT_API_ENDPOINT.replace(/\/$/, '');
    const url = `${endpoint}/v1beta/models/${FIXED_SETTINGS.model}:generateContent`;

    const parts = [];

    // 添加锁脸提示和表情包生成提示
    parts.push({
        text: `Please reference the facial features from the following character images and generate an image that matches the requirements. Maintain consistent facial characteristics, face shape, and key features.\n\nStyle requirement: ${STICKER_PROMPT}`
    });

    // 添加参考图片
    refImages.forEach((img) => {
        parts.push({
            inline_data: {
                mime_type: img.mimeType,
                data: img.base64
            }
        });
    });

    const requestBody = {
        contents: [{ parts: parts }],
        generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
                aspectRatio: FIXED_SETTINGS.aspectRatio,
                imageSize: FIXED_SETTINGS.resolution
            }
        }
    };

    console.log('=== Sticker Generation Request ===');
    console.log('URL:', url);
    console.log('Reference Images:', refImages.length);

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();
    console.log('Response Status:', response.status);

    let data;
    try {
        data = JSON.parse(responseText);
    } catch (e) {
        throw new Error('响应解析失败: ' + responseText.substring(0, 200));
    }

    if (!response.ok) {
        throw new Error(data.error?.message || `请求失败: ${response.status}`);
    }

    if (data.candidates) {
        for (const candidate of data.candidates) {
            if (candidate.content?.parts) {
                for (const part of candidate.content.parts) {
                    if (part.inlineData) {
                        return {
                            base64: part.inlineData.data,
                            mimeType: part.inlineData.mimeType || 'image/png'
                        };
                    }
                }
            }
        }
    }

    throw new Error('未生成图片，请重试');
}

function displayStickerPreview(image) {
    const preview = document.getElementById('stickerPreview');
    const step1 = document.getElementById('step1Section');
    const step2 = document.getElementById('step2Section');
    
    preview.innerHTML = `
        <img src="data:${image.mimeType};base64,${image.base64}" alt="Generated sticker sheet" />
        <div class="sticker-grid-overlay show" id="gridOverlay"></div>
    `;
    
    // 生成6x6网格线
    const gridOverlay = document.getElementById('gridOverlay');
    let gridHtml = '';
    for (let i = 1; i < 6; i++) {
        gridHtml += `<div class="grid-line-h" style="top: ${(i / 6) * 100}%"></div>`;
        gridHtml += `<div class="grid-line-v" style="left: ${(i / 6) * 100}%"></div>`;
    }
    gridOverlay.innerHTML = gridHtml;
    
    step1.style.display = 'none';
    step2.style.display = 'block';
    step2.scrollIntoView({ behavior: 'smooth' });
}

function regenerateSticker() {
    document.getElementById('step1Section').style.display = 'block';
    document.getElementById('step2Section').style.display = 'none';
    document.getElementById('step3Section').style.display = 'none';
    updateStepIndicators(1);
    generatedStickerImage = null;
    splitStickers = [];
}

function startOver() {
    regenerateSticker();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =========================================
// 白色背景移除（将白色/近白色像素转为透明）
// =========================================
function removeWhiteBackground(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // 白色阈值：RGB 值高于此值的像素被视为白色背景
    const threshold = 240;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // 如果像素接近白色，将其设为透明
        if (r >= threshold && g >= threshold && b >= threshold) {
            data[i + 3] = 0; // 设置 alpha 为 0（完全透明）
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

// =========================================
// 切割和下载
// =========================================
async function splitAndDownload() {
    if (!generatedStickerImage) {
        showToast('请先生成表情包', 'warning');
        return;
    }

    const btn = document.getElementById('splitBtn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');

    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline-flex';

    try {
        splitStickers = await splitImageIntoStickers(generatedStickerImage);
        displaySplitStickers(splitStickers);
        updateStepIndicators(3);
        
        // 保存到历史记录
        addToHistory(
            selectedCharacter?.name || '未命名角色',
            generatedStickerImage,
            splitStickers
        );
        
        showToast('切割完成！共 36 个表情，已保存到历史记录', 'success');
    } catch (error) {
        console.error('Split failed:', error);
        showToast('切割失败：' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

async function splitImageIntoStickers(image) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const stickers = [];
                const gridSize = 6;
                
                // 切割偏移量修正（向右偏移10像素）
                const offsetX = 10;
                const offsetY = 0;
                
                // 计算有效区域（去掉偏移后的区域）
                const effectiveWidth = img.width - offsetX;
                const effectiveHeight = img.height - offsetY;
                const stickerWidth = effectiveWidth / gridSize;
                const stickerHeight = effectiveHeight / gridSize;

                for (let row = 0; row < gridSize; row++) {
                    for (let col = 0; col < gridSize; col++) {
                        const canvas = document.createElement('canvas');
                        canvas.width = Math.floor(stickerWidth);
                        canvas.height = Math.floor(stickerHeight);
                        const ctx = canvas.getContext('2d');

                        // 从偏移位置开始切割
                        const srcX = offsetX + col * stickerWidth;
                        const srcY = offsetY + row * stickerHeight;

                        ctx.drawImage(
                            img,
                            srcX,
                            srcY,
                            stickerWidth,
                            stickerHeight,
                            0,
                            0,
                            canvas.width,
                            canvas.height
                        );

                        // 将白色背景转换为透明
                        removeWhiteBackground(ctx, canvas.width, canvas.height);

                        // 使用PNG格式保持透明背景
                        const dataUrl = canvas.toDataURL('image/png');
                        const base64 = dataUrl.split(',')[1];

                        stickers.push({
                            index: row * gridSize + col + 1,
                            base64: base64,
                            mimeType: 'image/png',
                            dataUrl: dataUrl
                        });
                    }
                }

                resolve(stickers);
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = `data:${image.mimeType};base64,${image.base64}`;
    });
}

function displaySplitStickers(stickers) {
    const step2 = document.getElementById('step2Section');
    const step3 = document.getElementById('step3Section');
    const grid = document.getElementById('stickerResultGrid');

    grid.innerHTML = stickers.map((sticker, index) => `
        <div class="sticker-result-item" onclick="previewSticker(${index})" style="animation: fadeInUp 0.3s ease backwards; animation-delay: ${index * 0.02}s">
            <img src="${sticker.dataUrl}" alt="Sticker ${sticker.index}" />
        </div>
    `).join('');

    step2.style.display = 'none';
    step3.style.display = 'block';
    step3.scrollIntoView({ behavior: 'smooth' });
}

function previewSticker(index) {
    const sticker = splitStickers[index];
    if (!sticker) return;

    currentModalImage = {
        base64: sticker.base64,
        mimeType: sticker.mimeType,
        index: sticker.index
    };

    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    modalImg.src = sticker.dataUrl;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('imageModal').classList.remove('show');
    document.body.style.overflow = '';
    currentModalImage = null;
}

function downloadCurrentImage() {
    if (!currentModalImage) return;

    const link = document.createElement('a');
    link.href = `data:${currentModalImage.mimeType};base64,${currentModalImage.base64}`;
    link.download = `sticker-${currentModalImage.index || Date.now()}.png`;
    link.click();

    showToast('下载开始！', 'success');
}

async function downloadAllStickers() {
    if (splitStickers.length === 0) {
        showToast('没有可下载的表情包', 'warning');
        return;
    }

    const btn = document.getElementById('downloadAllBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-spinner"></i> 打包中...';

    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    progressBar.style.display = 'block';

    try {
        const zip = new JSZip();
        const folder = zip.folder('q-stickers');

        for (let i = 0; i < splitStickers.length; i++) {
            const sticker = splitStickers[i];
            const paddedIndex = String(sticker.index).padStart(2, '0');
            folder.file(`sticker-${paddedIndex}.png`, sticker.base64, { base64: true });

            // 更新进度
            const progress = ((i + 1) / splitStickers.length) * 100;
            progressFill.style.width = `${progress}%`;
        }

        const content = await zip.generateAsync({ type: 'blob' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `q-stickers-${selectedCharacter?.name || 'pack'}-${Date.now()}.zip`;
        link.click();

        URL.revokeObjectURL(link.href);
        showToast('表情包已打包下载！', 'success');
    } catch (error) {
        console.error('Download failed:', error);
        showToast('打包失败：' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="ph ph-download-simple"></i> 下载全部表情包 (ZIP)';
        progressBar.style.display = 'none';
        progressFill.style.width = '0%';
    }
}

// =========================================
// UI 辅助函数
// =========================================
function updateStepIndicators(activeStep) {
    const steps = [
        document.getElementById('step1Indicator'),
        document.getElementById('step2Indicator'),
        document.getElementById('step3Indicator')
    ];

    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index + 1 < activeStep) {
            step.classList.add('completed');
        } else if (index + 1 === activeStep) {
            step.classList.add('active');
        }
    });
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
    document.body.style.overflow = '';
}

// =========================================
// 键盘事件
// =========================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeAuthModal();
        closeCharactersModal();
        closeEditCharacterModal();
    }
});

// =========================================
// 历史记录功能
// =========================================

// 加载历史记录
function loadStickerHistory() {
    try {
        const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
        stickerHistory = stored ? JSON.parse(stored) : [];
        renderStickerHistory();
    } catch (e) {
        console.error('[History] Load error:', e);
        stickerHistory = [];
        renderStickerHistory();
    }
}

// 保存历史记录到本地存储
function saveStickerHistory() {
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(stickerHistory));
    } catch (e) {
        console.error('[History] Save error:', e);
        // 如果存储空间不足，删除最旧的记录
        if (stickerHistory.length > 1) {
            stickerHistory.pop();
            saveStickerHistory();
        }
    }
}

// 添加到历史记录
function addToHistory(characterName, largeImage, stickers) {
    const historyItem = {
        id: Date.now().toString(),
        characterName: characterName,
        createdAt: new Date().toISOString(),
        // 保存大图的缩略图（压缩版本）
        thumbnail: createThumbnail(largeImage),
        // 保存切割后的表情包
        stickers: stickers.map(s => ({
            index: s.index,
            base64: s.base64,
            mimeType: s.mimeType
        }))
    };

    // 添加到开头
    stickerHistory.unshift(historyItem);

    // 限制最大数量
    if (stickerHistory.length > MAX_HISTORY_ITEMS) {
        stickerHistory = stickerHistory.slice(0, MAX_HISTORY_ITEMS);
    }

    saveStickerHistory();
    renderStickerHistory();
}

// 创建缩略图
function createThumbnail(image) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    // 同步创建缩略图
    canvas.width = 200;
    canvas.height = 200;
    
    // 返回原图的压缩版本（用于显示）
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = 200;
    tempCanvas.height = 200;
    
    const tempImg = new Image();
    tempImg.src = `data:${image.mimeType};base64,${image.base64}`;
    
    // 由于是同步操作，我们直接返回原图的 base64（会在渲染时压缩显示）
    return {
        base64: image.base64.substring(0, 50000), // 截取部分作为缩略图
        mimeType: image.mimeType
    };
}

// 渲染历史记录
function renderStickerHistory() {
    const grid = document.getElementById('historyGrid');
    const empty = document.getElementById('historyEmpty');

    if (!grid) return;

    if (stickerHistory.length === 0) {
        grid.style.display = 'none';
        empty.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';

    grid.innerHTML = stickerHistory.map((item, index) => {
        const date = new Date(item.createdAt);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        const stickerCount = item.stickers?.length || 36;

        // 使用第一个表情作为缩略图
        const thumbSrc = item.stickers?.[0] 
            ? `data:${item.stickers[0].mimeType};base64,${item.stickers[0].base64}`
            : '';

        return `
            <div class="history-item" style="animation: fadeInUp 0.3s ease backwards; animation-delay: ${index * 0.05}s">
                <div class="history-item-thumb">
                    ${thumbSrc ? `<img src="${thumbSrc}" alt="Sticker pack" />` : '<i class="ph ph-image" style="font-size: 2rem; color: var(--text-muted);"></i>'}
                </div>
                <div class="history-item-info">
                    <div class="history-item-name">${escapeHtml(item.characterName || '未命名')}</div>
                    <div class="history-item-date">${dateStr} · ${stickerCount}个表情</div>
                </div>
                <div class="history-item-actions">
                    <button class="btn-download" onclick="downloadHistoryItem('${item.id}')">
                        <i class="ph ph-download-simple"></i> 下载
                    </button>
                    <button class="btn-delete" onclick="deleteHistoryItem('${item.id}')">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 下载历史记录中的表情包
async function downloadHistoryItem(itemId) {
    const item = stickerHistory.find(h => h.id === itemId);
    if (!item || !item.stickers?.length) {
        showToast('表情包数据不完整', 'error');
        return;
    }

    showToast('正在打包下载...', 'info');

    try {
        const zip = new JSZip();
        const folder = zip.folder('q-stickers');

        item.stickers.forEach((sticker) => {
            const paddedIndex = String(sticker.index).padStart(2, '0');
            folder.file(`sticker-${paddedIndex}.png`, sticker.base64, { base64: true });
        });

        const content = await zip.generateAsync({ type: 'blob' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `q-stickers-${item.characterName || 'pack'}-${item.id}.zip`;
        link.click();

        URL.revokeObjectURL(link.href);
        showToast('下载完成！', 'success');
    } catch (error) {
        console.error('[History] Download error:', error);
        showToast('下载失败：' + error.message, 'error');
    }
}

// 删除历史记录
function deleteHistoryItem(itemId) {
    if (!confirm('确定要删除这个表情包吗？')) return;

    stickerHistory = stickerHistory.filter(h => h.id !== itemId);
    saveStickerHistory();
    renderStickerHistory();
    showToast('已删除', 'success');
}
