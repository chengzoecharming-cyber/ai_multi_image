import type { SystemTemplate, TemplateVariant } from "../types";

// ── 尺寸标注展示图 — 系统模板配置 ──

const variants: TemplateVariant[] = [
  {
    name: "Radial Dimensions",
    layoutType: "technical_callout_with_insets",
    layoutDirection:
      "产品在中心左侧 55% 比例；直线测量线辐射到右侧和顶部空白；标题左上；占位框保持对齐。",
  },
  {
    name: "Profile Sheet",
    layoutType: "exploded_layer_explanation",
    layoutDirection:
      "产品使用侧视/轮廓视图横贯中心；上方水平长度引导，下方直径/高度引导；标签使用破折号或通用名称。",
  },
  {
    name: "Isometric Markup",
    layoutType: "technical_callout_with_insets",
    layoutDirection:
      "产品等轴测 52% 比例；注释框围绕产品形成整洁周边，短不交叉引导线指向孔、边缘、槽或螺纹。",
  },
];

export const tplDimension: SystemTemplate = {
  id: "tpl-dimension-annotation",
  name: "尺寸标注展示图",
  description: "展示产品尺寸和结构标注。带测量示意线和标注框，但不生成真实数字。",
  imageType: "spec_info",
  archetype: "technical_breakdown",
  allowedLayoutTypes: [
    "technical_callout_with_insets",
    "exploded_layer_explanation",
  ],
  defaultCopyDensity: "medium",
  riskRules: [
    "禁止生成真实尺寸数值或具体测量",
    "尺寸值必须是占位符样式（空白、破折号或通用标签）",
    "注释线必须指向真实可见结构",
  ],
  allowedStyleIds: ["light_technical", "dark_technical", "clean_catalog"],
  variants,
  mandatoryVisualRules: [
    "标题区必须存在且作为视觉锚点：headline 简洁 technical 风格，位于画面合适位置",
    "标题颜色应与 annotation line 颜色协调（dark gray 或 subtle accent）",
    "背景：clean neutral white (#FFFFFF) 或 very light warm gray (#F5F5F0)；禁止渐变、纹理；感觉像 engineering drawing sheet",
    "产品处理：产品以 reveal key dimensions 的角度展示 — side profile view、top-down view、isometric (30°)；产品占画面 50-60%，居中或略左；完整产品可见，禁止裁切",
    "照明：even diffused studio light at 60° 俯角，soft fill；crisp edges with slight ground shadow；禁止戏剧性阴影、rim light；照明必须清晰 reveal 所有边缘用于标注",
    "景深：DEEP。整个产品完美清晰；禁止选择性对焦",
    "注释风格：THIN measurement lines (#333333 或 #666666, 1px weight) with simple arrowheads pointing to real product features: edges、holes、slots、threads、tips、lengths、diameters；线条必须 straight and precise，非 freehand",
    "尺寸值：ALL values 必须是 PLACEHOLDERS — blank spaces、dashes ('—')、或 generic labels ('LENGTH'、'DIAMETER'、'HEIGHT')；禁止真实数字、假测量、虚构尺寸",
    "尺寸面板：small rectangular boxes (#F0F0F0 fill, #CCCCCC border, 1px) 在每条测量线旁 containing placeholder label",
    "色彩：neutral white/gray 背景 + 产品自然色 + dark gray (#333333) 注释线和文字 + 一个 subtle accent (blue #2196F3 或 red #F44336) 仅用于 dimension leader lines",
    "文字：MINIMAL-MEDIUM。Headline + 3-4 short feature labels (描述标注内容: 'OVERALL LENGTH'、'THREAD SIZE' 等) + 3 bottom_info items；禁止 body paragraphs、comparison_labels",
    "布局：产品 center-left with annotation lines radiating outward；dimension labels 放在 clean empty space；线条禁止互相交叉",
    "产品必须有 subtle ground shadow 或 contact shadow，增强 engineering drawing 的真实感",
  ],
  avoidRules: [
    "禁止真实测量数字或具体尺寸",
    "禁止杂乱表格、数据网格或规格面板",
    "禁止深色背景或厚重面板",
    "禁止生活场景或 workshop 背景",
    "禁止戏剧性照明或有色滤片",
    "禁止产品裁切（必须展示完整产品用于标注）",
    "禁止重叠或交叉的注释线",
    "禁止假认证或规格声明",
    "禁止纯平无层次背景",
    "禁止信息密度过高",
  ],
  sceneRules: [
    "clean neutral white 或 very light warm gray 背景",
    "像 engineering drawing sheet",
    "无环境、无道具、无生活场景",
    "纯粹的 technical annotation 氛围",
  ],
  lightingColorRules: [
    "even diffused studio light at 60° 俯角",
    "soft fill",
    "crisp edges with slight ground shadow",
    "禁止戏剧性阴影、rim light",
    "neutral white/gray 背景",
    "dark gray (#333333) 注释线和文字",
    "subtle accent：blue #2196F3 或 red #F44336 仅用于 dimension leader lines",
    "标题颜色应与 annotation line 颜色协调",
  ],
  productPlacementRules: [
    "产品以 reveal key dimensions 的角度展示：side profile、top-down、isometric (30°)",
    "产品占画面 50-60%",
    "完整产品可见，禁止裁切",
    "必须有 subtle ground shadow 或 contact shadow",
    "禁止悬浮",
  ],
  copyRules: [
    "密度：MINIMAL-MEDIUM。Headline + 3-4 short labels 描述标注维度 + 3 bottom_info items",
    "labels 应命名维度类型，不 state value",
    "禁止 body paragraphs、comparison_labels",
    "placeholder values 必须是空白、破折号或通用标签",
    "禁止真实数字",
    "信息层级之间必须有 generous spacing",
  ],
};
