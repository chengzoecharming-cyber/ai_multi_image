// 自包含类型定义，避免与 templates 循环依赖
export type TemplateIntentId =
  | "hero_main"
  | "feature_explain"
  | "detail_focus"
  | "usage_scene"
  | "comparison"
  | "spec_dimension"
  | "promo_campaign"
  | "brand_mood"
  | "bundle_showcase"
  | "story_sequence";

export type CreativeFreedomLevel = "strict" | "balanced" | "expressive";

export type StyleWorldId =
  // 原有方向（保留兼容）
  | "clean_catalog"
  | "light_technical"
  | "dark_technical"
  | "high_contrast_promo"
  | "macro_chiaroscuro"
  | "premium_black"
  | "comparison_drama"
  | "bundle_pop"
  | "workshop_lifestyle"
  | "cnc_machine_bed"
  | "worn_workbench"
  | "assembly_station"
  // 新增方向
  | "editorial_product_ad"
  | "gradient_modern_showcase"
  | "material_stage"
  | "soft_premium"
  | "colorful_marketplace"
  | "minimal_no_text"
  | "diagram_light"
  | "scene_story"
  | "cinematic_workshop";

/** 背景类型 — 用于指导 LLM 选择，不锁定具体颜色 */
export type BackgroundType =
  | "pure_white"
  | "light_neutral"
  | "soft_gradient"
  | "deep_void"
  | "warm_studio"
  | "cool_studio"
  | "industrial_environment"
  | "material_surface"
  | "geometric_blocks"
  | "editorial_negative_space"
  | "cinematic_dark"
  | "colorful_flat"
  | "blueprint_grid"
  | "bokeh_scene";

export type LightingMood =
  | "soft_diffused"
  | "even_technical"
  | "dramatic_key_rim"
  | "warm_ambient"
  | "hard_chiaroscuro"
  | "flat_cad"
  | "editorial_natural"
  | "promo_spotlight"
  | "cinematic_mixed";

export interface StyleWorld {
  id: StyleWorldId;
  label: string;
  description: string;
  /** 视觉方向描述（注入 LLM） */
  visualDirection: string;
  /** 色彩方向描述（注入 LLM） */
  colorDirection: string;
  /** 该风格适合的意图 */
  suitableIntents: TemplateIntentId[];
  /** 该风格适合的创意自由度 */
  suitableFreedomLevels: CreativeFreedomLevel[];
  /** 该风格下的典型背景类型 */
  typicalBackgrounds: BackgroundType[];
  /** 该风格下的典型光源 */
  typicalLighting: LightingMood[];
}
