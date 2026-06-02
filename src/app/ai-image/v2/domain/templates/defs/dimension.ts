import type { SystemTemplate, TemplateVariant } from "../types";

// ── 尺寸标注展示图 — 系统模板配置 ──
// 功能定位：展示产品尺寸和结构标注，带测量示意线和标注框。如用户提供具体尺寸则如实呈现。

const variants: TemplateVariant[] = [
  {
    name: "Radial Dimensions",
    layoutType: "technical_callout_with_insets",
    layoutDirection:
      "产品在中心左侧；测量线辐射到右侧和顶部空白；标题左上；占位框保持对齐。",
  },
  {
    name: "Profile Sheet",
    layoutType: "exploded_layer_explanation",
    layoutDirection:
      "产品使用侧视/轮廓视图横贯中心；长度引导在上方，直径/高度引导在下方；标签使用破折号或通用名称。",
  },
  {
    name: "Isometric Markup",
    layoutType: "technical_callout_with_insets",
    layoutDirection:
      "产品等轴测展示；注释框围绕产品形成周边，短引导线指向孔、边缘、槽或螺纹。",
  },
];

export const tplDimension: SystemTemplate = {
  id: "tpl-dimension-annotation",
  name: "尺寸标注展示图",
  description: "展示产品尺寸和结构标注。带测量示意线和标注框。",
  imageType: "spec_info",
  archetype: "technical_breakdown",
  allowedLayoutTypes: [
    "technical_callout_with_insets",
    "exploded_layer_explanation",
  ],
  defaultCopyDensity: "medium",
  visualComplexity: "complex",
  informationDensity: "medium",
  copyProfile: "technical_medium",
  visualIdentity:
    "Clean engineering drawing sheet style with product at dimension-revealing angle, thin measurement lines, dimension callouts.",
  colorDirection: "Neutral technical palette with product natural colors.",
  layoutNonNegotiables:
    "Product full and visible; annotation lines point to visible features and must not cross.",
  riskRules: [
    "注释线必须指向真实可见结构",
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
