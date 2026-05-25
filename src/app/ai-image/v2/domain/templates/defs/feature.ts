import type { SystemTemplate, TemplateVariant } from "../types";

// ── 功能卖点说明图 — 系统模板配置 ──

const variants: TemplateVariant[] = [
  {
    name: "Product + Side Panels",
    layoutType: "hero_right_product_left_features",
    layoutDirection:
      "产品+侧面功能面板：产品一侧占 50-65% 作为绝对视觉主角，信息为配角；另一侧垂直排列 3-4 个卖点；卖点之间用 generous spacing + subtle hairline divider 分隔，面板使用 glassmorphism / translucent 风格，禁止 flat opaque 色块。",
  },
  {
    name: "Hero with Orbital Features",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "环绕式卖点：产品居中占 55-70% 作为绝对主角，3-4 个功能卖点围绕产品形成弧形或轨道排列；卖点之间靠 generous spacing 分隔，使用 subtle connecting lines 或 visual paths；背景可用 subtle 几何纹理或渐变增加深度。",
  },
  {
    name: "Exploded Benefit Map",
    layoutType: "exploded_layer_explanation",
    layoutDirection:
      "效果映射：产品与使用场景并置（如产品+加工工件/装配结果），功能卖点用引导线或视觉路径连接两者；信息区块之间靠 spacing 分隔，不用底色色块。",
  },
];

export const tplFeature: SystemTemplate = {
  id: "tpl-feature-explanation",
  name: "功能卖点说明图",
  description: "结构化展示产品功能卖点。支持侧面面板、环绕排列、效果映射三种组织方式。产品是绝对主角，信息是配角。",
  imageType: "feature_showcase",
  archetype: "multi_panel_info",
  allowedLayoutTypes: [
    "hero_right_product_left_features",
    "premium_center_product_minimal_text",
    "exploded_layer_explanation",
  ],
  defaultCopyDensity: "medium",
  visualComplexity: "medium",
  informationDensity: "medium",
  copyProfile: "feature_medium",
  visualIdentity:
    "Clean feature-explanation image on cool light gray whiteboard background, deep focus, even upper-front studio light, slight ground reflection, structured white information panels, restrained technical clarity.",
  colorDirection:
    "Background #E8ECF0 to #F0F2F5; panels #FFFFFF; primary text #111827; secondary text #475569; one restrained accent #0066CC, #008080, or #4682B4.",
  layoutNonNegotiables:
    "Product full and sharp at 40-50% frame. Use headline, subheadline, 3-4 feature panels with body copy, and optional bottom info. No dark backgrounds, warm accents, comparison labels, or fake specs.",
  riskRules: [
    "禁止生成虚假数据表格、规格框或测量注释",
    "禁止用 CAD 式蓝色细线标注",
  ],
  allowedStyleIds: ["dark_technical", "high_contrast_promo", "light_technical", "premium_black"],
  variants,
  mandatoryVisualRules: [
    "标题区必须存在且作为视觉锚点：headline 是画面最高层级，ALL CAPS 或 bold weight",
    "标题颜色应与产品色调形成呼应：同类产品可用类似色，突出差异可用对比色；禁止无关随机 accent",
    "产品必须是画面中最大的单一元素，占 50-65% 画幅，是绝对视觉主角；信息面板/卖点是配角，不能喧宾夺主",
    "每个卖点必须有视觉对应元素（图标/图形/色彩块/数字），不能是纯文字列表",
    "卖点之间必须有视觉层次和分隔，但不能靠 flat 底色色块 — 靠 generous spacing + subtle hairline divider + 字体层级区分",
    "背景必须有 subtle depth / texture：推荐 soft radial gradient、subtle noise texture、faint geometric mesh、或 brushed metal reflection；禁止纯平单色",
    "产品必须有 subtle ground reflection 和 soft shadow，增强真实存在感，禁止悬浮",
    "信息面板若有底色，必须使用 glassmorphism（subtle translucency + soft shadow + rounded corners），禁止 flat opaque 色块或生硬直角",
    "图标推荐使用 outline / line-art 风格，统一克制不花哨",
  ],
  avoidRules: [
    "禁止 plain text on plain background — 必须有设计元素（shapes, gradients, panels），但分隔主要靠 spacing 而非色块",
    "禁止 CAD 式细蓝线标注或测量箭头",
    "禁止假数据表格、规格框、尺寸数值",
    "禁止所有文字堆在单一列中 — 信息必须创造性分布",
    "禁止纯平 flat 背景（如纯 #FFFFFF 或纯 #F5F5F5 无渐变/无纹理）",
    "禁止产品悬浮无阴影",
    "禁止信息面板使用 flat opaque 色块、生硬直角或厚重 border",
    "禁止每个信息模块都加底色色块 — 分隔主要靠 generous spacing",
    "禁止信息密度过高导致拥挤",
  ],
  sceneRules: [],
  lightingColorRules: [
    "背景可深可浅，由具体产品和卖点气质决定；深色可用 charcoal/navy with subtle radial gradient，浅色可用 soft white/pale gray with faint texture",
    "允许 cool accent（tech blue, teal, steel blue）用于图标和 headline 强调，但必须与产品色调协调",
    "避免 pastel 或 flat 无层次配色；推荐 subtle gradient shifts 增加背景深度",
    "产品照明必须专业：key light from upper-left + soft fill，有 crisp edge、subtle ground reflection、soft shadow beneath",
    "允许 subtle specular highlights on product 增加金属/涂层质感",
    "信息面板可使用 subtle glow 或 soft shadow 与背景区分，但不能用 flat opaque 色块",
    "标题颜色应与产品或场景主色调呼应",
  ],
  productPlacementRules: [
    "产品必须 large and commanding，50-65% 画幅，是绝对主角",
    "可带 dynamic angle（15-30° tilt）或 partial crop 增加张力",
    "产品边缘必须清晰，不能和背景糊在一起",
    "产品必须有 natural ground contact：subtle reflection + soft shadow，不能悬浮",
  ],
  copyRules: [
    "MEDIUM 密度为上限，优先 generous negative space；密度可低至 headline + 3-4 feature_labels（title only）",
    "headline 必须存在且作为顶部视觉锚点，ALL CAPS 或 bold weight",
    "feature body text 必须解释卖点价值，不能只是重复标题",
    "卖点标题 2-4 词 ALL CAPS，描述 8-15 词",
    "NO comparison_labels, NO application_labels",
    "信息层级之间必须有 generous spacing，优先 negative space 而非填满画面",
  ],
};
