import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getImageProvider } from "@/lib/image-providers";
import { buildPrompt, getFragmentsByIds, buildPromptFromTemplate } from "@/lib/prompt";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const LOCAL_GENERATED_DIR = path.join(process.cwd(), "public", "generated");

async function persistImageLocally(taskId: string, imageUrl: string): Promise<string | null> {
  try {
    await mkdir(LOCAL_GENERATED_DIR, { recursive: true });
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(30000) });
    if (!imgRes.ok) return null;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const fileName = `task-${taskId}.png`;
    const filePath = path.join(LOCAL_GENERATED_DIR, fileName);
    await writeFile(filePath, buffer);
    return `/generated/${fileName}`;
  } catch (e) {
    console.error("[Generate] failed to persist image locally:", e);
    return null;
  }
}

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

    // Resolve relative reference image URLs (e.g. "/uploads/xxx.png") to absolute URLs
    // so the server-side provider can fetch them correctly in dev (port may not be 3000).
    const origin = request.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resolvedProductImageUrl =
      typeof productImageUrl === "string" && productImageUrl.startsWith("/")
        ? `${origin}${productImageUrl}`
        : productImageUrl;
    const resolvedStyleReferenceUrls = Array.isArray(styleReferenceUrls)
      ? styleReferenceUrls.map((u: unknown) =>
          typeof u === "string" && u.startsWith("/") ? `${origin}${u}` : String(u)
        )
      : [];

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
        hasProductImage: !!resolvedProductImageUrl,
        hasStyleReferences: resolvedStyleReferenceUrls.length > 0,
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
        hasProductImage: !!resolvedProductImageUrl,
        hasStyleReferences: resolvedStyleReferenceUrls.length > 0,
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
        : generationModeId === "conservative_enhancement" && !!resolvedProductImageUrl
          ? deriveStableSeed([resolvedProductImageUrl, finalPrompt, finalNegativePrompt || "", width, height, model])
          : undefined;

    const requestedStrengthRaw = (config as any)?.editStrength ?? (config as any)?.strength;
    const requestedStrength =
      typeof requestedStrengthRaw === "number" && Number.isFinite(requestedStrengthRaw)
        ? Math.max(0, Math.min(1, requestedStrengthRaw))
        : undefined;

    let editStrength =
      !!resolvedProductImageUrl
        ? generationModeId === "conservative_enhancement"
          ? 0.35
          : generationModeId === "commercial_showcase"
            ? 0.55
            : 0.75
        : undefined;

    // Allow explicit override from client.
    if (requestedStrength !== undefined && editStrength !== undefined) {
      editStrength = requestedStrength;
    }

    // For long "direct prompt" (V2 rich prompt) paths, keep the product closer to
    // the reference image by default. High strength often causes product drift.
    if (isDirectPromptPath && editStrength !== undefined) {
      // Still cap, but allow enough change to avoid "original image" outputs.
      editStrength = Math.min(editStrength, 0.75);
    }

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

const providerName = body.provider || process.env.IMAGE_PROVIDER || "chatgpt2api";
    const provider = getImageProvider(providerName);

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
          productImageUrl: resolvedProductImageUrl || null,
          styleReferenceUrls: resolvedStyleReferenceUrls || [],
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
        productImageUrl: resolvedProductImageUrl || null,
        styleReferenceUrls: resolvedStyleReferenceUrls || [],
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
      // Persist image locally so URLs survive page refreshes (v2 session images).
      let imageUrl = result.imageUrl;
      if (providerName === "chatgpt2api" && imageUrl && imageUrl.includes("localhost:3000")) {
        imageUrl = imageUrl.replace("localhost:3000", "47.237.113.100:3000");
        console.log("[Generate] chatgpt2api imageUrl replaced:", imageUrl);
      }
      // Always persist to local static path if possible; provider-hosted URLs may expire.
      const localImageUrl = await persistImageLocally(task.id, imageUrl);
      const effectiveImageUrl = localImageUrl || imageUrl;

      // Download image and convert to base64 for frontend copy/download (avoids CORS)
      let imageBase64 = "";
      try {
        const fetchUrlForBase64 = effectiveImageUrl.startsWith("/") ? `${origin}${effectiveImageUrl}` : effectiveImageUrl;
        const imgRes = await fetch(fetchUrlForBase64, { signal: abortController.signal });
        if (imgRes.ok) {
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          if (buffer.length > 0) {
          imageBase64 = `data:image/png;base64,${buffer.toString("base64")}`;
          }
        }
      } catch (e) {
        console.log("[Generate] failed to download image for base64:", e);
      }

      const updatedTask = await prisma.aiImageTask.update({
        where: { id: task.id },
        data: {
          status: "completed",
          resultImageUrl: JSON.stringify([effectiveImageUrl]),
        },
      });
      return NextResponse.json({
        data: updatedTask,
        imageBase64,
        debug: {
          generationModeId,
          model,
          size: `${width}x${height}`,
          editStrength: editStrength ?? null,
          seed: seed ?? null,
          promptLength: finalPrompt.length,
          hasProductImage: !!resolvedProductImageUrl,
          isDirectPromptPath,
          strictSize,
          provider: providerName,
        },
      });
    } else {
      const updatedTask = await prisma.aiImageTask.update({
        where: { id: task.id },
        data: {
          status: "failed",
          errorMessage: result.error || "生成失败",
        },
      });
      return NextResponse.json({
        data: updatedTask,
        debug: {
          generationModeId,
          model,
          size: `${width}x${height}`,
          editStrength: editStrength ?? null,
          seed: seed ?? null,
          promptLength: finalPrompt.length,
          hasProductImage: !!resolvedProductImageUrl,
          isDirectPromptPath,
          strictSize,
          provider: providerName,
        },
      });
    }
  } catch (error) {
    console.error("Failed to generate image:", error);
    return NextResponse.json({ error: "生成图片失败" }, { status: 500 });
  }
}
