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
      "产品纹理填充画面 75%，从右下向右上；标题在左上极小；两个矩形光学插图对比相邻可见表面区域。",
  },
  {
    name: "Shadow Reveal",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "产品细节从黑暗中在中心右侧浮现，60% 裁切可见度；标题 sits 左下，黑色空间中无其他文字。",
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
  riskRules: [
    "仅显示产品 40-60%，必须戏剧性裁切",
    "仅允许标题，禁止正文、虚假尺寸、渐变、色块或完整产品目录视图",
    "放大细节区域必须对应真实可见结构，禁止虚构细节",
  ],
  allowedStyleIds: ["macro_chiaroscuro", "dark_technical", "premium_black"],
  variants,
  mandatoryVisualRules: [
    "背景：纯黑或极暗 matte (RGB 5-15)，无渐变、无纹理、无环境暗示",
    "照明：单一硬光源从镜头左侧约 45° 俯角；暖白 key light (3200K-4000K)；无 fill light，让阴影落入纯黑；强烈 specular highlights on metal edges；chiaroscuro 照明，非均匀 studio lighting",
    "景深：SHALLOW。焦平面极薄；背景和非焦区必须落入 soft blur (bokeh)",
    "产品处理：主体产品应被画面边缘部分裁切，不展示完整产品；展示 40-60% 产品，dramatically cropped",
    "细节插图：1-2 个圆形或矩形放大 callouts (各 15-20%)，展示真实表面纹理：tool marks、grain structure、cutting edge geometry、thread profile、surface finish；必须像光学显微摄影，非数字插画",
    "色彩：仅单色金属色调 — silver、steel gray、gunmetal、brass；仅允许一个 warm accent (copper 或 amber) 用于 highlight edge；禁止 blue、green、red",
    "文字：绝对极简。仅 1 个 headline (2-4 词, ALL CAPS, thin weight, 放在负空间)；禁止 subheadline、body text、bullet points、feature labels",
    "布局：产品占画面 70-80%，裁切；插图漂浮在剩余空间，带 thin hairline borders；禁止 decorative frames、shadow boxes、gradients behind insets",
    "产品必须有 subtle ground contact 或 grounded shadow，即使是裁切特写也要有存在感",
  ],
  avoidRules: [
    "禁止展示完整产品（扼杀 macro 感觉）",
    "禁止均匀 studio lighting（扼杀戏剧性氛围）",
    "禁止多色或色块",
    "禁止文字密集布局",
    "禁止虚假测量 callouts 或尺寸线",
    "禁止装饰元素、粒子、镜头光晕",
    "禁止渐变背景",
    "禁止信息密度过高",
  ],
  sceneRules: [
    "纯黑或极暗 void 背景",
    "无环境、无道具、无纹理",
    "像光学显微摄影",
  ],
  lightingColorRules: [
    "单一硬光源从镜头左侧约 45° 俯角",
    "暖白 key light (3200K-4000K)",
    "无 fill light，让阴影落入纯黑",
    "强烈 specular highlights on metal edges",
    "chiaroscuro 照明",
    "仅单色金属色调 + 一个 warm accent (copper/amber) 用于 highlight edge",
    "禁止 blue、green、red",
  ],
  productPlacementRules: [
    "展示 40-60% 产品，dramatically cropped",
    "主体产品被画面边缘部分裁切",
    "产品占画面 70-80%",
    "必须有 subtle ground contact 或 grounded shadow",
    "禁止悬浮",
  ],
  copyRules: [
    "密度：MINIMAL — headline only",
    "禁止 feature_points、technical_points、comparison_labels",
    "headline 是唯一的文字元素",
    "headline: 2-4 词, ALL CAPS, thin weight, 放在负空间",
  ],
};
