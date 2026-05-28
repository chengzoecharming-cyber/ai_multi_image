import type { SystemTemplate, TemplateVariant } from "../types";

// ── 环境场景图 — 系统模板配置 ──
// 功能定位：展示真实工业/加工环境，画面主角是应用场景本身（原材料、加工过程、工作环境），产品可以不出现在画面中。

const variants: TemplateVariant[] = [
  {
    name: "Single Environment Focus",
    layoutType: "large_headline_with_bottom_info_bar",
    layoutDirection:
      "画面主体是真实的工业/加工环境，占画面主体；顶部大标题统领场景主题。产品可以完全不出现，或仅作为环境元素的一部分。",
  },
  {
    name: "Multi-Scenario Grid",
    layoutType: "four_panel_application_grid",
    layoutDirection:
      "多场景网格展示不同应用场景/材料/工艺阶段，每格是独立的场景图+场景标签。",
  },
  {
    name: "Process Flow",
    layoutType: "top_headline_bottom_feature_bar",
    layoutDirection:
      "顶部标题说明工艺主题，画面主体展示加工/使用中的动态场景，底部 feature bar 展示工艺阶段标签。",
  },
];

export const tplEnvironment: SystemTemplate = {
  id: "tpl-environment-scene",
  name: "环境场景图",
  description:
    "展示真实工业/加工环境的场景图片。画面主角是应用场景本身，产品可以不出现在画面中。",
  imageType: "environment_scene",
  archetype: "environment_showcase",
  allowedLayoutTypes: [
    "large_headline_with_bottom_info_bar",
    "four_panel_application_grid",
    "top_headline_bottom_feature_bar",
  ],
  defaultCopyDensity: "medium",
  visualComplexity: "medium",
  informationDensity: "medium",
  copyProfile: "application_medium",
  visualIdentity:
    "Authentic industrial environment scene: workshop, machining process, raw materials. Environment itself is the hero; product may be absent.",
  colorDirection: "Warm industrial palette with natural workshop tones.",
  layoutNonNegotiables:
    "Environment must be the hero. Product may be absent or appear only as a small tool. No fake machinery brands.",
  riskRules: [
    "禁止生成虚假的数据表格、规格框或测量注释",
    "环境必须是真实可信的工业场景",
    "不虚构参数、不编造品牌",
  ],
  allowedStyleIds: ["dark_technical", "high_contrast_promo", "workshop_lifestyle", "cnc_machine_bed"],
  variants,
  mandatoryVisualRules: [],
  avoidRules: [],
  sceneRules: [],
  lightingColorRules: [],
  productPlacementRules: [],
  copyRules: [],
  userGoalConflictResolution:
    "用户输入含'主图'或'产品'时，模板用途优先：本模板生成的是环境场景图，展示行业/工艺/材料应用场景，不是产品主图。",
};
