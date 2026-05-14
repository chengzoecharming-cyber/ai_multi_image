import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/ai-image/tasks/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const task = await prisma.aiImageTask.findUnique({
      where: { id },
      include: {
        promptGroup: {
          include: {
            category: true,
          },
        },
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
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.aiImageTask.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete task:", error);
    return NextResponse.json({ error: "删除任务失败" }, { status: 500 });
  }
}
