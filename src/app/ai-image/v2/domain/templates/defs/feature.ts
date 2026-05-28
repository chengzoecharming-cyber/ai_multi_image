import type { SystemTemplate, TemplateVariant } from "../types";

// ── 功能卖点说明图 — v2.1 重构版 ──
// 核心变化：
// - 背景不再锁死 cool light gray whiteboard，支持浅色/深色/渐变/轻纹理/玻璃拟态/轻量图解
// - 文案模式从固定 medium 扩展为 feature_cards / headline_labels / technical_annotations
// - 标题从"必须存在"改为 required（功能图通常需要标题，但允许密度变化）
// - 支持 clean_catalog / light_technical / dark_technical / gradient_modern / diagram_light / material_stage

const variants: TemplateVariant[] = [
  {
    name: "Product + Side Panels",
    layoutType: "hero_right_product_left_features",
    layoutDirection:
      "产品一侧作为绝对视觉主角，信息为配角；另一侧垂直排列 3-4 个卖点；卖点之间用 generous spacing + subtle hairline divider 分隔。面板风格由 styleWorld 决定：可以是 glassmorphism、flat cards、rounded diagram panels 或 minimalist labels。",
  },
  {
    name: "Hero with Orbital Features",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "产品居中作为绝对主角，3-4 个功能卖点围绕产品形成弧形或轨道排列；卖点之间靠 generous spacing 分隔，使用 subtle connecting lines 或 visual paths；背景可用 subtle 几何纹理、渐变或干净留白，由 styleWorld 决定。",
  },
  {
    name: "Exploded Benefit Map",
    layoutType: "exploded_layer_explanation",
    layoutDirection:
      "产品与使用场景并置（如产品+加工工件/装配结果），功能卖点用引导线或视觉路径连接两者；信息区块之间靠 spacing 分隔，不用底色色块。风格由 styleWorld 决定。",
  },
];

export const tplFeature: SystemTemplate = {
  id: "tpl-feature-explanation",
  name: "功能卖点说明图",
  description:
    "结构化展示产品功能卖点。支持侧面面板、环绕排列、效果映射三种组织方式。产品是绝对主角，信息是配角。背景可浅可深可渐变，由风格世界灵活决定。",
  imageType: "feature_showcase",
  archetype: "multi_panel_info",
  allowedLayoutTypes: [
    "hero_right_product_left_features",
    "premium_center_product_minimal_text",
    "exploded_layer_explanation",
  ],
  defaultCopyDensity: "medium",

  // ── v2.1 新三层架构 ──
  configV2: {
    intent: "feature_explain",
    preferredStyleWorlds: [
      "light_technical",
      "dark_technical",
      "gradient_modern_showcase",
      "diagram_light",
      "material_stage",
      "editorial_product_ad",
      "clean_catalog",
    ],
    preferredLayouts: ["side_panels", "orbital_callouts", "asymmetric_dynamic"],
    defaultCopyMode: "feature_cards",
    headlineRequirement: "required",
    defaultCreativeFreedom: "balanced",
    productScaleStrategy: "dominant",
    safetyRules: [
      "每个卖点必须有视觉对应元素，不能是纯文字列表",
    ],
    conflictResolution:
      "用户说'更高级/更有设计感/渐变/彩色'时，允许切换到 gradient_modern_showcase、editorial_product_ad 或 material_stage。用户说'轻量/干净/不要太重'时，推荐 diagram_light 或 clean_catalog。",
  },

  // ── 新控制字段 ──
  copyMode: "feature_cards",
  headlineRequirement: "required",
  creativeFreedom: "balanced",
  productScaleStrategy: "dominant",

  // ── 旧字段（保留兼容） ──
  visualComplexity: "medium",
  informationDensity: "medium",
  copyProfile: "feature_medium",
  visualIdentity:
    "Structured feature-explanation image. The product is the absolute hero at 40-65% of the frame. Information is organized in panels, orbital callouts, or benefit maps depending on layout. Background and panel style are determined by the selected style world — could be cool light gray, dark slate with glassmorphism, soft gradient, material surface, or clean white diagram.",
  colorDirection:
    "Determined by style world. Light technical: cool light gray #E8ECF0 to #F0F2F5, white panels, technical blue accent. Dark technical: dark slate #0F172A, panel #1E293B, cyan accent. Gradient modern: soft flowing gradient. Diagram light: pure white with friendly blue. Material stage: surface-driven palette.",
  layoutNonNegotiables:
    "Product full and sharp, clearly the largest single element. Use headline, feature points with visual support (icons, shapes, color blocks, or connecting lines). No fake specs, no CAD-style thin blue annotation lines. Information density adjustable by copyMode.",
  riskRules: [
    "每个卖点必须有视觉对应元素，不能是纯文字列表",
  ],
  allowedStyleIds: [
    "dark_technical",
    "high_contrast_promo",
    "light_technical",
    "premium_black",
  ],
  variants,
  mandatoryVisualRules: [],
  avoidRules: [],
  sceneRules: [],
  lightingColorRules: [],
  productPlacementRules: [],
  copyRules: [],
};
