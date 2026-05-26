import type { SystemTemplate, TemplateVariant } from "../types";

// ── 高端质感展示图 — v2.1 重构版 ──
// 核心变化：
// - 不再锁死 near-pure black void，支持深棕、酒红、雾蓝、金属灰、柔和渐变等 premium 背景
// - 标题从"必须存在"改为 optional，允许无文字高端视觉
// - 支持 premium_black / soft_premium / material_stage / minimal_no_text / editorial_product_ad / macro_chiaroscuro
// - 产品比例抽象为 dominant，不锁死 60-70%
// - creativeFreedom: expressive，允许更强的光影和材质变化

const variants: TemplateVariant[] = [
  {
    name: "Gallery Center",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "产品在中心略低于中点， generous negative space 环绕；标题漂浮在上三分之一（optional），字间距宽；背景由 styleWorld 决定 — 可以是深黑 void、雾蓝、酒红、金属灰、柔和渐变或材质台面。",
  },
  {
    name: "Low Reflection",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "产品在下方中心，缎面反射在画面底部渐变 fade；标题小而居中上方（optional）；背景由 styleWorld 决定。",
  },
  {
    name: "Edge Rim",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "产品略偏右，让边缘光描绘轮廓；标题 sits 左上负空间中（optional）；背景由 styleWorld 决定。",
  },
];

export const tplPremium: SystemTemplate = {
  id: "tpl-premium-luxury",
  name: "高端质感展示图",
  description:
    "深色或柔和背景下的高端质感展示。强调材质、反射、边缘光。支持纯黑 luxury、柔和 premium、材质台面、无文字极简、杂志广告等多种视觉方向。适合表达精密、高端、耐用的产品形象。",
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
      "strict 模式下仅允许标题，禁止功能标签、底部信息、面板、粒子、生活场景、渐变或多产品",
      "expressive 模式下允许 subtle gradient、material surface、或 soft colored background，但产品仍必须是唯一主角",
    ],
    conflictResolution:
      "用户说'高端/质感/奢华/品牌'时，默认 expressive，允许从 premium_black、soft_premium、material_stage 中选择。用户明确说'不要文字/纯视觉'时，切换到 minimal_no_text。用户说'柔和/温暖/不冷'时，优先 soft_premium。",
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
    "Premium product photography with sculptural product treatment, generous negative space, and dramatic lighting. Background is determined by style world — could be near-pure black void, soft warm gray, mist blue, wine red, brushed metal surface, or material stage. The product feels heavy, precise, and valuable.",
  colorDirection:
    "Determined by style world. Premium black: near-black #0A0A0A, champagne gold #F7E7CE, silver #C0C0C0. Soft premium: warm gray #E5E5E0, cream #F5F0E8, antique gold #C5A059. Material stage: concrete, brushed aluminum, or stone surface tones. Editorial: very light warm gray with deep charcoal text.",
  layoutNonNegotiables:
    "Headline optional. Product full and commanding with maximum negative space. No feature labels, bottom info, panels, or extra products in strict mode. In expressive mode, subtle background texture, gradient, or material surface allowed, but product remains the sole hero.",
  riskRules: [
    "strict 模式下仅允许标题，禁止功能标签、底部信息、面板、粒子、生活场景、渐变或多产品",
  ],
  allowedStyleIds: ["premium_black", "macro_chiaroscuro", "clean_catalog"],
  variants,

  // ── 结构化规则（兼容层兜底） ──
  mandatoryVisualRules: [
    "标题区 optional：headline 可以是画面中唯一的文字元素，也可以完全无文字",
    "背景由 styleWorld 决定：premium_black = 深黑 void；soft_premium = 暖灰/雾蓝/奶白；material_stage = 石材/金属/亚克力台面；minimal_no_text = 纯视觉无文字",
    "产品处理：产品完整展示，占画面主导地位，居中或略低于中心；generous negative space 在上方和周围",
    "照明：DRAMATIC。允许 rim light、key light、subtle colored light 由 styleWorld 决定。soft_premium 用柔和漫射光，premium_black 用 dramatic rim light，macro_chiaroscuro 用 hard chiaroscuro",
    "反射：允许 satin-smooth ground reflection、subtle shadow、或 material surface contact，禁止悬浮",
    "景深：DEEP 或 SHALLOW 由 styleWorld 决定。premium_black 用 deep，macro_chiaroscuro 用 shallow",
    "色彩：产品自然材质色 + styleWorld 定义的 accent。premium_black 仅 champagne/silver；soft_premium 允许 antique gold/rose gold；editorial 允许 single restrained accent",
    "布局：center-product, maximum negative space。产品是唯一元素。文字如果存在，漂浮在 vast space 中",
  ],
  avoidRules: [
    "禁止产品裁切或极端特写（macro 风格除外）",
    "禁止文字密集布局、bullet points、feature panels",
    "禁止均匀 studio lighting 或 flat lighting",
    "禁止装饰元素、粒子、镜头光晕（除非 cinematic_workshop 风格）",
    "禁止杂乱构图或多产品",
    "禁止镜面反射或 double image",
    "禁止信息密度过高",
  ],
  sceneRules: [
    "由 styleWorld 决定场景氛围",
    "premium_black: deep matte black infinite void，无环境、无道具、无纹理",
    "soft_premium: 柔和空间感，像 luxury skincare 或 audio product page",
    "material_stage: 真实材质台面，产品像被精心摆放",
    "minimal_no_text: 纯视觉，无文字，产品自己说话",
  ],
  lightingColorRules: [
    "照明由 styleWorld 决定",
    "premium_black: DRAMATIC RIM LIGHT 是 PRIMARY 光源，单一 sharp light 从产品后方，bright white 或 warm white 描边每个边缘",
    "soft_premium: 柔和漫射光，均匀温暖，subtle warm fill",
    "macro_chiaroscuro: 单一硬光源从镜头左侧约 45°，暖白 key light，无 fill light，chiaroscuro",
    "material_stage: 自然光或 studio light，强调材质纹理和反射",
  ],
  productPlacementRules: [
    "产品完整展示",
    "产品占画面主导地位，居中或略低于中心",
    "generous negative space 在上方和周围",
    "必须有 grounded contact：reflection、shadow 或 material surface contact，禁止悬浮",
  ],
  copyRules: [
    "密度：MINIMAL — headline only 或 no_text",
    "headline 是 optional，不是强制",
    "禁止 subheadline、feature_points、technical_points、bottom_info",
    "headline: 2-4 词, elegant serif 或 thin sans-serif, all caps 或 title case, small size",
  ],
};
