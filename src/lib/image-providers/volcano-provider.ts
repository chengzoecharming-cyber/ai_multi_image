import { ImageProvider, GenerateImageParams, GenerateImageResult } from "./types";

/**
 * 火山引擎方舟 - Seedream 文生图/图生图
 * 文档: https://www.volcengine.com/docs/82379/1541523
 *
 * Endpoint:
 *   POST https://ark.cn-beijing.volces.com/api/v3/images/generations
 *
 * 支持参数:
 *   - model: 模型名称或 Endpoint ID（如 doubao-seedream-5-0-260128）
 *   - prompt: 正向提示词
 *   - image: 参考图 base64 或 URL（图生图）
 *   - size: 尺寸 (如 "1024x1024")
 */

const VOLCANO_API_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const MIN_PIXELS = 3_686_400; // Seedream 5.0 最小像素要求 (2560×1440)
const MAX_PIXELS = 16_777_216; // 4K x 4K

/** 放大尺寸到满足 Seedream 最小像素要求，保持宽高比 */
function normalizeSize(width: number, height: number): { width: number; height: number } {
  const pixels = width * height;
  if (pixels >= MIN_PIXELS && pixels <= MAX_PIXELS) {
    return { width, height };
  }
  const ratio = width / height;
  if (pixels < MIN_PIXELS) {
    // 放大到最小像素
    const scale = Math.sqrt(MIN_PIXELS / pixels);
    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
    };
  }
  // 缩小到最大像素
  const scale = Math.sqrt(MAX_PIXELS / pixels);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

async function fetchImageAsBase64(url: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const fetchUrl = url.startsWith("/")
      ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${url}`
      : url;

    const res = await fetch(fetchUrl, { signal });
    if (!res.ok) return null;

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${base64}`;
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") throw e;
    console.error("[Volcano] fetchImageAsBase64 error:", e);
    return null;
  }
}

export class VolcanoProvider implements ImageProvider {
  async generate(params: GenerateImageParams): Promise<GenerateImageResult> {
    const apiKey = process.env.VOLCANO_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "未配置 VOLCANO_API_KEY，请前往火山引擎控制台获取 API Key",
      };
    }

    try {
      const model =
        process.env.VOLCANO_MODEL ||
        (params.model && params.model !== "default" ? params.model : undefined) ||
        "doubao-seedream-5-0-260128";

      const body: Record<string, unknown> = {
        model,
        prompt: params.prompt,
        watermark: false,
      };

      if (params.productImageUrl || (params.styleReferenceUrls && params.styleReferenceUrls.length > 0)) {
        const imageUrl = params.productImageUrl || params.styleReferenceUrls?.[0];
        if (imageUrl) {
          // Local dev: base64 (Seedream server can't access localhost)
          // Production: could switch to URL if images are on public CDN
          const base64Image = await fetchImageAsBase64(imageUrl, params.signal);
          if (base64Image) {
            body.image = base64Image;
            if (params.editStrength !== undefined) {
              body.strength = params.editStrength;
            }
          }
        }
      }

      if (params.seed !== undefined) {
        body.seed = params.seed;
      }

      // size 参数（自动适配到 Seedream 像素要求）
      const { width, height } = normalizeSize(params.width, params.height);
      const size = `${width}x${height}`;
      body.size = size;

      console.log("[Volcano] request model:", model, "size:", size);
      console.log("[Volcano] has image:", !!body.image, "strength:", body.strength, "seed:", body.seed);
      console.log("[Volcano] prompt length:", params.prompt.length);
      console.log("[Volcano] prompt preview:", params.prompt.substring(0, 400));

      const response = await fetch(VOLCANO_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: params.signal,
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        const errObj = (errorData.error || errorData) as Record<string, unknown>;
        const message = String(errObj.message || errorData.message || response.statusText);
        console.error("[Volcano] API error:", response.status, message);
        return {
          success: false,
          error: `火山引擎 API 错误 (${response.status}): ${message}`,
        };
      }

      const data = (await response.json()) as {
        data?: Array<{ url: string }>;
      };

      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        return {
          success: false,
          error: "火山引擎返回结果中未包含图片 URL",
        };
      }

      return {
        success: true,
        imageUrl,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error; // let caller handle timeout
      }
      console.error("Volcano generate error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "调用火山引擎 API 失败",
      };
    }
  }
}
