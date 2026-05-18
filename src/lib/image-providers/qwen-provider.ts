import { ImageProvider, GenerateImageParams, GenerateImageResult } from "./types";

/**
 * 阿里云百炼 - 通义万相 (Wanx) 图像生成
 * 注册即送免费额度，新用户额度较充足
 * 文档: https://help.aliyun.com/zh/model-studio/developer-reference/use-qianwen-to-draw-pictures
 *
 * 基础 URL (OpenAI 兼容模式):
 *   POST https://dashscope.aliyuncs.com/compatible-mode/v1/images/generations
 *
 * 支持参数:
 *   - model: 模型名称
 *   - prompt: 正向提示词
 *   - size: 尺寸 (如 "1024x1024")
 *   - n: 生成数量
 *   - seed: 随机种子
 *
 * 常用模型:
 *   - wanx2.1-t2i-turbo (快速，免费额度可用)
 *   - wanx2.1-t2i-plus (质量更高)
 */

const QWEN_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/images/generations";

// 通义万相支持的标准尺寸
function normalizeSize(width: number, height: number): string {
  // 通义万相支持的标准尺寸
  const supported = [
    "1024x1024",
    "1024x768",
    "768x1024",
    "1280x720",
    "720x1280",
    "1280x768",
    "768x1280",
    "1440x720",
    "720x1440",
  ];

  const exact = `${width}x${height}`;
  if (supported.includes(exact)) return exact;

  // 找最接近的
  const targetRatio = width / height;
  let best = "1024x1024";
  let bestDiff = Infinity;

  for (const size of supported) {
    const [w, h] = size.split("x").map(Number);
    const ratio = w / h;
    const diff = Math.abs(ratio - targetRatio);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = size;
    }
  }

  return best;
}

export class QwenProvider implements ImageProvider {
  async generate(params: GenerateImageParams): Promise<GenerateImageResult> {
    const apiKey = process.env.QWEN_API_KEY || process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error:
          "未配置 QWEN_API_KEY，请前往 https://bailian.console.aliyun.com/ 注册获取 API Key",
      };
    }

    try {
      const model = process.env.QWEN_MODEL || params.model || "wanx2.1-t2i-turbo";
      const supported = new Set([
        "1024x1024",
        "1024x768",
        "768x1024",
        "1280x720",
        "720x1280",
        "1280x768",
        "768x1280",
        "1440x720",
        "720x1440",
      ]);
      const requestedSize = `${params.width}x${params.height}`;
      const size = supported.has(requestedSize)
        ? requestedSize
        : normalizeSize(params.width, params.height);

      // Strict-size: do not silently normalize unless caller opted out.
      if (params.strictSize !== false && size !== requestedSize) {
        return {
          success: false,
          error:
            `通义万相不支持该尺寸: ${requestedSize}。` +
            `可选尺寸: ${Array.from(supported).join(", ")}。` +
            `请修改“生成尺寸”或关闭严格尺寸(不推荐)。`,
        };
      }

      const body: Record<string, unknown> = {
        model,
        prompt: params.prompt,
        size,
        n: 1,
      };

      // 种子：如传入则保持稳定，否则随机
      body.seed = params.seed ?? Math.floor(Math.random() * 2_147_483_647);

      console.log("[Qwen/Wanx] request model:", model, "size:", size);

      const response = await fetch(QWEN_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        const errObj = (errorData.error || errorData) as Record<string, unknown>;
        const message = String(errObj.message || errorData.message || response.statusText);
        return {
          success: false,
          error: `通义万相 API 错误 (${response.status}): ${message}`,
        };
      }

      const data = (await response.json()) as {
        data?: Array<{ url: string; revised_prompt?: string }>;
      };

      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        return {
          success: false,
          error: "通义万相返回结果中未包含图片 URL",
        };
      }

      return {
        success: true,
        imageUrl,
      };
    } catch (error) {
      console.error("Qwen/Wanx generate error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "调用通义万相 API 失败",
      };
    }
  }
}
