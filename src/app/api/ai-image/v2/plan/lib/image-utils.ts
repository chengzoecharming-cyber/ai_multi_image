import { readFile } from "fs/promises";
import path from "path";

export async function imageUrlToBase64(imageUrl: string): Promise<string | null> {
  try {
    if (imageUrl.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", imageUrl);
      const buffer = await readFile(filePath);
      const ext = path.extname(imageUrl).toLowerCase();
      const mimeType =
        ext === ".png"
          ? "image/png"
          : ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".webp"
              ? "image/webp"
              : "image/jpeg";
      return `data:${mimeType};base64,${buffer.toString("base64")}`;
    }
    if (imageUrl.startsWith("http")) {
      const res = await fetch(imageUrl);
      if (!res.ok) return null;
      const buffer = Buffer.from(await res.arrayBuffer());
      const contentType = res.headers.get("content-type") || "image/jpeg";
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    }
    return null;
  } catch (e) {
    console.error("[imageUrlToBase64] error:", e);
    return null;
  }
}
