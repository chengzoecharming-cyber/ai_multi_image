import type { SystemTemplate, TemplateVariant } from "../types";

// ── 局部放大细节图 — 系统模板配置 ──

const variants: TemplateVariant[] = [
  {
    name: "Edge Slice",
    layoutType: "technical_callout_with_insets",
    layoutDirection:
      "产品对角线穿过画面，关键边缘穿过中心；标题在黑色负空间；一个小圆形细节插图漂浮在对角。",
  },
  {
    name: "Surface Window",
    layoutType: "technical_callout_with_insets",
    layoutDirection:
      "产品纹理填充画面，从右下向右上；标题在左上极小；两个矩形光学插图对比相邻可见表面区域。",
  },
  {
    name: "Shadow Reveal",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "产品细节从黑暗中在中心右侧浮现；标题 sits 左下，黑色空间中无其他文字。",
  },
];

export const tplMacro: SystemTemplate = {
  id: "tpl-macro-detail",
  name: "局部放大细节图",
  description: "微距特写风格，突出刀刃、螺纹、表面质感。深背景，戏剧性侧光，质感强烈。",
  imageType: "product_detail",
  archetype: "technical_breakdown",
  allowedLayoutTypes: [
    "technical_callout_with_insets",
    "premium_center_product_minimal_text",
  ],
  defaultCopyDensity: "headline_only",
  visualComplexity: "medium",
  informationDensity: "low",
  copyProfile: "headline_only",
  visualIdentity:
    "Macro detail photography on near-pure black, single hard warm side light from camera-left at 45 degrees, no fill, strong specular edge highlights, shallow razor-thin focal plane, dramatic cropped product texture.",
  colorDirection:
    "Near-pure black background; product natural metal tones only; optional warm copper or amber edge highlight; text light gray.",
  layoutNonNegotiables:
    "Show only part of the product, cropped dramatically. Headline only. Optional magnified insets. No body text, fake dimensions, gradients, color blocks, or full-product catalog view.",
  riskRules: [
    "放大细节区域必须对应真实可见结构，禁止虚构细节",
  ],
  allowedStyleIds: ["macro_chiaroscuro", "dark_technical", "premium_black"],
  variants,
  mandatoryVisualRules: [],
  avoidRules: [],
  sceneRules: [],
  lightingColorRules: [],
  productPlacementRules: [],
  copyRules: [],
};
