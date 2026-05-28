import type { SystemTemplate, TemplateVariant } from "../types";

// ── 白底主图 — v2.1 重构版 ──
// 核心变化：
// - 不再锁死纯白背景，而是推荐多种风格世界（catalog / editorial / gradient / material / soft-premium / minimal）
// - 标题从"必须存在"改为 optional，允许无文字主图
// - 背景允许浅色渐变、轻材质台面、极简色块，strict 模式才回到平台白底
// - 产品比例抽象为 dominant，不锁死 70-85%

const variants: TemplateVariant[] = [
  {
    name: "Centered Catalog",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "产品居中作为绝对主角，完整展示无裁切；标题在上方或下方三分之一，2-3 个短标签在产品下方或侧面整齐排列；背景干净简洁，由所选风格世界决定具体色调（纯白、浅灰、渐变或材质台面）。",
  },
  {
    name: "Offset Thumbnail",
    layoutType: "hero_left_text_right_product",
    layoutDirection:
      "产品略偏右，完整展示；标题在左上负空间，2-3 个短标签沿左侧边缘垂直堆叠；背景由风格世界决定。",
  },
  {
    name: "Low Reflection",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "产品略低于中心，底部有柔和反射；标题在下三分之一，2-3 个紧凑标签对齐在反射上方；背景干净，由风格世界决定。",
  },
];

export const tplHero: SystemTemplate = {
  id: "tpl-white-bg-hero",
  name: "白底主图",
  description:
    "平台主图 / 首图。产品为画面绝对主角，背景干净简洁。支持纯白 catalog、杂志广告风、现代渐变、材质台面、柔和高级、无文字极简等多种视觉方向。",
  imageType: "ecommerce_hero",
  archetype: "hero_feature",
  allowedLayoutTypes: [
    "premium_center_product_minimal_text",
    "hero_left_text_right_product",
  ],
  defaultCopyDensity: "minimal",

  // ── v2.1 新三层架构 ──
  configV2: {
    intent: "hero_main",
    preferredStyleWorlds: [
      "clean_catalog",
      "editorial_product_ad",
      "gradient_modern_showcase",
      "material_stage",
      "soft_premium",
      "minimal_no_text",
    ],
    preferredLayouts: ["center_hero", "offset_hero", "full_bleed_product"],
    defaultCopyMode: "headline_labels",
    headlineRequirement: "optional",
    defaultCreativeFreedom: "balanced",
    productScaleStrategy: "dominant",
    safetyRules: [],
    conflictResolution:
      "用户明确说'主图/白底/平台图/Amazon/Temu'时，自动切换为 strict 模式，背景锁定纯白/浅灰，标题 optional。用户说'更高级/更有设计感/杂志感/渐变'时，允许扩展为 expressive，背景可变为 editorial、gradient、material 或 soft-premium 方向。",
  },

  // ── 新控制字段 ──
  copyMode: "headline_labels",
  headlineRequirement: "optional",
  creativeFreedom: "balanced",
  productScaleStrategy: "dominant",

  // ── 旧字段（保留，由兼容层消费） ──
  visualComplexity: "simple",
  informationDensity: "low",
  copyProfile: "headline_labels",
  visualIdentity:
    "Clean product-hero photography with the product as the absolute protagonist. Background is determined by the selected style world — could be pure white, warm gray, soft gradient, material surface, or editorial negative space. Full product visibility, sharp focus, and generous negative space.",
  colorDirection:
    "Determined by style world. For strict/platform mode: #FFFFFF or #F7F7F7 only. For expressive/editorial: very light warm gray #FAFAFA, soft gradient, or material surface tone. Product uses natural material colors. Text deep charcoal #111111.",
  layoutNonNegotiables:
    "Full product must remain visible with no cropped edges. One concise headline plus 2-3 short labels only, or no text at all. No fake data, no panels, no decorative frames in strict mode. In expressive mode, subtle geometric shapes or soft gradients allowed as background elements only.",
  riskRules: [],
  allowedStyleIds: ["clean_catalog", "light_technical", "premium_black"],
  variants,
  mandatoryVisualRules: [],
  avoidRules: [],
  sceneRules: [],
  lightingColorRules: [],
  productPlacementRules: [],
  copyRules: [],
};
