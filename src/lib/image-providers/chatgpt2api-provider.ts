import fs from "fs";
import path from "path";
import sharp from "sharp";
import { ImageProvider, GenerateImageParams, GenerateImageResult } from "./types";
import { generateImage, editImage } from "@/lib/chatgpt2api";

const VALID_SIZES = ["1024x1024", "1024x1536", "1536x1024"] as const;
type ValidSize = (typeof VALID_SIZES)[number];

function resolveSize(width: number, height: number): ValidSize {
  const ratio = width / height;
  if (ratio > 1.1) return "1536x1024";
  if (ratio < 0.9) return "1024x1536";
  return "1024x1024";
}

function resolveImageUrl(imageUrl: string): string {
  let resolvedUrl = imageUrl.startsWith("/")
    ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${imageUrl}`
    : imageUrl;
  if (resolvedUrl.includes("localhost:3002")) {
    resolvedUrl = resolvedUrl.replace("localhost:3002", "47.237.113.100:3002");
  }
  return resolvedUrl;
}

async function fetchImageBuffer(imageUrl: string, signal?: AbortSignal): Promise<Buffer> {
  const resolvedUrl = resolveImageUrl(imageUrl);
  const isLocalUpload = resolvedUrl.includes("/uploads/");
  const isLocalGenerated = resolvedUrl.includes("/generated/");
  const isLocalhost = resolvedUrl.includes("localhost");

  if (isLocalUpload || isLocalGenerated || isLocalhost) {
    let filePath;
    if (isLocalUpload) {
      const fileName = resolvedUrl.split("/uploads/")[1] || path.basename(resolvedUrl);
      filePath = path.join(process.cwd(), "public", "uploads", fileName);
    } else if (isLocalGenerated) {
      const fileName = resolvedUrl.split("/generated/")[1] || path.basename(resolvedUrl);
      filePath = path.join(process.cwd(), "public", "generated", fileName);
    } else {
      const fileName = path.basename(resolvedUrl);
      filePath = path.join(process.cwd(), "public", "uploads", fileName);
    }
    return fs.readFileSync(filePath);
  }

  const imageRes = await fetch(resolvedUrl, { signal });
  if (!imageRes.ok) {
    throw new Error(`无法获取参考图: ${imageRes.status}`);
  }
  return Buffer.from(await imageRes.arrayBuffer());
}

async function processReferenceImage(
  imageUrl: string,
  targetW: number,
  targetH: number,
  index: number,
  signal?: AbortSignal
): Promise<File> {
  const buffer = await fetchImageBuffer(imageUrl, signal);
  const processedBuffer = await sharp(buffer)
    .resize(targetW, targetH, { fit: "cover", position: "center" })
    .png()
    .toBuffer();
  return new File(
    [new Uint8Array(processedBuffer)],
    `reference-${index + 1}.png`,
    { type: "image/png" }
  );
}

export class ChatGPT2APIProvider implements ImageProvider {
  async generate(params: GenerateImageParams): Promise<GenerateImageResult> {
    try {
      const size = resolveSize(params.width, params.height);

      // Prefer explicit array of product images; fall back to the legacy single URL.
      const productImageUrls = Array.isArray(params.productImageUrls)
        ? params.productImageUrls.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
        : params.productImageUrl
          ? [params.productImageUrl]
          : [];

      const hasReferenceImage = productImageUrls.length > 0;

      if (hasReferenceImage) {
        const [targetW, targetH] = size.split("x").map(Number);
        const files: File[] = [];
        for (let i = 0; i < productImageUrls.length; i++) {
          try {
            const file = await processReferenceImage(productImageUrls[i], targetW, targetH, i, params.signal);
            files.push(file);
          } catch (e) {
            return {
              success: false,
              error: `无法读取第 ${i + 1} 张参考图: ${e instanceof Error ? e.message : String(e)}`,
            };
          }
        }

        const model = params.model && params.model !== "default" ? params.model : undefined;
        const result = await editImage({
          prompt: params.prompt,
          images: files,
          model,
          size,
        });
        const imageUrlResult = result.data?.[0]?.url;
        if (!imageUrlResult) {
          console.warn("[ChatGPT2API] edit returned no image url", {
            model: model || process.env.CHATGPT2API_IMAGE_MODEL || process.env.IMAGE_MODEL || "gpt-image-1",
            size,
            imageCount: files.length,
            dataLength: result.data?.length ?? 0,
          });
        }
        if (!imageUrlResult) return { success: false, error: "ChatGPT2API 未返回图片 URL" };
        return { success: true, imageUrl: imageUrlResult };
      }

      const model = params.model && params.model !== "default" ? params.model : undefined;
      const result = await generateImage({
        prompt: params.prompt,
        model,
        n: 1,
        size,
        response_format: "url",
      });
      const imageUrlResult = result.data?.[0]?.url;
      if (!imageUrlResult) {
        console.warn("[ChatGPT2API] generation returned no image url", {
          model: model || process.env.CHATGPT2API_IMAGE_MODEL || process.env.IMAGE_MODEL || "gpt-image-1",
          size,
          dataLength: result.data?.length ?? 0,
        });
      }
      if (!imageUrlResult) return { success: false, error: "ChatGPT2API 未返回图片 URL" };
      return { success: true, imageUrl: imageUrlResult };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      console.error("[ChatGPT2API] generate error:", error);
      return { success: false, error: error instanceof Error ? error.message : "调用 ChatGPT2API 失败" };
    }
  }
}
