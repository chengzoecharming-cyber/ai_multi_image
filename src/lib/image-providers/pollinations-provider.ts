import { ImageProvider, GenerateImageParams, GenerateImageResult } from "./types";

/**
 * Pollinations AI - 完全免费的生图 API
 * 无需注册、无需 API Key
 * 文档: https://pollinations.ai/
 *
 * 基础 URL 格式:
 *   GET https://image.pollinations.ai/prompt/{encodedPrompt}
 *
 * 支持参数:
 *   - width / height: 图片尺寸
 *   - seed: 种子值，保证相同 prompt 输出一致
 *   - nologo: 去掉水印
 *   - negative_prompt: 负面提示词（URL 中传递）
 *   - image: 参考图 URL（支持 img2img）
 *   - seed: 随机种子
 *   - model: 模型名称 (如 'flux', 'turbo', 'any-dark' 等)
 *
 * 限制:
 *   - 不支持多张 style reference
 *   - 仅支持单张 product image 作为 img2img 参考
 */

const POLLINATIONS_BASE_URL = "https://image.pollinations.ai/prompt";

function encodePrompt(prompt: string): string {
  // Pollinations expects the prompt to be URI-encoded in the path
  return encodeURIComponent(prompt);
}

function buildPollinationsUrl(params: GenerateImageParams): string {
  const {
    prompt,
    negativePrompt,
    productImageUrl,
    width,
    height,
    seed,
    model,
  } = params;

  const encodedPrompt = encodePrompt(prompt);
  const url = new URL(`${POLLINATIONS_BASE_URL}/${encodedPrompt}`);

  // 尺寸
  if (width) url.searchParams.set("width", String(width));
  if (height) url.searchParams.set("height", String(height));

  // 去水印
  url.searchParams.set("nologo", "true");

  // 种子：如传入则保持稳定，否则随机
  url.searchParams.set(
    "seed",
    String(seed ?? Math.floor(Math.random() * 1000000))
  );

  // 负面提示词
  if (negativePrompt) {
    url.searchParams.set("negative_prompt", negativePrompt);
  }

  // 参考图（img2img）— Pollinations 支持单张 image 参数
  if (productImageUrl) {
    url.searchParams.set("image", productImageUrl);
  }

  // 模型选择（可选，默认 flux）
  if (model && model !== "default") {
    url.searchParams.set("model", model);
  }

  return url.toString();
}

export class PollinationsProvider implements ImageProvider {
  async generate(params: GenerateImageParams): Promise<GenerateImageResult> {
    try {
      const imageUrl = buildPollinationsUrl(params);

      // Pollinations 返回的就是图片二进制，我们只需要验证它可访问
      // 但为了性能，直接返回构造好的 URL，让前端/浏览器自己去加载
      // 这里做一个 HEAD 请求验证 URL 是否有效
      const checkRes = await fetch(imageUrl, { method: "HEAD" });
      if (!checkRes.ok) {
        return {
          success: false,
          error: `Pollinations API 返回错误: ${checkRes.status} ${checkRes.statusText}`,
        };
      }

      return {
        success: true,
        imageUrl,
      };
    } catch (error) {
      console.error("Pollinations generate error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "调用 Pollinations API 失败",
      };
    }
  }
}
