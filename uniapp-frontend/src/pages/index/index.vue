<template>
  <view class="page">
    <!-- Sticky Header Section -->
    <view class="sticky-header">
      <!-- Page Title -->
      <view class="page-header">
        <text class="page-title">Templates</text>
        <text class="page-subtitle">Choose a style</text>
      </view>

      <!-- Category Tabs -->
      <scroll-view
        scroll-x
        class="category-tabs"
        :show-scrollbar="false"
        :scroll-left="scrollLeft"
      >
        <view class="category-list">
          <view
            v-for="cat in categories"
            :key="cat.id"
            :class="['category-tab', { active: currentCat === cat.id, pressed: pressedCat === cat.id }]"
            @tap="handleCategoryTap(cat.id)"
          >
            {{ cat.name }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- Mixed Grid Content -->
    <scroll-view
      scroll-y
      class="content-scroll"
      @scrolltolower="loadMore"
      :lower-threshold="100"
    >
      <!-- Loading Skeleton -->
      <view v-if="loading" class="skeleton-container">
        <view v-for="n in 9" :key="n" :class="['skeleton-item', getSkeletonType(n)]">
          <view class="skeleton-inner">
            <view class="shimmer"></view>
          </view>
        </view>
      </view>

      <!-- Smart Mixed Grid -->
      <view v-else class="mixed-grid">
        <view
          v-for="tpl in filteredTemplates"
          :key="tpl.id"
          :class="[
            'grid-item',
            tpl.size || 'small',
            { pressed: pressedCard === tpl.id }
          ]"
          @tap="handleCardTap(tpl)"
          @touchstart="pressedCard = tpl.id"
          @touchend="pressedCard = null"
          @touchcancel="pressedCard = null"
        >
          <!-- Card Image -->
          <view class="card-wrapper">
            <image
              :src="tpl.thumbnail"
              mode="aspectFill"
              class="card-image"
            />

            <!-- Badge -->
            <view v-if="tpl.badge" :class="['card-badge', tpl.badgeType]">
              {{ tpl.badge }}
            </view>

            <!-- Title Overlay (for large cards) -->
            <view v-if="tpl.showTitleOverlay" class="card-title-overlay">
              <text class="overlay-title">{{ tpl.name.zh || tpl.name }}</text>
            </view>
          </view>

          <!-- Card Title (for small/medium cards) -->
          <view v-if="!tpl.showTitleOverlay" class="card-info">
            <text class="card-title">{{ tpl.name.zh || tpl.name }}</text>
          </view>
        </view>
      </view>

      <!-- Empty State -->
      <view v-if="!loading && filteredTemplates.length === 0" class="empty-state">
        <text class="empty-text">暂无模板</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { request } from '../../utils/request'

// ========== 状态管理 ==========
const templates = ref([])
const loading = ref(true)
const currentCat = ref('all')
const pressedCat = ref(null)
const pressedCard = ref(null)
const scrollLeft = ref(0)

// ========== 分类数据 ==========
const categories = [
  { id: 'all', name: '全部' },
  { id: 'portrait', name: '人像' },
  { id: 'creative', name: '创意' },
  { id: 'scene', name: '场景' },
  { id: 'art', name: '艺术' },
  { id: 'anime', name: '动漫' }
]

// ========== 计算属性 ==========
const filteredTemplates = computed(() => {
  if (currentCat.value === 'all') return templates.value
  return templates.value.filter(t => t.category === currentCat.value)
})

// ========== 数据获取 ==========
const fetchTemplates = async () => {
  try {
    loading.value = true
    const res = await request({ url: '/api/templates' })

    // 为模板添加布局属性（智能混合模式）
    templates.value = (res || []).map((tpl, index) => {
      // 智能分配尺寸，确保每行完整
      return assignSmartLayout(tpl, index)
    })
  } catch (e) {
    console.error('获取模板失败:', e)
    // 添加模拟数据用于演示
    templates.value = generateMockTemplates()
  } finally {
    loading.value = false
  }
}

// 智能分配布局
const assignSmartLayout = (tpl, index) => {
  // 定义布局模式，确保每行宽度总和不超过100%
  // 假设：small=1单位, medium=1单位但更高, large=2单位, xlarge=3单位

  const patterns = [
    // 模式1: 3个小卡片 (1+1+1=3)
    ['small', 'small', 'small'],
    // 模式2: 1个大卡片 (2)
    ['large'],
    // 模式3: 1个超大卡片 (3)
    ['xlarge'],
    // 模式4: 1个小 + 1个大 (1+2=3)
    ['small', 'large'],
    // 模式5: 1个中 + 1个中 + 1个小 (1+1+1=3)
    ['medium', 'medium', 'small'],
  ]

  // 循环使用模式
  const patternIndex = Math.floor(index / 3) % patterns.length
  const pattern = patterns[patternIndex]
  const sizeIndex = index % pattern.length
  const size = pattern[sizeIndex]

  const result = {
    ...tpl,
    size
  }

  // 根据尺寸添加额外属性
  if (size === 'small') {
    result.ratio = '1:1'
    result.badge = index === 0 ? 'NEW' : null
  } else if (size === 'medium') {
    result.ratio = '3:4'
  } else if (size === 'large') {
    result.ratio = '16:9'
    result.showTitleOverlay = true
    result.badge = index === 3 ? 'HOT' : null
  } else if (size === 'xlarge') {
    result.ratio = '16:9'
    result.showTitleOverlay = true
  }

  if (result.badge) {
    result.badgeType = result.badge === 'NEW' ? 'badge-new' : 'badge-hot'
  }

  return result
}

// 生成模拟数据
const generateMockTemplates = () => {
  const mockData = []
  const categories = ['portrait', 'creative', 'scene', 'art', 'anime']

  for (let i = 0; i < 15; i++) {
    const tpl = {
      id: i + 1,
      name: { zh: `模板 ${i + 1}` },
      thumbnail: 'https://via.placeholder.com/300x400/FF6B6B/FFFFFF?text=Template',
      category: categories[i % categories.length]
    }

    mockData.push(assignSmartLayout(tpl, i))
  }

  return mockData
}

// 获取骨架屏类型
const getSkeletonType = (index) => {
  const patterns = [
    ['small', 'small', 'small'],
    ['large'],
    ['xlarge'],
    ['small', 'large'],
    ['medium', 'medium', 'small'],
  ]

  const patternIndex = Math.floor((index - 1) / 3) % patterns.length
  const pattern = patterns[patternIndex]
  const sizeIndex = (index - 1) % pattern.length

  return pattern[sizeIndex]
}

// ========== 交互处理 ==========
const handleCategoryTap = (categoryId) => {
  pressedCat.value = categoryId
  setTimeout(() => {
    currentCat.value = categoryId
    pressedCat.value = null
  }, 150)
}

const handleCardTap = (tpl) => {
  uni.navigateTo({
    url: `/pages/generate/index?id=${tpl.id}`
  })
}

const loadMore = () => {
  console.log('加载更多模板')
}

// ========== 生命周期 ==========
onMounted(() => {
  fetchTemplates()
})
</script>

<style scoped>
/* ========== 页面容器 ========== */
.page {
  min-height: 100vh;
  background-color: #F6F7F9;
}

/* ========== 粘性头部 ========== */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: #F6F7F9;
}

.page-header {
  padding: 32rpx 32rpx 24rpx;
}

.page-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #111111;
  line-height: 1.3;
}

.page-subtitle {
  display: block;
  font-size: 24rpx;
  font-weight: 400;
  color: #111111;
  opacity: 0.6;
  margin-top: 4rpx;
}

/* ========== 分类标签栏 ========== */
.category-tabs {
  width: 100%;
  white-space: nowrap;
  padding: 0 32rpx 24rpx;
}

.category-list {
  display: inline-flex;
  gap: 16rpx;
}

.category-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 72rpx;
  padding: 0 32rpx;
  background-color: #FFFFFF;
  color: #111111;
  font-size: 28rpx;
  font-weight: 500;
  border-radius: 36rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.category-tab.active {
  background-color: #111111;
  color: #FFFFFF;
}

.category-tab.pressed {
  opacity: 0.85;
  transform: scale(0.98);
}

/* ========== 内容滚动区 ========== */
.content-scroll {
  height: calc(100vh - 180rpx);
  padding: 0 32rpx 32rpx;
}

/* ========== 骨架屏 ========== */
.skeleton-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.skeleton-item {
  background-color: #FFFFFF;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.10);
}

/* 小卡片：占1份宽度 */
.skeleton-item.small {
  width: calc((100% - 24rpx) / 3);
  aspect-ratio: 1 / 1;
}

/* 中卡片：占1份宽度，但更高 */
.skeleton-item.medium {
  width: calc((100% - 24rpx) / 3);
  aspect-ratio: 3 / 4;
}

/* 大卡片：占2份宽度 */
.skeleton-item.large {
  width: calc((100% - 12rpx) / 3 * 2);
  aspect-ratio: 16 / 9;
}

/* 超大卡片：占3份宽度（整行） */
.skeleton-item.xlarge {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.skeleton-inner {
  width: 100%;
  height: 100%;
  background-color: #F0F0F0;
  position: relative;
  overflow: hidden;
}

.shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ========== 智能混合网格 ========== */
.mixed-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

/* 小卡片：占1份宽度 (1:1) */
.grid-item.small {
  width: calc((100% - 24rpx) / 3);
}

/* 中卡片：占1份宽度 (3:4 竖版) */
.grid-item.medium {
  width: calc((100% - 24rpx) / 3);
  aspect-ratio: 3 / 4;
}

/* 大卡片：占2份宽度 (16:9 横版) */
.grid-item.large {
  width: calc((100% - 12rpx) / 3 * 2);
  aspect-ratio: 16 / 9;
}

/* 超大卡片：占3份宽度（整行，16:9） */
.grid-item.xlarge {
  width: 100%;
  aspect-ratio: 16 / 9;
}

/* ========== 卡片样式 ========== */
.grid-item {
  background-color: #FFFFFF;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.10);
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  flex-direction: column;
}

.grid-item.pressed {
  transform: scale(0.98);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.card-wrapper {
  width: 100%;
  flex: 1;
  position: relative;
  overflow: hidden;
}

.card-wrapper {
  border-radius: 24rpx;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* ========== Badge ========== */
.card-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 600;
  z-index: 10;
}

.badge-new {
  background-color: #FF6B6B;
  color: #FFFFFF;
}

.badge-hot {
  background-color: #FFA500;
  color: #FFFFFF;
}

/* ========== 标题覆盖 ========== */
.card-title-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32rpx 24rpx 24rpx;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
}

.overlay-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #FFFFFF;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
}

/* ========== 卡片信息 ========== */
.card-info {
  padding: 16rpx;
  text-align: center;
}

.card-title {
  font-size: 24rpx;
  font-weight: 500;
  color: #111111;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ========== 空状态 ========== */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 120rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
}
</style>
