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
export class ChatGPT2APIProvider implements ImageProvider {
  async generate(params: GenerateImageParams): Promise<GenerateImageResult> {
    try {
      const size = resolveSize(params.width, params.height);
      const hasReferenceImage = !!params.productImageUrl;
      if (hasReferenceImage) {
        const imageUrl = params.productImageUrl!;
        let resolvedUrl = imageUrl.startsWith("/") ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${imageUrl}` : imageUrl;
        if (resolvedUrl.includes("localhost:3002")) {
          resolvedUrl = resolvedUrl.replace("localhost:3002", "47.237.113.100:3002");
        }
        if (resolvedUrl.includes("localhost:3002")) {
          resolvedUrl = resolvedUrl.replace("localhost:3002", "47.237.113.100:3002");
        }
        let buffer: Buffer;
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
          try {
            buffer = fs.readFileSync(filePath);
          } catch (e) {
            return { success: false, error: `无法读取参考图: ${e instanceof Error ? e.message : String(e)}` };
          }
        } else {
          const imageRes = await fetch(resolvedUrl, { signal: params.signal });
          if (!imageRes.ok) return { success: false, error: `无法获取参考图: ${imageRes.status}` };
          buffer = Buffer.from(await imageRes.arrayBuffer());
        }

        // Resize reference image to match target aspect ratio before sending to edit API.
        // This prevents the API from inheriting a mismatched aspect ratio.
        const [targetW, targetH] = size.split("x").map(Number);
        const processedBuffer = await sharp(buffer)
          .resize(targetW, targetH, { fit: "cover", position: "center" })
          .png()
          .toBuffer();
        const file = new File([new Uint8Array(processedBuffer)], "reference.png", { type: "image/png" });

        const result = await editImage({ prompt: params.prompt, image: file, model: params.model && params.model !== "default" ? params.model : undefined, size });
        const imageUrlResult = result.data?.[0]?.url;
        if (!imageUrlResult) return { success: false, error: "ChatGPT2API 未返回图片 URL" };
        return { success: true, imageUrl: imageUrlResult };
      }
      const result = await generateImage({ prompt: params.prompt, model: params.model && params.model !== "default" ? params.model : undefined, n: 1, size, response_format: "url" });
      const imageUrlResult = result.data?.[0]?.url;
      if (!imageUrlResult) return { success: false, error: "ChatGPT2API 未返回图片 URL" };
      return { success: true, imageUrl: imageUrlResult };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw error;
      console.error("[ChatGPT2API] generate error:", error);
      return { success: false, error: error instanceof Error ? error.message : "调用 ChatGPT2API 失败" };
    }
  }
}
