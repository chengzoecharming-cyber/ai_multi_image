import type { SystemTemplate, TemplateVariant } from "../types";

// ── 环境场景图 — 系统模板配置 ──
//
// 与 lifestyle_scene 的核心区别：
//   lifestyle：产品必须在场，环境为产品服务
//   environment：应用场景/加工对象/环境本身是主角，产品可以不出现在画面中

const variants: TemplateVariant[] = [
  {
    name: "Single Environment Focus",
    layoutType: "large_headline_with_bottom_info_bar",
    layoutDirection:
      "单一场景聚焦：画面主体是真实的工业/加工环境（如 CNC 机床、工作台、原材料、加工过程），占画面 60-80%；顶部大标题统领场景主题；底部信息栏可放置场景分类标签。产品可以完全不出现，或仅作为环境元素的一部分（如加工区域的工具）。",
  },
  {
    name: "Multi-Scenario Grid",
    layoutType: "four_panel_application_grid",
    layoutDirection:
      "多场景网格：2×2 网格展示不同应用场景/材料/工艺阶段，每格是独立的场景图+场景标签；顶部大标题统领全局。参考示例：铝型材、CNC 加工、铝合金零件、CNC 成品。每格聚焦该场景本身，产品可以不出现或作为配角。",
  },
  {
    name: "Process Flow",
    layoutType: "top_headline_bottom_feature_bar",
    layoutDirection:
      "加工流程展示：顶部标题说明工艺主题，画面主体展示加工/使用中的动态场景（切削、装配、测量），底部 feature bar 展示工艺阶段标签。焦点在工艺过程和原材料/半成品上，产品作为工具出现而非主角。",
  },
];

export const tplEnvironment: SystemTemplate = {
  id: "tpl-environment-scene",
  name: "环境场景图",
  description:
    "展示真实工业/加工环境的场景图片。画面主角是应用场景本身（原材料、加工过程、成品零件、工作环境），产品可以不出现在画面中。适用于展示行业场景、工艺流程、材料应用。",
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
    "Authentic warm industrial environment scene: CNC bed, workshop bench, raw materials, machining process, shallow bokeh background, warm 3000K-3500K ambient plus crisp key light. The environment itself is the hero; the product may be absent or play a supporting role.",
  colorDirection:
    "Warm amber #D4A574, workshop brown #8B6914, steel gray #708090, oxidized metal #B87333; text #FFFFFF with soft shadow; no cool blue/neon/pure black backgrounds.",
  layoutNonNegotiables:
    "Environment must be the hero at 60-80% frame. Use headline and 2-3 scene labels. The product may be absent or appear only as a small tool in the scene. No fake machinery brands or labels.",
  riskRules: [
    "禁止生成虚假的数据表格、规格框或测量注释",
    "环境必须是真实可信的工业场景，禁止 CG 感或过度美化",
  ],
  allowedStyleIds: ["dark_technical", "high_contrast_promo", "workshop_lifestyle", "cnc_machine_bed"],
  variants,
  mandatoryVisualRules: [
    "标题区必须存在且作为视觉锚点：headline 是画面最高层级，ALL CAPS 或 bold weight",
    "标题颜色应与场景主色调形成呼应：可用类似色或对比色，禁止无关随机 accent",
    "画面主角是应用场景/加工对象/环境本身，占画面 60-80%，必须是画面中最清晰、最有质感的元素",
    "环境必须有真实使用痕迹：metal shavings、oil stains、cutting fluid residue、scratch marks、worn surfaces、加工工件",
    "shallow to medium depth of field，背景可有自然虚化，但主体区域必须清晰锐利",
    "真实工业照明：机床工作灯、车间顶灯、切削火花等混合光源，色温偏冷或中性（4000K-6500K）",
    "允许金属/加工表面的高光反射和质感表现",
    "产品可以完全不出现；若出现，必须是环境的一部分（如加工中的工具、夹具中的配件），不能喧宾夺主",
    "内容区块之间靠 generous spacing + 负空间分隔，不依赖底色色块或 border",
  ],
  avoidRules: [
    "clean studio backgrounds or pure colors",
    "product as the hero — 产品不能是画面焦点",
    "product shown large and commanding",
    "product cropped or shown in extreme close-up as main subject",
    "exaggerated scenarios（如不可能发生的加工场景）",
    "text-heavy layouts or dense info panels placed over busy background",
    "禁止 sterile / overly clean 的环境（如全新未使用的设备、无痕迹的工作台）",
    "禁止产品悬浮无 shadow 或 ground contact",
    "禁止每个信息模块都加底色色块 — 分隔主要靠 generous spacing 和负空间",
    "禁止信息密度过高导致拥挤",
  ],
  sceneRules: [
    "authentic industrial environment — CNC machine bed, raw materials, work-in-progress parts, metal shavings, cutting tools, vise, assembly station",
    "environment must look REAL and USED, not staged or sterile",
    "visible workshop details: worn surfaces, oil stains, tool marks, clamps, rulers, coolant residue, raw material textures",
    "slight dust particles or metal shavings visible in light beam (subtle)",
    "scene feels like an active workspace — someone is currently working or just paused",
    "工作台/机床表面应有 authentic use marks：scratches、oil residue、metal dust、coolant spots、wear patterns",
    "原材料/工件应有真实加工痕迹：切削纹路、钻孔、倒角、表面处理质感",
  ],
  lightingColorRules: [
    "lighting: 真实工业混合光源 — 机床工作灯（cool white ~5000K-6500K）、车间环境灯、切削火花 warm highlights",
    "允许 cool/neutral color cast 体现工业环境的冷峻感",
    "color palette: steel gray (#708090), aluminum silver (#C0C0C0), coolant blue (#4A90D9), oxidized metal (#B87333), machine oil dark (#2F2F2F)",
    "金属表面应有真实的 specular highlights 和 reflections",
    "主体区域照明充足清晰，背景可自然虚化",
    "NO flat even lighting — 必须有光源方向和明暗层次",
    "允许 subtle lens flare 或 spark highlights 增加工业现场感",
    "标题颜色应与场景主色调呼应",
  ],
  productPlacementRules: [
    "产品 optional：可以完全不出现",
    "若出现，必须是环境的一部分：如夹在机床中的铣刀、放在工作台旁的测量工具、加工中的工件夹具",
    "产品不得大于画面的 15%，不得成为视觉焦点",
    "产品必须有 natural ground contact：subtle shadow beneath + 与环境表面的自然交互",
  ],
  copyRules: [
    "MEDIUM 密度为上限，优先 generous negative space",
    "headline 必须存在且作为顶部视觉锚点，ALL CAPS 或 bold weight",
    "场景标签 describe the scenario / material / process，not product features",
    "Headline + 2-4 scene_labels（title + short body describing WHAT scene / material / process is shown）+ optional bottom_info items",
    "NO dense feature panels, NO comparison_labels",
    "text placed in negative space（upper corners or bottom edge），never over busy background",
    "信息层级之间必须有 generous spacing，优先 negative space 而非填满画面",
  ],
  userGoalConflictResolution:
    "用户输入含'主图'或'产品'时，模板用途优先：本模板生成的是环境场景图，展示行业/工艺/材料应用场景，不是产品主图。画面主角是场景本身，产品可以完全不出现。",
};
