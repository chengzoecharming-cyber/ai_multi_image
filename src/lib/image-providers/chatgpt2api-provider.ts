import { ImageProvider, GenerateImageParams, GenerateImageResult } from "./types";
import { generateImage, editImage } from "@/lib/chatgpt2api";

/**
 * ChatGPT2API Provider
 * 基于 OpenAI 兼容接口的图片生成后端
 *
 * 支持:
 *   - 文生图: POST /v1/images/generations (model: gpt-image-2)
 *   - 图生图: POST /v1/images/edits (单张参考图)
 *
 * 限制:
 *   - 尺寸只能是 1024x1024, 1024x1536, 1536x1024
 *   - 不支持 negativePrompt
 *   - 不支持 seed
 *   - 图生图只支持单张参考图 (productImageUrl)
 *   - 不支持 styleReferenceUrls
 */

const VALID_SIZES = ["1024x1024", "1024x1536", "1536x1024"] as const;

type ValidSize = (typeof VALID_SIZES)[number];

function resolveSize(width: number, height: number): ValidSize {
  // 优先按用户指定的宽高比映射到最近的支持尺寸
  const ratio = width / height;
  if (ratio > 1.1) return "1536x1024"; // 横向
  if (ratio < 0.9) return "1024x1536"; // 竖向
  return "1024x1024"; // 方形或接近方形
}

export class ChatGPT2APIProvider implements ImageProvider {
  async generate(params: GenerateImageParams): Promise<GenerateImageResult> {
    try {
      const size = resolveSize(params.width, params.height);

      // ChatGPT2API 不支持多张 style reference，只支持单张 product image（通过 edits）
      const hasReferenceImage = !!params.productImageUrl;

      if (hasReferenceImage) {
        // 图生图：使用 /v1/images/edits
        // 需要把图片 URL 转为 base64（如果是本地 URL）
        const imageUrl = params.productImageUrl!;

        // 如果图片 URL 是相对路径，转为绝对路径
        const resolvedUrl = imageUrl.startsWith("/")
          ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${imageUrl}`
          : imageUrl;

        // 下载图片转为 base64（chatgpt2api 需要 multipart form-data）
        const imageRes = await fetch(resolvedUrl, { signal: params.signal });
        if (!imageRes.ok) {
          return {
            success: false,
            error: `无法获取参考图: ${imageRes.status}`,
          };
        }

        const blob = await imageRes.blob();
        const file = new File([blob], "reference.png", { type: blob.type || "image/png" });

        const result = await editImage({
          prompt: params.prompt,
          image: file,
          model: params.model && params.model !== "default" ? params.model : undefined,
        });

        const imageUrlResult = result.data?.[0]?.url;
        if (!imageUrlResult) {
          return {
            success: false,
            error: "ChatGPT2API 未返回图片 URL",
          };
        }

        return { success: true, imageUrl: imageUrlResult };
      }

      // 文生图：使用 /v1/images/generations
      const result = await generateImage({
        prompt: params.prompt,
        model: params.model && params.model !== "default" ? params.model : undefined,
        n: 1,
        size,
        response_format: "url",
      });

      const imageUrlResult = result.data?.[0]?.url;
      if (!imageUrlResult) {
        return {
          success: false,
          error: "ChatGPT2API 未返回图片 URL",
        };
      }

      return { success: true, imageUrl: imageUrlResult };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      console.error("[ChatGPT2API] generate error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "调用 ChatGPT2API 失败",
      };
    }
  }
}
