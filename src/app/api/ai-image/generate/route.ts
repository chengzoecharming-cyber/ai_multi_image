import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getImageProvider } from "@/lib/image-providers";
import { buildPrompt } from "@/lib/prompt/builder";
import { PromptFieldSelections } from "@/lib/types";

// POST /api/ai-image/generate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      promptGroupId,
      promptContent,
      negativePrompt,
      referenceImageUrls,
      config,
      tenantId = "default",
      userId = "default",
    } = body;

    // Build final prompt using Prompt Builder if fields are provided
    let finalPrompt = promptContent?.trim() || "";
    let finalNegativePrompt = negativePrompt?.trim() || "";

    const promptFields: PromptFieldSelections | undefined = config?.promptFields;

    if (promptFields && Object.keys(promptFields).length > 0) {
      const builderResult = buildPrompt({
        fields: promptFields,
        userPrompt: promptContent || "",
        negativePrompt: negativePrompt || "",
        preserveStructure: (referenceImageUrls || []).length > 0,
      });
      finalPrompt = builderResult.positivePrompt;
      finalNegativePrompt = builderResult.negativePrompt;
    }

    if (!finalPrompt) {
      return NextResponse.json({ error: "Prompt 内容不能为空" }, { status: 400 });
    }

    // Create task record (save snapshot)
    const task = await prisma.aiImageTask.create({
      data: {
        tenantId,
        userId,
        promptGroupId: promptGroupId || null,
        promptSnapshot: finalPrompt,
        configSnapshot: JSON.stringify(config || { ratio: "1:1", width: 1024, height: 1024, model: "default", quality: "standard" }),
        referenceImagesSnapshot: JSON.stringify(referenceImageUrls || []),
        status: "pending",
      },
    });

    // Update usage count if linked to a prompt group
    if (promptGroupId) {
      await prisma.aiPromptGroup.update({
        where: { id: promptGroupId },
        data: {
          useCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });
    }

    // Update status to processing
    await prisma.aiImageTask.update({
      where: { id: task.id },
      data: { status: "processing" },
    });

    // Call Image Provider to generate image
    const provider = getImageProvider();
    const result = await provider.generate({
      prompt: finalPrompt,
      referenceImageUrls: referenceImageUrls || [],
      width: config?.width || 1024,
      height: config?.height || 1024,
      model: config?.model,
      quality: config?.quality,
    });

    if (result.success && result.imageUrl) {
      const updatedTask = await prisma.aiImageTask.update({
        where: { id: task.id },
        data: {
          status: "completed",
          resultImageUrl: result.imageUrl,
        },
      });
      return NextResponse.json({ data: updatedTask });
    } else {
      const updatedTask = await prisma.aiImageTask.update({
        where: { id: task.id },
        data: {
          status: "failed",
          errorMessage: result.error || "生成失败",
        },
      });
      return NextResponse.json({ data: updatedTask });
    }
  } catch (error) {
    console.error("Failed to generate image:", error);
    return NextResponse.json({ error: "生成图片失败" }, { status: 500 });
  }
}
