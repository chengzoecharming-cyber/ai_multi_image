import type { SystemTemplate, TemplateVariant } from "../types";

// ── 五张详情组图策划方案 — 系统模板配置 ──
//
// 注：v2 当前已下线「五张详情组图」模式。
// 本模板保留在 domain 层，作为未来组图功能重启时的配置基础。

const variants: TemplateVariant[] = [
  {
    name: "Hero",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection: "纯白背景，产品居中，极简标题。主图风格。",
  },
  {
    name: "Feature",
    layoutType: "hero_right_product_left_features",
    layoutDirection: "产品左侧，右侧功能面板。卖点说明图风格。",
  },
  {
    name: "Detail",
    layoutType: "technical_callout_with_insets",
    layoutDirection: "产品戏剧性裁切，局部放大插图。微距细节图风格。",
  },
  {
    name: "Lifestyle",
    layoutType: "four_panel_application_grid",
    layoutDirection: "应用场景图风格。",
  },
  {
    name: "Promo",
    layoutType: "top_headline_bottom_feature_bar",
    layoutDirection: "深色背景+几何色块，促销张力。促销图风格。",
  },
];

export const tplImageSet5: SystemTemplate = {
  id: "tpl-image-set-5",
  name: "五张详情组图策划方案",
  description: "一次生成一套五张详情图。每张有独立视觉风格，全组保持产品一致性。",
  imageType: "ecommerce_hero",
  archetype: "hero_feature",
  allowedLayoutTypes: [
    "premium_center_product_minimal_text",
    "hero_right_product_left_features",
    "technical_callout_with_insets",
    "four_panel_application_grid",
    "top_headline_bottom_feature_bar",
  ],
  defaultCopyDensity: "medium",
  riskRules: [
    "五张图必须保持产品比例和结构一致",
    "禁止任何一张图看起来像属于不同产品",
    "禁止假价格、假折扣或平台标识",
    "禁止真实测量数字",
    "不虚构参数、不编造品牌",
  ],
  allowedStyleIds: [
    "clean_catalog",
    "light_technical",
    "macro_chiaroscuro",
    "workshop_lifestyle",
    "high_contrast_promo",
  ],
  variants,
  mandatoryVisualRules: [],
  avoidRules: [],
  sceneRules: [],
  lightingColorRules: [],
  productPlacementRules: [],
  copyRules: [],
};
