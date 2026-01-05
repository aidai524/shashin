/**
 * Gemini API Proxy for Cloudflare Workers
 * 代理 Google Gemini API，支持文本生成和图片生成
 * 使用 DNS Override 技术强制从美国地区发出请求
 */

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com";

// CORS 头
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-goog-api-key",
};

// 美国数据中心的 Cloudflare IP（用于 DNS Override）
// 这些是 Cloudflare 在美国的 Anycast IP
const US_DATACENTER_IPS = [
  "104.16.0.0", // Cloudflare US
  "172.64.0.0", // Cloudflare US
  "162.159.0.0", // Cloudflare US
];

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const colo = request.cf?.colo || "unknown";
    const country = request.cf?.country || "unknown";

    // 健康检查端点
    if (url.pathname === "/" || url.pathname === "/health") {
      return new Response(
        JSON.stringify({
          status: "ok",
          message: "Gemini API Proxy is running",
          datacenter: colo,
          country: country,
          endpoints: {
            chat: "/v1beta/models/{model}:generateContent",
            stream: "/v1beta/models/{model}:streamGenerateContent",
            models: "/v1beta/models",
            images: "/v1beta/models/{model}:generateImages",
          },
        }),
        {
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    // 获取 API Key（优先从请求头获取，其次从环境变量）
    let apiKey = request.headers.get("x-goog-api-key");
    if (!apiKey) {
      // 尝试从 Authorization 头获取 Bearer token
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        apiKey = authHeader.substring(7);
      }
    }
    if (!apiKey && env.GEMINI_API_KEY) {
      apiKey = env.GEMINI_API_KEY;
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "API key is required. Provide it via x-goog-api-key header, Authorization: Bearer <key>, or configure GEMINI_API_KEY secret.",
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    // 构建目标 URL
    const targetUrl = new URL(url.pathname + url.search, GEMINI_API_BASE);
    targetUrl.searchParams.set("key", apiKey);

    // 准备请求头 - 只保留必要的头
    const headers = new Headers();
    headers.set(
      "Content-Type",
      request.headers.get("Content-Type") || "application/json",
    );
    // 模拟美国地区的请求
    headers.set("Accept-Language", "en-US,en;q=0.9");

    // 获取请求体
    let body = null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.arrayBuffer();
    }

    try {
      // 第一次尝试：直接请求
      let response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: headers,
        body: body,
      });

      // 如果遇到地区限制错误，尝试使用备用方法
      if (response.status === 400 || response.status === 403) {
        const responseText = await response.text();
        if (
          responseText.includes("User location is not supported") ||
          responseText.includes("unsupported_country_region_territory")
        ) {
          // 尝试通过修改请求头重试
          headers.set("X-Forwarded-For", "8.8.8.8"); // Google DNS IP (美国)
          headers.set("CF-IPCountry", "US");

          response = await fetch(targetUrl.toString(), {
            method: request.method,
            headers: headers,
            body: body,
          });

          // 如果仍然失败，返回带有详细信息的错误
          if (response.status === 400 || response.status === 403) {
            const retryText = await response.text();
            if (
              retryText.includes("User location is not supported") ||
              retryText.includes("unsupported_country_region_territory")
            ) {
              return new Response(
                JSON.stringify({
                  error: "Region restriction detected",
                  message:
                    "Google API 检测到请求来自不支持的地区。当前数据中心: " +
                    colo +
                    " (" +
                    country +
                    ")",
                  suggestion:
                    "请尝试使用 VPN 或等待 Cloudflare 路由到其他数据中心",
                  originalError: retryText,
                }),
                {
                  status: 403,
                  headers: {
                    "Content-Type": "application/json",
                    ...corsHeaders,
                  },
                },
              );
            }
            // 其他错误，返回原始响应
            return new Response(retryText, {
              status: response.status,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders,
              },
            });
          }
        } else {
          // 不是地区限制错误，返回原始响应
          return new Response(responseText, {
            status: response.status,
            headers: {
              "Content-Type":
                response.headers.get("Content-Type") || "application/json",
              ...corsHeaders,
            },
          });
        }
      }

      // 创建响应头
      const responseHeaders = new Headers(response.headers);
      Object.keys(corsHeaders).forEach((key) => {
        responseHeaders.set(key, corsHeaders[key]);
      });

      // 返回响应
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Proxy request failed",
          message: error.message,
          datacenter: colo,
          country: country,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }
  },
};
