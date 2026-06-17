import type {
  ProductAnalysis,
  CreativePlan,
  ImageSetPlan,
  LayoutOverlay,
  CopyBlock,
  CopySource,
  PlanArchetype,
  VisualComplexity,
  InformationDensity,
  ImageRole,
} from "@/app/ai-image/v2/types";
import { buildLayoutOverlay } from "./layout-overlay";
import { buildPlanSummaryPrompt, buildImageGenerationPrompt } from "./prompt-builders";

export function normalizeProductAnalysis(raw: unknown): ProductAnalysis {
  const r = raw as Record<string, unknown>;
  return {
    productName: String(r?.productName || "Product"),
    productType: String(r?.productType || "General"),
    productSubjectDescription: String(r?.productSubjectDescription || "Product subject"),
    visibleFeatures: Array.isArray(r?.visibleFeatures) ? r.visibleFeatures.map(String) : ["Main body"],
    materialGuess: r?.materialGuess ? String(r.materialGuess) : undefined,
    structureRisks: Array.isArray(r?.structureRisks) ? r.structureRisks.map(String) : ["Preserve original structure"],
    detectedNonProductElements: Array.isArray(r?.detectedNonProductElements)
      ? r.detectedNonProductElements.map(String)
      : [],
    isolationInstruction: String(r?.isolationInstruction || "Isolate product from background"),
  };
}

function normalizeCopyBlock(raw: unknown): CopyBlock {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r?.id || `cb-${Math.random().toString(36).slice(2, 6)}`),
    title: String(r?.title || ""),
    subtitle: r?.subtitle ? String(r.subtitle) : undefined,
    body: r?.body ? String(r.body) : undefined,
    role: (r?.role as CopyBlock["role"]) || "feature_point",
    iconHint: r?.iconHint ? String(r.iconHint) : undefined,
    priority: Number(r?.priority || 1),
  };
}

export function normalizeCreativePlan(raw: unknown, fallbackAnalysis?: ProductAnalysis): CreativePlan {
  const p = raw as Record<string, unknown>;
  const analysis = p?.productAnalysis
    ? normalizeProductAnalysis(p.productAnalysis)
    : fallbackAnalysis;

  const headline = p?.headline ? String(p.headline) : undefined;
  const subtitle = p?.subtitle ? String(p.subtitle) : undefined;
  const sellingPoints = (() => {
    if (!Array.isArray(p?.sellingPoints)) return undefined;
    // Some models return structured objects; convert them to readable strings.
    return (p.sellingPoints as unknown[]).map((sp) => {
      if (typeof sp === "string") return sp;
      if (!sp || typeof sp !== "object") return String(sp);
      const o = sp as Record<string, unknown>;
      const title = o.title ? String(o.title) : "";
      const body = o.body ? String(o.body) : "";
      const subtitleText = o.subtitle ? String(o.subtitle) : "";
      const parts = [title, body || subtitleText].map((x) => x.trim()).filter(Boolean);
      if (parts.length === 0) return "FEATURE";
      return parts.join(" — ");
    });
  })();

  const templateId = String(p?.templateId || "tpl-feature-explanation");
  const isBlank = templateId === "tpl-blank-free";

  const layoutDirection = String(
    p?.layoutDirection || (isBlank ? "" : "Centered product on clean background")
  );
  const visualDirection = String(
    p?.visualDirection || (isBlank ? "" : "Professional studio lighting")
  );
  const colorDirection = String(
    p?.colorDirection || (isBlank ? "" : "Neutral background")
  );
  const imageType = String(p?.imageType || "product_showcase");

  // Normalize copyBlocks
  let copyBlocks: CopyBlock[] = [];
  if (Array.isArray(p?.copyBlocks)) {
    copyBlocks = p.copyBlocks.map(normalizeCopyBlock);
  }

  // Ensure we always have at least some copyBlocks (only if content exists)
  if (copyBlocks.length === 0 && (headline || subtitle || (sellingPoints && sellingPoints.length > 0))) {
    if (headline) {
      copyBlocks.push({ id: "cb-headline", title: headline, role: "headline", priority: 1 });
    }
    if (subtitle) {
      copyBlocks.push({ id: "cb-subheadline", title: subtitle, role: "subheadline", priority: 2 });
    }
    (sellingPoints || []).forEach((sp, i) => {
      copyBlocks.push({ id: `cb-sp-${i}`, title: sp, role: "feature_point", priority: 3 + i });
    });
  }

  let layoutOverlay = p?.layoutOverlay as LayoutOverlay | undefined;
  if (!layoutOverlay) {
    layoutOverlay = buildLayoutOverlay(
      headline,
      subtitle,
      sellingPoints,
      layoutDirection,
      imageType,
      copyBlocks
    );
  }

  const copySource = (p?.copySource as CopySource) || "ai_suggested";
  const planArchetype = (p?.planArchetype as PlanArchetype) || "hero_feature";
  const visualComplexity = (p?.visualComplexity as VisualComplexity) || "medium";
  const informationDensity = (p?.informationDensity as InformationDensity) || "medium";

  const plan: CreativePlan = {
    id: String(p?.id || `plan-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`),
    planName: String(p?.planName || "方案"),
    planArchetype,
    templateId,
    imageType,
    productAnalysis: analysis,
    productName: String(p?.productName || analysis?.productName || "Product"),
    headline,
    subtitle,
    sellingPoints,
    copyBlocks,
    headlineCn: p?.headlineCn ? String(p.headlineCn) : undefined,
    subtitleCn: p?.subtitleCn ? String(p.subtitleCn) : undefined,
    sellingPointsCn: Array.isArray(p?.sellingPointsCn)
      ? (p.sellingPointsCn as unknown[]).map((sp) => (typeof sp === "string" ? sp : String(sp)))
      : undefined,
    copyBlocksCn: Array.isArray(p?.copyBlocksCn)
      ? (p.copyBlocksCn as unknown[]).map(normalizeCopyBlock)
      : undefined,
    copySource,
    copyNotes: Array.isArray(p?.copyNotes) ? p.copyNotes.map(String) : undefined,
    layoutDirection,
    visualDirection,
    colorDirection,
    visualComplexity,
    informationDensity,
    layoutOverlay,
    textLanguage: "English",
    riskWarnings: Array.isArray(p?.riskWarnings) ? p.riskWarnings.map(String) : ["Keep text short English"],
  };

  // CRITICAL FIX: If LLM already returned imageGenerationPrompt / planSummaryPrompt,
  // preserve them instead of overwriting with generic mock-style prompts.
  // The LLM generates prompts that already incorporate template visual identity,
  // product-specific details, and rich copyBlocks. Overwriting them destroys
  // template enforcement and produces generic output.
  const llmImageGenPrompt = p?.imageGenerationPrompt ? String(p.imageGenerationPrompt) : undefined;
  const llmPlanSummary = p?.planSummaryPrompt ? String(p.planSummaryPrompt) : undefined;

  if (llmImageGenPrompt && llmPlanSummary) {
    plan.imageGenerationPrompt = llmImageGenPrompt;
    plan.planSummaryPrompt = llmPlanSummary;
  } else if (isBlank) {
    // 空白模板：始终使用精简的 blank prompt 构建器
    plan.imageGenerationPrompt = buildImageGenerationPrompt(plan);
    plan.planSummaryPrompt = buildPlanSummaryPrompt(plan);
  } else {
    plan.planSummaryPrompt = buildPlanSummaryPrompt(plan);
    plan.imageGenerationPrompt = buildImageGenerationPrompt(plan);
  }
  plan.finalPrompt = plan.imageGenerationPrompt;

  return plan;
}

export function normalizeImageSetPlan(raw: unknown): ImageSetPlan {
  const s = raw as Record<string, unknown>;
  const analysis = normalizeProductAnalysis(s?.productAnalysis);

  const rawPlans = Array.isArray(s?.plans) ? s.plans : [];
  const plans = rawPlans.map((p) => normalizeCreativePlan(p, analysis));

  let imageRoles: ImageRole[] = [];
  if (Array.isArray(s?.imageRoles)) {
    imageRoles = s.imageRoles.map((r: unknown) => {
      const raw = r as Record<string, unknown>;
      return {
        index: Number(raw?.index || 0),
        role: String(raw?.role || ""),
        purpose: String(raw?.purpose || ""),
      };
    });
  }

  // Default image roles if not provided
  if (imageRoles.length === 0) {
    imageRoles = [
      { index: 0, role: "Hero / 主视觉", purpose: "让用户一眼知道产品是什么、核心卖点是什么" },
      { index: 1, role: "Feature / 核心卖点", purpose: "解释产品为什么好，展示主要优势" },
      { index: 2, role: "Technical / 结构细节", purpose: "展示产品关键结构" },
      { index: 3, role: "Application / 应用场景", purpose: "展示适用材料、使用环境或应用方向" },
      { index: 4, role: "Comparison / 购买理由", purpose: "通过对比或规格信息强化购买理由" },
    ];
  }

  return {
    id: String(s?.id || `set-${Date.now()}`),
    setName: String(s?.setName || "五张详情组图"),
    templateId: String(s?.templateId || "tpl-image-set-5"),
    productAnalysis: analysis,
    storyline: String(s?.storyline || "Cohesive e-commerce product visual suite for maximum conversion."),
    imageRoles,
    overallDirection: String(s?.overallDirection || "Clean e-commerce product photography suite"),
    platform: s?.platform ? String(s.platform) : undefined,
    imageCount: Number(s?.imageCount || plans.length || 5),
    plans,
    riskWarnings: Array.isArray(s?.riskWarnings) ? s.riskWarnings.map(String) : ["Keep text short English"],
  };
}
