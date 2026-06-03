import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}

// GET /api/ai-image/tasks
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const tenantId = "default";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const where: Record<string, unknown> = { tenantId, userId };

    const tasks = await prisma.aiImageTask.findMany({
      where,
      select: {
        id: true,
        status: true,
        resultImageUrl: true,
        thumbImageUrl: true,
        userPrompt: true,
        promptSnapshot: true,
        configSnapshot: true,
        negativePromptSnapshot: true,
        referenceImagesSnapshot: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.aiImageTask.count({ where });

    return NextResponse.json({ data: tasks, total, limit, offset });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json({ error: "获取任务列表失败" }, { status: 500 });
  }
}
