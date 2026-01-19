# 小程序后端 Worker 部署指南

## 概述

本项目包含两个独立的 Cloudflare Worker：

1. **gemini-proxy** - 网页版后端 (main 分支)
2. **gemini-proxy-miniapp** - 小程序后端 (miniapp 分支)

两个 Worker 共享相同的 KV 存储和 R2 存储桶，但代码和部署配置相互独立。

## 部署小程序 Worker

### 1. 首次部署

```bash
# 使用小程序配置部署
npm run deploy:miniapp
```

### 2. 本地开发

```bash
# 本地运行小程序 Worker
npm run dev:miniapp
```

### 3. 查看日志

```bash
# 实时查看小程序 Worker 日志
npm run tail:miniapp
```

## 配置文件

- `wrangler.toml` - 网页版 Worker 配置
- `wrangler-miniapp.toml` - 小程序 Worker 配置
- `src/index.js` - 网页版 Worker 代码
- `src-miniapp/index.js` - 小程序 Worker 代码

## 共享资源

两个 Worker 共享以下资源：

- **KV 存储**:
  - TEMPLATES_KV: 模板数据
  - USERS_KV: 用户数据
  - CHARACTERS_KV: 角色数据
  - HISTORY_KV: 历史记录

- **R2 存储桶**:
  - gemini-images: 图片存储

## API 端点

小程序 Worker 提供以下 API：

- `/api/auth/*` - 用户认证
- `/api/auth/wechat` - 微信登录
- `/api/templates` - 模板管理
- `/api/characters/*` - 角色管理
- `/api/history/*` - 历史记录
- `/api/generate` - 图片生成
- `/v1beta/*` - Gemini API 代理

## 环境变量

需要在 Cloudflare Dashboard 中配置以下环境变量：

- `GEMINI_API_KEY` - Google Gemini API 密钥
- `JWT_SECRET` - JWT 签名密钥
- `ADMIN_KEY` - 管理员密钥
- `WX_APP_ID` - 微信小程序 AppID
- `WX_APP_SECRET` - 微信小程序 AppSecret

## 部署后的 URL

- 网页版: `https://gemini-proxy.YOUR_SUBDOMAIN.workers.dev`
- 小程序版: `https://gemini-proxy-miniapp.YOUR_SUBDOMAIN.workers.dev`

## 注意事项

1. 两个 Worker 可以同时部署，互不影响
2. 数据存储是共享的，用户可以在网页和小程序间切换使用
3. 确保在 miniapp 分支进行小程序相关的修改
4. 部署前确保环境变量已正确配置
