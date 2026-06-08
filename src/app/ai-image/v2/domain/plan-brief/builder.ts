import type { PlanBrief, StyleStrategy, EmptyTemplatePlanConfig, EmptyTemplatePlanType } from "./types";
import type { SavedTemplate } from "../templates";
import type { StyleWorldId } from "../style-worlds";
import type { V2DetailType } from "../detail-assets";
import { getSystemTemplateProfile } from "../templates";
import { DETAIL_ASSET_TO_IMAGE_TYPE, IMAGE_TYPE_TO_ALLOWED_LAYOUTS, IMAGE_TYPE_TO_DEFAULT_COPY_DENSITY } from "../taxonomy";
import { getStyleWorldById } from "../style-worlds";
import { adaptStyleWorldsForRuntime } from "./style-world-adapter";

function freeStyleStrategy(): StyleStrategy {
  return {
    mode: "free",
    pool: [],
    count: 3,
  };
}

// ============================================================
// 空模板通用约束
// ============================================================

const EMPTY_TEMPLATE_RISK_RULES: string[] = [
  "不得编造品牌名、型号、价格",
  "不得虚构未提供的技术参数",
];

const EMPTY_TEMPLATE_MANDATORY_RULES: string[] = [
  "产品必须完整可见，边缘不得裁切",
  "产品与背景必须有清晰边缘分离",
];

// ============================================================
// PlanBrief builders
// ============================================================

const EMPTY_DEFAULT_STYLE_WORLDS: StyleWorldId[] = [
  "editorial_product_ad",
  "gradient_modern_showcase",
  "material_stage",
  "soft_premium",
  "clean_catalog",
  "diagram_light",
];

function assignEmptyStyleWorlds(): { styleWorldId: StyleWorldId; copyMode: string }[] {
  return [
    { styleWorldId: "editorial_product_ad", copyMode: "headline_only" },
    { styleWorldId: "gradient_modern_showcase", copyMode: "feature_cards" },
    { styleWorldId: "material_stage", copyMode: "no_text" },
  ];
}

/**
 * 构建空模板 PlanBrief。
 *
 * 空模板是"完全自由生成模式"：
 * - 不预设明暗倾向，由模型根据产品图自行判断
 * - 不固定布局方向，由模型自由发挥
 * - 仅提供安全红线 + 用户目标，让模型全权决定视觉策略
 */
export function buildEmptyPlanBrief(
  userGoal?: string,
  productContext?: { productName?: string; productType?: string }
): PlanBrief {
  const assigned = assignEmptyStyleWorlds();

  const suggestedPlanDirections = [
    {
      type: "platform_hero" as EmptyTemplatePlanType,
      description: "方向A：由模型根据产品特征和用户目标自由决定。可以是主图风、场景风、极简风或信息风。",
      layoutType: "",
    },
    {
      type: "feature_showcase" as EmptyTemplatePlanType,
      description: "方向B：由模型根据产品特征和用户目标自由决定。与方向A在视觉风格上必须明显不同。",
      layoutType: "",
    },
    {
      type: "info_dense" as EmptyTemplatePlanType,
      description: "方向C：由模型根据产品特征和用户目标自由决定。与方向A、B在视觉风格上必须明显不同。",
      layoutType: "",
    },
  ];

  const { visualStyleIds, styleWorldPool, primaryHints, resolvedFreedom } =
    adaptStyleWorldsForRuntime(assigned.map((a) => a.styleWorldId), userGoal);

  return {
    sourceType: "empty",
    sourceId: "auto",
    imageType: "auto",
    allowedLayoutTypes: [],
    defaultCopyDensity: "rich",
    riskRules: EMPTY_TEMPLATE_RISK_RULES,
    styleStrategy: {
      mode: "pick_from_pool",
      pool: visualStyleIds,
      count: 3,
      styleWorldPool,
      recommendedCopyMode: assigned.map((a) => a.copyMode).join(", "),
    },
    variants: [],
    userGoal,
    productContext,
    mandatoryVisualRules: EMPTY_TEMPLATE_MANDATORY_RULES,
    inferredMode: undefined,
    emptyTemplatePlans: suggestedPlanDirections.map((d, i) => ({
      type: d.type,
      mode: "free",
      styleId: visualStyleIds[i] || "free",
      layoutType: d.layoutType,
      description: d.description,
      styleWorldId: assigned[i].styleWorldId,
      copyMode: assigned[i].copyMode,
    })),
    styleWorldPromptHints: primaryHints,
    resolvedCreativeFreedom: resolvedFreedom,
    resolvedPrimaryStyleWorld: assigned[0].styleWorldId,
  };
}

/**
 * 从系统模板构建 PlanBrief。
 */
export function buildPlanBriefFromSystemTemplate(
  templateId: string,
  userGoal?: string
): PlanBrief | null {
  const template = getSystemTemplateProfile(templateId);
  if (!template) return null;

  // v2.1: 如果模板有 configV2，优先使用 styleWorld 系统
  if (template.configV2) {
    const { visualStyleIds, styleWorldPool, primaryHints, resolvedFreedom } =
      adaptStyleWorldsForRuntime(template.configV2.preferredStyleWorlds, userGoal);

    return {
      sourceType: "system_template",
      sourceId: templateId,
      imageType: template.imageType,
      allowedLayoutTypes: template.allowedLayoutTypes,
      defaultCopyDensity: template.defaultCopyDensity,
      riskRules: template.riskRules,
      styleStrategy: {
        mode: "pick_from_pool",
        pool: visualStyleIds,
        count: 3,
        styleWorldPool,
        recommendedCopyMode: template.configV2.defaultCopyMode,
      },
      variants: template.variants,
      userGoal,
      mandatoryVisualRules: template.mandatoryVisualRules,
      avoidRules: template.avoidRules,
      sceneRules: template.sceneRules,
      lightingColorRules: template.lightingColorRules,
      productPlacementRules: template.productPlacementRules,
      copyRules: template.copyRules,
      userGoalConflictResolution: template.userGoalConflictResolution,
      styleWorldPromptHints: primaryHints,
      resolvedCreativeFreedom: resolvedFreedom,
      resolvedPrimaryStyleWorld: styleWorldPool[0],
    };
  }

  // Legacy fallback
  return {
    sourceType: "system_template",
    sourceId: templateId,
    imageType: template.imageType,
    allowedLayoutTypes: template.allowedLayoutTypes,
    defaultCopyDensity: template.defaultCopyDensity,
    riskRules: template.riskRules,
    styleStrategy: freeStyleStrategy(),
    variants: template.variants,
    userGoal,
    mandatoryVisualRules: template.mandatoryVisualRules,
    avoidRules: template.avoidRules,
    sceneRules: template.sceneRules,
    lightingColorRules: template.lightingColorRules,
    productPlacementRules: template.productPlacementRules,
    copyRules: template.copyRules,
    userGoalConflictResolution: template.userGoalConflictResolution,
  };
}

/**
 * 从用户保存的模板构建 PlanBrief。
 */
export function buildPlanBriefFromSavedTemplate(
  saved: SavedTemplate,
  userGoal?: string
): PlanBrief {
  const base = saved.baseTemplateId
    ? getSystemTemplateProfile(saved.baseTemplateId)
    : undefined;

  const imageType = saved.imageType ?? base?.imageType ?? "auto";
  const allowedLayoutTypes = saved.allowedLayoutTypes ?? base?.allowedLayoutTypes ?? [];
  const defaultCopyDensity = saved.defaultCopyDensity ?? base?.defaultCopyDensity ?? "medium";
  const riskRules = [
    ...(base?.riskRules ?? []),
    ...(saved.riskRules ?? []),
  ];
  const styleStrategy = freeStyleStrategy();
  const variants = base?.variants ?? [];

  return {
    sourceType: "saved_template",
    sourceId: saved.id,
    imageType,
    allowedLayoutTypes,
    defaultCopyDensity,
    riskRules,
    styleStrategy,
    variants,
    userGoal,
  };
}

/**
 * 从商详图素材类型构建 PlanBrief。
 */
export function buildPlanBriefFromDetailAsset(
  detailType: V2DetailType,
  userGoal?: string
): PlanBrief | null {
  const imageType = DETAIL_ASSET_TO_IMAGE_TYPE[detailType];
  if (!imageType) return null;

  return {
    sourceType: "detail_asset",
    sourceId: detailType,
    imageType,
    allowedLayoutTypes: IMAGE_TYPE_TO_ALLOWED_LAYOUTS[imageType],
    defaultCopyDensity: IMAGE_TYPE_TO_DEFAULT_COPY_DENSITY[imageType],
    riskRules: [],
    styleStrategy: freeStyleStrategy(),
    variants: [],
    userGoal,
  };
}
