import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthScope, requireActiveAuthorizationCode, scopedTenantUserWhere } from "@/lib/auth-scope";

// GET /api/ai-image/tasks
export async function GET(request: NextRequest) {
  try {
    const scope = await getAuthScope(request);
    if (!scope) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const activeCode = requireActiveAuthorizationCode(scope);
    if (!activeCode.ok) {
      return NextResponse.json({ error: activeCode.error }, { status: activeCode.status });
    }
    const { searchParams } = new URL(request.url);
    const tenantId = "default";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const where = scopedTenantUserWhere(scope, tenantId);

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
