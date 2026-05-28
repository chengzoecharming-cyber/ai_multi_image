import { NextRequest, NextResponse } from "next/server";
import { getImageProvider } from "@/lib/image-providers";
import { persistGeneratedImage } from "@/lib/image-persist";
import { prisma } from "@/lib/db";
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
}

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
  };
}

function buildDetailPrompt(args: {
  type: DetailType;
  productDescription: string;
  heroContext?: HeroPlanContext | null;
}): string {
  const base = (args.productDescription || "").trim();
  const hero = args.heroContext;

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
    "", // separator
    styleAnchor,
    "",
    "【文案要求】",
    "- 画面可包含简洁的英文文案，用于电商展示。文案有无、内容、密度交由大模型根据图片功能自由决定。",
    "- 禁止虚构技术参数、价格、品牌、认证。",
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
      "禁止生成真实尺寸数值或具体测量，尺寸值必须是占位符样式（空白、破折号或通用标签）。",
    ].join("\n"),
  };

  return `${common}\n\n${base ? `Product: ${base}\n` : ""}${perType[args.type]}`.trim();
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
    const body = await request.json();
    const {
      heroImageUrl,
      productDescription,
      selectedTypes,
      output,
      heroPlan,
    } = body as {
      heroImageUrl?: unknown;
      productDescription?: unknown;
      selectedTypes?: unknown;
      output?: { width?: unknown; height?: unknown };
      heroPlan?: unknown;
    };

    const origin = request.nextUrl?.origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resolvedHeroImageUrl = resolveUrl(origin, heroImageUrl);
    if (!resolvedHeroImageUrl) {
      return NextResponse.json({ error: "缺少主图 heroImageUrl" }, { status: 400 });
    }

    const validTypes: DetailType[] = ["detail", "multi_angle", "lifestyle", "feature", "comparison", "spec"];
    const types: DetailType[] = Array.isArray(selectedTypes)
      ? (selectedTypes.filter((t): t is DetailType => validTypes.includes(t as DetailType)) as DetailType[])
      : [];
    if (types.length === 0) {
      return NextResponse.json({ error: "selectedTypes 不能为空" }, { status: 400 });
    }

    const width = Number.isFinite(Number(output?.width)) ? Number(output?.width) : 1024;
    const height = Number.isFinite(Number(output?.height)) ? Number(output?.height) : 1024;

    const providerName = body.provider || process.env.IMAGE_PROVIDER || "pollinations";
    const provider = getImageProvider(providerName);

    const heroContext = extractHeroContext(heroPlan as CreativePlan | null);

    const pages: Array<{ type: DetailType; imageUrl: string; taskId?: string }> = [];
    let index = 0;
    for (const type of types) {
      const prompt = buildDetailPrompt({
        type,
        productDescription: typeof productDescription === "string" ? productDescription : "",
        heroContext,
      });

      const negativePrompt =
        "watermark, ai generated mark, logo, signature, corner badge, copyright stamp, generated by, ai watermark, brand mark, label as decoration, stamp, qr code";

      const task = await prisma.aiImageTask.create({
        data: {
          tenantId: "default",
          userId: "default",
          promptSnapshot: prompt,
          userPrompt: typeof productDescription === "string" ? productDescription.trim() : null,
          negativePromptSnapshot: negativePrompt,
          configSnapshot: JSON.stringify({ width, height, detailType: type, strictSize: true, model: "default", quality: "standard" }),
          referenceImagesSnapshot: JSON.stringify({ productImageUrl: resolvedHeroImageUrl, styleReferenceUrls: [resolvedHeroImageUrl] }),
          status: "processing",
          provider: providerName,
        },
      });

      const result = await provider.generate({
        prompt,
        negativePrompt,
        productImageUrl: resolvedHeroImageUrl,
        styleReferenceUrls: [resolvedHeroImageUrl],
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
      const localUrl = await persistGeneratedImage(result.imageUrl, fileName, origin);
      const effectiveUrl = localUrl || result.imageUrl;

      await prisma.aiImageTask.update({
        where: { id: task.id },
        data: {
          status: "completed",
          resultImageUrl: JSON.stringify([effectiveUrl]),
        },
      });

      pages.push({ type, imageUrl: effectiveUrl, taskId: task.id });
      index++;
    }

    return NextResponse.json({ pages });
  } catch (error) {
    console.error("[v2/detail/generate] Failed:", error);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}
