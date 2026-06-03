import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@better-auth/utils/password";

export async function POST() {
  try {
    // Seed admin user if not exists
    const adminExists = await prisma.user.findUnique({
      where: { email: "admin@example.com" },
    });
    if (!adminExists) {
      const hashed = await hashPassword("adminpass123");
      const user = await prisma.user.create({
        data: {
          name: "Admin",
          email: "admin@example.com",
          emailVerified: true,
          role: "admin",
          imageQuota: 9999,
          imageQuotaMax: 9999,
          quotaResetHours: 24,
        },
      });
      await prisma.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password: hashed,
        },
      });
    }

    // Seed demo templates if they don't already exist
    const templates = [
      {
        name: "白色背景商品主图",
        promptContent: "无线耳机 高端商品图 纯白背景",
        finalPrompt:
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
        name: "居家场景氛围图",
        promptContent: "北欧风客厅 阳光照射 家居产品展示",
        finalPrompt:
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
        name: "45度角商品展示",
        promptContent: "45度角 商品展示 白色背景 专业摄影",
        finalPrompt:
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
        name: "金属零件结构细节",
        promptContent: "精密金属零件 微距摄影 拉丝纹理 CNC加工",
        finalPrompt:
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
        name: "产品对比效果图",
        promptContent: "产品对比 前后效果 分屏设计 电商视觉",
        finalPrompt:
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
      {
        name: "促销活动海报",
        promptContent: "促销海报 鲜艳色彩 现代排版 折扣风格",
        finalPrompt:
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
            name: t.name,
            promptContent: t.promptContent,
            finalPrompt: t.finalPrompt,
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
