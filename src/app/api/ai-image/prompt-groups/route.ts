import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/ai-image/prompt-groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const search = searchParams.get("search");
    const tenantId = searchParams.get("tenantId") || "default";
    const userId = searchParams.get("userId") || "default";

    const where: {
      tenantId: string;
      userId: string;
      categoryId?: string;
      name?: { contains: string };
    } = { tenantId, userId };

    if (categoryId) where.categoryId = categoryId;
    if (search) where.name = { contains: search };

    const groups = await prisma.aiPromptGroup.findMany({
      where,
      include: {
        category: true,
        references: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ data: groups });
  } catch (error) {
    console.error("Failed to fetch prompt groups:", error);
    return NextResponse.json({ error: "获取提示词组失败" }, { status: 500 });
  }
}

// POST /api/ai-image/prompt-groups
export async function POST(request: NextRequest) {
  try {
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
      tenantId = "default",
      userId = "default",
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "提示词组名称不能为空" }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ error: "请选择分类" }, { status: 400 });
    }
    if (!promptContent?.trim()) {
      return NextResponse.json({ error: "Prompt 内容不能为空" }, { status: 400 });
    }

    const group = await prisma.aiPromptGroup.create({
      data: {
        tenantId,
        userId,
        categoryId,
        name: name.trim(),
        promptContent: promptContent.trim(),
        negativePrompt: negativePrompt?.trim() || null,
        configJson: JSON.stringify(config || { ratio: "1:1", width: 1024, height: 1024, model: "default", quality: "standard" }),
        remark: remark?.trim() || null,
        coverImageUrl: coverImageUrl || null,
        references: {
          create: references?.map((ref: { imageUrl: string; imageName?: string; referenceType?: string }, index: number) => ({
            imageUrl: ref.imageUrl,
            imageName: ref.imageName || null,
            referenceType: ref.referenceType || null,
            sortOrder: index,
          })) || [],
        },
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
    console.error("Failed to create prompt group:", error);
    return NextResponse.json({ error: "创建提示词组失败" }, { status: 500 });
  }
}
