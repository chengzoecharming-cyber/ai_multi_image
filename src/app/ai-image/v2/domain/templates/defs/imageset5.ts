import type { SystemTemplate, TemplateVariant } from "../types";

// ── 五张详情组图策划方案 — 系统模板配置 ──
//
// 注：v2 当前已下线「五张详情组图」模式（plan API 返回 400 错误）。
// 本模板保留在 domain 层，作为未来组图功能重启时的配置基础。

const variants: TemplateVariant[] = [
  {
    name: "Hero",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "纯白背景，产品居中 75-85%，极简标题。Amazon/Temu 主图风格。",
  },
  {
    name: "Feature",
    layoutType: "hero_right_product_left_features",
    layoutDirection:
      "浅冷灰背景，产品 40-50% 左侧，右侧功能面板。卖点说明图风格。",
  },
  {
    name: "Detail",
    layoutType: "technical_callout_with_insets",
    layoutDirection:
      "纯黑背景，产品 40-60% 戏剧性裁切，局部放大插图。微距细节图风格。",
  },
  {
    name: "Lifestyle",
    layoutType: "four_panel_application_grid",
    layoutDirection:
      "车间环境，暖色调，产品清晰，背景虚化。应用场景图风格。",
  },
  {
    name: "Promo",
    layoutType: "top_headline_bottom_feature_bar",
    layoutDirection:
      "深色背景+几何色块，丰富文案，促销张力。促销图风格。",
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
  ],
  allowedStyleIds: [
    "clean_catalog",
    "light_technical",
    "macro_chiaroscuro",
    "workshop_lifestyle",
    "high_contrast_promo",
  ],
  variants,
  mandatoryVisualRules: [
    "五张图必须构成 coherent detail page story，从识别到购买决策的视觉叙事",
    "产品材质、颜色、finish 必须在五张图中完全一致",
    "产品比例和可见特征不得改变",
    "五张图必须 feel like they belong to the same product page",
    "每张图必须 follow 自己的 visual identity，但保持 cross-image consistency",
  ],
  avoidRules: [
    "禁止任何一张图看起来像属于不同产品",
    "禁止不一致的产品外观",
    "禁止假价格、假折扣或平台标识",
    "禁止真实测量数字",
  ],
  sceneRules: [
    "五张图覆盖：Hero → Feature → Detail → Lifestyle → Promo 的完整叙事",
  ],
  lightingColorRules: [
    "每张图根据自身类型使用对应 lighting：Hero=soft studio、Detail=hard chiaroscuro、Lifestyle=warm ambient、Promo=dramatic key+rim",
    "cross-image 产品材质一致性优先",
  ],
  productPlacementRules: [
    "产品材质、颜色、finish 必须在五张图中完全一致",
    "产品比例和可见特征不得改变",
  ],
  copyRules: [
    "每张图 follow 自己的 copy strategy：Hero=minimal、Feature=medium-rich、Detail=minimal、Lifestyle=minimal-medium、Promo=rich",
    "信息层级之间必须有 generous spacing",
  ],
};
