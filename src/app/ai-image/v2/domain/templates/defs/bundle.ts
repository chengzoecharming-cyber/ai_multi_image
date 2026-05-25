import type { SystemTemplate, TemplateVariant } from "../types";

// ── 促销套装组合图 — 系统模板配置 ──

const variants: TemplateVariant[] = [
  {
    name: "Hero Plus Arc",
    layoutType: "large_headline_with_bottom_info_bar",
    layoutDirection:
      "一个主角产品在中心 48% 比例，2-3 个较小的变体以弧形排列；标题左上；功能徽章在弧形下方。",
  },
  {
    name: "Equal Row",
    layoutType: "top_headline_bottom_feature_bar",
    layoutDirection:
      "所有产品等比例 20-25%，排成干净水平行；标题居中上方；三个价值功能块和底部信息在下方对齐。",
  },
  {
    name: "Staggered Grid",
    layoutType: "four_panel_application_grid",
    layoutDirection:
      "产品形成交错的 2x2 或 3x2 网格，几何色块分隔；标题和副标题占据左上。",
  },
];

export const tplBundle: SystemTemplate = {
  id: "tpl-bundle-showcase",
  name: "促销套装组合图",
  description: "展示产品组合/套装。多个产品或不同角度排列，鲜艳背景，大标题。",
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
    "Bundle showcase with multiple related items or variants, deep navy or charcoal base, hard geometric accent blocks, evenly lit full products, deep focus, energetic but orderly product arrangement.",
  colorDirection:
    "Primary background #1A2744 or #2D2D2D; accent blocks #007BFF, #FF6B00, or #FF2D55; text #FFFFFF; panels #111827; product natural colors.",
  layoutNonNegotiables:
    "Show 3-5 related items or deliberate variants, all fully visible and evenly lit. Copy should emphasize complete set, full range, variety, and value. No fake prices or bundle values.",
  riskRules: [
    "禁止生成假价格、假折扣或假套装价值",
  ],
  allowedStyleIds: ["bundle_pop", "high_contrast_promo", "clean_catalog"],
  variants,
  mandatoryVisualRules: [
    "标题区必须存在且作为视觉锚点：headline 是画面最高层级，bold 或 ALL CAPS，字号 dominant",
    "标题颜色应为高饱和度 accent 色或与背景形成强烈对比",
    "背景：bold flat color blocks 或 clean subtle gradient；主背景色：deep navy (#1A2744) 或 charcoal (#2D2D2D)；accent 色块：bright complementary tones (electric blue #007BFF、vivid orange #FF6B00、magenta #FF2D55) 作为几何形状",
    "产品处理：3-5 个相关产品以 deliberate composition 排列：\n  A) 一个 hero product (45-50%) 居中 + 2-3 个较小变体 (12-18%) 以三角形或弧形排列\n  B) 所有产品等大小 (20-25% 每个) 排成干净水平行或交错网格",
    "所有产品必须完整可见、清晰、均匀照明；禁止裁切较小产品",
    "照明：clean commercial studio light 从前上方 45°；所有产品均匀照明 — 禁止某个产品在阴影中而另一个明亮",
    "景深：DEEP，所有产品从前到后都清晰锐利",
    "色彩：产品自然色 + 背景色块色 + 一个 headline accent；禁止产品与背景之间 clash",
    "文字：MEDIUM 密度。Headline + subheadline + 3-4 feature_points (title only, 套装无 body text) + 3 bottom_info items；文案强调 VALUE 和 COMPLETENESS",
    "布局：产品以 dynamic but orderly composition 排列；色块在产品后方创造视觉分隔；标题顶部居中或左上；功能徽章或标签在产品排列下方",
    "每个产品必须有 subtle individual shadow beneath，增强 grounded 感",
  ],
  avoidRules: [
    "禁止单产品（违背套装目的）",
    "禁止 wildly different sizes 无 scale indication",
    "禁止假价格、假折扣、假套装价值",
    "禁止 uneven lighting（某些产品暗）",
    "禁止重叠产品互相遮挡",
    "禁止杂乱数据表或规格框",
    "禁止 soft pastel backgrounds（套装需要 bold presence）",
    "禁止纯平无层次背景",
    "禁止信息密度过高导致拥挤",
  ],
  sceneRules: [
    "deep navy (#1A2744) 或 charcoal (#2D2D2D) 基底",
    "硬边几何 accent 色块创造视觉分隔",
    "无环境、无生活场景",
    "像专业产品目录的组合展示",
  ],
  lightingColorRules: [
    "clean commercial studio light 从前上方 45°",
    "所有产品均匀照明",
    "soft fill from below",
    "subtle individual shadows beneath each product",
    "accent 色块：electric blue #007BFF、vivid orange #FF6B00、magenta #FF2D55",
    "主背景：deep navy #1A2744 或 charcoal #2D2D2D",
    "标题颜色应与 accent 色块呼应",
  ],
  productPlacementRules: [
    "3-5 个相关产品",
    "所有产品完整可见、清晰、均匀照明",
    "禁止裁切较小产品",
    "每个产品有 subtle individual shadow beneath",
    "禁止悬浮",
  ],
  copyRules: [
    "密度：MEDIUM。Headline + subheadline + 3-4 feature_points (title only, 无 body text) + 3 bottom_info items",
    "文案必须强调 abundance、variety、value",
    "feature_points 标题形式：'COMPLETE SET'、'FULL RANGE'、'ALL SIZES' 等",
    "信息层级之间必须有 generous spacing",
  ],
};
