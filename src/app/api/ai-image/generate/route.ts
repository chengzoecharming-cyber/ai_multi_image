import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getImageProvider } from "@/lib/image-providers";
import { buildPrompt, getFragmentsByIds, buildPromptFromTemplate } from "@/lib/prompt";

function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function deriveStableSeed(parts: Array<string | number | boolean | null | undefined>): number {
  const s = parts.map((p) => String(p ?? "")).join("|");
  return fnv1a32(s) % 2_147_483_647;
}

// POST /api/ai-image/generate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      promptGroupId,
      templateId,
      variableValues,
      userDescription,
      promptContent,
      negativePrompt,
      productImageUrl,
      styleReferenceUrls,
      config,
      tenantId = "default",
      userId = "default",
    } = body;

    let finalPrompt: string;
    let finalNegativePrompt: string;
    let isDirectPromptPath = false;
    const generationModeId: string = config?.generationModeId || "conservative_enhancement";
    const strictSize: boolean = config?.strictSize !== false;

    // Template-based generation (new path)
    if (templateId) {
      const builderResult = buildPromptFromTemplate({
        templateId,
        variableValues: variableValues || {},
        userDescription: userDescription || "",
        hasProductImage: !!productImageUrl,
        hasStyleReferences: (styleReferenceUrls || []).length > 0,
      });
      finalPrompt = builderResult.positivePrompt;
      finalNegativePrompt = builderResult.negativePrompt;
    } else if (promptContent && (!config?.selectedFragmentIds || config.selectedFragmentIds.length === 0)) {
      // Direct prompt path (e.g., v2 plan with rich imageGenerationPrompt)
      // Use the promptContent directly without legacy fragment augmentation,
      // so the full e-commerce visual direction is preserved.
      isDirectPromptPath = true;
      finalPrompt = promptContent;
      finalNegativePrompt = negativePrompt || "";
      console.log("[Generate] Direct prompt path used. Prompt length:", finalPrompt.length);
      console.log("[Generate] Direct prompt preview:", finalPrompt.substring(0, 300));
    } else {
      // Legacy fragment-based generation
      const selectedFragmentIds: string[] = config?.selectedFragmentIds || [];
      const fragments = getFragmentsByIds(selectedFragmentIds);
      const builderResult = buildPrompt({
        selectedFragments: fragments,
        userPrompt: promptContent || "",
        userNegativePrompt: negativePrompt || "",
        hasProductImage: !!productImageUrl,
        hasStyleReferences: (styleReferenceUrls || []).length > 0,
        generationModeId,
      });
      finalPrompt = builderResult.positivePrompt;
      finalNegativePrompt = builderResult.negativePrompt;
    }

    if (!finalPrompt) {
      return NextResponse.json({ error: "Prompt 内容不能为空" }, { status: 400 });
    }

    const width = Number.isFinite(config?.width) ? Number(config.width) : 1024;
    const height = Number.isFinite(config?.height) ? Number(config.height) : 1024;
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      return NextResponse.json({ error: "生成尺寸不合法，请检查 width/height" }, { status: 400 });
    }
    const model = config?.model || "default";

    const seed =
      typeof config?.seed === "number" && Number.isFinite(config.seed)
        ? Math.floor(config.seed)
        : generationModeId === "conservative_enhancement" && !!productImageUrl
          ? deriveStableSeed([productImageUrl, finalPrompt, finalNegativePrompt || "", width, height, model])
          : undefined;

    const editStrength = isDirectPromptPath
      ? 0.75 // v2 rich prompts need high freedom for text + composition changes
      : !!productImageUrl
        ? generationModeId === "conservative_enhancement"
          ? 0.35
          : generationModeId === "commercial_showcase"
            ? 0.55
            : 0.75
        : undefined;

    const configSnapshot = JSON.stringify({
      ...config,
      templateId: templateId || undefined,
      variableValues: variableValues || undefined,
      userDescription: userDescription || undefined,
      selectedFragmentIds: config?.selectedFragmentIds || [],
      generationModeId,
      ratio: config?.ratio || "1:1",
      width,
      height,
      model,
      quality: config?.quality || "standard",
      strictSize,
      seed,
    });

    const provider = getImageProvider();
    const providerName = process.env.IMAGE_PROVIDER || "pollinations";

    const task = await prisma.aiImageTask.create({
      data: {
        tenantId,
        userId,
        promptGroupId: promptGroupId || null,
        selectedFragmentIds: config?.selectedFragmentIds?.length > 0
          ? JSON.stringify(config.selectedFragmentIds)
          : null,
        promptSnapshot: finalPrompt,
        userPrompt: promptContent?.trim() || userDescription?.trim() || null,
        negativePromptSnapshot: finalNegativePrompt || null,
        configSnapshot,
        referenceImagesSnapshot: JSON.stringify({
          productImageUrl: productImageUrl || null,
          styleReferenceUrls: styleReferenceUrls || [],
        }),
        status: "pending",
        provider: providerName,
      },
    });

    if (promptGroupId) {
      await prisma.aiPromptGroup.update({
        where: { id: promptGroupId },
        data: {
          useCount: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });
    }

    await prisma.aiImageTask.update({
      where: { id: task.id },
      data: { status: "processing" },
    });

    // 90s timeout for image generation (Seedream 1920x1920 needs ~50-70s)
    const GENERATE_TIMEOUT_MS = 90000;
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), GENERATE_TIMEOUT_MS);

    let result;
    try {
      result = await provider.generate({
        prompt: finalPrompt,
        negativePrompt: finalNegativePrompt,
        productImageUrl: productImageUrl || null,
        styleReferenceUrls: styleReferenceUrls || [],
        width,
        height,
        strictSize,
        seed,
        editStrength,
        model: config?.model,
        quality: config?.quality,
        signal: abortController.signal,
      });
      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        await prisma.aiImageTask.update({
          where: { id: task.id },
          data: { status: "failed", errorMessage: "生成超时（60秒），请重试" },
        });
        return NextResponse.json({ error: "生成超时（90秒），请重试" }, { status: 504 });
      }
      throw err;
    }

    if (result.success && result.imageUrl) {
      const updatedTask = await prisma.aiImageTask.update({
        where: { id: task.id },
        data: {
          status: "completed",
          resultImageUrl: JSON.stringify([result.imageUrl]),
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
