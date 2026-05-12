import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getImageProvider } from "@/lib/image-providers";

// POST /api/ai-image/tasks/:id/retry
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const task = await prisma.aiImageTask.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    // 更新状态为 processing
    await prisma.aiImageTask.update({
      where: { id },
      data: {
        status: "processing",
        errorMessage: null,
        resultImageUrl: null,
      },
    });

    // 重新调用 Provider — generate multiple images
    const provider = getImageProvider();
    const config = JSON.parse(task.configSnapshot);
    const referenceImages = JSON.parse(task.referenceImagesSnapshot);
    const outputCount = config?.outputCount || 4;
    const imageUrls: string[] = [];

    for (let i = 0; i < outputCount; i++) {
      const result = await provider.generate({
        prompt: task.promptSnapshot,
        referenceImageUrls: referenceImages,
        width: config?.width || 1024,
        height: config?.height || 1024,
        model: config?.model,
        quality: config?.quality,
      });
      if (result.success && result.imageUrl) {
        imageUrls.push(result.imageUrl);
      }
    }

    if (imageUrls.length > 0) {
      const updatedTask = await prisma.aiImageTask.update({
        where: { id },
        data: {
          status: "completed",
          resultImageUrl: JSON.stringify(imageUrls),
        },
      });
      return NextResponse.json({ data: updatedTask });
    } else {
      const updatedTask = await prisma.aiImageTask.update({
        where: { id },
        data: {
          status: "failed",
          errorMessage: "重新生成失败",
        },
      });
      return NextResponse.json({ data: updatedTask });
    }
  } catch (error) {
    console.error("Failed to retry task:", error);
    return NextResponse.json({ error: "重新生成失败" }, { status: 500 });
  }
}
