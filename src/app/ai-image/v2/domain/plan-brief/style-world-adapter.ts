/**
 * StyleWorld → Runtime Adapter
 *
 * 将 v2.1 的 StyleWorld 配置映射到旧 runtime 消费的结构：
 * - VisualStyle fallback（让旧 applyTemplateRuleToPlan 不崩）
 * - Prompt hints（让新风格特征真正注入最终 prompt）
 * - 轻量冲突解析（关键词匹配）
 */

import type { StyleWorld, StyleWorldId, BackgroundType, LightingMood } from "../style-worlds";
import { getStyleWorldById } from "../style-worlds";
import type { VisualStyleId } from "../visual-styles";
import { getVisualStyleProfile } from "../visual-styles";
import type { StyleWorldPromptHints } from "./types";

// ── StyleWorld → VisualStyle fallback 映射 ──
const SW_TO_VS_FALLBACK: Record<StyleWorldId, VisualStyleId> = {
  // 原有方向
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
  worn_workbench: "worn_workbench",
  assembly_station: "assembly_station",
  // 新增方向 → 最接近的旧风格
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

/**
 * 获取 StyleWorld 对应的 fallback VisualStyleId。
 * 保证旧 consumer 不崩。
 */
export function getVisualStyleFallbackForStyleWorld(swId: StyleWorldId): VisualStyleId {
  return SW_TO_VS_FALLBACK[swId] || "clean_catalog";
}

/**
 * 从 StyleWorld 生成 prompt hints，供 applyTemplateRuleToPlan 合并。
 */
export function buildStyleWorldPromptHints(sw: StyleWorld): StyleWorldPromptHints {
  return {
    visualDirectionAddendum: `StyleWorld: "${sw.label}". ${sw.visualDirection}`,
    colorDirectionAddendum: `StyleWorld palette: ${sw.colorDirection}`,
    extraMandatoryRules: [
      `Background must be one of: ${sw.typicalBackgrounds.join(", ")}.`,
      `Lighting must be one of: ${sw.typicalLighting.join(", ")}.`,
    ],
    extraAvoidRules: [
      `Do NOT use backgrounds or lighting moods outside the "${sw.label}" style world.`,
    ],
    sceneHints: sw.typicalBackgrounds.map((bg: BackgroundType) => `Allowed background: ${bg}`),
    lightingHints: sw.typicalLighting.map((lt: LightingMood) => `Allowed lighting: ${lt}`),
  };
}

/**
 * 轻量冲突解析：从用户输入推断 creativeFreedom 和推荐 styleWorlds。
 */
export function resolveUserConflict(
  userGoal: string = "",
  preferredStyleWorlds: StyleWorldId[]
): {
  freedom: "strict" | "balanced" | "expressive";
  recommendedStyleWorlds: StyleWorldId[];
} {
  const text = userGoal.toLowerCase();

  const EXPRESSIVE_KEYWORDS = [
    "渐变", "gradient", "高级", "premium", "设计感", "design",
    "杂志感", "editorial", "材质", "material", "电影感", "cinematic",
    "柔和", "soft", "艺术", "art", "质感", "texture",
  ];

  const STRICT_KEYWORDS = [
    "白底", "white", "平台", "platform", "amazon", "temu",
    "合规", "compliant", "主图", "main image", "干净", "clean",
  ];

  let expressiveScore = 0;
  let strictScore = 0;

  for (const kw of EXPRESSIVE_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) expressiveScore += 2;
  }
  for (const kw of STRICT_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) strictScore += 2;
  }

  if (expressiveScore > strictScore) {
    // expressive: 优先新风格
    const expressiveWorlds = preferredStyleWorlds.filter((id) =>
      [
        "gradient_modern_showcase",
        "editorial_product_ad",
        "material_stage",
        "soft_premium",
        "scene_story",
        "cinematic_workshop",
        "minimal_no_text",
      ].includes(id)
    );
    return {
      freedom: "expressive",
      recommendedStyleWorlds: expressiveWorlds.length > 0 ? expressiveWorlds : preferredStyleWorlds,
    };
  }

  if (strictScore > expressiveScore) {
    // strict: 优先 clean_catalog
    const strictWorlds = preferredStyleWorlds.filter((id) =>
      ["clean_catalog", "light_technical", "diagram_light"].includes(id)
    );
    return {
      freedom: "strict",
      recommendedStyleWorlds: strictWorlds.length > 0 ? strictWorlds : preferredStyleWorlds,
    };
  }

  return {
    freedom: "balanced",
    recommendedStyleWorlds: preferredStyleWorlds,
  };
}

/**
 * 将 styleWorldIds 转换为用于旧 runtime 的 visualStyleIds + hints。
 */
export function adaptStyleWorldsForRuntime(
  styleWorldIds: StyleWorldId[],
  userGoal?: string
): {
  visualStyleIds: VisualStyleId[];
  styleWorldPool: StyleWorldId[];
  primaryHints?: StyleWorldPromptHints;
  resolvedFreedom: "strict" | "balanced" | "expressive";
} {
  const { freedom, recommendedStyleWorlds } = resolveUserConflict(
    userGoal || "",
    styleWorldIds
  );

  const visualStyleIds = recommendedStyleWorlds.map((swId) =>
    getVisualStyleFallbackForStyleWorld(swId)
  );

  const primarySw = getStyleWorldById(recommendedStyleWorlds[0]);

  return {
    visualStyleIds,
    styleWorldPool: recommendedStyleWorlds,
    primaryHints: primarySw ? buildStyleWorldPromptHints(primarySw) : undefined,
    resolvedFreedom: freedom,
  };
}
