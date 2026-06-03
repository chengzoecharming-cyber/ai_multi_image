import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthScope, scopedTenantUserWhere } from "@/lib/auth-scope";
import { writeFile, mkdir, access } from "fs/promises";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";

const LOCAL_GENERATED_DIR = path.join(process.cwd(), "public", "generated");
const THUMB_DIR = path.join(LOCAL_GENERATED_DIR, "thumbs");

function isExternalUrl(url: string, origin: string): boolean {
  if (!url) return false;
  if (url.startsWith("/")) return false;
  try {
    const urlObj = new URL(url);
    const originObj = new URL(origin);
    return urlObj.host !== originObj.host;
  } catch {
    return false;
  }
}

function deriveFileName(taskId: string, imageUrl: string): string {
  const hash = crypto.createHash("md5").update(imageUrl).digest("hex").slice(0, 12);
  const ext = path.extname(new URL(imageUrl).pathname) || ".png";
  return `task-${taskId}-${hash}${ext}`;
}

function deriveThumbName(taskId: string, imageUrl: string): string {
  const hash = crypto.createHash("md5").update(imageUrl).digest("hex").slice(0, 12);
  return `task-${taskId}-${hash}.jpg`;
}

/**
 * POST /api/ai-image/tasks/[id]/persist-image
 * Body: { imageUrl: string }
 *
 * Downloads an external image, persists full-size + thumbnail to public/generated/,
 * updates the task's resultImageUrl in DB, and returns local URLs.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getAuthScope(request);
    if (!scope) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const tenantId = "default";
    const { id: taskId } = await params;
    const body = (await request.json()) as { imageUrl?: string };
    const imageUrl = body.imageUrl;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "缺少 imageUrl" }, { status: 400 });
    }

    const origin = request.nextUrl.origin;

    // If already local, nothing to do
    if (!isExternalUrl(imageUrl, origin)) {
      return NextResponse.json({ localUrl: imageUrl, alreadyLocal: true });
    }

    // Read current task to get resultImageUrl array
    const task = await prisma.aiImageTask.findFirst({
      where: { id: taskId, ...scopedTenantUserWhere(scope, tenantId) },
      select: { resultImageUrl: true },
    });

    if (!task) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    // Parse resultImageUrl
    let imageUrls: string[] = [];
    if (task.resultImageUrl) {
      try {
        const parsed = JSON.parse(task.resultImageUrl);
        imageUrls = Array.isArray(parsed) ? parsed : [task.resultImageUrl];
      } catch {
        imageUrls = [task.resultImageUrl];
      }
    }

    const index = imageUrls.indexOf(imageUrl);
    if (index === -1) {
      return NextResponse.json({ error: "图片 URL 不在任务结果中" }, { status: 400 });
    }

    // Ensure directories exist
    await mkdir(LOCAL_GENERATED_DIR, { recursive: true });
    await mkdir(THUMB_DIR, { recursive: true });

    const fileName = deriveFileName(taskId, imageUrl);
    const thumbName = deriveThumbName(taskId, imageUrl);
    const filePath = path.join(LOCAL_GENERATED_DIR, fileName);
    const thumbPath = path.join(THUMB_DIR, thumbName);
    const localUrl = `/generated/${fileName}`;
    const thumbUrl = `/generated/thumbs/${thumbName}`;

    // Check if already persisted (idempotent)
    let fullExists = false;
    let thumbExists = false;
    try {
      await access(filePath);
      fullExists = true;
    } catch { /* not exists */ }
    try {
      await access(thumbPath);
      thumbExists = true;
    } catch { /* not exists */ }

    if (fullExists && thumbExists) {
      // Both exist, just update DB if needed
      const currentLocal = imageUrls[index];
      if (currentLocal !== localUrl) {
        imageUrls[index] = localUrl;
        await prisma.aiImageTask.update({
          where: { id: taskId },
          data: { resultImageUrl: JSON.stringify(imageUrls) },
        });
      }
      return NextResponse.json({ localUrl, thumbUrl, cached: true });
    }

    // Download external image
    const imgRes = await fetch(imageUrl, {
      signal: AbortSignal.timeout(60000),
    });
    if (!imgRes.ok) {
      return NextResponse.json(
        { error: `下载图片失败: ${imgRes.status}` },
        { status: 502 }
      );
    }

    const buffer = Buffer.from(await imgRes.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json({ error: "下载的图片为空" }, { status: 502 });
    }

    // Save full-size image
    if (!fullExists) {
      await writeFile(filePath, buffer);
    }

    // Generate thumbnail (192x192 cover crop, JPEG quality 80)
    if (!thumbExists) {
      try {
        await sharp(buffer)
          .resize(192, 192, { fit: "cover", position: "center" })
          .jpeg({ quality: 80, progressive: true })
          .toFile(thumbPath);
      } catch (thumbErr) {
        console.error("[PersistImage] thumbnail generation failed:", thumbErr);
        // Non-fatal: return without thumb
      }
    }

    // Update DB: replace external URL with local URL
    imageUrls[index] = localUrl;
    await prisma.aiImageTask.update({
      where: { id: taskId },
      data: { resultImageUrl: JSON.stringify(imageUrls) },
    });

    return NextResponse.json({ localUrl, thumbUrl });
  } catch (error) {
    console.error("[PersistImage] error:", error);
    return NextResponse.json({ error: "持久化图片失败" }, { status: 500 });
  }
}
