import type { ImageTypeId } from "../image-types";
import type { LayoutType } from "../layouts";
import type { CopyDensityId } from "../copy-density";
import type { VisualStyleId } from "../visual-styles";

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
// SystemTemplate — 系统方案模板
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
 * 约束的是图片用途、结构规则、安全边界、可选布局范围、默认文案密度。
 * 不绑定固定视觉风格（allowedStyleIds 只是候选池）。
 */
export interface SystemTemplate {
  id: string;
  name: string;
  description: string;

  // 图片用途
  imageType: ImageTypeId;

  // 结构原型（暂时用 string，后续收敛到 domain 类型）
  archetype: string;

  // 版式约束：该模板允许使用哪些版式结构
  allowedLayoutTypes: LayoutType[];

  // 文案密度策略
  defaultCopyDensity: CopyDensityId;

  // 安全边界 / 风险规则
  riskRules: string[];

  // 允许的视觉风格候选池（不绑定固定风格）
  allowedStyleIds: VisualStyleId[];

  // 版式变体（同一模板下主动拉开的不同构图）
  variants: TemplateVariant[];

  // === 结构化视觉硬约束（可选，用于强化 brief prompt 控制力） ===

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
}

// ============================================================
// SavedTemplate — 我的模板
// ============================================================

/**
 * SavedTemplate — 用户保存的模板。
 *
 * 保存的是结构和规则，不是 prompt 字符串，也不保存视觉风格。
 */
export interface SavedTemplate {
  id: string;
  name: string;

  // 从哪个系统模板衍生（可选）
  baseTemplateId?: string;

  // 用户确认过的图片用途
  imageType: ImageTypeId;

  // 结构原型（可选）
  archetype?: string;

  // 用户自定义规则
  allowedLayoutTypes?: LayoutType[];
  defaultCopyDensity?: CopyDensityId;
  riskRules?: string[];

  createdAt: number;
}
