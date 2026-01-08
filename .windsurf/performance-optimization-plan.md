# 全站性能优化计划

## 背景
用户反馈页面加载较慢，每次刷新都需要重新加载数据，特别是角色图片资源。需要从缓存、第三方服务和整体性能三个维度进行优化。

---

## 一、前端缓存优化

### 1.1 用户状态缓存优化
**现状问题：**
- 每次刷新页面都重新请求用户信息
- 登录状态验证耗时较长
- 角色列表数据没有本地缓存

**优化方案：**
```javascript
// 实现用户数据缓存策略
const CACHE_KEYS = {
  USER_INFO: 'cache:user_info',
  CHARACTERS: 'cache:characters',
  CACHE_TIME: 'cache:timestamp'
};

const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 缓存用户信息
function cacheUserData(user) {
  localStorage.setItem(CACHE_KEYS.USER_INFO, JSON.stringify(user));
  localStorage.setItem(CACHE_KEYS.CACHE_TIME, Date.now().toString());
}

// 获取缓存的用户信息
function getCachedUserData() {
  const cacheTime = parseInt(localStorage.getItem(CACHE_KEYS.CACHE_TIME) || '0');
  if (Date.now() - cacheTime > CACHE_DURATION) {
    return null; // 缓存过期
  }
  const cached = localStorage.getItem(CACHE_KEYS.USER_INFO);
  return cached ? JSON.parse(cached) : null;
}
```

**实施步骤：**
1. 在 `app.js` 中实现缓存工具函数
2. 修改 `checkAuth()` 函数，优先使用缓存数据
3. 后台异步验证 token 有效性
4. 缓存角色列表数据（带时间戳）

**预期效果：**
- 页面刷新时立即显示缓存的用户信息
- 减少 50% 的 API 请求
- 首屏加载时间减少 1-2 秒

---

### 1.2 R2 图片缩略图处理（重要优化）
**现状问题：**
- 所有预览场景都加载原始 4K 图片
- 角色列表、历史记录等场景不需要高清图
- 图片传输耗时长，占用大量带宽

**核心原则：**
> 除了最终下载时使用原始 4K 图片，其他所有预览和加载场景都使用缩略图（最大边 1024px）

**使用场景分类：**

| 场景 | 图片类型 | 最大尺寸 | 说明 |
|------|---------|---------|------|
| 角色列表头像 | 缩略图 | 200x200 | 极小尺寸，快速加载 |
| 角色编辑-参考照片 | 缩略图 | 1024px | 预览用，无需高清 |
| 历史记录列表 | 缩略图 | 400x400 | 网格展示 |
| 历史记录预览 | 缩略图 | 1024px | 弹窗预览 |
| 图片生成预览 | 缩略图 | 1024px | 实时预览 |
| 图片下载 | **原图** | 4K | 唯一使用原图的场景 |

**R2 缩略图实现方案：**

Cloudflare R2 支持通过 URL 参数动态生成缩略图：

```javascript
// 后端实现（src/index.js）
async function getImageFromR2(env, key, options = {}) {
  const { width, height, fit = 'scale-down', quality = 85 } = options;
  
  const object = await env.IMAGES_BUCKET.get(key);
  if (!object) {
    return errorResponse('Image not found', 404);
  }

  // 如果需要缩略图，使用 R2 的图片变换功能
  if (width || height) {
    const transformedKey = `${key}?width=${width || ''}&height=${height || ''}&fit=${fit}&quality=${quality}`;
    const transformed = await env.IMAGES_BUCKET.get(transformedKey);
    
    if (transformed) {
      return new Response(transformed.body, {
        headers: {
          'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000', // 缓存 1 年
          'ETag': transformed.etag
        }
      });
    }
  }

  // 返回原图
  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000',
      'ETag': object.etag
    }
  });
}

// 修改图片获取 API
// GET /api/images/:key?width=1024&quality=85
const imageMatch = pathname.match(/^\/api\/images\/(.+)$/);
if (imageMatch && method === 'GET') {
  const key = decodeURIComponent(imageMatch[1]);
  const url = new URL(request.url);
  const width = url.searchParams.get('width');
  const height = url.searchParams.get('height');
  const quality = url.searchParams.get('quality') || '85';
  
  return await getImageFromR2(env, key, {
    width: width ? parseInt(width) : undefined,
    height: height ? parseInt(height) : undefined,
    quality: parseInt(quality)
  });
}
```

**注意：** Cloudflare R2 本身不直接支持图片变换，需要使用 **Cloudflare Images** 或在 Worker 中集成图片处理库。

**替代方案：使用 Cloudflare Images**

```javascript
// 1. 上传图片到 R2 时，同时创建 Cloudflare Images 变体
async function uploadImageWithThumbnails(env, file, key) {
  // 上传原图到 R2
  await env.IMAGES_BUCKET.put(key, file, {
    httpMetadata: {
      contentType: file.type
    }
  });

  // 创建缩略图变体（如果使用 Cloudflare Images）
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CF_IMAGES_TOKEN}`
      },
      body: formData
    }
  );
  
  const result = await response.json();
  return result.result.variants; // 返回各种尺寸的 URL
}

// 2. 定义缩略图变体
const THUMBNAIL_VARIANTS = {
  avatar: 'width=200,height=200,fit=cover',
  preview: 'width=1024,fit=scale-down',
  grid: 'width=400,height=400,fit=cover'
};
```

**更简单的方案：在上传时生成缩略图**

```javascript
// 前端上传时生成多个尺寸
async function uploadWithThumbnails(file) {
  const sizes = [
    { name: 'original', maxSize: 4096 },
    { name: 'preview', maxSize: 1024 },
    { name: 'avatar', maxSize: 200 }
  ];
  
  const uploads = await Promise.all(
    sizes.map(async ({ name, maxSize }) => {
      const resized = await resizeImage(file, maxSize);
      const key = `${characterId}/${photoId}_${name}.jpg`;
      
      return fetch(`${API_ENDPOINT}/api/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key,
          data: resized.base64,
          mimeType: 'image/jpeg'
        })
      });
    })
  );
  
  return {
    original: `${characterId}/${photoId}_original.jpg`,
    preview: `${characterId}/${photoId}_preview.jpg`,
    avatar: `${characterId}/${photoId}_avatar.jpg`
  };
}
```

**推荐实现方案（最简单）：**

在后端保存图片时，自动生成缩略图版本：

```javascript
// src/index.js - 修改 addCharacterPhoto 函数
async function addCharacterPhoto(request, env, user, characterId) {
  try {
    const { photoData, mimeType } = await request.json();
    
    // 解码 Base64
    const imageBuffer = Uint8Array.from(atob(photoData), c => c.charCodeAt(0));
    
    // 保存原图到 R2（仅用于下载）
    const originalKey = `characters/${user.id}/${characterId}/${photoId}_original.jpg`;
    await env.IMAGES_BUCKET.put(originalKey, imageBuffer, {
      httpMetadata: { contentType: mimeType }
    });
    
    // 生成并保存缩略图（1024px，用于预览）
    const thumbnailBuffer = await generateThumbnail(imageBuffer, 1024);
    const thumbnailKey = `characters/${user.id}/${characterId}/${photoId}_thumb.jpg`;
    await env.IMAGES_BUCKET.put(thumbnailKey, thumbnailBuffer, {
      httpMetadata: { contentType: 'image/jpeg' }
    });
    
    // 在数据库中保存两个 key
    const photo = {
      id: photoId,
      originalKey,    // 原图 key（仅下载时使用）
      thumbnailKey,   // 缩略图 key（预览时使用）
      mimeType,
      uploadedAt: new Date().toISOString()
    };
    
    // ... 保存到 KV
  }
}

// 图片处理函数（使用 Worker 内置的图片处理能力）
async function generateThumbnail(imageBuffer, maxSize) {
  // 注意：Cloudflare Workers 没有内置图片处理
  // 需要使用第三方库或 Cloudflare Images API
  
  // 方案1：返回原图，在前端处理
  // 方案2：调用 Cloudflare Images API
  // 方案3：使用 wasm 图片处理库
}
```

**最终推荐方案（考虑实现复杂度）：**

由于 Cloudflare Workers 没有内置图片处理能力，最实用的方案是：

1. **前端上传时已经压缩到 500KB**（已实现）
2. **保存时同时存储原图和缩略图版本**
3. **前端请求时根据场景选择合适的版本**

```javascript
// 数据结构调整
const photo = {
  id: 'xxx',
  data: base64Data,           // 缩略图数据（1024px，用于预览）
  originalData: base64Data,   // 原图数据（4K，仅下载时使用）
  mimeType: 'image/jpeg',
  size: 500000,               // 缩略图大小
  originalSize: 2000000       // 原图大小
};

// 前端使用
function renderCharacterPhoto(photo, isDownload = false) {
  const data = isDownload ? photo.originalData : photo.data;
  return `data:${photo.mimeType};base64,${data}`;
}
```

**实施步骤：**
1. 修改角色照片数据结构，区分原图和缩略图
2. 上传时生成两个版本（前端已有压缩逻辑）
3. 预览时使用缩略图，下载时使用原图
4. 历史记录同样处理
5. 添加图片尺寸标识（UI 上显示"预览版"/"原图"）

**预期效果：**
- 角色列表加载速度提升 **90%**（200KB → 20KB）
- 历史记录加载速度提升 **80%**（1MB → 200KB）
- 带宽消耗减少 **85%**
- 用户体验大幅提升

---

### 1.3 图片资源缓存优化
**现状问题：**
- 角色照片每次都从服务器重新加载
- Base64 图片数据没有本地缓存
- 历史记录图片重复请求

**优化方案：**
```javascript
// 使用 IndexedDB 缓存图片
class ImageCache {
  constructor() {
    this.dbName = 'shashin_image_cache';
    this.storeName = 'images';
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async set(id, data, mimeType) {
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    await store.put({
      id,
      data,
      mimeType,
      timestamp: Date.now()
    });
  }

  async get(id) {
    const transaction = this.db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);
    return new Promise((resolve) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    });
  }

  async clear() {
    const transaction = this.db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);
    await store.clear();
  }
}

// 使用示例
const imageCache = new ImageCache();
await imageCache.init();

// 加载角色照片时先检查缓存
async function loadCharacterPhoto(photoId, photoData) {
  const cached = await imageCache.get(photoId);
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
    return `data:${cached.mimeType};base64,${cached.data}`;
  }
  
  // 缓存新数据
  await imageCache.set(photoId, photoData.data, photoData.mimeType);
  return `data:${photoData.mimeType};base64,${photoData.data}`;
}
```

**实施步骤：**
1. 创建 `imageCache.js` 模块
2. 在页面加载时初始化 IndexedDB
3. 修改角色照片加载逻辑，优先使用缓存
4. 实现缓存清理策略（超过 7 天自动清理）
5. 添加手动清理缓存的设置选项

**预期效果：**
- 角色照片加载速度提升 80%
- 减少服务器带宽消耗
- 离线时也能查看已缓存的照片

---

### 1.3 HTTP 缓存头优化（后端）
**优化方案：**
```javascript
// 在 src/index.js 中为静态资源添加缓存头
function addCacheHeaders(response, maxAge = 3600) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', `public, max-age=${maxAge}`);
  headers.set('ETag', generateETag(response));
  return new Response(response.body, {
    status: response.status,
    headers
  });
}

// 为不同类型的资源设置不同的缓存时间
const CACHE_TIMES = {
  images: 7 * 24 * 60 * 60,      // 图片缓存 7 天
  templates: 24 * 60 * 60,       // 模板缓存 1 天
  userCharacters: 5 * 60,        // 角色数据缓存 5 分钟
  history: 10 * 60               // 历史记录缓存 10 分钟
};
```

---

## 二、第三方服务优化（中国线路兼容）

### 2.1 检查当前第三方依赖
需要检查以下服务在中国的可访问性：

**检查清单：**
```bash
# 检查 index.html 中的外部资源
grep -r "https://" frontend/index.html
grep -r "http://" frontend/index.html
```

**常见被墙服务：**
- ❌ Google Fonts (`fonts.googleapis.com`)
- ❌ Google Analytics
- ❌ reCAPTCHA
- ❌ Unsplash 图片 CDN
- ✅ Cloudflare CDN（可访问）
- ✅ Phosphor Icons（需确认 CDN 地址）

### 2.2 优化方案

#### 方案 A：自托管字体
```html
<!-- 替换 Google Fonts -->
<!-- 旧代码 -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">

<!-- 新代码：使用国内 CDN 或自托管 -->
<link href="https://fonts.font.im/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<!-- 或 -->
<link href="/fonts/inter.css" rel="stylesheet">
```

#### 方案 B：替换 Unsplash 图片
```javascript
// 将模板缩略图上传到 Cloudflare R2
// 修改 defaultTemplates 中的 thumbnail URL
thumbnail: 'https://your-r2-bucket.com/templates/professional-portrait.jpg'
```

#### 方案 C：添加资源加载超时检测
```javascript
// 检测第三方资源加载失败
function detectSlowResources() {
  const resources = performance.getEntriesByType('resource');
  const slowResources = resources.filter(r => r.duration > 3000);
  
  if (slowResources.length > 0) {
    console.warn('[Performance] Slow resources detected:', slowResources);
    // 上报到监控系统
  }
}

window.addEventListener('load', () => {
  setTimeout(detectSlowResources, 1000);
});
```

**实施步骤：**
1. 使用 Chrome DevTools 检查所有外部资源
2. 测试每个资源在中国的加载速度
3. 替换或移除加载超过 3 秒的资源
4. 实现资源加载失败的降级方案

---

## 三、全站性能测试

### 3.1 性能测试工具

#### 工具 1：Lighthouse（Chrome DevTools）
```bash
# 安装 Lighthouse CLI
npm install -g lighthouse

# 运行性能测试
lighthouse https://i.sendto.you --output html --output-path ./performance-report.html

# 针对移动端测试
lighthouse https://i.sendto.you --preset=mobile --output html
```

**测试指标：**
- FCP (First Contentful Paint) - 首次内容绘制
- LCP (Largest Contentful Paint) - 最大内容绘制
- TBT (Total Blocking Time) - 总阻塞时间
- CLS (Cumulative Layout Shift) - 累积布局偏移
- Speed Index - 速度指数

**目标值：**
- FCP < 1.8s
- LCP < 2.5s
- TBT < 300ms
- CLS < 0.1
- Speed Index < 3.4s

#### 工具 2：WebPageTest
```
测试地址：https://www.webpagetest.org/
测试配置：
- Location: Beijing, China (重要！)
- Browser: Chrome
- Connection: 4G
```

#### 工具 3：Chrome Performance Profiler
```javascript
// 添加性能监控代码
window.addEventListener('load', () => {
  const perfData = performance.getEntriesByType('navigation')[0];
  console.log('[Performance] Page Load Metrics:', {
    DNS: perfData.domainLookupEnd - perfData.domainLookupStart,
    TCP: perfData.connectEnd - perfData.connectStart,
    Request: perfData.responseStart - perfData.requestStart,
    Response: perfData.responseEnd - perfData.responseStart,
    DOM: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
    Load: perfData.loadEventEnd - perfData.loadEventStart,
    Total: perfData.loadEventEnd - perfData.fetchStart
  });
});
```

### 3.2 性能测试检查清单

**前端性能：**
- [ ] 首页加载时间（空缓存）
- [ ] 首页加载时间（有缓存）
- [ ] 登录后加载角色列表时间
- [ ] 打开角色编辑弹窗时间
- [ ] 上传照片处理时间
- [ ] 生成图片请求时间
- [ ] 历史记录加载时间

**网络性能：**
- [ ] API 响应时间（中国 → Cloudflare）
- [ ] 图片加载时间（R2 → 中国）
- [ ] 静态资源加载时间
- [ ] WebSocket 连接时间（如果有）

**资源大小：**
- [ ] HTML 文件大小
- [ ] CSS 文件大小（是否需要压缩）
- [ ] JS 文件大小（是否需要分包）
- [ ] 图片资源总大小
- [ ] 字体文件大小

### 3.3 测试脚本
```javascript
// performance-test.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }

  start(label) {
    this.metrics[label] = { start: performance.now() };
  }

  end(label) {
    if (this.metrics[label]) {
      this.metrics[label].end = performance.now();
      this.metrics[label].duration = this.metrics[label].end - this.metrics[label].start;
      console.log(`[Perf] ${label}: ${this.metrics[label].duration.toFixed(2)}ms`);
    }
  }

  report() {
    console.table(Object.entries(this.metrics).map(([label, data]) => ({
      Operation: label,
      Duration: `${data.duration?.toFixed(2) || 'N/A'}ms`
    })));
  }
}

// 使用示例
const perf = new PerformanceMonitor();

// 测试登录流程
perf.start('login');
await login(email, password);
perf.end('login');

// 测试加载角色
perf.start('loadCharacters');
await loadCharacters();
perf.end('loadCharacters');

perf.report();
```

---

## 四、针对性优化方案

### 4.1 代码分割（Code Splitting）
```javascript
// 将大型库按需加载
// 例如：图片压缩库只在需要时加载
async function compressImage(file) {
  const { default: compress } = await import('./imageCompressor.js');
  return compress(file);
}
```

### 4.2 懒加载（Lazy Loading）
```html
<!-- 图片懒加载 -->
<img src="placeholder.jpg" data-src="actual-image.jpg" loading="lazy" />

<script>
// Intersection Observer 实现懒加载
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      imageObserver.unobserve(img);
    }
  });
});

document.querySelectorAll('img[data-src]').forEach(img => {
  imageObserver.observe(img);
});
</script>
```

### 4.3 预加载关键资源
```html
<!-- 预加载字体 -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>

<!-- 预连接到 API 域名 -->
<link rel="preconnect" href="https://iapi.sendto.you">
<link rel="dns-prefetch" href="https://iapi.sendto.you">
```

### 4.4 压缩和优化
```javascript
// 1. 启用 Gzip/Brotli 压缩（Cloudflare 自动处理）
// 2. 压缩 CSS 和 JS
// 3. 优化图片格式（使用 WebP）

// 检测 WebP 支持
function supportsWebP() {
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

if (supportsWebP()) {
  // 使用 WebP 格式
}
```

---

## 五、实施优先级

### P0（立即执行）
1. ✅ 检查并替换被墙的第三方服务（Google Fonts）
2. ✅ 实现用户状态缓存
3. ✅ 运行 Lighthouse 性能测试，识别主要瓶颈

### P1（本周完成）
4. 实现图片 IndexedDB 缓存
5. 优化 API 响应缓存策略
6. 添加资源加载性能监控

### P2（下周完成）
7. 实现代码分割和懒加载
8. 优化图片格式（WebP）
9. 添加预加载关键资源

---

## 六、监控和验证

### 6.1 性能监控指标
```javascript
// 添加到 app.js
function reportPerformance() {
  if ('sendBeacon' in navigator) {
    const perfData = {
      url: window.location.href,
      fcp: 0,
      lcp: 0,
      cls: 0,
      timestamp: Date.now()
    };

    // 收集 FCP
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcpEntry) perfData.fcp = fcpEntry.startTime;

    // 收集 LCP
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      perfData.lcp = lastEntry.startTime;
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // 上报数据（可以发送到自己的监控服务）
    navigator.sendBeacon('/api/performance', JSON.stringify(perfData));
  }
}

window.addEventListener('load', reportPerformance);
```

### 6.2 A/B 测试
- 对比优化前后的加载时间
- 收集用户反馈
- 监控错误率变化

---

## 七、预期效果

### 优化前（预估）
- 首次加载：5-8 秒
- 刷新加载：3-5 秒
- 角色列表加载：2-3 秒
- 图片加载：1-2 秒/张

### 优化后（目标）
- 首次加载：2-3 秒（减少 60%）
- 刷新加载：0.5-1 秒（减少 80%）
- 角色列表加载：0.3-0.5 秒（减少 85%）
- 图片加载：0.1-0.2 秒/张（减少 90%）

---

## 八、风险和注意事项

1. **缓存一致性**：确保缓存失效策略正确，避免用户看到过期数据
2. **存储限制**：IndexedDB 有配额限制，需要实现清理策略
3. **兼容性**：确保 IndexedDB 在所有目标浏览器中可用
4. **降级方案**：缓存失败时要有降级到直接请求的方案

---

## 九、后续优化方向

1. 实现 Service Worker 离线缓存
2. 使用 CDN 加速静态资源
3. 实现服务端渲染（SSR）或静态生成（SSG）
4. 优化数据库查询性能
5. 实现图片 CDN 和智能压缩
