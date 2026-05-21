import {
  Zap, Gem, BarChart3, ImageIcon, Eye, Layout,
  Microscope, Mountain, Sparkles, ShoppingBag,
} from "lucide-react";

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
  | "bottom_info";

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

export type LayoutType =
  | "hero_left_text_right_product"
  | "hero_right_product_left_features"
  | "top_headline_bottom_feature_bar"
  | "comparison_two_columns"
  | "technical_callout_with_insets"
  | "exploded_layer_explanation"
  | "four_panel_application_grid"
  | "large_headline_with_bottom_info_bar"
  | "diagonal_product_with_side_features"
  | "premium_center_product_minimal_text";

export type LayoutRegionRole =
  | "hero_product"
  | "headline_area"
  | "subheadline_area"
  | "feature_stack"
  | "bottom_info_bar"
  | "comparison_left"
  | "comparison_right"
  | "detail_inset"
  | "application_grid"
  | "badge_area";

export type LayoutRegionPosition =
  | "top"
  | "left"
  | "right"
  | "bottom"
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface LayoutRegion {
  id: string;
  role: LayoutRegionRole;
  position: LayoutRegionPosition;
  size: "small" | "medium" | "large";
  priority: number;
}

export type IconType =
  | "shield"
  | "wind"
  | "temperature"
  | "speed"
  | "target"
  | "gear"
  | "leaf"
  | "spark"
  | "tool"
  | "check"
  | "cross"
  | "clock"
  | "chart";

export interface IconHint {
  blockId: string;
  iconType: IconType;
  meaning: string;
}

export type TextBlockRole =
  | "headline"
  | "subtitle"
  | "selling_point"
  | "label"
  | "badge"
  | "feature_title"
  | "feature_description"
  | "spec_label"
  | "spec_value"
  | "section_header"
  | "callout";
export type TextBlockPosition = "top-left" | "top-right" | "right" | "left" | "bottom" | "top" | "center";

export interface TextBlock {
  id: string;
  text: string;
  role: TextBlockRole;
  position: TextBlockPosition;
  priority: number;
}

export interface ColorTheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

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
  | "multi_panel_info"
  | "premium_showcase"
  | "promo_sales";

export interface CreativePlan {
  id: string;
  planName: string;
  planArchetype: PlanArchetype;
  templateId: string;
  imageType: string;

  productAnalysis?: ProductAnalysis;

  productName: string;
  headline: string;
  subtitle?: string;
  sellingPoints: string[];
  copyBlocks: CopyBlock[];

  copySource: CopySource;
  copyNotes?: string[];

  layoutDirection: string;
  visualDirection: string;
  colorDirection: string;
  visualComplexity: VisualComplexity;
  informationDensity: InformationDensity;

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

export type V2DetailType =
  | "detail"
  | "multi_angle"
  | "lifestyle"
  | "feature";

export const V2_DETAIL_TYPE_LABELS: Record<V2DetailType, string> = {
  detail: "细节图",
  multi_angle: "多角度图",
  lifestyle: "仿实拍/场景图",
  feature: "卖点图",
};

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
  heroImageUrl: string | null;
  selectedTypes: V2DetailType[];
  generating: boolean;
  results: Array<{ type: V2DetailType; imageId: string }>;
  lastError?: string | null;
}

export interface V2Session {
  id: string;
  title?: string;
  createdAt: number;
  updatedAt: number;

  // Session kind: product images vs detail images
  workspaceTab?: V2WorkspaceTab;

  mode: GenerationMode;
  step: Step;
  status?: V2SessionStatus;
  lastError?: string | null;

  productImageUrl: string | null;
  // optional: used as a style reference for product tab generations
  productReferenceImageUrl: string | null;
  goal: string;

  outputWidth: number;
  outputHeight: number;

  selectedTemplateId?: string | null;

  singlePlans: CreativePlan[];
  expandedSingleId: string | null;
  editingSingleId: string | null;

  previewPlanId: string | null;
  copiedId: string | null;

  generatingImage: boolean;
  generatedImages: V2GeneratedImage[];

  detail?: V2DetailState;

  // ============================================================
  // Deprecated fields (kept for storage migration)
  // ============================================================
  groupId?: string | null;
}

export const IMAGE_TYPE_LABELS: Record<string, string> = {
  ecommerce_hero: "主图",
  feature_showcase: "功能卖点",
  product_detail: "局部细节",
  lifestyle_scene: "应用场景",
  comparison_chart: "优势对比",
  product_showcase: "产品展示",
  ecommerce_banner: "电商海报",
  spec_info: "规格信息",
  promo_sales: "促销销售",
  compatible_tools: "适配工具",
};

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
// Layout Type Labels
// ============================================================

export const LAYOUT_TYPE_LABELS: Record<LayoutType, string> = {
  hero_left_text_right_product: "左侧文案 + 右侧产品",
  hero_right_product_left_features: "右侧产品 + 左侧卖点",
  top_headline_bottom_feature_bar: "顶部标题 + 底部卖点条",
  comparison_two_columns: "左右双栏对比",
  technical_callout_with_insets: "技术标注 + 局部放大",
  exploded_layer_explanation: "分层结构说明",
  four_panel_application_grid: "四宫格应用场景",
  large_headline_with_bottom_info_bar: "大标题 + 底部信息栏",
  diagonal_product_with_side_features: "对角线产品 + 侧边卖点",
  premium_center_product_minimal_text: "居中产品 + 极简文字",
};

// ============================================================
// Archetype Labels
// ============================================================

export const ARCHETYPE_LABELS: Record<PlanArchetype, string> = {
  hero_feature: "单品卖点",
  technical_breakdown: "技术解析",
  comparison_story: "优势对比",
  application_scene: "应用场景",
  multi_panel_info: "多模块信息",
  premium_showcase: "高级质感",
  promo_sales: "强销售",
};
