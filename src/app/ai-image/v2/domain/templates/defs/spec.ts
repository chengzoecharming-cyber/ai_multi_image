import type { SystemTemplate, TemplateVariant } from "../types";

// ── 规格参数技术图 — 系统模板配置 ──

const variants: TemplateVariant[] = [
  {
    name: "Right Spec Rail",
    layoutType: "technical_callout_with_insets",
    layoutDirection:
      "产品以等轴测视图位于左中；3-4 个占位规格面板在右侧导轨对齐；细引导线连接到可见产品特征。",
  },
  {
    name: "Blueprint Center",
    layoutType: "exploded_layer_explanation",
    layoutDirection:
      "产品在网格上方居中；标题左上；面板围绕产品在四个角，带精确不交叉的引导线。",
  },
  {
    name: "Top-Down Sheet",
    layoutType: "technical_callout_with_insets",
    layoutDirection:
      "产品以顶视或侧视 50% 比例横贯中部；技术面板形成底部行，subtle 引导线向上指向实际特征。",
  },
];

export const tplSpec: SystemTemplate = {
  id: "tpl-spec-technical",
  name: "规格参数技术图",
  description: "技术文档风格。冷色调背景，网格/坐标感，产品+规格面板。不生成真实数字，但保留规格框架感。",
  imageType: "spec_info",
  archetype: "technical_breakdown",
  allowedLayoutTypes: [
    "technical_callout_with_insets",
    "exploded_layer_explanation",
  ],
  defaultCopyDensity: "medium",
  visualComplexity: "complex",
  informationDensity: "high",
  copyProfile: "technical_medium",
  visualIdentity:
    "Technical documentation style on cool slate CAD-like grid, flat even overhead lighting, infinite depth of field, product in isometric/profile/top-down technical angle, clean placeholder panels and precise leader lines.",
  colorDirection:
    "Background #4A5568 to #5A6A7A with grid #E2E8F0 at 5-8% opacity; text/lines #FFFFFF or #E2E8F0; accent #00BCD4 or #2196F3 only; product natural colors.",
  layoutNonNegotiables:
    "No real numbers or invented specifications. Use placeholder-style labels and values only. Product full and sharp at 40-50%, technical panels on right, clean annotation lines to visible structures.",
  riskRules: [
    "禁止生成真实尺寸或具体数值测量",
    "规格字段必须是占位符样式标签",
  ],
  allowedStyleIds: ["light_technical", "dark_technical", "clean_catalog"],
  variants,
  mandatoryVisualRules: [
    "标题区必须存在且作为视觉锚点：headline 是画面最高层级，technical 风格，简洁有力",
    "标题颜色应与 tech blue 或 cool accent 协调",
    "背景：cool slate blue-gray (#4A5568 到 #5A6A7A) + faint technical grid at 5-8% opacity；网格线：white 或 light gray (#E2E8F0)，0.5px weight，40-50px spacing；感觉像 blueprint paper 或 CAD background",
    "产品处理：产品以 TECHNICAL ANGLE 展示 — isometric (30°)、profile side view、或 top-down technical view；产品占画面 40-50%，位于左侧或居中；完整产品可见，禁止裁切",
    "照明：FLAT、EVEN、TECHNICAL。漫射顶光 80° 俯角，四面强 fill；禁止戏剧性阴影、rim light、specular highlights；照明必须像 3D CAD render 或技术插画 — clean、clinical、shadowless",
    "景深：INFINITE。整个产品完美清晰；禁止 bokeh、选择性对焦",
    "技术面板：右侧必须包含 3-4 个结构化 info blocks，带 placeholder labels；格式：thin rectangular panels with hairline borders (#FFFFFF at 40% opacity)；每个 panel 有 label ('MATERIAL'、'TYPE'、'APPLICATION' 等) 和 placeholder value (dashes、blank lines 或 '—')；禁止真实数字、假数据",
    "注释风格：thin dashed 或 solid lines (#FFFFFF, 1px) 从 panels 指向对应产品特征；箭头：simple triangles",
    "色彩：cool slate 背景 + 产品自然色 + white/light gray 文字和线条 + 一个 subtle accent (tech blue #00BCD4 或 electric blue #2196F3) 仅用于 emphasis lines",
    "文字：MEDIUM 密度。Headline + subheadline + 3-4 technical_points (title + body 描述结构) + 3 bottom_info items；文案感觉 technical and precise",
    "布局：产品左/居中，技术面板右；clean horizontal alignment；网格背景在所有空白区域可见",
    "产品必须有 subtle ground contact 或 technical base shadow，增强 CAD render 感",
  ],
  avoidRules: [
    "禁止真实测量数字、尺寸或具体技术数据",
    "禁止假数据表或虚构规格",
    "禁止 warm colors、orange、red accent",
    "禁止戏剧性照明、阴影或 rim light",
    "禁止 lifestyle backgrounds 或 workshop environments",
    "禁止产品裁切或艺术角度",
    "禁止杂乱或重叠的文字面板",
    "禁止纯平无层次背景",
    "禁止信息密度过高导致无法快速扫读",
  ],
  sceneRules: [
    "cool slate CAD-like grid 背景",
    "像 blueprint paper 或工程图纸",
    "无环境、无道具、无生活场景",
    "纯粹的 technical documentation 氛围",
  ],
  lightingColorRules: [
    "FLAT、EVEN、TECHNICAL 照明",
    "漫射顶光 80° 俯角，四面强 fill",
    "禁止戏剧性阴影、rim light、specular highlights",
    "像 3D CAD render 或技术插画",
    "cool slate 背景 #4A5568 到 #5A6A7A",
    "网格线 #E2E8F0 at 5-8% opacity",
    "accent：tech blue #00BCD4 或 electric blue #2196F3 仅用于 emphasis lines",
    "标题颜色应与 tech blue 协调",
  ],
  productPlacementRules: [
    "产品以 technical angle 展示：isometric (30°)、profile side view、top-down",
    "产品占画面 40-50%",
    "完整产品可见，禁止裁切",
    "必须有 subtle ground contact 或 technical base shadow",
    "禁止悬浮",
  ],
  copyRules: [
    "密度：MEDIUM。Headline + subheadline + 3-4 technical_points (title + body 解释结构/细节) + 3 bottom_info items",
    "technical body text 必须描述物理特征，不是 benefits",
    "headline 简洁 technical 风格",
    "placeholder values 必须是 dashes、blank lines 或 '—'",
    "禁止真实数字、假数据",
    "信息层级之间必须有 generous spacing",
  ],
};
