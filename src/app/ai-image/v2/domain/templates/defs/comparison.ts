import type { SystemTemplate, TemplateVariant } from "../types";

// ── 优势对比图 — 系统模板配置 ──

const variants: TemplateVariant[] = [
  {
    name: "Side-by-Side Split",
    layoutType: "comparison_two_columns",
    layoutDirection:
      "左右分屏对比：中心 VS 锚点或分割线作为视觉焦点；左侧为产品问题/缺陷状态，右侧为产品理想/解决状态；内容区块之间靠 generous spacing + subtle hairline divider 分隔，不推荐每个模块都加底色。",
  },
  {
    name: "Diagonal Contrast",
    layoutType: "diagonal_product_with_side_features",
    layoutDirection:
      "对角线分割：用对角线色块或光带分割画面；一侧暗淡 cool gray（产品缺陷状态），另一侧明亮 warm accent（产品理想状态）；产品从对角两端向中心形成张力。",
  },
  {
    name: "Before/After Reveal",
    layoutType: "large_headline_with_bottom_info_bar",
    layoutDirection:
      "揭示式对比：画面从一侧「产品旧/缺陷状态」过渡到另一侧「升级/理想状态」，过渡边界可用光效/色温变化暗示；标题置顶。底部功能条为可选，若需要可用 2-3 张功能卡片简要说明升级点。",
  },
];

export const tplComparison: SystemTemplate = {
  id: "tpl-advantage-comparison",
  name: "优势对比图",
  description: "用视觉对比证明产品优势。左侧展示产品真实问题/缺陷状态，右侧展示产品理想/解决状态。不引用真实竞品。",
  imageType: "comparison_chart",
  archetype: "comparison_story",
  allowedLayoutTypes: ["comparison_two_columns", "diagonal_product_with_side_features", "large_headline_with_bottom_info_bar"],
  defaultCopyDensity: "medium",
  visualComplexity: "complex",
  informationDensity: "high",
  copyProfile: "comparison_medium",
  visualIdentity:
    "Strict split-screen advantage comparison on one unified deep dark background: left same product category desaturated and dim with red X, right reference product full color and warm sharp with green check, clear VS divider, bottom advantage bar.",
  colorDirection:
    "Unified background #151515 to #1E1E1E; left desaturated blue-gray #5A6A7A with red X #DC2626; right natural product color with warm amber #FFB347 and green check #22C55E; VS #FFFFFF or #E0E0E0; bottom bar #1A1A1A.",
  layoutNonNegotiables:
    "Comparison layout: same product category both sides, with clear visual contrast. No fake specs or competitor references.",
  riskRules: [
    "两侧必须是同一产品类型，不能是不同产品",
    "禁止引用具体竞争品牌或产品",
    "禁止生成虚假性能数据、测试分数、对比数字或统计",
  ],
  allowedStyleIds: ["comparison_drama", "dark_technical", "high_contrast_promo"],
  variants,
  mandatoryVisualRules: [],
  avoidRules: [],
  sceneRules: [],
  lightingColorRules: [],
  productPlacementRules: [],
  copyRules: [],
};
