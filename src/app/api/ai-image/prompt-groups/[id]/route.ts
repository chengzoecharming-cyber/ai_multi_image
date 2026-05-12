import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/ai-image/prompt-groups/:id
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const group = await prisma.aiPromptGroup.findUnique({
      where: { id },
      include: {
        category: true,
        references: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "提示词组不存在" }, { status: 404 });
    }

    return NextResponse.json({ data: group });
  } catch (error) {
    console.error("Failed to fetch prompt group:", error);
    return NextResponse.json({ error: "获取提示词组失败" }, { status: 500 });
  }
}

// PUT /api/ai-image/prompt-groups/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      categoryId,
      promptContent,
      negativePrompt,
      config,
      remark,
      coverImageUrl,
      references,
    } = body;

    const updateData: {
      name?: string;
      categoryId?: string;
      promptContent?: string;
      negativePrompt?: string | null;
      configJson?: string;
      remark?: string | null;
      coverImageUrl?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name.trim();
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (promptContent !== undefined) updateData.promptContent = promptContent.trim();
    if (negativePrompt !== undefined) updateData.negativePrompt = negativePrompt?.trim() || null;
    if (config !== undefined) updateData.configJson = JSON.stringify(config);
    if (remark !== undefined) updateData.remark = remark?.trim() || null;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl || null;

    // Delete existing references and create new ones
    if (references !== undefined) {
      await prisma.aiPromptGroupReference.deleteMany({
        where: { groupId: id },
      });
    }

    const group = await prisma.aiPromptGroup.update({
      where: { id },
      data: {
        ...updateData,
        references: references !== undefined ? {
          create: references.map((ref: { imageUrl: string; imageName?: string; referenceType?: string }, index: number) => ({
            imageUrl: ref.imageUrl,
            imageName: ref.imageName || null,
            referenceType: ref.referenceType || null,
            sortOrder: index,
          })),
        } : undefined,
      },
      include: {
        category: true,
        references: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ data: group });
  } catch (error) {
    console.error("Failed to update prompt group:", error);
    return NextResponse.json({ error: "更新提示词组失败" }, { status: 500 });
  }
}

// DELETE /api/ai-image/prompt-groups/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.aiPromptGroup.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete prompt group:", error);
    return NextResponse.json({ error: "删除提示词组失败" }, { status: 500 });
  }
}
