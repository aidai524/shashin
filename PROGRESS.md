# Dream Photo 项目进展文档

> 最后更新：2026-01-06

## 项目概述

Dream Photo 是一个基于 Gemini AI 的智能图片生成应用，通过预设模板和角色锁脸功能，让用户轻松创建各种风格的 AI 图像。

## 技术栈

- **前端**：原生 HTML/CSS/JavaScript
- **后端**：Cloudflare Workers
- **存储**：Cloudflare KV
- **AI 服务**：Google Gemini API

## 已完成功能 ✅

### 阶段一：前端交互优化

| 任务 | 状态 | 描述 |
|------|------|------|
| 移除 API 配置区域 | ✅ 完成 | API 配置移至后端，前端无需用户设置 |
| 模型选项简化 | ✅ 完成 | 简化为「高级」和「快速」两个直观选项 |
| 生成数量优化 | ✅ 完成 | 添加预估时间提示（1张~30s，2张~60s，4张~120s） |
| 宽高比可视化 | ✅ 完成 | 改为缩略图样式选择，更加直观 |
| 分辨率展示优化 | ✅ 完成 | 使用更直观的表达方式 |

### 阶段二：模板系统

| 任务 | 状态 | 描述 |
|------|------|------|
| 前端模板选择界面 | ✅ 完成 | 替代提示词输入，用户选择预设模板 |
| 后端模板 API | ✅ 完成 | CRUD API + KV 存储 |
| 模板管理后台 | ✅ 完成 | 独立的 admin.html 管理界面 |

#### 模板 API 端点

```
GET    /api/templates          获取所有模板
GET    /api/templates/:id      获取单个模板
POST   /api/templates          创建模板（需管理员密钥）
PUT    /api/templates/:id      更新模板（需管理员密钥）
DELETE /api/templates/:id      删除模板（需管理员密钥）
POST   /api/templates/init     初始化默认模板（需管理员密钥）
```

#### 预设模板（12个）

| 分类 | 模板名称 |
|------|----------|
| 人像 | 职业形象照、艺术人像、休闲生活照、极简主义 |
| 创意 | 复古胶片、赛博朋克、动漫风格、古风汉服、油画风格 |
| 场景 | 奇幻世界、海边日落、都市街拍 |

### 阶段三：用户认证系统

| 任务 | 状态 | 描述 |
|------|------|------|
| 后端用户认证 API | ✅ 完成 | 注册、登录、Token 验证 |
| 前端登录/注册界面 | ✅ 完成 | 用户登录注册表单 |
| 用户权限系统 | ✅ 完成 | 免费版/个人版/家庭版权限区分 |

#### 用户 API 端点

```
POST   /api/auth/register        用户注册
POST   /api/auth/login           用户登录
GET    /api/auth/me              获取当前用户信息
PUT    /api/auth/me              更新用户信息
POST   /api/auth/change-password 修改密码
```

#### 权限等级

| 套餐 | 角色数量 | 每角色照片数 |
|------|----------|--------------|
| 免费版 | 1 个 | 3 张 |
| 个人版 | 1 个 | 5 张 |
| 家庭版 | 5 个 | 10 张 |

### 阶段四：角色管理系统

| 任务 | 状态 | 描述 |
|------|------|------|
| 后端角色管理 API | ✅ 完成 | 角色 CRUD、多图片支持 |
| 前端角色创建界面 | ✅ 完成 | 创建角色、上传多张照片 |
| 前端角色选择界面 | ✅ 完成 | 生成时必须选择角色进行锁脸 |

#### 角色 API 端点

```
GET    /api/characters              获取用户的所有角色
GET    /api/characters/:id          获取单个角色详情
POST   /api/characters              创建角色
PUT    /api/characters/:id          更新角色
DELETE /api/characters/:id          删除角色
POST   /api/characters/:id/photos   添加照片
DELETE /api/characters/:id/photos/:photoId  删除照片
```

---

## 配置信息

### 环境变量 (Cloudflare Worker Secrets)

| 变量名 | 描述 |
|--------|------|
| `GEMINI_API_KEY` | Gemini API 密钥 |
| `ADMIN_KEY` | 管理后台密钥 |
| `JWT_SECRET` | JWT 签名密钥 |

### KV 存储

| 命名空间 | 用途 |
|----------|------|
| `TEMPLATES_KV` | 存储模板数据 |
| `USERS_KV` | 存储用户数据 |
| `CHARACTERS_KV` | 存储角色数据 |

### 访问地址

| 环境 | 地址 |
|------|------|
| API 后端 | https://iapi.sendto.you |
| Worker 地址 | https://gemini-proxy.aidai524.workers.dev |

---

## 文件结构

```
shashin/
├── frontend/
│   ├── index.html      # 主页面
│   ├── admin.html      # 模板管理后台
│   ├── app.js          # 主应用逻辑
│   ├── style.css       # 样式文件
│   └── README.md       # 前端说明
├── src/
│   └── index.js        # Cloudflare Worker（API + 代理）
├── wrangler.toml       # Cloudflare 配置
├── package.json        # 项目配置
├── PROGRESS.md         # 本文档
└── README.md           # 项目说明
```

---

## 使用流程

1. **注册/登录** - 创建账号并登录
2. **创建角色** - 点击「我的角色」创建角色并上传照片
3. **选择模板** - 从 12 个预设风格中选择
4. **选择角色** - 选择要使用的角色（锁脸）
5. **调整设置** - 选择质量、数量、宽高比等
6. **生成图片** - 点击生成，等待 AI 创作

---

## 更新日志

### 2026-01-06 v2.0.0
- ✅ 完成阶段三：用户认证系统
- ✅ 完成阶段四：角色管理系统
- ✅ 强制使用角色锁脸（移除手动上传）
- ✅ 自动选择第一个有照片的角色
- 📝 更新进展文档

### 2026-01-06 v1.0.0
- ✅ 完成阶段一：前端交互优化
- ✅ 完成阶段二：模板系统
- 📝 创建进展文档

---

## 管理员信息

- **管理后台地址**：`/admin.html`
- **管理员密钥**：`dream-photo-admin-2024`

> ⚠️ 生产环境请务必更改管理员密钥！
