import {
  Zap, Gem, BarChart3, ImageIcon, Eye, Layout,
  Microscope, Mountain, Sparkles, ShoppingBag,
} from "lucide-react";
import type { VisualStyleId } from "./plan-taxonomy";
import type {
  ImageTypeId,
  LayoutType,
  LayoutRegion,
  LayoutRegionRole,
  LayoutRegionPosition,
  IconType,
  IconHint,
  TextBlockRole,
  TextBlockPosition,
  TextBlock,
  ColorTheme,
} from "./domain";
import type { CopyDensityId } from "./domain/copy-density";

// Re-export domain types for backward compat
export type {
  ImageTypeId,
  LayoutType,
  LayoutRegion,
  LayoutRegionRole,
  LayoutRegionPosition,
  IconType,
  IconHint,
  TextBlockRole,
  TextBlockPosition,
  TextBlock,
  ColorTheme,
} from "./domain";
export { IMAGE_TYPE_LABELS, getImageTypeLabel } from "./domain/image-types";
export { LAYOUT_TYPE_LABELS } from "./domain/layouts";

export type GenerationMode = "single";

export type CopySource = "user_exact" | "ai_rewritten" | "ai_suggested";

// ============================================================
// ProductAnalysis
// ============================================================

export interface ProductAnalysis {
  productName: string;
  productType: string;
  productSubjectDescription: string;
  visibleFeatures: string[];
  materialGuess?: string;
  structureRisks: string[];
  detectedNonProductElements: string[];
  isolationInstruction: string;
}

// ============================================================
// CopyBlock
// ============================================================

export type CopyBlockRole =
  | "headline"
  | "subheadline"
  | "core_claim"
  | "feature_point"
  | "technical_point"
  | "comparison_label"
  | "application_label"
  | "bottom_info"
  | "badge";

export interface CopyBlock {
  id: string;
  title: string;
  subtitle?: string;
  body?: string;
  role: CopyBlockRole;
  iconHint?: string;
  priority: number;
}

// ============================================================
// LayoutOverlay
// ============================================================

export type VisualDensity = "clean" | "balanced" | "high_information";

export type VisualComplexity = "simple" | "medium" | "complex";

export type InformationDensity = "low" | "medium" | "high";

export interface LayoutOverlay {
  layoutType: LayoutType;
  headline: string;
  subtitle?: string;
  sellingPoints: string[];
  textLanguage: "English";
  textBlocks: TextBlock[];
  colorTheme: ColorTheme;
  visualDensity: VisualDensity;
  regions?: LayoutRegion[];
  hasIconSystem?: boolean;
  hasBottomInfoBar?: boolean;
  hasDetailInsets?: boolean;
  hasComparisonPanels?: boolean;
  hasApplicationGrid?: boolean;
  iconHints?: IconHint[];
}

// ============================================================
// CreativePlan
// ============================================================

export type PlanArchetype =
  | "hero_feature"
  | "technical_breakdown"
  | "comparison_story"
  | "application_scene"
  | "environment_showcase"
  | "multi_panel_info"
  | "premium_showcase"
  | "promo_sales";

export interface CreativePlan {
  id: string;
  planName: string;
  planArchetype: PlanArchetype;
  templateId: string;
  imageType: ImageTypeId | string;

  visualComplexity: VisualComplexity;
  informationDensity: InformationDensity;
  /** 文案密度策略（新增）。当未指定时，由 taxonomy 提供默认值。 */
  copyDensity?: CopyDensityId;

  layoutDirection: string;
  visualDirection: string;
  colorDirection: string;

  productAnalysis?: ProductAnalysis;

  productName: string;
  headline: string;
  subtitle?: string;
  sellingPoints: string[];
  copyBlocks: CopyBlock[];

  copySource: CopySource;
  copyNotes?: string[];

  visualStyleId?: VisualStyleId;
  visualStyleLabel?: string;

  layoutOverlay?: LayoutOverlay;

  textLanguage: "English";
  riskWarnings: string[];

  planSummaryPrompt?: string;
  imageGenerationPrompt?: string;
  finalPrompt?: string;
}

// ============================================================
// ImageSetPlan
// ============================================================

export interface ImageRole {
  index: number;
  role: string;
  purpose: string;
}

export interface ImageSetPlan {
  id: string;
  setName: string;
  templateId: string;

  productAnalysis: ProductAnalysis;
  storyline: string;
  imageRoles: ImageRole[];
  overallDirection: string;
  platform?: string;
  imageCount: number;

  plans: CreativePlan[];
  riskWarnings: string[];
}

// ============================================================
// UI State
// ============================================================

export type Step = "input" | "generating" | "plans" | "preview";

// ============================================================
// V2 Session (UI-only)
// ============================================================

export type V2SessionStatus =
  | "draft"
  | "planning"
  | "needs_review"
  | "generating"
  | "done"
  | "failed";

export type V2WorkspaceTab = "product" | "detail";

// V2DetailType 定义已迁移到 domain/detail-assets，以下 import + re-export 保持兼容
import type { V2DetailType as _V2DetailType } from "./domain/detail-assets";
import { V2_DETAIL_TYPE_LABELS as _V2_DETAIL_TYPE_LABELS } from "./domain/detail-assets";
export type V2DetailType = _V2DetailType;
export const V2_DETAIL_TYPE_LABELS = _V2_DETAIL_TYPE_LABELS;

export interface V2GeneratedImage {
  id: string;
  planId?: string;
  taskId?: string;
  tab?: V2WorkspaceTab;
  detailType?: V2DetailType;
  imageUrl: string;
  imageBase64?: string;
  createdAt: number;
}

export interface V2DetailState {
  /** 商详参考图列表（主图、尺寸图、材质图等） */
  detailImageUrls: string[];
  activeDetailImageIndex: number;
  heroPlan?: CreativePlan | null;
  selectedTypes: V2DetailType[];
  generating: boolean;
  results: Array<{ type: V2DetailType; imageId: string }>;
  lastError?: string | null;
}

export interface V2Session {
  id: string;
  authorizationCodeId?: string | null;
  authorizationCode?: {
    code: string;
    status: string;
    note?: string | null;
  } | null;
  title?: string;
  createdAt: number;
  updatedAt: number;

  // Session kind: product images vs detail images
  workspaceTab?: V2WorkspaceTab;

  mode: GenerationMode;
  step: Step;
  status?: V2SessionStatus;
  lastError?: string | null;

  /** 商品图列表（主图 + 多角度/形式图） */
  productImageUrls: string[];
  activeProductImageIndex: number;

  /** 风格参考图（非商品图，用于风格迁移） */
  referenceImageUrls: string[];
  goal: string;

  outputWidth: number;
  outputHeight: number;

  /** 图片生成后端 Provider */
  provider?: string;

  selectedTemplateId?: string | null;

  singlePlans: CreativePlan[];
  expandedSingleId: string | null;
  editingSingleId: string | null;

  previewPlanId: string | null;
  copiedId: string | null;

  generatingImage: boolean;
  generatingImagePlanId: string | null;
  generatedImages: V2GeneratedImage[];

  detail?: V2DetailState;

  groupId?: string | null;
}

export interface PlanMeta {
  icon: typeof Zap;
  label: string;
  color: string;
  bg: string;
  border: string;
}

const ARCHETYPE_META: Record<PlanArchetype, PlanMeta> = {
  hero_feature:       { icon: Zap,          label: "单品卖点",   color: "text-orange-500",  bg: "bg-orange-50",  border: "border-orange-100" },
  technical_breakdown:{ icon: Microscope,   label: "技术解析",   color: "text-cyan-600",    bg: "bg-cyan-50",    border: "border-cyan-100" },
  comparison_story:   { icon: BarChart3,    label: "优势对比",   color: "text-blue-500",    bg: "bg-blue-50",    border: "border-blue-100" },
  application_scene:  { icon: Mountain,     label: "应用场景",   color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
  environment_showcase:{ icon: Mountain,    label: "环境场景",   color: "text-slate-500",   bg: "bg-slate-50",   border: "border-slate-100" },
  multi_panel_info:   { icon: Layout,       label: "多模块信息", color: "text-indigo-500",  bg: "bg-indigo-50",  border: "border-indigo-100" },
  premium_showcase:   { icon: Sparkles,     label: "高级质感",   color: "text-violet-500",  bg: "bg-violet-50",  border: "border-violet-100" },
  promo_sales:        { icon: ShoppingBag,  label: "强销售",     color: "text-rose-500",    bg: "bg-rose-50",    border: "border-rose-100" },
};

export function getPlanMeta(plan: CreativePlan): PlanMeta {
  return ARCHETYPE_META[plan.planArchetype] || ARCHETYPE_META.hero_feature;
}

// Deprecated static array — kept for backward compat but should not be used for new code
export const PLAN_META = [
  ARCHETYPE_META.hero_feature,
  ARCHETYPE_META.premium_showcase,
  ARCHETYPE_META.comparison_story,
];

export const SUB_PLAN_META = [
  { icon: ImageIcon,  color: "text-indigo-500",  bg: "bg-indigo-50" },
  { icon: Zap,        color: "text-orange-500",  bg: "bg-orange-50" },
  { icon: Eye,        color: "text-violet-500",  bg: "bg-violet-50" },
  { icon: Layout,     color: "text-emerald-500", bg: "bg-emerald-50" },
  { icon: BarChart3,  color: "text-blue-500",    bg: "bg-blue-50" },
];

// ============================================================
// Archetype Labels
// ============================================================

export const ARCHETYPE_LABELS: Record<PlanArchetype, string> = {
  hero_feature: "单品卖点",
  technical_breakdown: "技术解析",
  comparison_story: "优势对比",
  application_scene: "应用场景",
  environment_showcase: "环境场景",
  multi_panel_info: "多模块信息",
  premium_showcase: "高级质感",
  promo_sales: "强销售",
};
