import type { SystemTemplate, TemplateVariant } from "../types";

// ── 促销套装组合图 — 系统模板配置 ──
// 功能定位：展示产品组合或套装，多个相关产品以组合形式呈现。

const variants: TemplateVariant[] = [
  {
    name: "Hero Plus Arc",
    layoutType: "large_headline_with_bottom_info_bar",
    layoutDirection:
      "主角产品在中心，较小变体以弧形排列；标题左上；功能徽章在弧形下方。",
  },
  {
    name: "Equal Row",
    layoutType: "top_headline_bottom_feature_bar",
    layoutDirection:
      "所有产品等比例排成干净水平行；标题居中上方；功能块在下方对齐。",
  },
  {
    name: "Staggered Grid",
    layoutType: "four_panel_application_grid",
    layoutDirection:
      "产品形成交错的网格，几何色块分隔；标题和副标题占据左上。",
  },
];

export const tplBundle: SystemTemplate = {
  id: "tpl-bundle-showcase",
  name: "促销套装组合图",
  description: "展示产品组合或套装。多个产品或不同角度排列。",
  imageType: "product_showcase",
  archetype: "multi_panel_info",
  allowedLayoutTypes: [
    "large_headline_with_bottom_info_bar",
    "top_headline_bottom_feature_bar",
    "four_panel_application_grid",
  ],
  defaultCopyDensity: "medium",
  visualComplexity: "complex",
  informationDensity: "medium",
  copyProfile: "bundle_medium",
  visualIdentity:
    "Bundle showcase with multiple related items or variants, evenly lit full products, energetic but orderly product arrangement.",
  colorDirection: "Bold promotional palette with product natural colors.",
  layoutNonNegotiables:
    "Show related items or deliberate variants, all fully visible. No fake prices or bundle values.",
  riskRules: [
    "禁止生成假价格、假折扣或假套装价值",
    "不虚构参数、不编造品牌、产品完整可见",
  ],
  allowedStyleIds: ["bundle_pop", "high_contrast_promo", "clean_catalog"],
  variants,
  mandatoryVisualRules: [],
  avoidRules: [],
  sceneRules: [],
  lightingColorRules: [],
  productPlacementRules: [],
  copyRules: [],
};
