import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthScope, scopedTenantUserWhere } from "@/lib/auth-scope";

// GET /api/ai-image/tasks/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getAuthScope(request);
    if (!scope) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const tenantId = "default";
    const { id } = await params;
    const task = await prisma.aiImageTask.findFirst({
      where: { id, ...scopedTenantUserWhere(scope, tenantId) },
      include: {
        promptGroup: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    }

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("Failed to fetch task:", error);
    return NextResponse.json({ error: "获取任务详情失败" }, { status: 500 });
  }
}

// DELETE /api/ai-image/tasks/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getAuthScope(request);
    if (!scope) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const tenantId = "default";
    const { id } = await params;
    await prisma.aiImageTask.deleteMany({
      where: { id, ...scopedTenantUserWhere(scope, tenantId) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "删除任务失败" }, { status: 500 });
  }
}
