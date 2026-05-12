import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    // Create default categories (idempotent via findFirst + create)
    const categoryNames = [
      { name: "白底主图", sortOrder: 0 },
      { name: "场景图", sortOrder: 1 },
      { name: "海报", sortOrder: 2 },
      { name: "详情图", sortOrder: 3 },
      { name: "金属质感", sortOrder: 4 },
      { name: "自定义", sortOrder: 5 },
    ];

    const categories: { id: string; name: string }[] = [];
    for (const c of categoryNames) {
      let cat = await prisma.aiPromptCategory.findFirst({
        where: { tenantId: "default", userId: "default", name: c.name },
      });
      if (!cat) {
        cat = await prisma.aiPromptCategory.create({
          data: {
            tenantId: "default",
            userId: "default",
            name: c.name,
            sortOrder: c.sortOrder,
          },
        });
      }
      categories.push(cat);
    }

    const findCatId = (name: string) =>
      categories.find((c) => c.name === name)?.id || categories[0].id;

    // Seed templates if they don't already exist
    const templates = [
      {
        categoryId: findCatId("白底主图"),
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
      },
      {
        categoryId: findCatId("场景图"),
        name: "居家场景氛围图",
        promptContent:
          "A cozy living room scene with warm sunlight, minimalist Scandinavian interior design, soft natural lighting, lifestyle photography",
        negativePrompt: "",
        configJson: JSON.stringify({
          ratio: "16:9",
          width: 1024,
          height: 576,
          model: "default",
          quality: "standard",
        }),
        remark: "适用于家居类目场景展示",
        useCount: 1,
      },
      {
        categoryId: findCatId("海报"),
        name: "促销活动海报",
        promptContent:
          "Vibrant promotional poster design with bold colors, modern typography, discount banner style, eye-catching layout",
        negativePrompt: "",
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
      {
        categoryId: findCatId("金属质感"),
        name: "金属零件结构细节",
        promptContent:
          "精密金属零件微距摄影，突出表面拉丝纹理与CNC加工痕迹，工业级灯光，黑灰渐变背景，8K超清细节",
        negativePrompt: "塑料感，生锈，模糊，低分辨率",
        configJson: JSON.stringify({
          ratio: "1:1",
          width: 1024,
          height: 1024,
          model: "default",
          quality: "high",
        }),
        remark: "工业金属零件展示",
        useCount: 2,
      },
      {
        categoryId: findCatId("白底主图"),
        name: "45度角商品展示",
        promptContent:
          "Commercial product photography at 45-degree angle, clean white background, soft shadow, professional studio lighting, maintain original product structure",
        negativePrompt: "distorted, deformed, extra elements, text watermark",
        configJson: JSON.stringify({
          ratio: "3:4",
          width: 768,
          height: 1024,
          model: "default",
          quality: "standard",
        }),
        remark: "45度角商业摄影通用模板",
        useCount: 5,
      },
      {
        categoryId: findCatId("详情图"),
        name: "产品对比效果图",
        promptContent:
          "Product comparison layout, before and after style, split screen design, clean minimal UI, professional e-commerce visual",
        negativePrompt: "cluttered background, unrelated objects",
        configJson: JSON.stringify({
          ratio: "16:9",
          width: 1024,
          height: 576,
          model: "default",
          quality: "standard",
        }),
        remark: "详情页对比图模板",
        useCount: 0,
      },
    ];

    for (const t of templates) {
      const existing = await prisma.aiPromptGroup.findFirst({
        where: { tenantId: "default", userId: "default", name: t.name },
      });
      if (!existing) {
        await prisma.aiPromptGroup.create({
          data: {
            tenantId: "default",
            userId: "default",
            categoryId: t.categoryId,
            name: t.name,
            promptContent: t.promptContent,
            negativePrompt: t.negativePrompt,
            configJson: t.configJson,
            remark: t.remark,
            useCount: t.useCount,
            lastUsedAt: t.useCount > 0 ? new Date() : null,
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Seed data created/updated" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
