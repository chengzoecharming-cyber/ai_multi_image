import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    // Create default categories
    const categories = await Promise.all([
      prisma.aiPromptCategory.create({
        data: { tenantId: "default", userId: "default", name: "主图", sortOrder: 0 },
      }),
      prisma.aiPromptCategory.create({
        data: { tenantId: "default", userId: "default", name: "场景图", sortOrder: 1 },
      }),
      prisma.aiPromptCategory.create({
        data: { tenantId: "default", userId: "default", name: "海报", sortOrder: 2 },
      }),
      prisma.aiPromptCategory.create({
        data: { tenantId: "default", userId: "default", name: "详情图", sortOrder: 3 },
      }),
    ]);

    // Create sample prompt groups
    await prisma.aiPromptGroup.create({
      data: {
        tenantId: "default",
        userId: "default",
        categoryId: categories[0].id,
        name: "白色背景商品主图",
        promptContent:
          "A premium wireless headphone product photo on pure white background, studio lighting, high-end commercial photography, sharp focus, 4K quality",
        negativePrompt: "blurry, low quality, dark background, people, text",
        configJson: JSON.stringify({
          ratio: "1:1",
          width: 1024,
          height: 1024,
          model: "default",
          quality: "standard",
        }),
        remark: "适用于电商平台商品主图",
        useCount: 3,
        lastUsedAt: new Date(),
      },
    });

    await prisma.aiPromptGroup.create({
      data: {
        tenantId: "default",
        userId: "default",
        categoryId: categories[1].id,
        name: "居家场景氛围图",
        promptContent:
          "A cozy living room scene with warm sunlight, minimalist Scandinavian interior design, soft natural lighting, lifestyle photography",
        configJson: JSON.stringify({
          ratio: "16:9",
          width: 1024,
          height: 576,
          model: "default",
          quality: "standard",
        }),
        remark: "适用于家居类目场景展示",
        useCount: 1,
        lastUsedAt: new Date(Date.now() - 86400000),
      },
    });

    await prisma.aiPromptGroup.create({
      data: {
        tenantId: "default",
        userId: "default",
        categoryId: categories[2].id,
        name: "促销活动海报",
        promptContent:
          "Vibrant promotional poster design with bold colors, modern typography, discount banner style, eye-catching layout",
        configJson: JSON.stringify({
          ratio: "3:4",
          width: 768,
          height: 1024,
          model: "enhanced",
          quality: "high",
        }),
        remark: "大促活动海报模板",
        useCount: 0,
      },
    });

    return NextResponse.json({ success: true, message: "Seed data created" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
