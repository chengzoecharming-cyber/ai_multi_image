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
      "禁止生成虚假数据表格、规格框或测量注释",
      "禁止用 CAD 式蓝色细线标注",
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
    "Product full and sharp, clearly the largest single element. Use headline, 3-4 feature points with visual support (icons, shapes, color blocks, or connecting lines). No fake specs, no CAD-style thin blue annotation lines. Information density adjustable by copyMode.",
  riskRules: [
    "禁止生成虚假数据表格、规格框或测量注释",
    "禁止用 CAD 式蓝色细线标注",
  ],
  allowedStyleIds: [
    "dark_technical",
    "high_contrast_promo",
    "light_technical",
    "premium_black",
  ],
  variants,

  // ── 结构化规则（兼容层兜底） ──
  mandatoryVisualRules: [
    "标题区必须存在且作为视觉锚点：headline 是画面最高层级",
    "产品必须是画面中最大的单一元素，是绝对视觉主角；信息面板/卖点是配角",
    "每个卖点必须有视觉对应元素（图标/图形/色彩块/数字/连接线路径），不能是纯文字列表",
    "卖点之间必须有视觉层次和分隔，但不依赖 flat 底色色块 — 靠 generous spacing + subtle hairline divider + 字体层级区分",
    "背景必须有 subtle depth / texture，由 styleWorld 决定具体形式",
    "产品必须有 subtle ground reflection 和 soft shadow，禁止悬浮",
    "信息面板若有底色，禁止使用 flat opaque 色块或生硬直角 — glassmorphism、subtle shadow、rounded corners 优先",
  ],
  avoidRules: [
    "禁止 plain text on plain background",
    "禁止 CAD 式细蓝线标注或测量箭头",
    "禁止假数据表格、规格框、尺寸数值",
    "禁止所有文字堆在单一列中",
    "禁止纯平 flat 背景无渐变/无纹理",
    "禁止产品悬浮无阴影",
    "禁止信息面板使用 flat opaque 色块、生硬直角或厚重 border",
    "禁止每个信息模块都加底色色块",
    "禁止信息密度过高导致拥挤",
  ],
  sceneRules: [],
  lightingColorRules: [
    "背景可深可浅，由具体产品和 styleWorld 决定",
    "允许 cool accent 用于图标和 headline 强调，但必须与产品色调协调",
    "避免 pastel 或 flat 无层次配色",
    "产品照明必须专业：key light from upper-left + soft fill",
    "允许 subtle specular highlights on product 增加金属/涂层质感",
    "信息面板可使用 subtle glow 或 soft shadow 与背景区分",
    "标题颜色应与产品或场景主色调呼应",
  ],
  productPlacementRules: [
    "产品必须 large and commanding，是绝对主角",
    "可带 dynamic angle（15-30° tilt）或 partial crop 增加张力",
    "产品边缘必须清晰，不能和背景糊在一起",
    "产品必须有 natural ground contact：subtle reflection + soft shadow",
  ],
  copyRules: [
    "headline 必须存在且作为顶部视觉锚点",
    "feature body text 必须解释卖点价值，不能只是重复标题",
    "卖点标题 2-4 词 ALL CAPS，描述 8-15 词",
    "NO comparison_labels, NO application_labels",
    "信息层级之间必须有 generous spacing，优先 negative space 而非填满画面",
  ],
};
