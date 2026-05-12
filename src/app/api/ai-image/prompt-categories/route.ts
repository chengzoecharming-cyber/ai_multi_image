import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/ai-image/prompt-categories
export async function GET() {
  try {
    const categories = await prisma.aiPromptCategory.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json({ error: "获取分类失败" }, { status: 500 });
  }
}

// POST /api/ai-image/prompt-categories
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, tenantId = "default", userId = "default" } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "分类名称不能为空" }, { status: 400 });
    }

    const category = await prisma.aiPromptCategory.create({
      data: {
        tenantId,
        userId,
        name: name.trim(),
      },
    });

    return NextResponse.json({ data: category });
  } catch (error) {
    console.error("Failed to create category:", error);
    return NextResponse.json({ error: "创建分类失败" }, { status: 500 });
  }
}
