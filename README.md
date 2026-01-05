# Gemini API Proxy

一个部署在 Cloudflare Workers 上的 Google Gemini API 代理服务，附带图片生成前端界面。

## 项目结构

```
gemini-proxy/
├── src/
│   └── index.js          # Cloudflare Workers 代理代码
├── frontend/
│   ├── index.html        # 图片生成器界面
│   ├── style.css         # 样式文件
│   ├── app.js            # 前端逻辑
│   └── README.md         # 前端说明
├── wrangler.toml         # Workers 配置
└── package.json
```

## 功能特性

### 后端代理
- ✅ 代理所有 Gemini API 请求（文本生成、图片生成、流式响应等）
- ✅ 支持 Gemini 2.0 Flash、Gemini 1.5 Pro 等所有模型
- ✅ 支持 Imagen 3 图片生成
- ✅ CORS 支持，可从浏览器直接调用
- ✅ 多种 API Key 传递方式

### 前端界面
- 🎨 支持 Imagen 3 和 Gemini 2.0 Flash 图片生成
- 📝 提示词输入，支持中英文
- 🖼️ 可选择生成 1/2/4 张图片
- 📚 历史记录保存（本地存储）
- 🔍 图片预览和下载
- 📱 响应式设计，支持移动端

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 登录 Cloudflare

```bash
npx wrangler login
```

### 3. 配置 API Key（可选）

如果你想在 Worker 中配置默认的 API Key：

```bash
npx wrangler secret put GEMINI_API_KEY
```

然后输入你的 Google AI Studio API Key。

### 4. 部署后端

```bash
npm run deploy
```

部署成功后，你会得到一个类似 `https://gemini-proxy.<your-subdomain>.workers.dev` 的 URL。

### 5. 使用前端界面

直接在浏览器中打开 `frontend/index.html`，或使用本地服务器：

```bash
# 在项目根目录运行
npm run frontend

# 然后访问 http://localhost:8080
```

在界面中配置你的代理地址和 API Key，即可开始生成图片。

## API 使用方法

### API Key 传递方式

你可以通过以下三种方式传递 API Key：

1. **请求头 `x-goog-api-key`**（推荐）
2. **Authorization Bearer Token**: `Authorization: Bearer YOUR_API_KEY`
3. **环境变量**：配置 `GEMINI_API_KEY` secret（适合固定 Key 的场景）

### 示例请求

#### 文本生成（Gemini）

```bash
curl -X POST "https://your-worker.workers.dev/v1beta/models/gemini-2.0-flash:generateContent" \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -d '{
    "contents": [{
      "parts": [{"text": "Hello, how are you?"}]
    }]
  }'
```

#### 流式响应

```bash
curl -X POST "https://your-worker.workers.dev/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse" \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -d '{
    "contents": [{
      "parts": [{"text": "Write a short story"}]
    }]
  }'
```

#### 图片生成（Imagen 3）

```bash
curl -X POST "https://your-worker.workers.dev/v1beta/models/imagen-3.0-generate-002:predict" \
  -H "Content-Type: application/json" \
  -H "x-goog-api-key: YOUR_API_KEY" \
  -d '{
    "instances": [{"prompt": "A beautiful sunset over mountains"}],
    "parameters": {"sampleCount": 1}
  }'
```

#### 列出可用模型

```bash
curl "https://your-worker.workers.dev/v1beta/models" \
  -H "x-goog-api-key: YOUR_API_KEY"
```

## 可用端点

| 端点 | 描述 |
|------|------|
| `/v1beta/models` | 列出所有可用模型 |
| `/v1beta/models/{model}:generateContent` | 文本生成 |
| `/v1beta/models/{model}:streamGenerateContent` | 流式文本生成 |
| `/v1beta/models/{model}:predict` | 图片生成（Imagen） |
| `/v1beta/models/{model}:embedContent` | 文本嵌入 |
| `/v1beta/cachedContents` | 缓存内容管理 |

## 本地开发

```bash
npm run dev
```

这会在本地启动一个开发服务器（默认 http://localhost:8787）。

## 部署前端到 Cloudflare Pages（可选）

如果你想把前端也部署到云端：

1. 在 Cloudflare Dashboard 中创建 Pages 项目
2. 上传 `frontend` 文件夹中的文件
3. 或者连接 GitHub 仓库，设置构建输出目录为 `frontend`

## 注意事项

1. **API Key 安全**：建议使用 `wrangler secret` 存储 API Key，而不是硬编码在代码中
2. **配额限制**：代理请求仍然受 Google API 配额限制
3. **费用**：Cloudflare Workers 免费版每天有 100,000 次请求限制
4. **历史记录**：前端历史记录保存在浏览器 localStorage 中，最多 50 条

## License

MIT