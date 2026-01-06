/**
 * Gemini API Proxy + Template Management API
 * Cloudflare Workers
 */

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com";

// CORS 头
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-goog-api-key, x-admin-key",
};

// 默认模板数据（初始化用）
const defaultTemplates = [
  {
    id: 'professional-portrait',
    category: 'portrait',
    name: { zh: '职业形象照', en: 'Professional Portrait' },
    description: { zh: '商务风格的专业形象照，适合简历和社交媒体', en: 'Professional business portrait for resume and social media' },
    thumbnail: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    prompt: 'Professional corporate headshot portrait, wearing formal business attire, clean neutral background, soft studio lighting, confident and approachable expression, high-end photography style, sharp focus on face, subtle color grading',
    order: 1,
    active: true
  },
  {
    id: 'artistic-portrait',
    category: 'portrait',
    name: { zh: '艺术人像', en: 'Artistic Portrait' },
    description: { zh: '富有艺术感的人像摄影风格', en: 'Artistic portrait photography style' },
    thumbnail: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop',
    prompt: 'Artistic portrait photography, dramatic lighting with shadows, moody atmosphere, cinematic color grading, fine art photography style, ethereal and dreamy quality, professional retouching',
    order: 2,
    active: true
  },
  {
    id: 'casual-lifestyle',
    category: 'portrait',
    name: { zh: '休闲生活照', en: 'Casual Lifestyle' },
    description: { zh: '自然放松的生活方式照片', en: 'Natural and relaxed lifestyle photography' },
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    prompt: 'Casual lifestyle portrait, natural outdoor lighting, relaxed and genuine smile, candid moment, warm color tones, bokeh background, natural environment setting, authentic and approachable',
    order: 3,
    active: true
  },
  {
    id: 'vintage-film',
    category: 'creative',
    name: { zh: '复古胶片', en: 'Vintage Film' },
    description: { zh: '怀旧的胶片相机美学风格', en: 'Nostalgic film camera aesthetic' },
    thumbnail: 'https://images.unsplash.com/photo-1516914943479-89db7d9ae7f2?w=400&h=400&fit=crop',
    prompt: 'Vintage film photography style portrait, 35mm film grain texture, warm faded colors, soft vignette, nostalgic 1970s aesthetic, natural film bokeh, slightly overexposed highlights, authentic analog look',
    order: 4,
    active: true
  },
  {
    id: 'cyberpunk',
    category: 'creative',
    name: { zh: '赛博朋克', en: 'Cyberpunk' },
    description: { zh: '未来科幻风格的霓虹美学', en: 'Futuristic sci-fi neon aesthetics' },
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop',
    prompt: 'Cyberpunk style portrait, neon lights in pink and blue, futuristic urban background, rain-soaked streets, holographic elements, high contrast dramatic lighting, sci-fi aesthetic, blade runner inspired',
    order: 5,
    active: true
  },
  {
    id: 'anime-style',
    category: 'creative',
    name: { zh: '动漫风格', en: 'Anime Style' },
    description: { zh: '日式动漫插画风格', en: 'Japanese anime illustration style' },
    thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=400&fit=crop',
    prompt: 'Anime style portrait illustration, vibrant colors, clean line art, big expressive eyes, soft cel shading, beautiful detailed background, studio ghibli inspired, high quality digital art',
    order: 6,
    active: true
  },
  {
    id: 'fantasy-world',
    category: 'scene',
    name: { zh: '奇幻世界', en: 'Fantasy World' },
    description: { zh: '魔法奇幻场景中的人物', en: 'Character in magical fantasy setting' },
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=400&fit=crop',
    prompt: 'Fantasy portrait in magical world, ethereal lighting, mystical forest background, floating particles of light, elvish aesthetic, dramatic atmosphere, fantasy movie poster style, epic and magical',
    order: 7,
    active: true
  },
  {
    id: 'beach-sunset',
    category: 'scene',
    name: { zh: '海边日落', en: 'Beach Sunset' },
    description: { zh: '浪漫的海边黄昏场景', en: 'Romantic beach sunset scene' },
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop',
    prompt: 'Portrait at beach during golden hour sunset, warm orange and pink sky, gentle ocean waves, silhouette lighting, romantic atmosphere, summer vibes, professional vacation photography',
    order: 8,
    active: true
  },
  {
    id: 'urban-street',
    category: 'scene',
    name: { zh: '都市街拍', en: 'Urban Street' },
    description: { zh: '时尚的城市街头风格', en: 'Fashionable urban street style' },
    thumbnail: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=400&fit=crop',
    prompt: 'Urban street style portrait, modern city background, fashion photography, natural street lighting, trendy and stylish pose, contemporary architecture backdrop, magazine editorial style',
    order: 9,
    active: true
  },
  {
    id: 'chinese-ancient',
    category: 'creative',
    name: { zh: '古风汉服', en: 'Chinese Traditional' },
    description: { zh: '中国古典汉服风格', en: 'Traditional Chinese Hanfu style' },
    thumbnail: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=400&h=400&fit=crop',
    prompt: 'Chinese traditional Hanfu portrait, elegant ancient Chinese costume, classical garden background, soft natural lighting, graceful pose, traditional Chinese painting aesthetic, flowing silk fabric, cultural heritage photography',
    order: 10,
    active: true
  },
  {
    id: 'minimalist',
    category: 'portrait',
    name: { zh: '极简主义', en: 'Minimalist' },
    description: { zh: '简洁干净的极简风格', en: 'Clean and simple minimalist style' },
    thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    prompt: 'Minimalist portrait photography, clean white background, simple composition, soft diffused lighting, modern and elegant, negative space, high-key photography, contemporary art style',
    order: 11,
    active: true
  },
  {
    id: 'oil-painting',
    category: 'creative',
    name: { zh: '油画风格', en: 'Oil Painting' },
    description: { zh: '经典油画艺术风格', en: 'Classic oil painting art style' },
    thumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=400&fit=crop',
    prompt: 'Classical oil painting style portrait, Renaissance master technique, rich warm colors, dramatic chiaroscuro lighting, visible brushstroke texture, museum quality fine art, timeless elegance',
    order: 12,
    active: true
  }
];

// 辅助函数：JSON 响应
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
  });
}

// 辅助函数：错误响应
function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}

// 验证管理员密钥
function isAdmin(request, env) {
  const adminKey = request.headers.get("x-admin-key");
  return adminKey && adminKey === env.ADMIN_KEY;
}

// =========================================
// 模板 API 处理
// =========================================

async function handleTemplatesAPI(request, env, pathname) {
  const method = request.method;
  
  // GET /api/templates - 获取所有模板
  if (pathname === "/api/templates" && method === "GET") {
    return await getTemplates(env);
  }
  
  // GET /api/templates/:id - 获取单个模板
  const getMatch = pathname.match(/^\/api\/templates\/([^\/]+)$/);
  if (getMatch && method === "GET") {
    return await getTemplate(env, getMatch[1]);
  }
  
  // POST /api/templates - 创建模板
  if (pathname === "/api/templates" && method === "POST") {
    if (!isAdmin(request, env)) {
      return errorResponse("Unauthorized", 401);
    }
    const body = await request.json();
    return await createTemplate(env, body);
  }
  
  // PUT /api/templates/:id - 更新模板
  const putMatch = pathname.match(/^\/api\/templates\/([^\/]+)$/);
  if (putMatch && method === "PUT") {
    if (!isAdmin(request, env)) {
      return errorResponse("Unauthorized", 401);
    }
    const body = await request.json();
    return await updateTemplate(env, putMatch[1], body);
  }
  
  // DELETE /api/templates/:id - 删除模板
  const deleteMatch = pathname.match(/^\/api\/templates\/([^\/]+)$/);
  if (deleteMatch && method === "DELETE") {
    if (!isAdmin(request, env)) {
      return errorResponse("Unauthorized", 401);
    }
    return await deleteTemplate(env, deleteMatch[1]);
  }
  
  // POST /api/templates/init - 初始化默认模板
  if (pathname === "/api/templates/init" && method === "POST") {
    if (!isAdmin(request, env)) {
      return errorResponse("Unauthorized", 401);
    }
    return await initTemplates(env);
  }
  
  return errorResponse("Not found", 404);
}

// 获取所有模板
async function getTemplates(env) {
  try {
    // 尝试从 KV 获取
    if (env.TEMPLATES_KV) {
      const templatesJson = await env.TEMPLATES_KV.get("templates");
      if (templatesJson) {
        const templates = JSON.parse(templatesJson);
        // 只返回激活的模板，按 order 排序
        const activeTemplates = templates
          .filter(t => t.active !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        return jsonResponse(activeTemplates);
      }
    }
    // KV 为空或不可用，返回默认模板
    return jsonResponse(defaultTemplates);
  } catch (e) {
    console.error("Error getting templates:", e);
    return jsonResponse(defaultTemplates);
  }
}

// 获取单个模板
async function getTemplate(env, id) {
  try {
    if (env.TEMPLATES_KV) {
      const templatesJson = await env.TEMPLATES_KV.get("templates");
      if (templatesJson) {
        const templates = JSON.parse(templatesJson);
        const template = templates.find(t => t.id === id);
        if (template) {
          return jsonResponse(template);
        }
      }
    }
    // 从默认模板查找
    const template = defaultTemplates.find(t => t.id === id);
    if (template) {
      return jsonResponse(template);
    }
    return errorResponse("Template not found", 404);
  } catch (e) {
    console.error("Error getting template:", e);
    return errorResponse("Internal error", 500);
  }
}

// 创建模板
async function createTemplate(env, data) {
  if (!data.id || !data.name || !data.prompt) {
    return errorResponse("Missing required fields: id, name, prompt");
  }
  
  try {
    let templates = defaultTemplates;
    
    if (env.TEMPLATES_KV) {
      const templatesJson = await env.TEMPLATES_KV.get("templates");
      if (templatesJson) {
        templates = JSON.parse(templatesJson);
      }
    }
    
    // 检查 ID 是否已存在
    if (templates.find(t => t.id === data.id)) {
      return errorResponse("Template ID already exists");
    }
    
    const newTemplate = {
      id: data.id,
      category: data.category || 'creative',
      name: data.name,
      description: data.description || { zh: '', en: '' },
      thumbnail: data.thumbnail || '',
      prompt: data.prompt,
      order: data.order || templates.length + 1,
      active: data.active !== false,
      createdAt: new Date().toISOString()
    };
    
    templates.push(newTemplate);
    
    if (env.TEMPLATES_KV) {
      await env.TEMPLATES_KV.put("templates", JSON.stringify(templates));
    }
    
    return jsonResponse(newTemplate, 201);
  } catch (e) {
    console.error("Error creating template:", e);
    return errorResponse("Internal error", 500);
  }
}

// 更新模板
async function updateTemplate(env, id, data) {
  try {
    let templates = defaultTemplates;
    
    if (env.TEMPLATES_KV) {
      const templatesJson = await env.TEMPLATES_KV.get("templates");
      if (templatesJson) {
        templates = JSON.parse(templatesJson);
      }
    }
    
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) {
      return errorResponse("Template not found", 404);
    }
    
    // 更新字段
    const updated = {
      ...templates[index],
      ...data,
      id: id, // ID 不可更改
      updatedAt: new Date().toISOString()
    };
    
    templates[index] = updated;
    
    if (env.TEMPLATES_KV) {
      await env.TEMPLATES_KV.put("templates", JSON.stringify(templates));
    }
    
    return jsonResponse(updated);
  } catch (e) {
    console.error("Error updating template:", e);
    return errorResponse("Internal error", 500);
  }
}

// 删除模板
async function deleteTemplate(env, id) {
  try {
    let templates = defaultTemplates;
    
    if (env.TEMPLATES_KV) {
      const templatesJson = await env.TEMPLATES_KV.get("templates");
      if (templatesJson) {
        templates = JSON.parse(templatesJson);
      }
    }
    
    const index = templates.findIndex(t => t.id === id);
    if (index === -1) {
      return errorResponse("Template not found", 404);
    }
    
    templates.splice(index, 1);
    
    if (env.TEMPLATES_KV) {
      await env.TEMPLATES_KV.put("templates", JSON.stringify(templates));
    }
    
    return jsonResponse({ success: true, message: "Template deleted" });
  } catch (e) {
    console.error("Error deleting template:", e);
    return errorResponse("Internal error", 500);
  }
}

// 初始化默认模板
async function initTemplates(env) {
  try {
    if (env.TEMPLATES_KV) {
      await env.TEMPLATES_KV.put("templates", JSON.stringify(defaultTemplates));
      return jsonResponse({ success: true, message: "Templates initialized", count: defaultTemplates.length });
    }
    return errorResponse("KV not available", 500);
  } catch (e) {
    console.error("Error initializing templates:", e);
    return errorResponse("Internal error", 500);
  }
}

// =========================================
// Gemini API 代理
// =========================================

async function handleGeminiProxy(request, env, url) {
  // 获取 API Key
    let apiKey = request.headers.get("x-goog-api-key");
    if (!apiKey) {
      const authHeader = request.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        apiKey = authHeader.substring(7);
      }
    }
    if (!apiKey && env.GEMINI_API_KEY) {
      apiKey = env.GEMINI_API_KEY;
    }

    if (!apiKey) {
    return errorResponse("API key is required", 401);
    }

    // 构建目标 URL
    const targetUrl = new URL(url.pathname + url.search, GEMINI_API_BASE);
    targetUrl.searchParams.set("key", apiKey);

  // 准备请求头
    const headers = new Headers();
  headers.set("Content-Type", request.headers.get("Content-Type") || "application/json");
    headers.set("Accept-Language", "en-US,en;q=0.9");

    // 获取请求体
    let body = null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.arrayBuffer();
    }

  const colo = request.cf?.colo || "unknown";
  const country = request.cf?.country || "unknown";

    try {
      let response = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: headers,
        body: body,
      });

    // 处理地区限制
      if (response.status === 400 || response.status === 403) {
        const responseText = await response.text();
        if (
          responseText.includes("User location is not supported") ||
          responseText.includes("unsupported_country_region_territory")
        ) {
        headers.set("X-Forwarded-For", "8.8.8.8");
          headers.set("CF-IPCountry", "US");

          response = await fetch(targetUrl.toString(), {
            method: request.method,
            headers: headers,
            body: body,
          });

          if (response.status === 400 || response.status === 403) {
            const retryText = await response.text();
            if (
              retryText.includes("User location is not supported") ||
              retryText.includes("unsupported_country_region_territory")
            ) {
            return jsonResponse({
                  error: "Region restriction detected",
              message: `Google API 检测到请求来自不支持的地区。当前数据中心: ${colo} (${country})`,
              suggestion: "请尝试使用 VPN 或等待 Cloudflare 路由到其他数据中心",
            }, 403);
          }
            return new Response(retryText, {
              status: response.status,
            headers: { "Content-Type": "application/json", ...corsHeaders },
            });
          }
        } else {
          return new Response(responseText, {
            status: response.status,
            headers: {
            "Content-Type": response.headers.get("Content-Type") || "application/json",
              ...corsHeaders,
            },
          });
        }
      }

    // 返回响应
      const responseHeaders = new Headers(response.headers);
      Object.keys(corsHeaders).forEach((key) => {
        responseHeaders.set(key, corsHeaders[key]);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
    return jsonResponse({
          error: "Proxy request failed",
          message: error.message,
          datacenter: colo,
          country: country,
    }, 500);
  }
}

// =========================================
// 主入口
// =========================================

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检请求
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // 健康检查
    if (pathname === "/" || pathname === "/health") {
      return jsonResponse({
        status: "ok",
        message: "Gemini API Proxy + Template API",
        endpoints: {
          templates: "/api/templates",
          gemini: "/v1beta/models/{model}:generateContent",
        },
      });
    }

    // 模板 API
    if (pathname.startsWith("/api/templates")) {
      return await handleTemplatesAPI(request, env, pathname);
    }

    // Gemini API 代理
    if (pathname.startsWith("/v1beta/")) {
      return await handleGeminiProxy(request, env, url);
    }

    return errorResponse("Not found", 404);
  },
};
