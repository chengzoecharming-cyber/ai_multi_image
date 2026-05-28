import type { SystemTemplate, TemplateVariant } from "../types";

// ── 高端质感展示图 — 系统模板配置 ──
// 功能定位：深色或柔和背景下的高端质感展示，强调材质、反射、光影。支持纯黑 luxury、柔和 premium、材质台面等多种视觉方向。

const variants: TemplateVariant[] = [
  {
    name: "Gallery Center",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "产品在中心略低于中点，负空间环绕；标题漂浮在上三分之一（optional）。",
  },
  {
    name: "Low Reflection",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "产品在下方中心，缎面反射在画面底部渐变 fade；标题小而居中上方（optional）。",
  },
  {
    name: "Edge Rim",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "产品略偏右，让边缘光描绘轮廓；标题 sits 左上负空间中（optional）。",
  },
];

export const tplPremium: SystemTemplate = {
  id: "tpl-premium-luxury",
  name: "高端质感展示图",
  description:
    "深色或柔和背景下的高端质感展示。强调材质、反射、边缘光。适合表达精密、高端、耐用的产品形象。",
  imageType: "ecommerce_hero",
  archetype: "premium_showcase",
  allowedLayoutTypes: ["premium_center_product_minimal_text"],
  defaultCopyDensity: "headline_only",

  // ── v2.1 新三层架构 ──
  configV2: {
    intent: "brand_mood",
    preferredStyleWorlds: [
      "premium_black",
      "soft_premium",
      "material_stage",
      "minimal_no_text",
      "editorial_product_ad",
      "macro_chiaroscuro",
    ],
    preferredLayouts: [
      "center_hero",
      "editorial_negative_space",
      "full_bleed_product",
    ],
    defaultCopyMode: "headline_only",
    headlineRequirement: "optional",
    defaultCreativeFreedom: "expressive",
    productScaleStrategy: "dominant",
    safetyRules: [
      "产品必须完整展示，不得裁切",
    ],
    conflictResolution:
      "用户说'高端/质感/奢华/品牌'时，默认 expressive。用户明确说'不要文字/纯视觉'时，切换到 minimal_no_text。",
  },

  // ── 新控制字段 ──
  copyMode: "headline_only",
  headlineRequirement: "optional",
  creativeFreedom: "expressive",
  productScaleStrategy: "dominant",

  // ── 旧字段（保留兼容） ──
  visualComplexity: "medium",
  informationDensity: "low",
  copyProfile: "headline_only",
  visualIdentity:
    "Premium product photography with sculptural product treatment, generous negative space, and dramatic lighting.",
  colorDirection: "Determined by style world — premium black, soft premium, material stage, etc.",
  layoutNonNegotiables:
    "Headline optional. Product full with maximum negative space.",
  riskRules: [
    "不虚构参数、不编造品牌、产品完整可见",
  ],
  allowedStyleIds: ["premium_black", "macro_chiaroscuro", "clean_catalog"],
  variants,

  // ── 结构化规则（已清空，交给大模型自由发挥） ──
  mandatoryVisualRules: [],
  avoidRules: [],
  sceneRules: [],
  lightingColorRules: [],
  productPlacementRules: [],
  copyRules: [],
};
