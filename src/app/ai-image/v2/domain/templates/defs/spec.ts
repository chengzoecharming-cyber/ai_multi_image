import type { SystemTemplate, TemplateVariant } from "../types";

// ── 规格参数技术图 — 系统模板配置 ──
// 功能定位：以技术文档风格展示产品规格框架，保留规格面板和引导线结构，但不生成真实数据。

const variants: TemplateVariant[] = [
  {
    name: "Right Spec Rail",
    layoutType: "technical_callout_with_insets",
    layoutDirection:
      "产品以等轴测视图位于左中；规格面板在右侧导轨对齐；引导线连接到可见产品特征。",
  },
  {
    name: "Blueprint Center",
    layoutType: "exploded_layer_explanation",
    layoutDirection:
      "产品在网格上方居中；标题左上；面板围绕产品在四个角，带精确不交叉的引导线。",
  },
  {
    name: "Top-Down Sheet",
    layoutType: "technical_callout_with_insets",
    layoutDirection:
      "产品以顶视或侧视横贯中部；技术面板形成底部行，引导线向上指向实际特征。",
  },
];

export const tplSpec: SystemTemplate = {
  id: "tpl-spec-technical",
  name: "规格参数技术图",
  description: "技术文档风格展示产品规格框架。保留规格面板和引导线结构，不生成真实数字。",
  imageType: "spec_info",
  archetype: "technical_breakdown",
  allowedLayoutTypes: [
    "technical_callout_with_insets",
    "exploded_layer_explanation",
  ],
  defaultCopyDensity: "medium",
  visualComplexity: "complex",
  informationDensity: "high",
  copyProfile: "technical_medium",
  visualIdentity:
    "Technical documentation style with product and structured placeholder spec panels connected by leader lines.",
  colorDirection: "Cool technical palette with product natural colors.",
  layoutNonNegotiables:
    "No real numbers or invented specifications. Use placeholder-style labels only. Product full and sharp, technical panels with clean annotation lines.",
  riskRules: [
    "禁止生成真实尺寸或具体数值测量",
    "规格字段必须是占位符样式标签",
    "不虚构参数、不编造品牌、产品完整可见",
  ],
  allowedStyleIds: ["light_technical", "dark_technical", "clean_catalog"],
  variants,
  mandatoryVisualRules: [],
  avoidRules: [],
  sceneRules: [],
  lightingColorRules: [],
  productPlacementRules: [],
  copyRules: [],
};
