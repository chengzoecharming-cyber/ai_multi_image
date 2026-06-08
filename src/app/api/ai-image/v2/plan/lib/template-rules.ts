import type {
  CopyBlock,
  CreativePlan,
  InformationDensity,
  LayoutType,
  PlanArchetype,
  VisualComplexity,
} from "@/app/ai-image/v2/types";
import type { VisualStyleId } from "@/app/ai-image/v2/plan-taxonomy";
import { DEFAULT_THREE_PLAN_STYLE_IDS, getVisualStyleProfile } from "@/app/ai-image/v2/plan-taxonomy";
import { getSystemTemplateProfile } from "@/app/ai-image/v2/domain/templates";
import type { SystemTemplate, CopyProfile as DomainCopyProfile } from "@/app/ai-image/v2/domain/templates";
import type { StyleWorldPromptHints } from "@/app/ai-image/v2/domain/plan-brief";
import { getVisualStyleFallbackForStyleWorld } from "@/app/ai-image/v2/domain/plan-brief/style-world-adapter";
import { buildLayoutOverlay } from "./layout-overlay";
import { buildImageGenerationPrompt, buildPlanSummaryPrompt } from "./prompt-builders";

/** 将新版 SystemTemplate 转换为旧版 TemplateRule（渐进迁移桥梁） */
function systemTemplateToTemplateRule(st: SystemTemplate): TemplateRule {
  return {
    id: st.id,
    archetype: st.archetype as PlanArchetype,
    imageType: st.imageType,
    visualComplexity: st.visualComplexity as VisualComplexity,
    informationDensity: st.informationDensity as InformationDensity,
    copyProfile: st.copyProfile as DomainCopyProfile,
    visualIdentity: st.visualIdentity || "",
    colorDirection: st.colorDirection || "",
    layoutNonNegotiables: st.layoutNonNegotiables || "",
    styleIds: st.allowedStyleIds as VisualStyleId[],
    variants: st.variants as TemplateVariant[],
    riskRules: st.riskRules,
  };
}

type CopyProfile =
  | "headline_only"
  | "headline_labels"
  | "feature_medium"
  | "technical_medium"
  | "comparison_medium"
  | "application_medium"
  | "bundle_medium"
  | "promo_rich";

interface TemplateVariant {
  name: string;
  layoutType: LayoutType;
  layoutDirection: string;
}

interface TemplateRule {
  id: string;
  archetype: PlanArchetype;
  imageType: string;
  visualComplexity: VisualComplexity;
  informationDensity: InformationDensity;
  copyProfile: CopyProfile;
  visualIdentity: string;
  colorDirection: string;
  layoutNonNegotiables: string;
  styleIds: VisualStyleId[];
  variants: TemplateVariant[];
  riskRules?: string[];
}

export function getTemplateRule(templateId?: string): TemplateRule | undefined {
  if (!templateId) return undefined;

  const st = getSystemTemplateProfile(templateId);
  if (!st) return undefined;

  // imageset5 当前下线且字段不完整，保持旧行为返回 undefined
  if (!st.visualIdentity || !st.colorDirection || !st.layoutNonNegotiables || !st.copyProfile) {
    return undefined;
  }

  return systemTemplateToTemplateRule(st);
}

export function getTemplateRulePrompt(templateId?: string): string {
  const rule = getTemplateRule(templateId);
  if (!rule) return "";
  const variants = rule.variants
    .map((variant, index) => `${index + 1}. ${variant.name}: ${variant.layoutDirection}`)
    .join("\n");
  const styles = rule.styleIds
    .map((styleId, index) => {
      const style = getVisualStyleProfile(styleId);
      return style ? `${index + 1}. ${style.label} (id: ${styleId})` : `${index + 1}. ${styleId}`;
    })
    .join("\n");

  return `
模板参考信息（供模型参考，不强制）：
- 模板用途：${rule.archetype}
- 图片类型：${rule.imageType}
- 可选视觉风格：
${styles}
- 可选构图变体：
${variants}
`.trim();
}

function trimText(value: string, fallback: string): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || fallback;
}

function block(id: string, title: string, role: CopyBlock["role"], priority: number, body?: string, iconHint?: string): CopyBlock {
  return {
    id,
    title: trimText(title, "PRODUCT"),
    body: body ? trimText(body, "") : undefined,
    role,
    iconHint,
    priority,
  };
}

function enforceCopyProfile(plan: CreativePlan, _profile: CopyProfile): CopyBlock[] {
  const existing = Array.isArray(plan.copyBlocks) ? plan.copyBlocks.filter((b) => b?.title?.trim()) : [];
  if (existing.length > 0) {
    return existing
      .slice()
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
      .map((item, index) => ({
        ...item,
        id: item.id || `cb-${index + 1}`,
        priority: Number.isFinite(item.priority) ? item.priority : index + 1,
      }));
  }

  const headline = plan.headline?.trim() ? block("cb-headline", plan.headline, "headline", 1) : undefined;
  const subtitle = plan.subtitle?.trim() ? block("cb-subheadline", plan.subtitle, "subheadline", 2) : undefined;
  const noteBlocks = (plan.sellingPoints || [])
    .slice(0, 6)
    .map((note, index) => block(`cb-note-${index + 1}`, note, "feature_point", index + 3));

  return [headline, subtitle, ...noteBlocks].filter(Boolean) as CopyBlock[];
}

/**
 * v2.1: 从 PlanBrief 中提取 styleWorldPromptHints 并合并进 CreativePlan。
 *
 * 将 StyleWorld hints 作为参考加入，不强约束模型。
 */
function mergeStyleWorldHints(
  plan: CreativePlan,
  hints?: StyleWorldPromptHints
): CreativePlan {
  if (!hints) return plan;

  const extraRules = [
    ...hints.extraMandatoryRules,
    ...hints.sceneHints,
    ...hints.lightingHints,
  ];

  return {
    ...plan,
    visualDirection: hints.visualDirectionAddendum
      ? `${plan.visualDirection || ""}\n[视觉风格参考: ${hints.visualDirectionAddendum}]`.trim()
      : plan.visualDirection,
    colorDirection: hints.colorDirectionAddendum
      ? `${plan.colorDirection || ""}\n[色彩参考: ${hints.colorDirectionAddendum}]`.trim()
      : plan.colorDirection,
    riskWarnings: Array.from(new Set([...(plan.riskWarnings || []), ...extraRules, ...hints.extraAvoidRules])),
  };
}

export function applyTemplateRuleToPlan(
  plan: CreativePlan,
  templateId?: string,
  variantIndex = 0,
  styleWorldHints?: StyleWorldPromptHints,
  resolvedPrimaryStyleWorld?: string
): CreativePlan {
  const rule = getTemplateRule(templateId || plan.templateId);

  // ── 空模板 / 无 rule 分支 ──
  if (!rule) {
    let styleId: import("@/app/ai-image/v2/plan-taxonomy").VisualStyleId;
    if (resolvedPrimaryStyleWorld) {
      styleId = getVisualStyleFallbackForStyleWorld(resolvedPrimaryStyleWorld as import("@/app/ai-image/v2/domain/style-worlds").StyleWorldId);
    } else {
      styleId = DEFAULT_THREE_PLAN_STYLE_IDS[variantIndex % DEFAULT_THREE_PLAN_STYLE_IDS.length];
    }
    const style = getVisualStyleProfile(styleId);
    let next: CreativePlan = {
      ...plan,
      templateId: templateId || plan.templateId,
      planName: plan.planName?.includes(style.label) ? plan.planName : `${plan.planName} · ${style.label}`,
      visualDirection: `${style.visualDirection}\n此方案使用"${style.label}"风格，与另外两方案保持视觉差异。`,
      colorDirection: style.colorDirection,
      layoutDirection: `${plan.layoutDirection}\n构图要求：与另外两方案使用不同的构图、产品角度和信息密度。`,
    };
    next = mergeStyleWorldHints(next, styleWorldHints);
    next.layoutOverlay = buildLayoutOverlay(
      next.headline,
      next.subtitle,
      next.sellingPoints,
      next.layoutDirection,
      next.imageType,
      next.copyBlocks
    );
    next.planSummaryPrompt = buildPlanSummaryPrompt(next);
    next.imageGenerationPrompt = buildImageGenerationPrompt(next);
    next.finalPrompt = next.imageGenerationPrompt;
    return next;
  }

  const variant = rule.variants[variantIndex % rule.variants.length];
  const style = getVisualStyleProfile(rule.styleIds[variantIndex % rule.styleIds.length]);
  const copyBlocks = enforceCopyProfile(plan, rule.copyProfile);
  const sellingPoints = (plan.sellingPoints || []).length > 0
    ? [...(plan.sellingPoints || [])]
    : copyBlocks
      .filter((item) => item.role !== "headline" && item.role !== "subheadline")
      .map((item) => item.body ? `${item.title} / ${item.body}` : item.title)
      .slice(0, 6);

  // 模板信息仅作为参考，不强约束
  const layoutDirection = `版式类型: ${variant.layoutType}。${variant.layoutDirection}`;
  const visualDirection = `${style.visualDirection}\n[模板背景: ${rule.visualIdentity}]\n变体"${variant.name}"：使用此构图变体。此方案风格为"${style.label}"，与另外两方案保持差异。`;
  const colorDirection = `${style.colorDirection}\n[模板色彩参考: ${rule.colorDirection}]`;

  let next: CreativePlan = {
    ...plan,
    planName: plan.planName?.includes(variant.name) ? plan.planName : `${plan.planName} · ${variant.name}`,
    planArchetype: rule.archetype,
    templateId: rule.id,
    imageType: rule.imageType,
    subtitle: plan.subtitle,
    copyBlocks,
    sellingPoints,
    visualDirection,
    colorDirection,
    layoutDirection,
    visualComplexity: rule.visualComplexity,
    informationDensity: rule.informationDensity,
    riskWarnings: Array.from(
      new Set(
        [
          ...(plan.riskWarnings || []),
          ...(rule.riskRules || []),
          rule.layoutNonNegotiables,
        ].filter(Boolean)
      )
    ),
  };

  next = mergeStyleWorldHints(next, styleWorldHints);

  next.layoutOverlay = buildLayoutOverlay(
    next.headline,
    next.subtitle,
    next.sellingPoints,
    layoutDirection,
    next.imageType,
    next.copyBlocks
  );
  next.planSummaryPrompt = buildPlanSummaryPrompt(next);
  next.imageGenerationPrompt = buildImageGenerationPrompt(next);
  next.finalPrompt = next.imageGenerationPrompt;

  return next;
}
