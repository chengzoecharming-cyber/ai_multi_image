import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/ai-image/tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "default";
    const userId = searchParams.get("userId") || "default";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const tasks = await prisma.aiImageTask.findMany({
      where: { tenantId, userId },
      include: {
        promptGroup: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    const total = await prisma.aiImageTask.count({
      where: { tenantId, userId },
    });

    return NextResponse.json({ data: tasks, total });
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json({ error: "获取任务列表失败" }, { status: 500 });
  }
}
