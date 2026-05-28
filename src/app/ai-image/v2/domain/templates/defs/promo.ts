import type { SystemTemplate, TemplateVariant } from "../types";

// ── Temu 高对比促销图 — 系统模板配置 ──

const variants: TemplateVariant[] = [
  {
    name: "Diagonal Attack",
    layoutType: "top_headline_bottom_feature_bar",
    layoutDirection:
      "超大标题占据左上；产品位于中右；对角线色块在后方穿插；功能徽章沿右侧交错排列，底部信息条贯穿。",
  },
  {
    name: "Center Burst",
    layoutType: "large_headline_with_bottom_info_bar",
    layoutDirection:
      "产品锚定中心；硬边色块在后方辐射；标题居中上方；功能卡片聚集在左下，底部信息横跨宽度。",
  },
  {
    name: "Side Poster",
    layoutType: "hero_left_text_right_product",
    layoutDirection:
      "产品占据右侧；标题和核心主张在左侧堆叠；功能块在标题和底部栏之间形成垂直节奏。",
  },
];

export const tplPromo: SystemTemplate = {
  id: "tpl-temu-promo",
  name: "Temu 高对比促销图",
  description: "高能量促销风格。深色背景 + 亮色块/几何切割，大标题，强视觉冲击力。",
  imageType: "promo_sales",
  archetype: "promo_sales",
  allowedLayoutTypes: [
    "top_headline_bottom_feature_bar",
    "large_headline_with_bottom_info_bar",
    "hero_left_text_right_product",
  ],
  defaultCopyDensity: "rich",
  visualComplexity: "complex",
  informationDensity: "high",
  copyProfile: "promo_rich",
  visualIdentity:
    "High-energy Temu promo style: deep matte black base, hard-edged geometric color blocks, dramatic key light, crisp shadow, sharp product, bold commercial impact.",
  colorDirection:
    "Deep matte black background; choose one dominant accent per plan; text white; panels dark; product natural colors.",
  layoutNonNegotiables:
    "Asymmetric high-impact promo layout with oversized headline and feature blocks. No fake prices, discounts, countdowns, CTA buttons, or platform marks.",
  riskRules: [
    "禁止生成假价格、假折扣、假倒计时、CTA 按钮或平台标识",
  ],
  allowedStyleIds: ["high_contrast_promo", "dark_technical", "bundle_pop"],
  variants,
  mandatoryVisualRules: [],
  avoidRules: [],
  sceneRules: [],
  lightingColorRules: [],
  productPlacementRules: [],
  copyRules: [],
};
