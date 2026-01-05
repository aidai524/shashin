# Gemini 图片生成器

一个简洁的 Web 界面，用于调用 Google Gemini/Imagen API 生成图片。

## 功能特性

- 🎨 支持 Imagen 3 和 Gemini 2.0 Flash 图片生成
- 📝 提示词输入，支持中英文
- 🖼️ 可选择生成 1/2/4 张图片
- 📚 历史记录保存（本地存储）
- 🔍 图片预览和下载
- 📱 响应式设计，支持移动端

## 使用方法

### 1. 部署后端代理

首先需要部署 Cloudflare Workers 代理服务，参考项目根目录的 README。

### 2. 打开前端页面

可以直接在浏览器中打开 `index.html` 文件，或者使用本地服务器：

```bash
# 在项目根目录运行
npm run frontend

# 或者在 frontend 目录下直接运行
npx serve . -l 8080
```

然后访问 http://localhost:8080

### 3. 配置 API

1. 点击页面顶部的 **⚙️ API 配置**
2. 填入你的代理地址，例如：`https://gemini-proxy.xxx.workers.dev`
3. 填入你的 Google AI Studio API Key
4. 点击 **💾 保存配置**

### 4. 生成图片

1. 在提示词输入框中描述你想生成的图片
2. 选择模型和生成数量
3. 点击 **✨ 生成图片** 或按 `Ctrl/Cmd + Enter`
4. 等待生成完成

## 快捷键

- `Ctrl/Cmd + Enter` - 生成图片（焦点在提示词输入框时）
- `Esc` - 关闭图片预览弹窗

## 模型说明

| 模型 | 说明 |
|------|------|
| Imagen 3 (推荐) | Google 最新的图片生成模型，效果最佳 |
| Gemini 2.0 Flash | Gemini 多模态模型，支持图片生成 |

## 数据存储

- 所有数据（配置、历史记录）保存在浏览器的 localStorage 中
- 最多保存 50 条历史记录
- 清除浏览器数据会清空所有记录

## 部署到 Cloudflare Pages（可选）

如果你想把前端也部署到云端：

1. Fork 或上传这个项目到 GitHub
2. 在 Cloudflare Dashboard 中创建 Pages 项目
3. 连接你的 GitHub 仓库
4. 设置构建配置：
   - 构建命令：留空
   - 构建输出目录：`frontend`
5. 部署

## License

MIT