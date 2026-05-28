import type { SystemTemplate, TemplateVariant } from "../types";

// ── 应用场景图 — 系统模板配置 ──

const variants: TemplateVariant[] = [
  {
    name: "Single Environment Hero",
    layoutType: "hero_left_text_right_product",
    layoutDirection:
      "单一场景主角：产品置于 believable industrial environment 中；背景 shallow DOF 虚化；标题和短标签放在负空间，不覆盖 busy background。",
  },
  {
    name: "Multi-Scenario Grid",
    layoutType: "four_panel_application_grid",
    layoutDirection:
      "多场景网格：2x2 或 3 格展示不同应用场景，每格含场景图+场景标签；顶部大标题统领全局。",
  },
  {
    name: "Process Flow",
    layoutType: "diagonal_product_with_side_features",
    layoutDirection:
      "加工流程瞬间：捕捉产品正在加工/使用中的动态瞬间；产品清晰，背景有速度感或 motion blur。",
  },
];

export const tplLifestyle: SystemTemplate = {
  id: "tpl-lifestyle-scene",
  name: "应用场景 Lifestyle 图",
  description: "产品置于真实工作环境中。支持单一场景、多场景网格、动态流程三种形式。",
  imageType: "lifestyle_scene",
  archetype: "application_scene",
  allowedLayoutTypes: [
    "hero_left_text_right_product",
    "four_panel_application_grid",
    "diagonal_product_with_side_features",
  ],
  defaultCopyDensity: "medium",
  visualComplexity: "medium",
  informationDensity: "medium",
  copyProfile: "application_medium",
  visualIdentity:
    "Authentic warm industrial lifestyle scene: CNC bed, workshop bench, vise, metal shavings, worn surfaces, shallow bokeh background, product tack-sharp and brightest, warm ambient plus crisp key light.",
  colorDirection:
    "Warm amber, workshop brown, steel gray, oxidized metal; text with soft shadow.",
  layoutNonNegotiables:
    "Product in believable industrial environment with real use traces. Environment supports product without stealing focus.",
  riskRules: [
    "必须是 believable industrial environment，不是 studio product shot",
    "环境中必须有与产品使用直接相关的真实痕迹",
  ],
  allowedStyleIds: ["workshop_lifestyle", "cnc_machine_bed", "worn_workbench", "assembly_station"],
  variants,
  mandatoryVisualRules: [],
  avoidRules: [],
  sceneRules: [],
  lightingColorRules: [],
  productPlacementRules: [],
  copyRules: [],
  userGoalConflictResolution:
    "用户输入含'主图'时，模板用途优先：本模板生成的是应用场景主视觉（lifestyle / usage scene），不是白底/纯色主图。产品必须置于 believable industrial environment 中。",
};
