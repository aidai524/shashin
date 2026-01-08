// 缓存管理模块
// 用于优化页面加载性能，减少不必要的 API 请求

const CACHE_KEYS = {
  USER_INFO: 'cache:user_info',
  CHARACTERS: 'cache:characters',
  CHARACTER_LIMITS: 'cache:character_limits',
  TEMPLATES: 'cache:templates',
  TIMESTAMP: 'cache:timestamp:'
};

const CACHE_DURATION = {
  USER_INFO: 5 * 60 * 1000,      // 用户信息缓存 5 分钟
  CHARACTERS: 3 * 60 * 1000,     // 角色列表缓存 3 分钟
  TEMPLATES: 30 * 60 * 1000      // 模板列表缓存 30 分钟
};

class CacheManager {
  constructor() {
    this.enabled = this.checkLocalStorageAvailable();
  }

  // 检查 localStorage 是否可用
  checkLocalStorageAvailable() {
    try {
      const test = '__cache_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('[Cache] localStorage not available:', e);
      return false;
    }
  }

  // 生成时间戳 key
  getTimestampKey(key) {
    return CACHE_KEYS.TIMESTAMP + key;
  }

  // 设置缓存
  set(key, data, duration = 5 * 60 * 1000) {
    if (!this.enabled) return false;

    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        duration
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
      console.log(`[Cache] Set: ${key}, expires in ${duration / 1000}s`);
      return true;
    } catch (e) {
      console.error('[Cache] Set error:', e);
      // 如果存储满了，清理过期缓存
      if (e.name === 'QuotaExceededError') {
        this.clearExpired();
        try {
          localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now(), duration }));
          return true;
        } catch (e2) {
          console.error('[Cache] Set error after cleanup:', e2);
        }
      }
      return false;
    }
  }

  // 获取缓存
  get(key) {
    if (!this.enabled) return null;

    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      // 检查是否过期
      if (age > cacheData.duration) {
        console.log(`[Cache] Expired: ${key} (${(age / 1000).toFixed(0)}s old)`);
        localStorage.removeItem(key);
        return null;
      }

      console.log(`[Cache] Hit: ${key} (${(age / 1000).toFixed(0)}s old)`);
      return cacheData.data;
    } catch (e) {
      console.error('[Cache] Get error:', e);
      return null;
    }
  }

  // 删除指定缓存
  remove(key) {
    if (!this.enabled) return;
    localStorage.removeItem(key);
    console.log(`[Cache] Removed: ${key}`);
  }

  // 清理过期缓存
  clearExpired() {
    if (!this.enabled) return;

    let cleared = 0;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith('cache:')) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const cacheData = JSON.parse(cached);
            const age = Date.now() - cacheData.timestamp;
            if (age > cacheData.duration) {
              localStorage.removeItem(key);
              cleared++;
            }
          }
        } catch (e) {
          // 无效的缓存数据，直接删除
          localStorage.removeItem(key);
          cleared++;
        }
      }
    });

    if (cleared > 0) {
      console.log(`[Cache] Cleared ${cleared} expired items`);
    }
  }

  // 清空所有缓存
  clearAll() {
    if (!this.enabled) return;

    const keys = Object.keys(localStorage);
    let cleared = 0;
    
    keys.forEach(key => {
      if (key.startsWith('cache:')) {
        localStorage.removeItem(key);
        cleared++;
      }
    });

    console.log(`[Cache] Cleared all cache (${cleared} items)`);
  }

  // 获取缓存统计信息
  getStats() {
    if (!this.enabled) return { enabled: false };

    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(k => k.startsWith('cache:'));
    let totalSize = 0;
    let validCount = 0;
    let expiredCount = 0;

    cacheKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
          const cacheData = JSON.parse(value);
          const age = Date.now() - cacheData.timestamp;
          if (age > cacheData.duration) {
            expiredCount++;
          } else {
            validCount++;
          }
        }
      } catch (e) {
        expiredCount++;
      }
    });

    return {
      enabled: true,
      totalItems: cacheKeys.length,
      validItems: validCount,
      expiredItems: expiredCount,
      totalSize: (totalSize / 1024).toFixed(2) + ' KB'
    };
  }
}

// 创建全局缓存实例
const cacheManager = new CacheManager();

// 用户信息缓存
function cacheUserInfo(user) {
  return cacheManager.set(CACHE_KEYS.USER_INFO, user, CACHE_DURATION.USER_INFO);
}

function getCachedUserInfo() {
  return cacheManager.get(CACHE_KEYS.USER_INFO);
}

function clearUserCache() {
  cacheManager.remove(CACHE_KEYS.USER_INFO);
}

// 角色数据缓存
function cacheCharacters(characters, limits) {
  const success1 = cacheManager.set(CACHE_KEYS.CHARACTERS, characters, CACHE_DURATION.CHARACTERS);
  const success2 = cacheManager.set(CACHE_KEYS.CHARACTER_LIMITS, limits, CACHE_DURATION.CHARACTERS);
  return success1 && success2;
}

function getCachedCharacters() {
  const characters = cacheManager.get(CACHE_KEYS.CHARACTERS);
  const limits = cacheManager.get(CACHE_KEYS.CHARACTER_LIMITS);
  
  if (characters && limits) {
    return { characters, limits };
  }
  return null;
}

function clearCharactersCache() {
  cacheManager.remove(CACHE_KEYS.CHARACTERS);
  cacheManager.remove(CACHE_KEYS.CHARACTER_LIMITS);
}

// 模板数据缓存
function cacheTemplates(templates) {
  return cacheManager.set(CACHE_KEYS.TEMPLATES, templates, CACHE_DURATION.TEMPLATES);
}

function getCachedTemplates() {
  return cacheManager.get(CACHE_KEYS.TEMPLATES);
}

function clearTemplatesCache() {
  cacheManager.remove(CACHE_KEYS.TEMPLATES);
}

// 页面加载时清理过期缓存
window.addEventListener('load', () => {
  cacheManager.clearExpired();
});

// 定期清理过期缓存（每 5 分钟）
setInterval(() => {
  cacheManager.clearExpired();
}, 5 * 60 * 1000);

// 导出到全局
window.cacheManager = cacheManager;
window.cacheUserInfo = cacheUserInfo;
window.getCachedUserInfo = getCachedUserInfo;
window.clearUserCache = clearUserCache;
window.cacheCharacters = cacheCharacters;
window.getCachedCharacters = getCachedCharacters;
window.clearCharactersCache = clearCharactersCache;
window.cacheTemplates = cacheTemplates;
window.getCachedTemplates = getCachedTemplates;
window.clearTemplatesCache = clearTemplatesCache;

console.log('[Cache] Cache manager initialized');
