import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getImageProvider } from "@/lib/image-providers";
import { buildPrompt, getFragmentsByIds } from "@/lib/prompt";

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

    // Build final prompt using Prompt Builder
    let finalPrompt = promptContent?.trim() || "";
    let finalNegativePrompt = negativePrompt?.trim() || "";

    // If selectedFragmentIds are provided, use new fragment-based builder
    const selectedFragmentIds: string[] = config?.selectedFragmentIds || [];

    if (selectedFragmentIds.length > 0) {
      const fragments = getFragmentsByIds(selectedFragmentIds);
      const builderResult = buildPrompt({
        selectedFragments: fragments,
        userPrompt: promptContent || "",
        userNegativePrompt: negativePrompt || "",
        preserveStructure: (referenceImageUrls || []).length > 0,
      });
      finalPrompt = builderResult.positivePrompt;
      finalNegativePrompt = builderResult.negativePrompt;
    } else {
      // Legacy: fallback to old field-based builder
      const promptFields = config?.promptFields;
      if (promptFields && Object.keys(promptFields).length > 0) {
        const { buildPromptFromFields } = await import("@/lib/prompt/legacy-builder");
        const builderResult = buildPromptFromFields({
          fields: promptFields,
          userPrompt: promptContent || "",
          negativePrompt: negativePrompt || "",
          preserveStructure: (referenceImageUrls || []).length > 0,
        });
        finalPrompt = builderResult.positivePrompt;
        finalNegativePrompt = builderResult.negativePrompt;
      }
    }

    if (!finalPrompt) {
      return NextResponse.json({ error: "Prompt 内容不能为空" }, { status: 400 });
    }

    // Create task record (save snapshot)
    const configSnapshot = JSON.stringify({
      ...config,
      selectedFragmentIds: config?.selectedFragmentIds || [],
      ratio: config?.ratio || "1:1",
      width: config?.width || 1024,
      height: config?.height || 1024,
      model: config?.model || "default",
      quality: config?.quality || "standard",
    });

    const task = await prisma.aiImageTask.create({
      data: {
        tenantId,
        userId,
        promptGroupId: promptGroupId || null,
        promptSnapshot: finalPrompt,
        configSnapshot,
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

    // Call Image Provider to generate multiple images
    const provider = getImageProvider();
    const outputCount = config?.outputCount || 4;
    const imageUrls: string[] = [];

    for (let i = 0; i < outputCount; i++) {
      const result = await provider.generate({
        prompt: finalPrompt,
        negativePrompt: finalNegativePrompt,
        referenceImageUrls: referenceImageUrls || [],
        width: config?.width || 1024,
        height: config?.height || 1024,
        model: config?.model,
        quality: config?.quality,
      });
      if (result.success && result.imageUrl) {
        imageUrls.push(result.imageUrl);
      }
    }

    if (imageUrls.length > 0) {
      const updatedTask = await prisma.aiImageTask.update({
        where: { id: task.id },
        data: {
          status: "completed",
          resultImageUrl: JSON.stringify(imageUrls),
        },
      });
      return NextResponse.json({ data: updatedTask });
    } else {
      const updatedTask = await prisma.aiImageTask.update({
        where: { id: task.id },
        data: {
          status: "failed",
          errorMessage: "生成失败",
        },
      });
      return NextResponse.json({ data: updatedTask });
    }
  } catch (error) {
    console.error("Failed to generate image:", error);
    return NextResponse.json({ error: "生成图片失败" }, { status: 500 });
  }
}
