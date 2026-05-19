import { ImageProvider, GenerateImageParams, GenerateImageResult } from "./types";

/**
 * 硅基流动 SiliconFlow - 国内大模型 API 平台
 * 注册即送免费额度，支持 FLUX 系列模型
 * 文档: https://docs.siliconflow.cn/
 *
 * 基础 URL:
 *   POST https://api.siliconflow.cn/v1/images/generations
 *
 * 支持参数:
 *   - model: 模型名称
 *   - prompt: 正向提示词
 *   - negative_prompt: 负面提示词
 *   - image_size: 尺寸 (如 "1024x1024")
 *   - seed: 随机种子
 *   - image: 参考图 base64 (img2img，部分模型支持)
 *   - strength: img2img 强度
 *
 * 常用模型（需账号有对应权限）:
 *   - Kwai-Kolors/Kolors (快手可图，中文理解好)
 *   - black-forest-labs/FLUX.1-schnell
 *   - black-forest-labs/FLUX.1-dev
 *   - stabilityai/stable-diffusion-xl-base-1.0
 */

const SILICONFLOW_API_URL = "https://api.siliconflow.cn/v1/images/generations";

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    // 本地上传的相对路径需要补全为绝对 URL
    const fetchUrl = url.startsWith("/")
      ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${url}`
      : url;

    const res = await fetch(fetchUrl);
    if (!res.ok) return null;

    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${base64}`;
  } catch (e) {
    console.error("[SiliconFlow] fetchImageAsBase64 error:", e);
    return null;
  }
}

export class SiliconFlowProvider implements ImageProvider {
  async generate(params: GenerateImageParams): Promise<GenerateImageResult> {
    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error:
          "未配置 SILICONFLOW_API_KEY，请前往 https://cloud.siliconflow.cn/ 注册获取 API Key",
      };
    }

    try {
      const model =
        process.env.SILICONFLOW_MODEL ||
        (params.model && params.model !== "default" ? params.model : undefined) ||
        "Qwen/Qwen-Image-Edit-2509";
      const body: Record<string, unknown> = {
        model,
        prompt: params.prompt,
        image_size: `${params.width}x${params.height}`,
      };
      console.log("[SiliconFlow] request model:", model);

      if (params.negativePrompt) {
        body.negative_prompt = params.negativePrompt;
      }

      // 种子：如传入则保持稳定，否则随机
      body.seed = params.seed ?? Math.floor(Math.random() * 2_147_483_647);

      // img2img: 如果有商品参考图，尝试以 base64 传入
      if (params.productImageUrl) {
        const base64Image = await fetchImageAsBase64(params.productImageUrl);
        if (base64Image) {
          body.image = base64Image;
          body.strength = params.editStrength ?? 0.75; // 保留产品结构的同时融入新场景
        }
      }

      // 风格参考图: SiliconFlow 目前只支持单张 image，
      // 若已有 productImageUrl 则忽略 style references；否则用第一张 style reference
      if (!params.productImageUrl && params.styleReferenceUrls && params.styleReferenceUrls.length > 0) {
        const base64Image = await fetchImageAsBase64(params.styleReferenceUrls[0]);
        if (base64Image) {
          body.image = base64Image;
          body.strength = params.editStrength ?? 0.65;
        }
      }

      const response = await fetch(SILICONFLOW_API_URL, {
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
        return {
          success: false,
          error: `SiliconFlow API 错误 (${response.status}): ${message}`,
        };
      }

      const data = (await response.json()) as {
        images?: Array<{ url: string }>;
        data?: Array<{ url: string }>;
      };

      const imageUrl = data.images?.[0]?.url || data.data?.[0]?.url;

      if (!imageUrl) {
        return {
          success: false,
          error: "SiliconFlow 返回结果中未包含图片 URL",
        };
      }

      return {
        success: true,
        imageUrl,
      };
    } catch (error) {
      console.error("SiliconFlow generate error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "调用 SiliconFlow API 失败",
      };
    }
  }
}
