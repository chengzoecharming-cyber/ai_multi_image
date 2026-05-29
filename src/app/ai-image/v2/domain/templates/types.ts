import type { ImageTypeId } from "../image-types";
import type { LayoutType } from "../layouts";
import type { CopyDensityId } from "../copy-density";
import type { VisualStyleId } from "../visual-styles";

// ── 与 v2/types.ts 对齐的辅助类型（避免循环依赖） ──

export type TemplateVisualComplexity = "simple" | "medium" | "complex";
export type TemplateInformationDensity = "low" | "medium" | "high";

export type CopyProfile =
  | "headline_only"
  | "headline_labels"
  | "feature_medium"
  | "technical_medium"
  | "comparison_medium"
  | "application_medium"
  | "bundle_medium"
  | "promo_rich";

export type V2TemplateEntryKind =
  | "solution_template"
  | "saved_template"
  | "detail_asset_type";

export const V2_TEMPLATE_ENTRY_KIND_LABELS: Record<V2TemplateEntryKind, string> = {
  solution_template: "方案模板库",
  saved_template: "我的模板",
  detail_asset_type: "商详图素材类型",
};

// ============================================================
// 新三层架构 — 意图层
// ============================================================

export type TemplateIntentId =
  | "hero_main"           // 主图/首图 — 识别产品
  | "feature_explain"     // 功能卖点说明
  | "detail_focus"        // 局部放大/细节聚焦
  | "usage_scene"         // 应用场景/生活方式
  | "comparison"          // 优势对比
  | "spec_dimension"      // 规格参数/尺寸标注
  | "promo_campaign"      // 促销/campaign
  | "brand_mood"          // 品牌氛围/形象
  | "bundle_showcase"     // 套装组合展示
  | "story_sequence";     // 叙事/流程

export interface TemplateIntent {
  id: TemplateIntentId;
  name: string;
  description: string;
  /** 该意图通常用于什么图片类型 */
  typicalImageTypes: ImageTypeId[];
  /** 该意图下产品的一般角色 */
  defaultProductScaleStrategy: ProductScaleStrategy;
  /** 该意图的默认文案模式 */
  defaultCopyMode: CopyMode;
  /** 该意图的默认创意自由度 */
  defaultCreativeFreedom: CreativeFreedomLevel;
}

// ============================================================
// 新三层架构 — 视觉世界层
// ============================================================

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

// ============================================================
// 新三层架构 — 版式层
// ============================================================

export type LayoutStrategyId =
  | "center_hero"
  | "offset_hero"
  | "side_panels"
  | "orbital_callouts"
  | "split_compare"
  | "diagonal_energy"
  | "grid_story"
  | "poster_headline"
  | "editorial_negative_space"
  | "process_flow"
  | "top_focus_bottom_bar"
  | "full_bleed_product"
  | "asymmetric_dynamic";

export interface LayoutStrategy {
  id: LayoutStrategyId;
  name: string;
  description: string;
  /** 对应的底层 LayoutType */
  compatibleLayoutTypes: LayoutType[];
  /** 该版式下产品的典型呈现方式 */
  productPresentation: string;
}

// ============================================================
// 新枚举 — 文案模式与创意自由度
// ============================================================

export type CopyMode =
  | "no_text"           // 纯视觉，无文案
  | "headline_only"     // 仅一个大标题
  | "headline_labels"   // 标题 + 简短标签
  | "feature_cards"     // 标题 + 功能卡片/面板
  | "technical_annotations" // 技术标注/占位符
  | "promo_poster"      // 促销海报级丰富文案
  | "story_sequence";   // 叙事型文案

export type HeadlineRequirement = "required" | "optional" | "none";

export type CreativeFreedomLevel = "strict" | "balanced" | "expressive";

/** 产品比例策略 — 抽象化，不锁死百分比 */
export type ProductScaleStrategy =
  | "dominant"        // 产品是绝对主角，占画面主体
  | "balanced"        // 产品与信息/环境均衡
  | "supporting"      // 产品是配角，环境/信息是主角
  | "detail_crop"     // 戏剧性裁切，只展示局部
  | "environment_first"; // 环境/场景是主角，产品可小可隐

// ============================================================
// 新三层架构 — 模板配置（推荐组合）
// ============================================================

export interface TemplateConfigV2 {
  /** 图片用途意图 */
  intent: TemplateIntentId;
  /** 推荐视觉世界（候选池，不锁定） */
  preferredStyleWorlds: StyleWorldId[];
  /** 推荐版式策略（候选池，不锁定） */
  preferredLayouts: LayoutStrategyId[];
  /** 默认文案模式 */
  defaultCopyMode: CopyMode;
  /** 标题要求强度 */
  headlineRequirement: HeadlineRequirement;
  /** 默认创意自由度 */
  defaultCreativeFreedom: CreativeFreedomLevel;
  /** 产品比例策略 */
  productScaleStrategy: ProductScaleStrategy;
  /** 安全规则（不变的红线） */
  safetyRules: string[];
  /** 冲突处理说明 */
  conflictResolution?: string;
}

// ============================================================
// SystemTemplate — 系统方案模板（扩展后）
// ============================================================

/**
 * 版式变体描述。同一模板下的不同构图方案。
 */
export interface TemplateVariant {
  name: string;
  layoutType: LayoutType;
  layoutDirection: string;
}

/**
 * SystemTemplate — 系统方案模板。
 *
 * v2.1 重构说明：
 * - 旧字段（visualIdentity / colorDirection / layoutNonNegotiables / mandatoryVisualRules / ...）
 *   保留，由兼容层自动从 v2 字段生成。
 * - 新增 configV2 字段承载三层架构（intent + styleWorld + layout）。
 * - 新增 copyMode / headlineRequirement / creativeFreedom / productScaleStrategy。
 * - 运行时通过 compat 层将 v2 字段映射回旧字段，保证下游零改动。
 */
export interface SystemTemplate {
  id: string;
  name: string;
  description: string;

  // ── 基础分类（保留兼容） ──
  imageType: ImageTypeId;
  archetype: string;
  allowedLayoutTypes: LayoutType[];
  defaultCopyDensity: CopyDensityId;
  riskRules: string[];
  allowedStyleIds: VisualStyleId[];
  variants: TemplateVariant[];

  // ── 新三层架构（核心新增，可选，逐步迁移） ──
  configV2?: TemplateConfigV2;

  // ── 新控制字段（直接替换旧 profile，可选，逐步迁移） ──
  copyMode?: CopyMode;
  headlineRequirement?: HeadlineRequirement;
  creativeFreedom?: CreativeFreedomLevel;
  productScaleStrategy?: ProductScaleStrategy;

  visualComplexity?: TemplateVisualComplexity;
  informationDensity?: TemplateInformationDensity;
  copyProfile?: CopyProfile;
  visualIdentity?: string;
  colorDirection?: string;
  layoutNonNegotiables?: string;

  mandatoryVisualRules?: string[];
  avoidRules?: string[];
  sceneRules?: string[];
  lightingColorRules?: string[];
  productPlacementRules?: string[];
  copyRules?: string[];
  userGoalConflictResolution?: string;
}

// ============================================================
// SavedTemplate — 我的模板（不变）
// ============================================================

export interface SavedTemplate {
  id: string;
  name: string;
  baseTemplateId?: string;
  imageType: ImageTypeId;
  archetype?: string;
  allowedLayoutTypes?: LayoutType[];
  defaultCopyDensity?: CopyDensityId;
  riskRules?: string[];
  createdAt: number;
}
