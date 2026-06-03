import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}

// GET /api/ai-image/prompt-groups/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const tenantId = "default";
    const { id } = await params;
    const group = await prisma.aiPromptGroup.findFirst({
      where: { id, tenantId, userId },
      include: {
        references: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "模板不存在" }, { status: 404 });
    }

    return NextResponse.json({ data: group });
  } catch (error) {
    console.error("Failed to fetch prompt group:", error);
    return NextResponse.json({ error: "获取模板详情失败" }, { status: 500 });
  }
}

// PUT /api/ai-image/prompt-groups/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const tenantId = "default";
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      promptContent,
      finalPrompt,
      negativePrompt,
      selectedFragmentIds,
      config,
      remark,
      coverImageUrl,
      references,
    } = body;

    const updateData: {
      name?: string;
      promptContent?: string;
      finalPrompt?: string | null;
      negativePrompt?: string | null;
      selectedFragmentIds?: string | null;
      configJson?: string;
      remark?: string | null;
      coverImageUrl?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name.trim();
    if (promptContent !== undefined) updateData.promptContent = promptContent.trim();
    if (finalPrompt !== undefined) updateData.finalPrompt = finalPrompt?.trim() || null;
    if (negativePrompt !== undefined) updateData.negativePrompt = negativePrompt?.trim() || null;
    if (selectedFragmentIds !== undefined) {
      updateData.selectedFragmentIds = selectedFragmentIds?.length > 0 ? JSON.stringify(selectedFragmentIds) : null;
    }
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
        references: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ data: group });
  } catch (error) {
    console.error("Failed to update prompt group:", error);
    return NextResponse.json({ error: "更新模板失败" }, { status: 500 });
  }
}

// DELETE /api/ai-image/prompt-groups/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const tenantId = "default";
    const { id } = await params;
    await prisma.aiPromptGroup.deleteMany({ where: { id, tenantId, userId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete prompt group:", error);
    return NextResponse.json({ error: "删除模板失败" }, { status: 500 });
  }
}
