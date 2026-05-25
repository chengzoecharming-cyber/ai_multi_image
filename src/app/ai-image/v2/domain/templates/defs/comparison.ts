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
  riskRules: [
    "禁止引用具体竞争品牌或产品",
    "禁止生成虚假性能数据、测试分数、对比数字或统计",
  ],
  allowedStyleIds: ["comparison_drama", "dark_technical", "high_contrast_promo"],
  variants,
  mandatoryVisualRules: [
    "两侧必须是同一产品类型，不能是不同产品",
    "左侧必须展示产品的真实问题/缺陷状态（如 chip welding、wear、dull finish、rough surface、poor cut quality），不是简单 desaturate",
    "右侧必须展示产品的理想/解决状态（如 smooth finish、iridescent coating、sharp edges、pristine surface、clean cut），与左侧形成真实状态差异",
    "右侧产品必须在视觉上 dominant（更大/更亮/更清晰/更饱和），具体比例由产品形状决定",
    "必须有明确的对比锚点（VS / 分割线 / 光效过渡），让用户一眼读出 THIS vs THAT",
    "状态指示符（红X / 绿✓ 或其他形式）是辅助元素，size 适中，不能覆盖产品或抢占视觉焦点",
    "背景必须有 subtle depth 感：推荐 faint radial gradient from center、subtle light streaks、soft vignette、或 subtle brushed texture；禁止纯平无层次",
    "产品必须有 subtle ground reflection 和 soft drop shadow，不能悬浮在背景上",
    "内容区块之间靠 generous spacing + subtle hairline divider 分隔，不推荐每个文字模块都加底色或 border",
    "标题区必须存在且作为视觉锚点：headline 是画面最高层级，字号/权重必须 dominant",
    "标题颜色应与产品色调形成呼应：同类产品可用类似色（analogous），突出差异可用对比色（complementary），禁止无关随机 accent",
  ],
  avoidRules: [
    "禁止引用真实竞品品牌、logo、可识别产品",
    "禁止假性能数据、假测试分数、假统计数字",
    "禁止两侧等亮、等饱和、等大",
    "禁止两侧使用不同背景色（必须统一深色背景）",
    "禁止纯平 flat 背景色（如纯 #000000 或纯 #1A1A1A 无渐变/无纹理）",
    "禁止产品悬浮无阴影/无反射",
    "禁止每个信息模块都加底色色块或生硬 border — 分隔主要靠 spacing",
    "禁止状态指示符过大或覆盖产品主体",
    "禁止底部功能条使用生硬直角或高饱和度边框",
    "禁止信息密度过高导致拥挤",
  ],
  sceneRules: [],
  lightingColorRules: [
    "统一深色背景，不分左右；但必须有 subtle depth：推荐 faint radial gradient（中心微亮向边缘渐暗）、subtle light streaks、或 soft vignette",
    "左侧：产品展示缺陷状态 — dimmer lighting、cool gray cast、desaturated；产品表面可带有真实问题痕迹（粗糙、积屑、磨损）",
    "右侧：产品展示理想状态 — bright warm key light 3200K-4000K、full saturation、tack-sharp、subtle warm glow/halo around product edges、可带有 iridescent coating 或 premium finish",
    "整体画面应有 unified ambient light 营造 cohesion，而不是左右完全割裂",
    "允许 subtle specular highlights on product surfaces 增加金属/涂层质感",
    "标题颜色应与产品或场景主色调呼应，形成色彩 cohesion",
  ],
  productPlacementRules: [
    "两侧产品必须保持相同结构、比例、孔位、螺纹、刃口",
    "右侧产品必须大于/亮于左侧，形成 subconscious superiority signal",
    "产品必须有 natural ground contact：subtle reflection plane + soft shadow beneath，增强真实感",
    "左侧产品应带有真实使用痕迹（wear、chip welding、rough texture），右侧产品应展示 pristine/ideal 状态",
  ],
  copyRules: [
    "密度可低可高：从 headline + 2 labels + 底部 2-3 个功能卡片，到 headline + subheadline + 2 comparison_labels + 3-4 feature_points + 3 bottom_info 均可接受",
    "headline 必须存在且作为顶部视觉锚点，ALL CAPS 或 bold weight",
    "comparison_labels 只能描述状态（如 Standard / Upgraded / Ordinary / Premium），不能引用真实品牌",
    "状态指示符可融入 label 中，size 适中不抢眼",
    "底部功能区为可选：可用简短文字、功能卡片、或无；若使用卡片，推荐 glassmorphism / subtle translucent 风格",
    "信息层级之间必须有 generous spacing，优先 negative space 而非填满画面",
  ],
};
