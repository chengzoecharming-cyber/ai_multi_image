import { writeFile, mkdir } from "fs/promises";
import path from "path";

const LOCAL_GENERATED_DIR = path.join(process.cwd(), "public", "generated");

/**
 * Download a remote/generated image and persist it to public/generated/.
 * Returns a relative local URL (e.g. "/generated/task-{id}.png")
 * that survives page refreshes and server restarts.
 *
 * @param origin - Optional base URL for resolving relative image URLs (e.g. "http://localhost:3000")
 */
export async function persistGeneratedImage(
  imageUrl: string,
  fileName: string,
  origin?: string
): Promise<string | null> {
  try {
    await mkdir(LOCAL_GENERATED_DIR, { recursive: true });

    const fetchUrl =
      imageUrl.startsWith("/") && origin
        ? `${origin}${imageUrl}`
        : imageUrl;

    const imgRes = await fetch(fetchUrl, { signal: AbortSignal.timeout(30000) });
    if (!imgRes.ok) {
      console.error("[persistGeneratedImage] fetch failed:", fetchUrl, imgRes.status);
      return null;
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const filePath = path.join(LOCAL_GENERATED_DIR, fileName);
    await writeFile(filePath, buffer);
    return `/generated/${fileName}`;
  } catch (e) {
    console.error("[persistGeneratedImage] error:", e);
    return null;
  }
}
