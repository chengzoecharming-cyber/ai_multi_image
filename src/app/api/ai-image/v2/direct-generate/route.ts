import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthScope, requireActiveAuthorizationCode, scopedTenantUserWhere } from "@/lib/auth-scope";
import { getImageProvider } from "@/lib/image-providers";
import { checkAndResetQuotaForScope, deductQuotaForScope, quotaErrorMessage } from "@/lib/quota";
import { writeFile, mkdir } from "fs/promises";
import fs from "fs";
import path from "path";

const LOCAL_GENERATED_DIR = path.join(process.cwd(), "public", "generated");

interface PersistResult {
  localUrl: string;
  thumbUrl: string;
}

async function persistImageWithThumb(taskId: string, imageUrl: string): Promise<PersistResult | null> {
  try {
    await mkdir(LOCAL_GENERATED_DIR, { recursive: true });
    const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(30000) });
    if (!imgRes.ok) return null;
    const buffer = Buffer.from(await imgRes.arrayBuffer());

    const fileName = `task-${taskId}.png`;
    const filePath = path.join(LOCAL_GENERATED_DIR, fileName);
    await writeFile(filePath, buffer);
    const localUrl = `/generated/${fileName}`;

    try {
      const sharp = (await import("sharp")).default;
      const thumbBuffer = await sharp(buffer)
        .resize(192, 192, { fit: "cover" })
        .jpeg({ quality: 85 })
        .toBuffer();
      const thumbName = `task-${taskId}.jpg`;
      const thumbPath = path.join(LOCAL_GENERATED_DIR, thumbName);
      await writeFile(thumbPath, thumbBuffer);
      const thumbUrl = `/generated/${thumbName}`;
      return { localUrl, thumbUrl };
    } catch (thumbErr) {
      console.warn("[DirectGenerate] thumbnail generation failed:", thumbErr);
      return { localUrl, thumbUrl: localUrl };
    }
  } catch (e) {
    console.error("[DirectGenerate] failed to persist image locally:", e);
    return null;
  }
}

function resolveLocalImagePath(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const resolvedUrl = url.startsWith("/") ? `http://localhost${url}` : url;
  const isLocalUpload = resolvedUrl.includes("/uploads/");
  const isLocalGenerated = resolvedUrl.includes("/generated/");
  const isLocalhost = resolvedUrl.includes("localhost");

  if (!isLocalUpload && !isLocalGenerated && !isLocalhost) {
    return null;
  }

  if (isLocalUpload) {
    const fileName = resolvedUrl.split("/uploads/")[1] || path.basename(resolvedUrl);
    return path.join(process.cwd(), "public", "uploads", fileName);
  }
  if (isLocalGenerated) {
    const fileName = resolvedUrl.split("/generated/")[1] || path.basename(resolvedUrl);
    return path.join(process.cwd(), "public", "generated", fileName);
  }
  const fileName = path.basename(resolvedUrl);
  return path.join(process.cwd(), "public", "uploads", fileName);
}

async function urlToBase64(url: string, origin: string): Promise<string | null> {
  try {
    const resolvedUrl = url.startsWith("/") ? `${origin}${url}` : url;

    // Prefer reading local files from disk to avoid self-fetch failures.
    const localPath = resolveLocalImagePath(resolvedUrl);
    if (localPath) {
      try {
        const buffer = fs.readFileSync(localPath);
        const ext = path.extname(localPath).toLowerCase();
        const contentType = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".webp" ? "image/webp" : "image/png";
        return `data:${contentType};base64,${buffer.toString("base64")}`;
      } catch (e) {
        console.warn("[DirectGenerate] failed to read local image, falling back to fetch:", localPath, e);
      }
    }

    const res = await fetch(resolvedUrl, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "image/png";
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (e) {
    console.error("[DirectGenerate] failed to fetch image:", e);
    return null;
  }
}

async function generatePromptFromUserGoal(
  productImageBase64s: string[],
  userGoal: string,
  requestId?: string
): Promise<string> {
  const tag = requestId ? `[DirectGenerate][${requestId}]` : "[DirectGenerate]";
  const llmUrl = process.env.LLM_API_URL || `${process.env.NEXT_PUBLIC_CHATGPT2API_URL || "http://localhost:3000/v1"}/chat/completions`;
  const apiKey = process.env.VOLCANO_API_KEY || process.env.KIMI_API_KEY || process.env.NEXT_PUBLIC_CHATGPT2API_KEY || "chatgpt2api";

  const systemPrompt = `You are an expert e-commerce image prompt engineer. Your task is to write a single, high-quality English image generation prompt based on the user's product photo and their description.

Rules:
- Output ONLY the final image prompt, no explanations, no markdown.
- The prompt should describe: product composition, lighting, background, mood, camera angle, and any text/copy style if needed.
- Keep it concise but vivid (80-200 words).
- The product in the photo must remain the hero of the image.
- Use commercial photography / e-commerce main image style.`;

  const userContent: Array<{ type: string; [key: string]: unknown }> = [];
  for (const base64 of productImageBase64s) {
    userContent.push({ type: "image_url", image_url: { url: base64 } });
  }
  userContent.push({ type: "text", text: `User request: ${userGoal}\n\nWrite the image generation prompt in English.` });

  try {
    const res = await fetch(llmUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "auto",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: userContent,
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.warn(`${tag} LLM prompt generation failed:`, res.status, errorData);
      return userGoal;
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      console.warn(`${tag} LLM returned empty prompt, falling back to userGoal`);
      return userGoal;
    }

    console.log(`${tag} LLM prompt generated, length:`, content.length);
    return content;
  } catch (e) {
    console.warn(`${tag} LLM prompt generation error, falling back to userGoal:`, e);
    return userGoal;
  }
}

// POST /api/ai-image/v2/direct-generate
export async function POST(request: NextRequest) {
  const requestId = `direct-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  try {
    const scope = await getAuthScope(request);
    if (!scope) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const activeCode = requireActiveAuthorizationCode(scope);
    if (!activeCode.ok) {
      return NextResponse.json({ error: activeCode.error }, { status: activeCode.status });
    }

    const tenantId = "default";

    const quotaCheck = await checkAndResetQuotaForScope(scope);
    if (!quotaCheck.ok) {
      return NextResponse.json(
        { error: quotaErrorMessage(quotaCheck.hoursUntilReset), code: "QUOTA_EXHAUSTED" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      productImageUrl,
      productImageUrls,
      userGoal,
      width = 1024,
      height = 1024,
      styleReferenceUrls = [],
      sessionId,
    } = body;

    const rawProductImageUrls = Array.isArray(productImageUrls)
      ? productImageUrls.filter((u: unknown): u is string => typeof u === "string" && u.trim().length > 0)
      : typeof productImageUrl === "string" && productImageUrl.trim().length > 0
        ? [productImageUrl]
        : [];

    if (rawProductImageUrls.length === 0) {
      return NextResponse.json({ error: "请上传商品图" }, { status: 400 });
    }
    if (!userGoal || typeof userGoal !== "string" || !userGoal.trim()) {
      return NextResponse.json({ error: "请输入制图目标" }, { status: 400 });
    }

    const origin = request.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3002";
    const resolvedProductImageUrls = rawProductImageUrls.map((u: string) =>
      u.startsWith("/") ? `${origin}${u}` : u
    );
    const resolvedProductImageUrl = resolvedProductImageUrls[0];
    const resolvedStyleReferenceUrls = Array.isArray(styleReferenceUrls)
      ? styleReferenceUrls.map((u: unknown) =>
          typeof u === "string" && u.startsWith("/") ? `${origin}${u}` : String(u)
        )
      : [];

    const productImageBase64s = (
      await Promise.all(resolvedProductImageUrls.map((u) => urlToBase64(u, origin)))
    ).filter((v): v is string => Boolean(v));
    if (productImageBase64s.length === 0) {
      return NextResponse.json({ error: "无法读取商品图" }, { status: 400 });
    }

    const finalPrompt = await generatePromptFromUserGoal(productImageBase64s, userGoal.trim(), requestId);

    const providerName = process.env.IMAGE_PROVIDER || "chatgpt2api";
    const provider = getImageProvider(providerName);

    const configSnapshot = JSON.stringify({
      width,
      height,
      provider: providerName,
      source: "direct-generate",
      userGoal: userGoal.trim(),
      sessionId: sessionId || undefined,
    });

    const task = await prisma.aiImageTask.create({
      data: {
        tenantId,
        userId: scope.userId,
        authorizationCodeId: scope.authorizationCodeId ?? null,
        promptGroupId: null,
        selectedFragmentIds: null,
        promptSnapshot: finalPrompt,
        userPrompt: userGoal.trim(),
        negativePromptSnapshot: null,
        configSnapshot,
        referenceImagesSnapshot: JSON.stringify({
          productImageUrl: resolvedProductImageUrl,
          productImageUrls: resolvedProductImageUrls,
          styleReferenceUrls: resolvedStyleReferenceUrls,
        }),
        status: "pending",
        provider: providerName,
      },
    });

    await prisma.aiImageTask.update({
      where: { id: task.id },
      data: { status: "processing" },
    });

    const GENERATE_TIMEOUT_MS = 90000;
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), GENERATE_TIMEOUT_MS);

    let result;
    try {
      result = await provider.generate({
        prompt: finalPrompt,
        negativePrompt: "",
        productImageUrl: resolvedProductImageUrl,
        productImageUrls: resolvedProductImageUrls,
        styleReferenceUrls: resolvedStyleReferenceUrls,
        width: Number(width),
        height: Number(height),
        strictSize: true,
        model: undefined,
        quality: undefined,
        signal: abortController.signal,
      });
      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        await prisma.aiImageTask.update({
          where: { id: task.id },
          data: { status: "failed", errorMessage: "生成超时（90秒），请重试" },
        });
        return NextResponse.json({ error: "生成超时（90秒），请重试" }, { status: 504 });
      }
      throw err;
    }

    if (result.success && result.imageUrl) {
      let imageUrl = result.imageUrl;
      if (providerName === "chatgpt2api" && imageUrl && imageUrl.includes("localhost:3000")) {
        imageUrl = imageUrl.replace("localhost:3000", "47.237.113.100:3000");
      }

      const persistResult = await persistImageWithThumb(task.id, imageUrl);
      const effectiveImageUrl = persistResult?.localUrl ?? imageUrl;
      const effectiveThumbUrl = persistResult?.thumbUrl ?? effectiveImageUrl;

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
        console.log("[DirectGenerate] failed to download image for base64:", e);
      }

      const remainingQuota = await deductQuotaForScope(scope, 1);

      const updatedTask = await prisma.aiImageTask.update({
        where: { id: task.id },
        data: {
          status: "completed",
          resultImageUrl: JSON.stringify([effectiveImageUrl]),
          thumbImageUrl: effectiveThumbUrl,
        },
      });

      if (typeof sessionId === "string" && sessionId) {
        const v2Session = await prisma.aiImageV2Session.findFirst({
          where: { id: sessionId, ...scopedTenantUserWhere(scope, tenantId) },
          select: { id: true, userId: true },
        });
        if (v2Session) {
          await prisma.aiImageV2GeneratedImage.create({
            data: {
              sessionId,
              tenantId,
              userId: v2Session.userId,
              planId: null,
              taskId: task.id,
              tab: "product",
              imageUrl: effectiveImageUrl,
              thumbImageUrl: effectiveThumbUrl,
              imageBase64: imageBase64 || null,
            },
          });
          await prisma.aiImageV2Session.update({
            where: { id: sessionId },
            data: { updatedAt: new Date() },
          });
        }
      }

      return NextResponse.json({
        data: updatedTask,
        imageUrl: effectiveImageUrl,
        thumbUrl: effectiveThumbUrl,
        imageBase64,
        remainingQuota,
        debug: {
          provider: providerName,
          size: `${width}x${height}`,
          promptLength: finalPrompt.length,
          usedFallbackPrompt: finalPrompt === userGoal.trim(),
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
      return NextResponse.json(
        { data: updatedTask, error: result.error || "生成失败" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`[DirectGenerate][${requestId}] error:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "直接生成失败" },
      { status: 500 }
    );
  }
}
