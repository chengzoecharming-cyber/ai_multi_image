import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}

// GET /api/ai-image/prompt-groups
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const tenantId = "default";

    const where: {
      tenantId: string;
      userId: string;
      name?: { contains: string };
    } = { tenantId, userId };

    if (search) where.name = { contains: search };

    const groups = await prisma.aiPromptGroup.findMany({
      where,
      include: {
        references: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ data: groups });
  } catch (error) {
    console.error("Failed to fetch prompt groups:", error);
    return NextResponse.json({ error: "获取模板列表失败" }, { status: 500 });
  }
}

// POST /api/ai-image/prompt-groups
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const tenantId = "default";
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

    if (!name?.trim()) {
      return NextResponse.json({ error: "模板名称不能为空" }, { status: 400 });
    }
    if (!promptContent?.trim()) {
      return NextResponse.json({ error: "Prompt 内容不能为空" }, { status: 400 });
    }

    const group = await prisma.aiPromptGroup.create({
      data: {
        tenantId,
        userId,
        name: name.trim(),
        promptContent: promptContent.trim(),
        finalPrompt: finalPrompt?.trim() || null,
        negativePrompt: negativePrompt?.trim() || null,
        selectedFragmentIds: selectedFragmentIds?.length > 0 ? JSON.stringify(selectedFragmentIds) : null,
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
        references: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({ data: group });
  } catch (error) {
    console.error("Failed to create prompt group:", error);
    return NextResponse.json({ error: "创建模板失败" }, { status: 500 });
  }
}
