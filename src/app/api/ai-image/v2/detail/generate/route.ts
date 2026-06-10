import { NextRequest, NextResponse } from "next/server";
import { getImageProvider } from "@/lib/image-providers";
import { persistGeneratedImage } from "@/lib/image-persist";
import { prisma } from "@/lib/db";
import { getAuthScope, requireActiveAuthorizationCode, scopedTenantUserWhere } from "@/lib/auth-scope";
import { checkAndResetQuotaForScope, deductQuotaForScope, quotaErrorMessage } from "@/lib/quota";
import type { CreativePlan } from "@/app/ai-image/v2/types";

type DetailType = "detail" | "multi_angle" | "lifestyle" | "feature" | "comparison" | "spec";

interface HeroPlanContext {
  headline?: string;
  subtitle?: string;
  sellingPoints?: string[];
  visualDirection?: string;
  colorDirection?: string;
  layoutDirection?: string;
  productName?: string;
  productAnalysis?: {
    productType?: string;
    productSubjectDescription?: string;
    visibleFeatures?: string[];
    materialGuess?: string;
    structureRisks?: string[];
  };
  copyBlocks?: Array<{ title?: string; body?: string; role?: string }>;
}

const LLM_API_URL = process.env.LLM_API_URL || `${process.env.NEXT_PUBLIC_CHATGPT2API_URL || "http://localhost:3000/v1"}/chat/completions`;
const LLM_MODEL = process.env.LLM_MODEL || "auto";
const LLM_AUTH_KEY = process.env.VOLCANO_API_KEY || process.env.KIMI_API_KEY || process.env.NEXT_PUBLIC_CHATGPT2API_KEY || "chatgpt2api";

function extractHeroContext(plan?: CreativePlan | null): HeroPlanContext | null {
  if (!plan) return null;
  return {
    headline: plan.headline || undefined,
    subtitle: plan.subtitle || undefined,
    sellingPoints: plan.sellingPoints || undefined,
    visualDirection: plan.visualDirection || undefined,
    colorDirection: plan.colorDirection || undefined,
    layoutDirection: plan.layoutDirection || undefined,
    productName: plan.productName || undefined,
    productAnalysis: plan.productAnalysis
      ? {
          productType: plan.productAnalysis.productType || undefined,
          productSubjectDescription: plan.productAnalysis.productSubjectDescription || undefined,
          visibleFeatures: plan.productAnalysis.visibleFeatures || undefined,
          materialGuess: plan.productAnalysis.materialGuess || undefined,
          structureRisks: plan.productAnalysis.structureRisks || undefined,
        }
      : undefined,
    copyBlocks: plan.copyBlocks?.map((b) => ({ title: b.title, body: b.body, role: b.role })) || undefined,
  };
}

function buildDetailPrompt(args: {
  type: DetailType;
  productDescription: string;
  heroContext?: HeroPlanContext | null;
  referenceImageCount?: number;
  activeReferenceIndex?: number;
}): string {
  const base = (args.productDescription || "").trim();
  const hero = args.heroContext;

  // Build rich product context from heroPlan analysis + user description
  const productLines: string[] = [];
  if (hero?.productName) productLines.push(`Product Name: ${hero.productName}`);
  if (hero?.productAnalysis?.productType) productLines.push(`Category: ${hero.productAnalysis.productType}`);
  if (hero?.productAnalysis?.productSubjectDescription) productLines.push(`Description: ${hero.productAnalysis.productSubjectDescription}`);
  if (hero?.productAnalysis?.visibleFeatures && hero.productAnalysis.visibleFeatures.length > 0)
    productLines.push(`Visible Features: ${hero.productAnalysis.visibleFeatures.join("; ")}`);
  if (hero?.productAnalysis?.materialGuess) productLines.push(`Material: ${hero.productAnalysis.materialGuess}`);
  if (hero?.productAnalysis?.structureRisks && hero.productAnalysis.structureRisks.length > 0)
    productLines.push(`Structure Notes: ${hero.productAnalysis.structureRisks.join("; ")}`);
  if (hero?.sellingPoints && hero.sellingPoints.length > 0)
    productLines.push(`Key Selling Points: ${hero.sellingPoints.join(" | ")}`);
  if (hero?.copyBlocks && hero.copyBlocks.length > 0) {
    const msgs = hero.copyBlocks
      .filter((b) => b.title || b.body)
      .map((b) => (b.body ? `${b.title}: ${b.body}` : b.title))
      .join(" | ");
    if (msgs) productLines.push(`Copy Messages: ${msgs}`);
  }
  if (base && !hero?.productAnalysis?.productSubjectDescription) productLines.push(`User Description: ${base}`);

  const productBlock = productLines.length > 0 ? productLines.join("\n") : base;

  // Hero plan style anchor
  const styleAnchor = hero
    ? [
        `【主图风格锚定】以下为主图方案的风格与文案参考，商详图必须保持同一视觉体系：`,
        `- 主标题参考：${hero.headline || "（未提供）"}`,
        hero.subtitle ? `- 副标题参考：${hero.subtitle}` : "",
        hero.sellingPoints && hero.sellingPoints.length > 0
          ? `- 核心卖点池：${hero.sellingPoints.join(" / ")}`
          : "",
        hero.visualDirection ? `- 视觉方向：${hero.visualDirection}` : "",
        hero.colorDirection ? `- 色彩方向：${hero.colorDirection}` : "",
        ``,
        `要求：商详图的光影质感、色调氛围、材质表现必须与主图一致。文案角度可以不同，但视觉体系必须统一。`,
      ]
        .filter(Boolean)
        .join("\n")
    : "【未提供主图方案】请根据商品描述自主决定视觉风格，保持商业摄影级质感。";

  const common = [
    "You are generating an e-commerce carousel image (product detail page slide).",
    "Keep the product identity consistent with the reference image.",
    "Maintain the same lighting, color mood, material treatment, and visual atmosphere as the style reference image.",
    "This is a companion image to the main hero image, part of a cohesive product listing set.",
    "Clean commercial look, realistic materials and lighting.",
    "If multiple reference images are provided, they describe the same product and should be jointly used as factual visual evidence.",
    "User free-text instructions are high priority. If the user text assigns semantic roles to images (e.g., dimension image, feature scene image), follow those assignments.",
    "Priority for numeric specs: USER PROMPT explicit values > readable values on uploaded reference images > qualitative non-numeric labels.",
    "If user prompt explicitly provides values/units, copy them exactly as-is. Do not rewrite decimals, units, symbols, or formatting.",
    "If prompt does not provide values but reference image labels include readable values, copy those values exactly.",
    `Reference images available: ${args.referenceImageCount || 1}. Active reference index: ${args.activeReferenceIndex ?? 0}.`,
    "", // separator
    styleAnchor,
    "",
    "【文案要求】",
    "- 画面可包含简洁的英文文案，用于电商展示。文案有无、内容、密度交由大模型根据图片功能自由决定。",
    "- 允许写入用户已提供的信息，以及可从图片稳定判断的非数值信息（如 part type、material family、process style、color family）。",
    "- 禁止虚构无法验证的精确数值或认证信息（例如具体尺寸值、硬度值、证书编号），除非用户明确提供。",
    "- 参数表/标签应尽量填写可用文本，不要把字段大面积留空或只填占位破折号。",
    "- 如有文字，必须清晰可读，不得被产品遮挡。",
  ].join("\n");

  const perType: Record<DetailType, string> = {
    detail: [
      "【功能定位】细节特写图：展示产品工艺、材质纹理、关键结构。",
      "Focus: close-up detail shot highlighting craftsmanship, texture, edges, and key functional surfaces.",
      "Composition: macro / near-macro, shallow depth of field allowed, product remains recognizable.",
    ].join("\n"),
    multi_angle: [
      "【功能定位】多角度展示图：从另一视角展示产品整体形体。",
      "Focus: a different angle of the same product (rotate viewpoint), showing overall form and structure.",
      "Composition: three-quarter view or side profile, clean background, consistent lighting and color mood.",
    ].join("\n"),
    lifestyle: [
      "【功能定位】使用场景图：展示产品在真实使用环境中的应用。",
      "Focus: realistic usage or contextual scene that matches the product category, still commercial and clean.",
      "Composition: product remains the hero; background elements unbranded and minimal. Show the product 'in action'.",
    ].join("\n"),
    feature: [
      "【功能定位】卖点爆破图：突出核心卖点，信息层次分明。",
      "Focus: highlight selling points through composition and supporting visual elements.",
      "Composition: hero product with organized info cards or callout zones. Benefit points should be clearly visualized, not just text.",
    ].join("\n"),
    comparison: [
      "【功能定位】对比优势图：通过对比展示产品优势或升级点。",
      "Focus: before/after, ordinary vs premium, or competitor comparison layout. Highlight the product's advantage visually.",
      "Composition: split-screen, side-by-side, or overlay comparison. Product must be clearly identified as the better option. 两侧必须是同一产品类型，不能是不同产品。",
    ].join("\n"),
    spec: [
      "【功能定位】规格参数图：展示尺寸、材质、技术参数等关键信息。",
      "Focus: technical specification visualization — dimensions, material, key parameters presented with clarity.",
      "Composition: product shown at scale with dimensional callouts, spec labels, or annotated diagram style. Clean and authoritative.",
      "When exact numeric dimensions are not provided, use qualitative spec text or bounded labels (e.g., 'High Precision', 'Tight Tolerance', 'Custom Size Available') instead of leaving rows blank.",
      "If the user provides exact values, preserve and render them exactly.",
    ].join("\n"),
  };

  return `${common}\n\n${productBlock ? `Product Context:\n${productBlock}\n` : ""}${perType[args.type]}`.trim();
}

async function shouldRetrySpecFill(imageUrl: string): Promise<boolean> {
  try {
    const res = await fetch(LLM_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LLM_AUTH_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          {
            role: "system",
            content:
              'You are a strict image QA checker. Return JSON only: {"needsRetry": boolean, "reason": string}. needsRetry=true when spec/parameter fields are mostly empty placeholders (e.g., "-", "—", blank).',
          },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageUrl } },
              { type: "text", text: "Check if parameter/spec table fields are mostly placeholders or blank. If yes, set needsRetry=true." },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0,
        max_tokens: 200,
      }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return false;
    const parsed = JSON.parse(content) as { needsRetry?: boolean };
    return Boolean(parsed.needsRetry);
  } catch {
    return false;
  }
}

function resolveUrl(origin: string, maybeUrl: unknown): string | null {
  if (typeof maybeUrl !== "string") return null;
  const u = maybeUrl.trim();
  if (!u) return null;
  if (u.startsWith("/")) return `${origin}${u}`;
  return u;
}

export async function POST(request: NextRequest) {
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

    // 配额检查（将在解析 selectedTypes 后扣除对应数量）
    const quotaCheck = await checkAndResetQuotaForScope(scope);
    if (!quotaCheck.ok) {
      return NextResponse.json(
        { error: quotaErrorMessage(quotaCheck.hoursUntilReset), code: "QUOTA_EXHAUSTED" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      heroImageUrl,
      detailImageUrls,
      activeDetailImageIndex,
      productDescription,
      selectedTypes,
      output,
      heroPlan,
      sessionId,
    } = body as {
      heroImageUrl?: unknown;
      detailImageUrls?: unknown;
      activeDetailImageIndex?: unknown;
      productDescription?: unknown;
      selectedTypes?: unknown;
      output?: { width?: unknown; height?: unknown };
      heroPlan?: unknown;
      sessionId?: unknown;
    };
    const v2SessionId = typeof sessionId === "string" ? sessionId : null;

    const origin = request.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resolvedHeroImageUrl = resolveUrl(origin, heroImageUrl);
    if (!resolvedHeroImageUrl) {
      return NextResponse.json({ error: "缺少主图 heroImageUrl" }, { status: 400 });
    }
    const resolvedDetailImageUrls = Array.isArray(detailImageUrls)
      ? detailImageUrls
          .map((u) => resolveUrl(origin, u))
          .filter((u): u is string => Boolean(u))
      : [];
    const currentIndex = Number.isFinite(Number(activeDetailImageIndex)) ? Number(activeDetailImageIndex) : 0;
    const activeRefUrl = resolvedDetailImageUrls[currentIndex] || resolvedHeroImageUrl;
    const referenceUrls = Array.from(new Set([activeRefUrl, ...resolvedDetailImageUrls].filter(Boolean))).slice(0, 6);

    const validTypes: DetailType[] = ["detail", "multi_angle", "lifestyle", "feature", "comparison", "spec"];
    const types: DetailType[] = Array.isArray(selectedTypes)
      ? (selectedTypes.filter((t): t is DetailType => validTypes.includes(t as DetailType)) as DetailType[])
      : [];
    if (types.length === 0) {
      return NextResponse.json({ error: "selectedTypes 不能为空" }, { status: 400 });
    }

    // 检查剩余配额是否足够生成所选类别数量
    if (quotaCheck.remaining < types.length) {
      return NextResponse.json(
        { error: quotaErrorMessage(quotaCheck.hoursUntilReset), code: "QUOTA_EXHAUSTED" },
        { status: 429 }
      );
    }

    const width = Number.isFinite(Number(output?.width)) ? Number(output?.width) : 1024;
    const height = Number.isFinite(Number(output?.height)) ? Number(output?.height) : 1024;

    const providerName = body.provider || process.env.IMAGE_PROVIDER || "chatgpt2api";
    const provider = getImageProvider(providerName);

    const heroContext = extractHeroContext(heroPlan as CreativePlan | null);

    const pages: Array<{ type: DetailType; imageUrl: string; taskId?: string }> = [];
    let index = 0;
    for (const type of types) {
      const prompt = buildDetailPrompt({
        type,
        productDescription: typeof productDescription === "string" ? productDescription : "",
        heroContext,
        referenceImageCount: referenceUrls.length,
        activeReferenceIndex: currentIndex,
      });

      const negativePrompt =
        "watermark, ai generated mark, logo, signature, corner badge, copyright stamp, generated by, ai watermark, brand mark, label as decoration, stamp, qr code";

      const task = await prisma.aiImageTask.create({
        data: {
          tenantId,
          userId: scope.userId,
          authorizationCodeId: scope.authorizationCodeId ?? null,
          promptSnapshot: prompt,
          userPrompt: typeof productDescription === "string" ? productDescription.trim() : null,
          negativePromptSnapshot: negativePrompt,
          configSnapshot: JSON.stringify({ width, height, detailType: type, sessionId: v2SessionId || undefined, strictSize: true, model: "default", quality: "standard" }),
          referenceImagesSnapshot: JSON.stringify({ productImageUrl: activeRefUrl, styleReferenceUrls: referenceUrls }),
          status: "processing",
          provider: providerName,
        },
      });

      const result = await provider.generate({
        prompt,
        negativePrompt,
        productImageUrl: activeRefUrl,
        styleReferenceUrls: referenceUrls,
        width,
        height,
        strictSize: true,
        model: "default",
        quality: "standard",
      });

      if (!result.success || !result.imageUrl) {
        await prisma.aiImageTask.update({
          where: { id: task.id },
          data: { status: "failed", errorMessage: result.error || "生成失败" },
        });
        return NextResponse.json({ error: result.error || "生成失败" }, { status: 500 });
      }

      const fileName = `detail-${Date.now()}-${index}.png`;
      let finalImageUrl = result.imageUrl;
      let localUrl = await persistGeneratedImage(finalImageUrl, fileName, origin);
      let effectiveUrl = localUrl || finalImageUrl;

      // Post-check for spec pages: if fields are mostly placeholders, retry once with stricter fill guidance.
      if (type === "spec") {
        const inspectUrl = effectiveUrl.startsWith("/") ? `${origin}${effectiveUrl}` : effectiveUrl;
        const needsRetry = await shouldRetrySpecFill(inspectUrl);
        if (needsRetry) {
          const retryPrompt = `${prompt}

[MANDATORY SPEC FILL RETRY]
- Do not leave spec rows blank or as '-' / '—' unless truly impossible.
- If user prompt contains values, copy exactly as-is (highest priority).
- Else, read values/labels from reference images and copy exactly.
- Else, fill with concrete qualitative labels (e.g., "Custom", "By Drawing", "High Precision", "CNC Machined", "Metal Body").
- Ensure most rows are meaningfully filled.`;
          const retry = await provider.generate({
            prompt: retryPrompt,
            negativePrompt,
            productImageUrl: activeRefUrl,
            styleReferenceUrls: referenceUrls,
            width,
            height,
            strictSize: true,
            model: "default",
            quality: "standard",
          });
          if (retry.success && retry.imageUrl) {
            finalImageUrl = retry.imageUrl;
            localUrl = await persistGeneratedImage(finalImageUrl, fileName, origin);
            effectiveUrl = localUrl || finalImageUrl;
          }
        }
      }

      await prisma.aiImageTask.update({
        where: { id: task.id },
        data: {
          status: "completed",
          resultImageUrl: JSON.stringify([effectiveUrl]),
        },
      });
      if (v2SessionId) {
        const v2Session = await prisma.aiImageV2Session.findFirst({
          where: { id: v2SessionId, ...scopedTenantUserWhere(scope, tenantId) },
          select: { id: true, userId: true },
        });
        if (v2Session) {
          const existingImage = await prisma.aiImageV2GeneratedImage.findFirst({
            where: { sessionId: v2SessionId, taskId: task.id },
            select: { id: true },
          });
          if (!existingImage) {
            await prisma.aiImageV2GeneratedImage.create({
              data: {
                sessionId: v2SessionId,
                tenantId,
                userId: v2Session.userId,
                taskId: task.id,
                tab: "detail",
                detailType: type,
                imageUrl: effectiveUrl,
              },
            });
            await prisma.aiImageV2Session.update({
              where: { id: v2SessionId },
              data: { updatedAt: new Date() },
            });
          }
        }
      }

      pages.push({ type, imageUrl: effectiveUrl, taskId: task.id });
      index++;
    }

    // 扣除配额（按选择的类别数量）
    const remainingQuota = await deductQuotaForScope(scope, types.length);

    return NextResponse.json({ pages, remainingQuota });
  } catch (error) {
    console.error("[v2/detail/generate] Failed:", error);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
