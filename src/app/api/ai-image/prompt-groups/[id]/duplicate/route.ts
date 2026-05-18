import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/ai-image/prompt-groups/:id/duplicate
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const original = await prisma.aiPromptGroup.findUnique({
      where: { id },
      include: {
        references: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!original) {
      return NextResponse.json({ error: "提示词组不存在" }, { status: 404 });
    }

    const duplicated = await prisma.aiPromptGroup.create({
      data: {
        tenantId: original.tenantId,
        userId: original.userId,
        name: `${original.name} (复制)`,
        promptContent: original.promptContent,
        negativePrompt: original.negativePrompt,
        configJson: original.configJson,
        remark: original.remark,
        coverImageUrl: original.coverImageUrl,
        references: {
          create: original.references.map((ref, index) => ({
            imageUrl: ref.imageUrl,
            imageName: ref.imageName,
            referenceType: ref.referenceType,
            sortOrder: index,
          })),
        },
      },
      include: {
        references: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ data: duplicated });
  } catch (error) {
    console.error("Failed to duplicate prompt group:", error);
    return NextResponse.json({ error: "复制提示词组失败" }, { status: 500 });
  }
}
