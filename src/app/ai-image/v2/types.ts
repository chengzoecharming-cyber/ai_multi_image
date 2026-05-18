import {
  Zap, Gem, BarChart3, ImageIcon, Eye, Layout,
} from "lucide-react";

export type GenerationMode = "single" | "set";

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
// LayoutOverlay
// ============================================================

export type LayoutType =
  | "top_headline_right_points"
  | "left_headline_bottom_points"
  | "center_product_surrounding_points"
  | "comparison_split"
  | "detail_magnifier"
  | "promo_banner"
  | "clean_spec_card";

export type TextBlockRole = "headline" | "subtitle" | "selling_point" | "label" | "badge";
export type TextBlockPosition = "top-left" | "top-right" | "right" | "left" | "bottom" | "center";

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

export interface LayoutOverlay {
  layoutType: LayoutType;
  headline: string;
  subtitle?: string;
  sellingPoints: string[];
  textLanguage: "English";
  textBlocks: TextBlock[];
  colorTheme: ColorTheme;
  visualDensity: VisualDensity;
}

// ============================================================
// CreativePlan
// ============================================================

export interface CreativePlan {
  id: string;
  planName: string;
  templateId: string;
  imageType: string;

  productAnalysis?: ProductAnalysis;

  productName: string;
  headline: string;
  subtitle?: string;
  sellingPoints: string[];

  copySource: CopySource;
  copyNotes?: string[];

  layoutDirection: string;
  visualDirection: string;
  colorDirection: string;

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

export interface ImageSetPlan {
  id: string;
  setName: string;
  templateId: string;

  productAnalysis: ProductAnalysis;
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

export interface V2GeneratedImage {
  id: string;
  planId?: string;
  taskId?: string;
  imageUrl: string;
  createdAt: number;
}

export interface V2Session {
  id: string;
  title?: string;
  createdAt: number;
  updatedAt: number;

  mode: GenerationMode;
  step: Step;
  status?: V2SessionStatus;
  lastError?: string | null;

  productImageUrl: string | null;
  productReferenceImageUrl: string | null;
  goal: string;

  selectedTemplateId?: string | null;

  singlePlans: CreativePlan[];
  expandedSingleId: string | null;
  editingSingleId: string | null;

  setPlans: ImageSetPlan[];
  expandedSetId: string | null;
  expandedSubIds: string[];
  editingSubId: string | null;

  previewPlanId: string | null;
  copiedId: string | null;

  generatingImage: boolean;
  generatedImages: V2GeneratedImage[];
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

export const PLAN_META = [
  { icon: Zap, label: "强销售卖点", color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100" },
  { icon: Gem, label: "高级质感", color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-100" },
  { icon: BarChart3, label: "优势功能", color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
];

export const SUB_PLAN_META = [
  { icon: ImageIcon, color: "text-indigo-500", bg: "bg-indigo-50" },
  { icon: Zap, color: "text-orange-500", bg: "bg-orange-50" },
  { icon: Eye, color: "text-violet-500", bg: "bg-violet-50" },
  { icon: Layout, color: "text-emerald-500", bg: "bg-emerald-50" },
  { icon: BarChart3, color: "text-blue-500", bg: "bg-blue-50" },
];

// ============================================================
// Layout Type Labels
// ============================================================

export const LAYOUT_TYPE_LABELS: Record<LayoutType, string> = {
  top_headline_right_points: "顶部标题 + 右侧卖点",
  left_headline_bottom_points: "左侧标题 + 底部卖点",
  center_product_surrounding_points: "居中产品 + 环绕卖点",
  comparison_split: "左右对比",
  detail_magnifier: "细节放大",
  promo_banner: "促销横幅",
  clean_spec_card: "简洁规格卡",
};
