# 微信支付接入配置说明

## 当前进度

✅ 数据库表已扩展
✅ 微信支付 SDK 已创建
✅ 支付 API 已实现
⚠️ **需要配置 Secrets 才能部署**

## 需要您提供的信息

### 1. 证书序列号（CERT_SERIAL）

从您提供的商户证书中提取，使用以下命令：

```bash
# 将证书保存为文件
cat > certificate.pem << 'EOF'
-----BEGIN CERTIFICATE-----
MIIEKDCCAxCgAwIBAgIUTN0sxpEaRapyC52SlrBa1P4+wKEwDQYJKoZIhvcNAQEL
... (您的证书内容)
-----END CERTIFICATE-----
EOF

# 提取序列号
openssl x509 -in certificate.pem -noout -serial
# 输出格式：serial=XXXXXXXX
# 只需要冒号后面的部分，并去掉冒号
```

### 2. 应用 AppID

由于您说"暂时没有"，这里有几个选择：

**选项 A：使用测试环境**
- 微信支付提供了沙箱环境用于测试
- 可以使用沙箱商户号和测试 AppID

**选项 B：使用 Native 支付（推荐）**
- Native 支付不需要 AppID
- 生成二维码让用户扫码支付
- 适合 PC 网站使用

**选项 C：注册微信开放平台应用**
- 注册微信公众号或小程序
- 获取正式的 AppID

### 3. 环境变量配置

#### 方法 1：使用 wrangler 命令行（推荐）

```bash
# 1. 商户号
echo "1105396457" | wrangler secret put WECHAT_PAY_MCHID

# 2. 证书序列号（需要从证书中提取）
echo "您的证书序列号" | wrangler secret put WECHAT_PAY_CERT_SERIAL

# 3. 商户私钥（使用您提供的私钥）
cat | wrangler secret put WECHAT_PAY_PRIVATE_KEY << 'EOF'
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDgDg6BomXM+oxG
... (完整内容)
-----END PRIVATE KEY-----
EOF

# 4. API v3 密钥
echo "kQeLkJowpricPQ4R2pffoVx5NKgCHKZc" | wrangler secret put WECHAT_PAY_APIV3_KEY

# 5. AppID（暂时可以为空，使用测试模式）
echo "" | wrangler secret put WECHAT_PAY_APPID

# 6. 支付回调地址
echo "https://iapi.sendto.you/api/payment/wechat/notify" | wrangler secret put WECHAT_PAY_NOTIFY_URL
```

#### 方法 2：使用 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Workers & Pages
3. 选择您的 Worker（gemini-proxy）
4. 点击 Settings → Variables and Secrets
5. 添加以下 Secrets：

| Name | Value | 说明 |
|------|-------|------|
| `WECHAT_PAY_MCHID` | `1105396457` | 商户号 |
| `WECHAT_PAY_CERT_SERIAL` | *(从证书提取)* | 证书序列号 |
| `WECHAT_PAY_PRIVATE_KEY` | *(您提供的私钥)* | 商户私钥 |
| `WECHAT_PAY_APIV3_KEY` | `kQeLkJowpricPQ4R2pffoVx5NKgCHKZc` | API v3 密钥 |
| `WECHAT_PAY_APPID` | *(暂时留空)* | 应用 AppID |
| `WECHAT_PAY_NOTIFY_URL` | `https://iapi.sendto.you/api/payment/wechat/notify` | 支付回调地址 |

## 下一步

### 步骤 1：提取证书序列号

请运行以下命令提取序列号：

```bash
# 保存证书
cat > cert.pem << 'EOF'
-----BEGIN CERTIFICATE-----
MIIEKDCCAxCgAwIBAgIUTN0sxpEaRapyC52SlrBa1P4+wKEwDQYJKoZIhvcNAQEL
BQAwXjELMAkGA1UEBhMCQ04xEzARBgNVBAoTClRlbnBheS5jb20xHTAbBgNVBAsT
FFRlbnBheS5jb20gQ0EgQ2VudGVyMRswGQYDVQQDExJUZW5wYXkuY29tIFJvb3Qg
Q0EwHhcNMjYwMTE1MDkzNjAxWhcNMzEwMTE0MDkzNjAxWjCBgTETMBEGA1UEAwwK
MTEwNTM5NjQ1NzEbMBkGA1UECgwS5b6u5L+h5ZWG5oi357O757ufMS0wKwYDVQQL
DCTljZfkuqzniZvmtL7mmbrog73np5HmioDmnInpmZDlhazlj7gxCzAJBgNVBAYT
AkNOMREwDwYDVQQHDAhTaGVuWmhlbjCCASIwDQYJKoZIhvcNAQEBBQADggEPADCC
AQoCggEBAOAODoGiZcz6jEaEcynJ+sbfEcoXk80MFM37C3OxxpgsZDs/tpzZq2wr
B/5pz4SApTqrLN8aP/SiGagqkxd3gZbf06oDgo3Ih8GNzR2mXc7UViJA8DeBUAvZ
n1GHapge4S2PopIlOZ/GUo62h9OJVxVg/Xc07S6qwMUnQmty9xn9ouMuRk20lwBo
G38xFsixCL5Tu6GshXP6bxaio7l96IiwSu4+bBlQKLoX6ew5oND7/UtlCfwfeyYz
4qPD837l3IweC7S5tbecq6svs8wDt4M30PwuSlsCTQJVk+m4fX8+Q4r8+FzrhGkk
ab2ctJd24k1kmdT7SWkFCmkDS/pMebMCAwEAAaOBuTCBtjAJBgNVHRMEAjAAMAsG
A1UdDwQEAwID+DCBmwYDVR0fBIGTMIGQMIGNoIGKoIGHhoGEaHR0cDovL2V2Y2Eu
aXRydXMuY29tLmNuL3B1YmxpYy9pdHJ1c2NybD9DQT0xQkQ0MjIwRTUwREJDMDRC
MDZBRDM5NzU0OTg0NkMwMUMzRThFQkQyJnNnPUhBQ0M0NzFCNjU0MjJFMTJCMjdB
OUQzM0E4N0FEMUNERjU5MjZFMTQwMzcxMA0GCSqGSIb3DQEBCwUAA4IBAQClqYU2
Y0MyiCXX2Ggmo9ILcXLcyjl+qIoWokf6vNxn3yHZHRMXLOVsEWHjdypBaILcnL5S
cFdemSr7qAGnoG3Oox98Sc9YpVwr6ug4AqhK9B28DDdV/TdaZIftOGqQJvMAzc1u
Dp97yB6PT10JEquV1d9Fc2FhjMB5rVmho95CWal7rWkurEO+lYT0tSMIGgSanq5s
FChyCrROrkUupnavCnpyaZ0cIiWGdfjk7eY0G9j1rv6jj23Vw0g013iAKFiefIj0
XjUdd2dG9S9irHhB/M3QfBAjZAIVjUNsU7xXg4yOZrtrG6yRBIiB6OZ+AUNwBZa5
aF8KE0XcT1ec9f24
-----END CERTIFICATE-----
EOF

# 提取序列号
openssl x509 -in cert.pem -noout -serial | cut -d'=' -f2 | tr -d ':'
```

将输出的序列号告诉我，我会帮您完成配置。

### 步骤 2：确认 AppID

请告诉我：
1. 您是否有微信开放平台账号（公众号/小程序/App）？
2. 如果没有，是否使用**Native 支付**（扫码支付）？

### 步骤 3：我帮您完成部署

一旦您提供了证书序列号和 AppID 决策，我将：
1. 配置所有 Secrets
2. 部署后端代码
3. 创建前端收银台页面
4. 进行端到端测试

## 测试流程

配置完成后，测试流程如下：

1. **创建订单**
   ```bash
   POST /api/orders/create
   {
     "product_type": "subscription",
     "product_id": "standard",
     "promo_code": "TEST2024"
   }
   ```

2. **创建支付**
   ```bash
   POST /api/payment/wechat/create
   {
     "order_no": "ORD2024..."
   }
   ```

3. **扫码支付**
   - 返回 `code_url`，生成二维码
   - 使用微信扫码支付

4. **支付成功回调**
   - 微信服务器自动回调 `/api/payment/wechat/notify`
   - 系统自动发放订阅和积分

5. **查询结果**
   ```bash
   POST /api/payment/wechat/query
   {
     "order_no": "ORD2024..."
   }
   ```

## 紧急问题

如果遇到问题，请提供：
- 错误日志
- 请求和响应详情
- Cloudflare Workers 日志

我会帮您快速定位和解决问题！
