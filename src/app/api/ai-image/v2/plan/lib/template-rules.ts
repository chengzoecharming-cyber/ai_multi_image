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
      // Keep this short: long visual/color directions in system prompt cause LLM timeouts.
      return style ? `${index + 1}. ${style.label} (id: ${styleId})` : `${index + 1}. ${styleId}`;
    })
    .join("\n");

  return `
STRUCTURED TEMPLATE RULES — MUST FOLLOW:
- templateId: ${rule.id}
- template purpose / structure archetype: ${rule.archetype}
- imageType: ${rule.imageType}
- visualComplexity: ${rule.visualComplexity}
- informationDensity: ${rule.informationDensity}
- copyProfile: ${rule.copyProfile} (guidance only, not fixed block recipe)
- shared template constraints: ${rule.visualIdentity}
- non-negotiable layout rules: ${rule.layoutNonNegotiables}
- style rule: the 3 plans must use DIFFERENT visual styles from this allowed style set.
${styles}
- variation rule: each plan should use a different layout/composition variant below while keeping review flexibility.
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
 * 优先级：StyleWorld hints > 旧 VisualStyle fallback
 * 当 hints 存在时，旧 VisualStyle 降级为 [Context] 参考，不输出强约束。
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
  const extraAvoid = hints.extraAvoidRules;

  // StyleWorld 优先：旧 visualDirection 降级为极简 context，colorDirection 直接丢弃旧 context。
  // 理由：colorDirection 里的 "White or very light neutral background" 等强色彩约束会与
  // StyleWorld 的 gradient/modern/dark 方向产生直接冲突。StyleWorld 的 colorDirectionAddendum
  // 已足够指导模型，旧 palette context 只会制造噪音。
  const oldVisualDir = sanitizeContextNote(plan.visualDirection || "");

  const contextNote = oldVisualDir
    ? `[Style context: ${oldVisualDir.slice(0, 200)}${oldVisualDir.length > 200 ? "..." : ""}]`
    : "";

  return {
    ...plan,
    visualDirection: `${hints.visualDirectionAddendum}${contextNote ? "\n" + contextNote : ""}`,
    colorDirection: hints.colorDirectionAddendum,
    riskWarnings: Array.from(new Set([...(plan.riskWarnings || []), ...extraRules, ...extraAvoid])),
  };
}

/** 将旧 VS visualDirection 中的强约束词替换为中性描述 */
function sanitizeContextNote(text: string): string {
  if (!text) return "";
  return (
    text
      // 强约束 → 中性参考（仅保留描述性语言）
      .replace(/must be pure white/gi, "originally light-toned")
      .replace(/必须为纯白/g, "原方向偏白")
      .replace(/禁止任何非纯白/g, "原方向避免非白")
      .replace(/禁止渐变/g, "原方向无渐变")
      .replace(/no gradient/gi, "originally no-gradient")
      .replace(/background must be.*white/gi, "background originally light-toned")
      .replace(/strict.*禁止.*背景/g, "原方向背景较严格")
      .replace(/full product visibility/gi, "product-forward framing")
      .replace(/full product must remain visible/gi, "product-forward framing")
      .replace(/完整展示/g, "产品为主")
      .replace(/无裁切/g, "保持完整")
      .replace(/不得裁切/g, "保持边缘")
      .replace(/不得裁切边缘/g, "保持边缘完整")
      .replace(/no cropped edges/gi, "edges preserved")
      .replace(/纯白/g, "偏白")
      .trim()
  );
}

export function applyTemplateRuleToPlan(
  plan: CreativePlan,
  templateId?: string,
  variantIndex = 0,
  styleWorldHints?: StyleWorldPromptHints,
  resolvedPrimaryStyleWorld?: string
): CreativePlan {
  const rule = getTemplateRule(templateId || plan.templateId);

  // ── 空模板 / 无 rule 分支：优先使用 StyleWorld fallback ──
  if (!rule) {
    // 如果有 resolvedPrimaryStyleWorld，使用其 fallback；否则用默认
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
      visualDirection: `${style.visualDirection}\nSaved-template constraints: Follow the selected saved template's saved layout, visual, and color direction without copying old product-specific content.\nThis plan's visual style is "${style.label}", intentionally different from the other two plans in this generation record.`,
      colorDirection: style.colorDirection,
      layoutDirection: `${plan.layoutDirection}\nDiversity requirement: use a distinct composition, product angle/crop, information density, and text rhythm from the other two plans.`,
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

  // v2.1: 当 styleWorldHints 存在时，旧 VisualStyle 降级为 context，不强约束
  const hasHints = !!styleWorldHints;

  const layoutDirection = hasHints
    ? `Layout type: ${variant.layoutType}. ${sanitizeContextNote(variant.layoutDirection)}\nShared template constraints: ${sanitizeContextNote(rule.layoutNonNegotiables)}`
    : `Layout type: ${variant.layoutType}. ${variant.layoutDirection}\nShared template constraints: ${rule.layoutNonNegotiables}`;

  const visualDirection = hasHints
    ? `${sanitizeContextNote(style.visualDirection)}\n[Template context: ${sanitizeContextNote(rule.visualIdentity).slice(0, 120)}${rule.visualIdentity.length > 120 ? "..." : ""}]\nVariant "${variant.name}": use this composition variant.`
    : `${style.visualDirection}\nTemplate purpose constraints: ${rule.visualIdentity}\nVariant "${variant.name}": use this composition variant. This plan's visual style is "${style.label}", intentionally different from the other two plans in this generation record.`;

  const colorDirection = hasHints
    ? `${sanitizeContextNote(style.colorDirection)}\n[Legacy palette context: ${sanitizeContextNote(rule.colorDirection).slice(0, 120)}${rule.colorDirection.length > 120 ? "..." : ""}]`
    : `${style.colorDirection}\nTemplate palette guardrails: ${rule.colorDirection}`;

  // v2.1: 过滤掉与 expressive 冲突的 strict-only 规则
  const filteredRiskRules = hasHints
    ? (rule.riskRules || []).filter((r) => !isStrictOnlyRule(r))
    : (rule.riskRules || []);

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
          ...filteredRiskRules,
          hasHints ? sanitizeContextNote(rule.layoutNonNegotiables) : rule.layoutNonNegotiables,
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

/** 判断一条规则是否为 strict-only（当 expressive 时应过滤） */
function isStrictOnlyRule(rule: string): boolean {
  const strictPatterns = [
    /must be pure white/i,
    /必须为纯白/i,
    /禁止任何非纯白/i,
    /禁止渐变/i,
    /禁止.*背景.*渐变/i,
    /no gradient/i,
    /background must be.*white/i,
    /strict.*禁止.*背景/i,
  ];
  return strictPatterns.some((p) => p.test(rule));
}
