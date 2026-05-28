import type { SystemTemplate, TemplateConfigV2, BackgroundType, LightingMood } from "./types";
import { getStyleWorldById } from "../style-worlds";
import type { VisualStyleId } from "../visual-styles";

// Local SW→VS fallback (avoid circular import from plan-brief)
const SW_TO_VS_FALLBACK: Record<string, VisualStyleId> = {
  clean_catalog: "clean_catalog",
  light_technical: "light_technical",
  dark_technical: "dark_technical",
  high_contrast_promo: "high_contrast_promo",
  macro_chiaroscuro: "macro_chiaroscuro",
  premium_black: "premium_black",
  comparison_drama: "comparison_drama",
  bundle_pop: "bundle_pop",
  workshop_lifestyle: "workshop_lifestyle",
  cnc_machine_bed: "cnc_machine_bed",
  worn_workbench: "workshop_lifestyle",
  assembly_station: "workshop_lifestyle",
  editorial_product_ad: "clean_catalog",
  gradient_modern_showcase: "clean_catalog",
  material_stage: "workshop_lifestyle",
  soft_premium: "premium_black",
  colorful_marketplace: "high_contrast_promo",
  minimal_no_text: "premium_black",
  diagram_light: "light_technical",
  scene_story: "workshop_lifestyle",
  cinematic_workshop: "workshop_lifestyle",
};

function getVisualStyleFallbackForStyleWorld(swId: string): VisualStyleId {
  return SW_TO_VS_FALLBACK[swId] || "clean_catalog";
}

/**
 * resolveTemplateFields — 向后兼容映射层。
 *
 * 如果 SystemTemplate 已包含 configV2（v2.1 新格式），
 * 则自动从 configV2 + StyleWorld 生成旧字段（visualIdentity / colorDirection / layoutNonNegotiables / mandatoryVisualRules / ...），
 * 保证下游（template-rules.ts、adapter.ts、plan-brief/builder.ts 等）零改动即可消费。
 *
 * 如果模板仍是旧格式（无 configV2），直接原样返回。
 */
export function resolveTemplateFields(st: SystemTemplate): SystemTemplate {
  if (!st.configV2) return st;

  const cfg = st.configV2;
  const primarySw = getStyleWorldById(cfg.preferredStyleWorlds[0]);

  // ── 1. 视觉身份 / 色彩方向 ──
  const visualIdentity =
    primarySw?.visualDirection ||
    st.visualIdentity ||
    `Intent: ${cfg.intent}. Product scale: ${cfg.productScaleStrategy}. Copy: ${cfg.defaultCopyMode}.`;

  const colorDirection =
    primarySw?.colorDirection ||
    st.colorDirection ||
    "Follow the selected style world's palette.";

  // ── 2. 布局硬约束 ──
  const layoutNonNegotiables =
    st.layoutNonNegotiables ||
    buildLayoutNonNegotiables(cfg);

  // ── 3. 视觉复杂度 / 信息密度 / copyProfile（旧枚举映射） ──
  const visualComplexity =
    st.visualComplexity || mapCopyModeToVisualComplexity(cfg.defaultCopyMode, cfg.defaultCreativeFreedom);

  const informationDensity =
    st.informationDensity || mapCopyModeToInformationDensity(cfg.defaultCopyMode);

  const copyProfile =
    st.copyProfile || mapCopyModeToCopyProfile(cfg.defaultCopyMode);

  // ── 4. 结构化规则（合并模板已有 + 自动生成） ──
  const mandatoryVisualRules = mergeRules(
    st.mandatoryVisualRules,
    buildMandatoryVisualRules(cfg, primarySw)
  );

  const avoidRules = mergeRules(
    st.avoidRules,
    buildAvoidRules(cfg, primarySw)
  );

  const sceneRules = mergeRules(
    st.sceneRules,
    buildSceneRules(cfg, primarySw)
  );

  const lightingColorRules = mergeRules(
    st.lightingColorRules,
    buildLightingColorRules(cfg, primarySw)
  );

  const productPlacementRules = mergeRules(
    st.productPlacementRules,
    buildProductPlacementRules(cfg)
  );

  const copyRules = mergeRules(
    st.copyRules,
    buildCopyRules(cfg)
  );

  const userGoalConflictResolution =
    cfg.conflictResolution || st.userGoalConflictResolution;

  // v2.1: 从 configV2 重新生成 allowedStyleIds，保证多样性
  const allowedStyleIds = (st.configV2
    ? buildAllowedStyleIds(st.configV2)
    : st.allowedStyleIds) as VisualStyleId[];

  return {
    ...st,
    visualIdentity,
    colorDirection,
    layoutNonNegotiables,
    visualComplexity,
    informationDensity,
    copyProfile,
    allowedStyleIds,
    mandatoryVisualRules,
    avoidRules,
    sceneRules,
    lightingColorRules,
    productPlacementRules,
    copyRules,
    userGoalConflictResolution,
  };
}

// ── 从 configV2 生成 fallback VisualStyleIds（确保 3 variants 多样性）──
function buildAllowedStyleIds(cfg: SystemTemplate["configV2"]): string[] {
  if (!cfg) return [];
  const mapped = cfg.preferredStyleWorlds
    .map((swId) => getVisualStyleFallbackForStyleWorld(swId as import("../style-worlds").StyleWorldId))
    .filter(Boolean);
  const unique = Array.from(new Set(mapped));
  if (unique.length >= 3) return unique;

  // 不足 3 个时按 intent 补充
  const extras: Record<string, VisualStyleId[]> = {
    hero_main: ["clean_catalog", "premium_black", "light_technical"],
    feature_explain: ["light_technical", "dark_technical", "clean_catalog"],
    brand_mood: ["premium_black", "macro_chiaroscuro", "clean_catalog"],
    usage_scene: ["workshop_lifestyle", "cnc_machine_bed", "clean_catalog"],
    detail_focus: ["macro_chiaroscuro", "premium_black", "clean_catalog"],
    comparison: ["comparison_drama", "high_contrast_promo", "clean_catalog"],
    promo_campaign: ["high_contrast_promo", "bundle_pop", "clean_catalog"],
    bundle_showcase: ["bundle_pop", "clean_catalog", "high_contrast_promo"],
    spec_dimension: ["light_technical", "dark_technical", "clean_catalog"],
    story_sequence: ["workshop_lifestyle", "clean_catalog", "light_technical"],
  };
  const fallbackPool = extras[cfg.intent] || ["clean_catalog", "light_technical", "premium_black"];
  for (const f of fallbackPool) {
    if (!unique.includes(f)) unique.push(f);
    if (unique.length >= 3) break;
  }
  return unique;
}

// ============================================================
// 辅助函数
// ============================================================

function buildLayoutNonNegotiables(cfg: SystemTemplate["configV2"]): string {
  const parts: string[] = [];
  if (!cfg) return "";
  parts.push(`Intent: ${cfg.intent}.`);
  parts.push(`Product scale strategy: ${cfg.productScaleStrategy}.`);
  parts.push(`Headline is ${cfg.headlineRequirement}.`);
  parts.push(`Creative freedom: ${cfg.defaultCreativeFreedom}.`);
  if (cfg.safetyRules.length > 0) {
    parts.push(`Safety: ${cfg.safetyRules.join("; ")}.`);
  }
  return parts.join(" ");
}

function mapCopyModeToVisualComplexity(
  mode: string,
  freedom: string
): SystemTemplate["visualComplexity"] {
  if (mode === "no_text" || mode === "headline_only") return "simple";
  if (mode === "promo_poster" || mode === "story_sequence") return "complex";
  if (freedom === "expressive") return "complex";
  if (freedom === "strict") return "simple";
  return "medium";
}

function mapCopyModeToInformationDensity(
  mode: string
): SystemTemplate["informationDensity"] {
  if (mode === "no_text" || mode === "headline_only") return "low";
  if (mode === "promo_poster" || mode === "story_sequence" || mode === "technical_annotations") return "high";
  return "medium";
}

function mapCopyModeToCopyProfile(
  mode: string
): SystemTemplate["copyProfile"] {
  const map: Record<string, SystemTemplate["copyProfile"]> = {
    no_text: "headline_only",
    headline_only: "headline_only",
    headline_labels: "headline_labels",
    feature_cards: "feature_medium",
    technical_annotations: "technical_medium",
    promo_poster: "promo_rich",
    story_sequence: "application_medium",
  };
  return map[mode] || "headline_only";
}

function mergeRules(
  existing: string[] | undefined,
  generated: string[]
): string[] {
  const set = new Set<string>();
  (existing || []).forEach((r) => set.add(r));
  generated.forEach((r) => set.add(r));
  return Array.from(set);
}

// ── 规则生成器（已精简，不再自动生成强制规则，交给模型自由决定） ──

function buildMandatoryVisualRules(
  _cfg: SystemTemplate["configV2"],
  _sw: ReturnType<typeof getStyleWorldById>
): string[] {
  return [];
}

function buildAvoidRules(
  _cfg: SystemTemplate["configV2"],
  _sw: ReturnType<typeof getStyleWorldById>
): string[] {
  return [];
}

function buildSceneRules(
  _cfg: SystemTemplate["configV2"],
  _sw: ReturnType<typeof getStyleWorldById>
): string[] {
  return [];
}

function buildLightingColorRules(
  _cfg: SystemTemplate["configV2"],
  _sw: ReturnType<typeof getStyleWorldById>
): string[] {
  return [];
}

function buildProductPlacementRules(
  _cfg: SystemTemplate["configV2"]
): string[] {
  return [];
}

function buildCopyRules(
  _cfg: SystemTemplate["configV2"]
): string[] {
  return [];
}
