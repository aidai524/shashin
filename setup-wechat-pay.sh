#!/bin/bash

# 微信支付配置脚本
# 请将以下变量的值替换为您的实际信息

# 微信支付商户号
MCHID="1105396457"

# 商户证书序列号（从证书中获取）
CERT_SERIAL=""  # 需要从证书中提取

# 商户私钥（PEM 格式，已提供）
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDgDg6BomXM+oxG
hHMpyfrG3xHKF5PNDBTN+wtzscaYLGQ7P7ac2atsKwf+ac+EgKU6qyzfGj/0ohmo
KpMXd4GW39OqA4KNyIfBjc0dpl3O1FYiQPA3gVAL2Z9Rh2qYHuEtj6KSJTmfxlKO
tofTiVcVYP13NO0uqsDFJ0JrcvcZ/aLjLkZNtJcAaBt/MRbIsQi+U7uhrIVz+m8W
oqO5feiIsEruPmwZUCi6F+nsOaDQ+/1LZQn8H3smM+Kjw/N+5dyMHgu0ubW3nKur
L7PMA7eDN9D8LkpbAk0CVZPpuH1/PkOK/Phc64RpJGm9nLSXduJNZJnU+0lpBQpp
A0v6THmzAgMBAAECggEAIaha64Ru0IUOz4UUG8H4xyk5beduz42yDmNZDA83qyJ4
CCKBFzznsH8iW0if4OLGb3LJcdZqpyA2xHlo0UyljfmfvVl7ojrukdfwaTTVwL1L
Fyg0LdJiKPWPJls2WxXAc+yw2k13Q5YyTrgC3XczOsXwLZkozCrgfH1yT9vcXO3i
FVfNdDQpkre4eZJof8c/zxCHBrECwIsBD+KuYPbYTB6O3bhcTPIBmOhAMvldOqEz
6PDVIZepxceOeJYRsRc3Fl4MapFm3YnOUVAzMaL8sUCpxhW4IdrohjLI5YF8ua3T
XCTi1zkXC3j7hlkS8oYW1lRlqt4/Cvog1maiP5c3YQKBgQD+WkzF9BFtdNt24tU8
DVDa0BarP7umkW1jNQxWos9WXrhOYiccwzUULdO4PHxi81TGrdWzqQLaULYho1Qk
KdAxvRBGEBTnK1uF4JnK/Qunyxz3pVImA9o9f3H5rQTz6BpqJxcDzjuEGYtBISlX
AXgAgKnodR7yD6ktPbzwrI+l8QKBgQDhgYZkWD5AER6RLcwA85nQGnyqQ07wKZ+m
G69B1qgW4ml9fTYfe5gdZCXLM98/lQqb5MNQv7teC+7cU8Mxxpchu0m29h21sMV0
co1DYZ8Yrxk8cYa3X2ylknT1AZYfO82R70SoptH0SGu0k7KziVTJZeGRR6DL6jel
gj4mGHil4wKBgEpSfIiDTuxa7x4IHiLUCUJG97jGgMClUf9hKt/N5yPnvZc52w/u
gn4I/gqhsf7/90+uz/kVc73zQ6UEoruGdE10X2L5pAIAi1fNT2MfGd7H3QkIB78P
9R9vNBCu2/mhYsaN8Y2tH3r0M9quI/RGe5g6AGvqfUZiCR8tIR56bechAoGBAIRM
ijz6rGLH6GgCN0pjoFy//V2iqYAq21gHq/VzayAp6vvNZuBnkWHE7Itfvl0+IoA9
YP1Rzyoo1BT9K2pbeTU3/NJTaDC9KcrcndXnQwCnUaXtcLzKRiKJXwaSzLE8U6mH
d39+h3TKvC2v7Up5in2xwPmLzWF04vq+A5o0ByxDAoGBAJlBZMqrJqoPT76wBqpN
sqc0KgJ11dm/GPFR+Hoys6Ls3T2QoqltTkxhKioBhrwwG2DTbbtBfP0sDMgNj1e2
wdi9UKLG8vhQILitJj+6h9Y+IxNhnFVjhFLlhDo/2Y+Zp0JxwNy2qh+UBBKLkXGQ
2TWdQ7lWmylJkLTqVxN12x1q
-----END PRIVATE KEY-----"

# API v3 密钥（32字节）
APIV3_KEY="kQeLkJowpricPQ4R2pffoVx5NKgCHKZc"

# 应用 AppID（暂时为空，因为还没有注册微信开放平台应用）
APPID=""  # 需要您提供

# 支付回调地址
NOTIFY_URL="https://iapi.sendto.you/api/payment/wechat/notify"

echo "配置 Cloudflare Workers Secrets..."
echo ""

# 设置 Secrets
echo "1. 设置商户号..."
wrangler secret put WECHAT_PAY_MCHID << EOF
$MCHID
EOF

echo "2. 设置证书序列号..."
# 需要从证书中提取序列号
openssl x509 -in certificate.pem -noout -serial | cut -d'=' -f2 | tr -d ':'

echo "3. 设置商户私钥..."
wrangler secret put WECHAT_PAY_PRIVATE_KEY << 'EOF'
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDgDg6BomXM+oxG
hHMpyfrG3xHKF5PNDBTN+wtzscaYLGQ7P7ac2atsKwf+ac+EgKU6qyzfGj/0ohmo
KpMXd4GW39OqA4KNyIfBjc0dpl3O1FYiQPA3gVAL2Z9Rh2qYHuEtj6KSJTmfxlKO
tofTiVcVYP13NO0uqsDFJ0JrcvcZ/aLjLkZNtJcAaBt/MRbIsQi+U7uhrIVz+m8W
oqO5feiIsEruPmwZUCi6F+nsOaDQ+/1LZQn8H3smM+Kjw/N+5dyMHgu0ubW3nKur
L7PMA7eDN9D8LkpbAk0CVZPpuH1/PkOK/Phc64RpJGm9nLSXduJNZJnU+0lpBQpp
A0v6THmzAgMBAAECggEAIaha64Ru0IUOz4UUG8H4xyk5beduz42yDmNZDA83qyJ4
CCKBFzznsH8iW0if4OLGb3LJcdZqpyA2xHlo0UyljfmfvVl7ojrukdfwaTTVwL1L
Fyg0LdJiKPWPJls2WxXAc+yw2k13Q5YyTrgC3XczOsXwLZkozCrgfH1yT9vcXO3i
FVfNdDQpkre4eZJof8c/zxCHBrECwIsBD+KuYPbYTB6O3bhcTPIBmOhAMvldOqEz
6PDVIZepxceOeJYRsRc3Fl4MapFm3YnOUVAzMaL8sUCpxhW4IdrohjLI5YF8ua3T
XCTi1zkXC3j7hlkS8oYW1lRlqt4/Cvog1maiP5c3YQKBgQD+WkzF9BFtdNt24tU8
DVDa0BarP7umkW1jNQxWos9WXrhOYiccwzUULdO4PHxi81TGrdWzqQLaULYho1Qk
KdAxvRBGEBTnK1uF4JnK/Qunyxz3pVImA9o9f3H5rQTz6BpqJxcDzjuEGYtBISlX
AXgAgKnodR7yD6ktPbzwrI+l8QKBgQDhgYZkWD5AER6RLcwA85nQGnyqQ07wKZ+m
G69B1qgW4ml9fTYfe5gdZCXLM98/lQqb5MNQv7teC+7cU8Mxxpchu0m29h21sMV0
co1DYZ8Yrxk8cYa3X2ylknT1AZYfO82R70SoptH0SGu0k7KziVTJZeGRR6DL6jel
gj4mGHil4wKBgEpSfIiDTuxa7x4IHiLUCUJG97jGgMClUf9hKt/N5yPnvZc52w/u
gn4I/gqhsf7/90+uz/kVc73zQ6UEoruGdE10X2L5pAIAi1fNT2MfGd7H3QkIB78P
9R9vNBCu2/mhYsaN8Y2tH3r0M9quI/RGe5g6AGvqfUZiCR8tIR56bechAoGBAIRM
ijz6rGLH6GgCN0pjoFy//V2iqYAq21gHq/VzayAp6vvNZuBnkWHE7Itfvl0+IoA9
YP1Rzyoo1BT9K2pbeTU3/NJTaDC9KcrcndXnQwCnUaXtcLzKRiKJXwaSzLE8U6mH
d39+h3TKvC2v7Up5in2xwPmLzWF04vq+A5o0ByxDAoGBAJlBZMqrJqoPT76wBqpN
sqc0KgJ11dm/GPFR+Hoys6Ls3T2QoqltTkxhKioBhrwwG2DTbbtBfP0sDMgNj1e2
wdi9UKLG8vhQILitJj+6h9Y+IxNhnFVjhFLlhDo/2Y+Zp0JxwNy2qh+UBBKLkXGQ
2TWdQ7lWmylJkLTqVxN12x1q
-----END PRIVATE KEY-----
EOF

echo "4. 设置 API v3 密钥..."
wrangler secret put WECHAT_PAY_APIV3_KEY << EOF
$APIV3_KEY
EOF

echo "5. 设置 AppID..."
if [ -n "$APPID" ]; then
  wrangler secret put WECHAT_PAY_APPID << EOF
$APPID
EOF
else
  echo "警告：AppID 为空，请后续配置"
fi

echo "6. 设置支付回调地址..."
wrangler secret put WECHAT_PAY_NOTIFY_URL << EOF
$NOTIFY_URL
EOF

echo ""
echo "✅ 配置完成！"
echo ""
echo "注意事项："
echo "1. 证书序列号需要从商户证书中提取，可以使用以下命令："
echo "   openssl x509 -in certificate.pem -noout -serial | cut -d'=' -f2 | tr -d ':'"
echo ""
echo "2. AppID 需要您注册微信开放平台应用后获取"
echo ""
echo "3. 所有 Secrets 已配置到 Cloudflare Workers"
