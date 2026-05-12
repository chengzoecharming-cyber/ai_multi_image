import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUT /api/ai-image/prompt-categories/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, sortOrder } = body;

    const data: { name?: string; sortOrder?: number } = {};
    if (name !== undefined) data.name = name.trim();
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    const category = await prisma.aiPromptCategory.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: category });
  } catch (error) {
    console.error("Failed to update category:", error);
    return NextResponse.json({ error: "更新分类失败" }, { status: 500 });
  }
}

// DELETE /api/ai-image/prompt-categories/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if category has prompt groups
    const groupCount = await prisma.aiPromptGroup.count({
      where: { categoryId: id },
    });

    if (groupCount > 0) {
      return NextResponse.json(
        { error: "该分类下存在提示词组，无法删除" },
        { status: 400 }
      );
    }

    await prisma.aiPromptCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json({ error: "删除分类失败" }, { status: 500 });
  }
}
