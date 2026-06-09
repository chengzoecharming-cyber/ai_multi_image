import type { ImageTypeId } from "../image-types";
import type { LayoutType } from "../layouts";
import type { CopyDensityId } from "../copy-density";
import type { VisualStyleId } from "../visual-styles";
import type { TemplateVariant } from "../templates";
import type { StyleWorldId } from "../style-worlds";

export type PlanBriefSourceType =
  | "empty"
  | "system_template"
  | "saved_template"
  | "detail_asset";

/** 空模板推断的明暗模式 */
export type EmptyTemplateMode = "light" | "dark" | "mixed";

/** 空模板方案类型 */
export type EmptyTemplatePlanType =
  | "platform_hero"
  | "feature_showcase"
  | "info_dense";

/**
 * 空模板单个方案配置。
 */
export interface EmptyTemplatePlanConfig {
  /** 方案类型 */
  type: EmptyTemplatePlanType;
  /** 明暗模式 */
  mode: "light" | "dark";
  /** 分配的视觉风格 */
  styleId: string;
  /** 版式布局 */
  layoutType: string;
  /** 方案描述 */
  description: string;
  /** v2.1: 分配的 styleWorldId */
  styleWorldId?: StyleWorldId;
  /** v2.1: 文案模式 */
  copyMode?: string;
}

/**
 * 视觉风格策略。
 *
 * 描述的是「怎么选风格」，不是绑定固定风格。
 * v2.1 扩展：同时支持 legacy VisualStyleId 和新 StyleWorldId。
 */
export interface StyleStrategy {
  /** 策略模式 */
  mode: "pick_from_pool" | "free";
  /** 候选 legacy visual style 池 */
  pool: VisualStyleId[];
  /** 需要从池中选出几个不同风格（例如一次生成 3 个方案） */
  count: number;
  /** v2.1: 候选 styleWorld 池（优先消费） */
  styleWorldPool?: StyleWorldId[];
  /** v2.1: 推荐 copyMode */
  recommendedCopyMode?: string;
}

/** v2.1: StyleWorld 运行时注入的 prompt hints */
export interface StyleWorldPromptHints {
  /** 视觉方向补充文本（并入 visualDirection） */
  visualDirectionAddendum: string;
  /** 色彩方向补充文本（并入 colorDirection） */
  colorDirectionAddendum: string;
  /** 额外 mandatory 规则 */
  extraMandatoryRules: string[];
  /** 额外 avoid 规则 */
  extraAvoidRules: string[];
  /** 场景/背景提示 */
  sceneHints: string[];
  /** 灯光提示 */
  lightingHints: string[];
}

/**
 * PlanBrief — 一次生成用的结构化 brief。
 *
 * 把 SystemTemplate / SavedTemplate / DetailAssetTypeProfile 统一转换成
 * 标准格式，供后续生成链路使用。
 *
 * 不绑定固定视觉风格，不保存 prompt 字符串。
 */
export interface PlanBrief {
  /** 来源类型 */
  sourceType: PlanBriefSourceType;
  /** 来源 ID（模板 ID 或素材类型 ID） */
  sourceId: string;

  // === 核心约束 ===

  /** 图片用途 */
  imageType: ImageTypeId;
  /** 允许的版式结构列表 */
  allowedLayoutTypes: LayoutType[];
  /** 默认文案密度 */
  defaultCopyDensity: CopyDensityId;
  /** 安全边界 / 风险规则 */
  riskRules: string[];

  // === 视觉风格策略 ===

  /** 风格选择策略（不绑定固定风格） */
  styleStrategy: StyleStrategy;

  /** v2.1: 选定的 styleWorld 提示（供 applyTemplateRuleToPlan 合并进 prompt） */
  styleWorldPromptHints?: StyleWorldPromptHints;

  /** v2.1: 解析后的用户意图冲突结果 */
  resolvedCreativeFreedom?: "strict" | "balanced" | "expressive";

  /** v2.1: 解析后的首选 styleWorld */
  resolvedPrimaryStyleWorld?: StyleWorldId;

  // === 版式变体 ===

  /** 版式变体列表（用于同一 brief 下生成多个差异化方案） */
  variants: TemplateVariant[];

  // === 用户上下文（可选） ===

  /** 用户制图目标 */
  userGoal?: string;
  /** 商品上下文 */
  productContext?: {
    productName?: string;
    productType?: string;
    productImageUrl?: string;
  };

  // === 结构化视觉硬约束（可选） ===

  /** 视觉硬约束：必须遵守的画面规则 */
  mandatoryVisualRules?: string[];

  /** 禁止事项：必须避免的画面元素或处理方式 */
  avoidRules?: string[];

  /** 场景/环境规则：背景、氛围、空间要求 */
  sceneRules?: string[];

  /** 灯光/景深/色彩规则：光照、景深、调色要求 */
  lightingColorRules?: string[];

  /** 产品摆放规则：产品在画面中的位置、比例、处理方式 */
  productPlacementRules?: string[];

  /** 文案规则：该模板下文案的具体形式、位置、密度要求 */
  copyRules?: string[];

  /** 用户输入与模板用途冲突时的处理说明 */
  userGoalConflictResolution?: string;

  // === 空模板推断结果（仅 sourceType === "empty" 时有效）===

  /** 推断的明暗模式 */
  inferredMode?: EmptyTemplateMode;
  /** 推断的产品类别 */
  inferredCategory?: string;
  /** 空模板 3 个方案的独立配置 */
  emptyTemplatePlans?: EmptyTemplatePlanConfig[];
}
