import type { SystemTemplate, TemplateVariant } from "../types";

// ── Temu 高对比促销图 — 系统模板配置 ──

const variants: TemplateVariant[] = [
  {
    name: "Diagonal Attack",
    layoutType: "top_headline_bottom_feature_bar",
    layoutDirection:
      "超大标题占据左上 25%；产品位于中右 60% 比例；对角线色块在后方穿插；三个功能徽章沿右侧交错排列，底部信息条贯穿。",
  },
  {
    name: "Center Burst",
    layoutType: "large_headline_with_bottom_info_bar",
    layoutDirection:
      "产品锚定中心 62% 比例，硬边色块在后方辐射；标题居中上方；功能卡片紧凑聚集在左下，底部信息横跨宽度。",
  },
  {
    name: "Side Poster",
    layoutType: "hero_left_text_right_product",
    layoutDirection:
      "产品占据右侧 55%；标题和核心主张在左侧堆叠；功能块在标题和底部栏之间形成垂直节奏。",
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
    "High-energy Temu promo style: deep matte black base, hard-edged geometric color blocks, dramatic upper-left key light, subtle colored rim light, crisp shadow, sharp product, bold commercial impact.",
  colorDirection:
    "Background #0A0A0A to #1A1A1A; choose one dominant accent per plan from #007BFF, #FF6B00, #FF2D55, or #39FF14; text #FFFFFF; panels #111111; product natural colors.",
  layoutNonNegotiables:
    "Asymmetric high-impact promo layout with oversized headline, subheadline, 3-4 feature blocks, and bottom info. No fake prices, discounts, countdowns, CTA buttons, or platform marks.",
  riskRules: [
    "禁止生成假价格、假折扣、假倒计时、CTA 按钮或平台标识",
  ],
  allowedStyleIds: ["high_contrast_promo", "dark_technical", "bundle_pop"],
  variants,
  mandatoryVisualRules: [
    "标题区必须存在且作为视觉锚点：headline 是画面最高层级，OVERSIZED (6-12 词, ALL CAPS, heavy weight)，占据顶部 20-25%",
    "标题颜色应为高饱和度 accent 色（electric blue #007BFF、vivid orange #FF6B00、hot red #FF2D55、acid green #39FF14），与深色背景形成强烈对比",
    "背景：深 matte black (#0A0A0A 到 #1A1A1A) + 硬边几何色块（矩形、对角切片、角形），禁止 soft gradients 或 rounded blobs",
    "产品必须完整展示，清晰锐利，占画面 55-65%，在深色背景上突出",
    "照明：戏剧性 key light 从左上 45° 带强烈 specular highlight；右侧 hard shadow；subtle colored rim light（与 accent 块同色）描边产品右边缘",
    "景深：MODERATE，产品完全清晰；背景色块可略软但必须保持可读形状",
    "文字：BOLD and AGGRESSIVE。Headline + subheadline + 3-4 feature badges/blocks + bottom info bar。高密度",
    "布局：不对称。大标题左上或顶部居中；产品中心或中右；色块在产品后方或侧面穿插；功能徽章动态交错排列",
    "产品必须有 crisp shadow beneath，增强 grounded 感，禁止悬浮",
  ],
  avoidRules: [
    "禁止 soft gradients 或 pastel colors（扼杀促销能量）",
    "禁止极简文字或大量负空间（这不是 premium，这是 promo）",
    "禁止假价格、假折扣、假倒计时、平台 logo",
    "禁止均匀 studio lighting 或 flat lighting",
    "禁止对称、居中、平衡布局（promo 需要不对称和张力）",
    "禁止产品裁切或极端特写",
    "禁止纯平无层次背景",
    "禁止信息密度过低",
  ],
  sceneRules: [
    "深色 matte black 基底 + 硬边几何色块",
    "无环境元素、无生活场景、无纹理背景",
    "色块必须 hard-edged：矩形、对角切片、角形",
  ],
  lightingColorRules: [
    "戏剧性 key light 从左上 45°",
    "强烈 specular highlights",
    "右侧 hard shadow",
    "subtle colored rim light（与 accent 色块匹配）描边产品右边缘，强度 20-30%",
    "背景色块可略软但必须保持可读形状",
    "accent 色从高饱和度池中选择：electric blue #007BFF、vivid orange #FF6B00、hot red #FF2D55、acid green #39FF14",
    "标题颜色应为高饱和度 accent 色",
  ],
  productPlacementRules: [
    "产品必须完整展示",
    "产品占画面 55-65%",
    "产品必须 brightly lit and sharply focused，在深色背景上突出",
    "产品必须有 crisp shadow beneath，禁止悬浮",
  ],
  copyRules: [
    "密度：RICH and BOLD。Headline + subheadline + core_claim + 3-4 feature_points + 3 bottom_info items",
    "文案必须感觉紧迫且 sales-driven",
    "headline: OVERSIZED, 6-12 词, ALL CAPS, heavy weight, 占顶部 20-25%",
    "feature text 必须强调 VALUE 和 COMPLETENESS",
    "信息层级之间必须有 generous spacing，但在 promo 语境下允许较高密度",
  ],
};
