import type { SystemTemplate, TemplateVariant } from "../types";

// ── 白底主图 — 系统模板配置 ──

const variants: TemplateVariant[] = [
  {
    name: "Centered Catalog",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "产品居中占 75-85% 画幅，完整展示无裁切；标题在上方或下方三分之一，2-3 个短标签在产品下方或侧面整齐排列；纯白/极浅灰背景，无渐变无纹理。",
  },
  {
    name: "Offset Thumbnail",
    layoutType: "hero_left_text_right_product",
    layoutDirection:
      "产品略偏右占 75% 比例，完整展示；标题在左上负空间，2-3 个短标签沿左侧边缘垂直堆叠；纯白/极浅灰背景。",
  },
  {
    name: "Low Reflection",
    layoutType: "premium_center_product_minimal_text",
    layoutDirection:
      "产品略低于中心占 72% 比例，底部有柔和反射；标题在下三分之一，2-3 个紧凑标签对齐在反射上方；纯白/极浅灰背景。",
  },
];

export const tplHero: SystemTemplate = {
  id: "tpl-white-bg-hero",
  name: "白底主图",
  description: "Amazon / Temu 平台主图。整体白色/浅灰背景，产品占画面主体，文案精简干净。",
  imageType: "ecommerce_hero",
  archetype: "hero_feature",
  allowedLayoutTypes: [
    "premium_center_product_minimal_text",
    "hero_left_text_right_product",
  ],
  defaultCopyDensity: "minimal",
  riskRules: [
    "产品边缘不得裁切",
    "仅允许一个简洁标题 + 2-3 个短标签",
    "禁止使用面板、底部栏、网格、装饰框、徽章或环境元素",
  ],
  allowedStyleIds: ["clean_catalog", "light_technical", "premium_black"],
  variants,
  mandatoryVisualRules: [
    "背景必须为纯白色 (#FFFFFF) 或极浅中性灰 (#F5F5F5 到 #F8F8F8)；禁止渐变、纹理、环境暗示、有色 cast",
    "产品必须完整展示，不得裁切边缘、尖端或把手",
    "产品占画面 70-85%，居中或略偏；产品是画面中除文字外的唯一视觉元素",
    "照明：柔和漫射顶光约 60° 俯角，右前方低强度 fill light 消除硬阴影；禁止戏剧性侧光、rim light、有色滤片",
    "景深：DEEP，整个产品从前到后都清晰锐利；禁止浅景深、选择性对焦、散景",
    "反射：产品正下方有 subtle ground reflection，透明度 15-25%；禁止镜面反射、悬浮阴影",
    "色彩：仅使用产品自然金属/材质色；禁止 accent color、色块、渐变叠加",
    "文字：极简但清晰。仅 1 个 headline (2-5 词, ALL CAPS, bold sans-serif, 位于上或下三分之一) + 2-3 个非常短的 feature labels (单字或 2 词短语, 小字号, 在产品旁水平排列或垂直堆叠)",
    "布局：单产品居中构图；禁止 side panels、bottom bars、multi-column grids、decorative frames",
    "产品必须有 subtle ground reflection 和 soft shadow beneath，增强真实存在感，禁止悬浮",
  ],
  avoidRules: [
    "禁止任何非纯白/极浅灰的背景",
    "禁止有色 rim light、粒子、镜头光晕或戏剧性效果",
    "禁止裁切产品边缘",
    "禁止深色面板、有色色块或渐变背景",
    "禁止文字拥挤或覆盖产品",
    "禁止多产品或产品变体同框",
    "禁止过暗或方向不自然的阴影",
    "禁止纯平无层次背景",
    "禁止信息密度过高",
  ],
  sceneRules: [
    "背景必须 read as 'nothing there' — clean, clinical, empty space",
    "无环境元素、无道具、无装饰",
    "产品像放在无限白色空间中",
  ],
  lightingColorRules: [
    "柔和漫射顶光约 60° 俯角",
    "右前方低强度 fill light 消除硬阴影",
    "阴影必须柔和、自然，直接落在产品正下方或略偏后",
    "无戏剧性侧光、rim light、有色滤片",
    "仅使用产品自然材质色",
  ],
  productPlacementRules: [
    "产品必须完整展示，不得裁切",
    "产品占画面 70-85%，居中或略偏",
    "产品有 subtle ground reflection 和 soft shadow beneath",
    "禁止悬浮",
  ],
  copyRules: [
    "密度：MINIMAL。仅 headline + 2-3 个短 labels",
    "禁止 subheadline、core_claim、feature body text、comparison_labels",
    "headline: 2-5 词, ALL CAPS, bold sans-serif",
    "feature labels: 单字或 2 词短语, 小字号",
  ],
};
