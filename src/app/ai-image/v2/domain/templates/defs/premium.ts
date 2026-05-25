import type { SystemTemplate, TemplateVariant } from "../types";

// ── 高端质感展示图 — 系统模板配置 ──

const variants: TemplateVariant[] = [
  {
    name: "Gallery Center",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "产品在中心略低于中点 65% 比例；标题漂浮在上三分之一，字间距宽，无其他文字。",
  },
  {
    name: "Low Reflection",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "产品在下方中心 62% 比例，缎面反射在 20% 画幅高度内渐变；标题小而居中上方。",
  },
  {
    name: "Edge Rim",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "产品略偏右 60% 比例，让边缘光描绘轮廓；标题 sits 左上黑色虚空中。",
  },
];

export const tplPremium: SystemTemplate = {
  id: "tpl-premium-luxury",
  name: "高端质感展示图",
  description: "深色背景下的高端质感展示。强调材质、反射、边缘光。适合表达精密、高端、耐用的产品形象。",
  imageType: "ecommerce_hero",
  archetype: "premium_showcase",
  allowedLayoutTypes: [
    "premium_center_product_minimal_text",
  ],
  defaultCopyDensity: "headline_only",
  visualComplexity: "medium",
  informationDensity: "low",
  copyProfile: "headline_only",
  visualIdentity:
    "Premium luxury product photography in near-pure black void, sculptural full product, generous negative space, dramatic primary rim light from behind, minimal key light, satin reflection, deep focus, luxury watch-ad restraint.",
  colorDirection:
    "Background #0A0A0A to #111111; text #F7E7CE or #FFFFFF; rim light #FFF8E7, #FFFFFF, or #C0C0C0; optional champagne accent #F7E7CE only; no blue, green, red, color blocks, or gradients.",
  layoutNonNegotiables:
    "Headline only. Product full at 60-70% frame with maximum negative space. No feature labels, bottom info, panels, particles, lifestyle, gradients, or extra products.",
  riskRules: [
    "仅允许标题，禁止功能标签、底部信息、面板、粒子、生活场景、渐变或多产品",
  ],
  allowedStyleIds: ["premium_black", "macro_chiaroscuro", "clean_catalog"],
  variants,
  mandatoryVisualRules: [
    "标题区必须存在且作为视觉锚点：headline 是画面中唯一的文字元素，elegant serif 或 thin sans-serif，all caps 或 title case，small size，漂浮在上三分之一，字间距宽",
    "标题颜色应为 champagne gold (#F7E7CE) 或 silver (#C0C0C0)，与 dark void 形成优雅对比",
    "背景：deep matte black (#0A0A0A 到 #111111)；禁止渐变、纹理、环境；感觉像 infinite void — pure, absolute darkness",
    "产品处理：产品完整展示，占画面 60-70%，居中或略低于中心；generous negative space 在上方和周围；产品必须像 gallery 中的雕塑 — isolated、honored、studied",
    "照明：DRAMATIC RIM LIGHT 是 PRIMARY 光源。单一 sharp light 从产品后方 10-20° 高于地平线，用 bright white 或 warm white (#FFF8E7 或 #FFFFFF) 描边每个边缘；key light 从前上方低强度，仅够 reveal surface texture；无 fill light，阴影落入纯黑",
    "反射：SATIN-SMOOTH ground reflection 直接在 product 下方，在 15-20% 画幅高度内垂直渐变 fade；反射必须比产品更软 (gaussian blur ~3-5px)；禁止镜面反射、禁止 double image",
    "景深：DEEP。整个产品清晰；背景保持纯黑",
    "色彩：仅产品自然金属色调 + champagne gold (#F7E7CE) 或 silver (#C0C0C0) accent 仅用于 rim light；禁止其他颜色、blue、green、red；感觉像 luxury watch ad",
    "文字：绝对极简。仅 1 个 headline (2-4 词)；禁止 subheadline、body text、feature labels、bottom info bar；product speaks, words are almost unnecessary",
    "布局：center-product, maximum negative space。产品是唯一元素。文字如果存在，漂浮在 vast darkness 中",
    "产品必须有 satin-smooth ground reflection，增强 luxury 感和 grounded 感",
  ],
  avoidRules: [
    "禁止任何非近纯黑的背景",
    "禁止多色、色块、渐变",
    "禁止文字密集布局、bullet points、feature panels",
    "禁止均匀 studio lighting 或 flat lighting",
    "禁止产品裁切或极端特写",
    "禁止装饰元素、粒子、镜头光晕",
    "禁止杂乱构图或多产品",
    "禁止镜面反射或 double image",
    "禁止信息密度过高",
  ],
  sceneRules: [
    "deep matte black infinite void",
    "无环境、无道具、无纹理、无渐变",
    "像 luxury gallery 中的雕塑展示",
    "像 luxury watch ad 的极简美学",
  ],
  lightingColorRules: [
    "DRAMATIC RIM LIGHT 是 PRIMARY 光源",
    "单一 sharp light 从产品后方 10-20° 高于地平线",
    "bright white 或 warm white (#FFF8E7 或 #FFFFFF) 描边每个边缘",
    "key light 从前上方低强度，仅够 reveal surface texture",
    "无 fill light，阴影落入纯黑",
    "仅产品自然金属色调 + champagne gold (#F7E7CE) 或 silver (#C0C0C0) accent 仅用于 rim light",
    "禁止 blue、green、red",
    "标题颜色应为 champagne gold 或 silver",
  ],
  productPlacementRules: [
    "产品完整展示",
    "产品占画面 60-70%，居中或略低于中心",
    "generous negative space 在上方和周围",
    "必须有 satin-smooth ground reflection",
    "禁止悬浮",
  ],
  copyRules: [
    "密度：MINIMAL — headline only",
    "禁止 subheadline、feature_points、technical_points、bottom_info",
    "headline 是唯一的文字元素",
    "headline: 2-4 词, elegant serif 或 thin sans-serif, all caps 或 title case, small size",
  ],
};
