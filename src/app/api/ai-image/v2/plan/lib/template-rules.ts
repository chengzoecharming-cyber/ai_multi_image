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
- copyProfile: ${rule.copyProfile}
- shared template constraints: ${rule.visualIdentity}
- non-negotiable layout rules: ${rule.layoutNonNegotiables}
- style rule: the 3 plans must use DIFFERENT visual styles from this allowed style set.
${styles}
- variation rule: each plan must use a different layout/composition variant below.
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

function chooseExisting(blocks: CopyBlock[], roles: CopyBlock["role"][], limit: number): CopyBlock[] {
  return blocks.filter((item) => roles.includes(item.role)).slice(0, limit);
}

function safeFeatureBlocks(plan: CreativePlan, limit: number): CopyBlock[] {
  const source = chooseExisting(plan.copyBlocks || [], ["feature_point", "technical_point", "application_label"], limit);
  if (source.length > 0) {
    return source.map((item, index) => ({
      ...item,
      id: item.id || `cb-feature-${index}`,
      role: "feature_point",
      priority: index + 2,
    }));
  }

  return (plan.sellingPoints || []).slice(0, limit).map((point, index) =>
    block(`cb-feature-${index}`, point.split("/")[0], "feature_point", index + 2, point.includes("/") ? point.split("/").slice(1).join("/").trim() : undefined)
  );
}

function enforceCopyProfile(plan: CreativePlan, profile: CopyProfile): CopyBlock[] {
  const headline = block("cb-headline", plan.headline, "headline", 1);
  const subtitle = plan.subtitle ? block("cb-subheadline", plan.subtitle, "subheadline", 2) : undefined;

  switch (profile) {
    case "headline_only":
      return [headline];
    case "headline_labels": {
      const labels = safeFeatureBlocks(plan, 3).map((item, index) => ({
        ...item,
        id: `cb-label-${index}`,
        title: item.title.split(/\s+/).slice(0, 2).join(" "),
        body: undefined,
        role: "feature_point" as const,
        priority: index + 2,
      }));
      return [headline, ...labels];
    }
    case "comparison_medium": {
      const features = safeFeatureBlocks(plan, 4).map((item, index) => ({ ...item, priority: index + 5 }));
      const bottom = features.slice(0, 3).map((item, index) => block(`cb-bottom-${index}`, item.title, "bottom_info", index + 9));
      return [
        headline,
        ...(subtitle ? [subtitle] : []),
        block("cb-vs-left", "ORDINARY", "comparison_label", 3),
        block("cb-vs-right", "OUR PRODUCT", "comparison_label", 4),
        ...features,
        ...bottom,
      ];
    }
    case "application_medium": {
      const apps = safeFeatureBlocks(plan, 3).map((item, index) => ({
        ...item,
        role: "application_label" as const,
        body: item.body || item.subtitle || "Built for real workshop use.",
        priority: index + 3,
      }));
      const bottom = apps.slice(0, 3).map((item, index) => block(`cb-bottom-${index}`, item.title, "bottom_info", index + 7));
      return [headline, ...apps, ...bottom];
    }
    case "technical_medium": {
      const tech = safeFeatureBlocks(plan, 4).map((item, index) => ({
        ...item,
        role: "technical_point" as const,
        body: item.body || item.subtitle || "Placeholder-style structural label only.",
        priority: index + 3,
      }));
      const bottom = tech.slice(0, 3).map((item, index) => block(`cb-bottom-${index}`, item.title, "bottom_info", index + 8));
      return [headline, ...(subtitle ? [subtitle] : []), ...tech, ...bottom];
    }
    case "bundle_medium":
    case "feature_medium": {
      const features = safeFeatureBlocks(plan, 4).map((item, index) => ({
        ...item,
        body: item.body || item.subtitle || "Clear product benefit for quick e-commerce scanning.",
        priority: index + 3,
      }));
      const bottom = features.slice(0, 3).map((item, index) => block(`cb-bottom-${index}`, item.title, "bottom_info", index + 8));
      return [headline, ...(subtitle ? [subtitle] : []), ...features, ...bottom];
    }
    case "promo_rich": {
      const features = safeFeatureBlocks(plan, 4).map((item, index) => ({
        ...item,
        body: item.body || item.subtitle || "Fast, punchy benefit copy for a high-impact sales visual.",
        priority: index + 4,
      }));
      const bottom = features.slice(0, 3).map((item, index) => block(`cb-bottom-${index}`, item.title, "bottom_info", index + 9));
      return [
        headline,
        ...(subtitle ? [subtitle] : []),
        block("cb-claim", "BUILT TO PERFORM", "core_claim", 3),
        ...features,
        ...bottom,
      ];
    }
  }
}

export function applyTemplateRuleToPlan(
  plan: CreativePlan,
  templateId?: string,
  variantIndex = 0
): CreativePlan {
  const rule = getTemplateRule(templateId || plan.templateId);
  if (!rule) {
    const style = getVisualStyleProfile(DEFAULT_THREE_PLAN_STYLE_IDS[variantIndex % DEFAULT_THREE_PLAN_STYLE_IDS.length]);
    const next: CreativePlan = {
      ...plan,
      templateId: templateId || plan.templateId,
      planName: plan.planName?.includes(style.label) ? plan.planName : `${plan.planName} · ${style.label}`,
      visualDirection: `${style.visualDirection}\nSaved-template constraints: Follow the selected saved template's saved layout, visual, and color direction without copying old product-specific content.\nThis plan's visual style is "${style.label}", intentionally different from the other two plans in this generation record.`,
      colorDirection: style.colorDirection,
      layoutDirection: `${plan.layoutDirection}\nDiversity requirement: use a distinct composition, product angle/crop, information density, and text rhythm from the other two plans.`,
    };
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
  const sellingPoints = copyBlocks
    .filter((item) => item.role !== "headline" && item.role !== "subheadline")
    .map((item) => item.body ? `${item.title} / ${item.body}` : item.title);

  const layoutDirection = `Layout type: ${variant.layoutType}. ${variant.layoutDirection}\nShared template constraints: ${rule.layoutNonNegotiables}`;
  const visualDirection = `${style.visualDirection}\nTemplate purpose constraints: ${rule.visualIdentity}\nVariant "${variant.name}": use this composition variant. This plan's visual style is "${style.label}", intentionally different from the other two plans in this generation record.`;

  const next: CreativePlan = {
    ...plan,
    planName: plan.planName?.includes(variant.name) ? plan.planName : `${plan.planName} · ${variant.name}`,
    planArchetype: rule.archetype,
    templateId: rule.id,
    imageType: rule.imageType,
    subtitle: rule.copyProfile === "headline_only" || rule.copyProfile === "headline_labels" ? undefined : plan.subtitle,
    copyBlocks,
    sellingPoints,
    visualDirection,
    colorDirection: `${style.colorDirection}\nTemplate palette guardrails: ${rule.colorDirection}`,
    layoutDirection,
    visualComplexity: rule.visualComplexity,
    informationDensity: rule.informationDensity,
    riskWarnings: Array.from(new Set([...(plan.riskWarnings || []), ...(rule.riskRules || []), rule.layoutNonNegotiables])),
  };

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
