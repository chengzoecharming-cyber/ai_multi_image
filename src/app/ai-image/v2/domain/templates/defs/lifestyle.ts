import type { SystemTemplate, TemplateVariant } from "../types";

// ── 应用场景图 — 系统模板配置 ──

const variants: TemplateVariant[] = [
  {
    name: "Single Environment Hero",
    layoutType: "hero_left_text_right_product",
    layoutDirection:
      "单一场景主角：产品置于 believable industrial environment 中，占画面 35-45%；背景 shallow DOF 虚化且有 subtle depth cues（light falloff、soft vignette）；标题和短标签放在负空间，不覆盖 busy background。产品与环境的互动痕迹必须可见。",
  },
  {
    name: "Multi-Scenario Grid",
    layoutType: "four_panel_application_grid",
    layoutDirection:
      "多场景网格：2x2 或 3 格展示不同应用场景，每格含场景图+场景标签；顶部大标题统领全局；产品可在每个场景中以不同姿态出现，或一个主角产品+四周场景小图。每格环境必须有真实使用痕迹。",
  },
  {
    name: "Process Flow",
    layoutType: "diagonal_product_with_side_features",
    layoutDirection:
      "加工流程瞬间：捕捉产品正在加工/使用中的动态瞬间（切削、装配、测量）；产品清晰，背景有速度感或 motion blur；标题在负空间。环境必须有 authentic use traces。",
  },
];

export const tplLifestyle: SystemTemplate = {
  id: "tpl-lifestyle-scene",
  name: "应用场景 Lifestyle 图",
  description: "产品置于真实工作环境中。支持单一场景、多场景网格、动态流程三种形式。环境必须有真实使用痕迹，产品是绝对主角。",
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
    "Authentic warm industrial lifestyle scene: CNC bed, workshop bench, vise, metal shavings, worn surfaces, shallow bokeh background, product tack-sharp and brightest, warm 3000K-3500K ambient plus crisp key light.",
  colorDirection:
    "Warm amber #D4A574, workshop brown #8B6914, steel gray #708090, oxidized metal #B87333; text #FFFFFF with soft shadow; no cool blue/neon/pure black backgrounds.",
  layoutNonNegotiables:
    "Product full and sharp at 35-45% frame, off-center by rule of thirds. Use headline, 2-3 application labels, and bottom info. Environment must support product, not outshine it.",
  riskRules: [
    "环境不得分散产品注意力；产品必须是画面中最亮、最清晰的元素",
  ],
  allowedStyleIds: ["workshop_lifestyle", "cnc_machine_bed", "worn_workbench", "assembly_station"],
  variants,
  mandatoryVisualRules: [
    "标题区必须存在且作为视觉锚点：headline 是画面最高层级，ALL CAPS 或 bold weight",
    "标题颜色应与产品或环境主色调形成呼应：可用类似色或对比色，禁止无关随机 accent",
    "必须是 believable industrial environment，不是 studio product shot",
    "环境中必须有与产品使用直接相关的真实痕迹（metal shavings、oil stains、cutting fluid residue、scratch marks、worn surfaces、加工工件），暗示产品正在发挥作用",
    "shallow depth of field，background heavily blurred 且有 subtle depth cues：light falloff、soft vignette、tonal variation；禁止 uniform flat blur",
    "product in tack-sharp focus，必须是画面中最亮、最清晰的元素",
    "warm workshop lighting ~3000K-3500K",
    "no cool blue tones on product，no neon accents，no pure black backgrounds",
    "产品必须有 natural ground contact：subtle shadow beneath + soft reflection on workbench surface，禁止悬浮",
    "内容区块之间靠 generous spacing + 负空间分隔，不依赖底色色块或 border",
  ],
  avoidRules: [
    "clean studio backgrounds or pure colors",
    "even lighting across entire frame",
    "product cropped or shown in extreme close-up",
    "exaggerated scenarios (product doing impossible things)",
    "environment brighter or sharper than product",
    "text-heavy layouts or dense info panels placed over busy background",
    "cool blue/gray color cast on product",
    "禁止 sterile / overly clean 的环境（如全新未使用的设备、无痕迹的工作台、spotless surfaces）",
    "禁止纯平 uniform background blur 无 tonal variation 或 depth cues",
    "禁止产品悬浮无 shadow 或 ground contact",
    "禁止每个信息模块都加底色色块 — 分隔主要靠 generous spacing 和负空间",
    "禁止信息密度过高导致拥挤",
  ],
  sceneRules: [
    "authentic industrial environment — CNC machine bed, workshop bench with scattered tools, metal shavings, vise, or assembly station",
    "environment must look REAL and USED, not staged or sterile",
    "visible workshop details: worn surfaces, oil stains, tool marks, clamps, rulers, coolant residue",
    "slight dust particles or metal shavings visible in light beam (subtle)",
    "scene feels like someone just paused work",
    "环境应暗示产品的使用状态：如产品旁有加工中的工件、附近有使用痕迹、或产品有 subtle wear marks",
    "工作台/机床表面应有 authentic use marks：scratches、oil residue、metal dust、coolant spots、wear patterns",
    "背景虚化区域应有 subtle depth：distant bokeh circles、light falloff、soft vignette",
  ],
  lightingColorRules: [
    "background treatment: SHALLOW DEPTH OF FIELD, heavily blurred (bokeh f/1.8-f/2.8 level) 且有 subtle depth cues",
    "blur transition natural — closer elements slightly sharper, distant fully soft；blur 区域有 tonal variation，不是 uniform flat",
    "color palette: warm amber (#D4A574), workshop brown (#8B6914), steel gray (#708090), oxidized metal (#B87333)",
    "lighting: warm ambient workshop light (tungsten/LED mix, ~3000K-3500K) + crisp key light on product from upper-left",
    "product must catch more light than surroundings",
    "NO flat even lighting",
    "subtle warm rim light on product's top edge to separate from background",
    "允许 subtle specular highlights on product surface 增加金属/涂层质感",
    "标题颜色应与产品或环境主色调呼应",
  ],
  productPlacementRules: [
    "product shown in FULL, 35-45% of frame",
    "positioned slightly off-center (rule of thirds) 或 centered hero",
    "product is the hero, environment frames it",
    "产品必须有 natural ground contact：subtle shadow beneath + soft reflection on workbench surface",
    "产品应带有 subtle interaction with environment：如放在工件旁、夹具中、或加工表面上",
  ],
  copyRules: [
    "MINIMAL-MEDIUM 密度为上限，优先 generous negative space",
    "headline 必须存在且作为顶部视觉锚点，ALL CAPS 或 bold weight",
    "Headline + 2-3 short application_labels (title + short body describing WHERE and HOW product is used) + 3 bottom_info items",
    "application_labels describe the scenario, not just product features",
    "NO dense feature panels, NO comparison_labels",
    "text placed in negative space (upper corners or bottom edge), never over busy background",
    "信息层级之间必须有 generous spacing，优先 negative space 而非填满画面",
  ],
  userGoalConflictResolution:
    "用户输入含'主图'时，模板用途优先：本模板生成的是应用场景主视觉（lifestyle / usage scene），不是白底/纯色主图。产品必须置于 believable industrial environment 中。",
};
