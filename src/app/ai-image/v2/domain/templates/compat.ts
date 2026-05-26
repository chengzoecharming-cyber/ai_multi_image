import type { SystemTemplate, TemplateConfigV2, BackgroundType, LightingMood } from "./types";
import { getStyleWorldById } from "../style-worlds";
import type { VisualStyleId } from "../visual-styles";

// Local SW→VS fallback (avoid circular import from plan-brief)
const SW_TO_VS_FALLBACK: Record<string, VisualStyleId> = {
  clean_catalog: "clean_catalog",
  light_technical: "light_technical",
  dark_technical: "dark_technical",
  high_contrast_promo: "high_contrast_promo",
  macro_chiaroscuro: "macro_chiaroscuro",
  premium_black: "premium_black",
  comparison_drama: "comparison_drama",
  bundle_pop: "bundle_pop",
  workshop_lifestyle: "workshop_lifestyle",
  cnc_machine_bed: "cnc_machine_bed",
  worn_workbench: "workshop_lifestyle",
  assembly_station: "workshop_lifestyle",
  editorial_product_ad: "clean_catalog",
  gradient_modern_showcase: "clean_catalog",
  material_stage: "workshop_lifestyle",
  soft_premium: "premium_black",
  colorful_marketplace: "high_contrast_promo",
  minimal_no_text: "premium_black",
  diagram_light: "light_technical",
  scene_story: "workshop_lifestyle",
  cinematic_workshop: "workshop_lifestyle",
};

function getVisualStyleFallbackForStyleWorld(swId: string): VisualStyleId {
  return SW_TO_VS_FALLBACK[swId] || "clean_catalog";
}

/**
 * resolveTemplateFields — 向后兼容映射层。
 *
 * 如果 SystemTemplate 已包含 configV2（v2.1 新格式），
 * 则自动从 configV2 + StyleWorld 生成旧字段（visualIdentity / colorDirection / layoutNonNegotiables / mandatoryVisualRules / ...），
 * 保证下游（template-rules.ts、adapter.ts、plan-brief/builder.ts 等）零改动即可消费。
 *
 * 如果模板仍是旧格式（无 configV2），直接原样返回。
 */
export function resolveTemplateFields(st: SystemTemplate): SystemTemplate {
  if (!st.configV2) return st;

  const cfg = st.configV2;
  const primarySw = getStyleWorldById(cfg.preferredStyleWorlds[0]);

  // ── 1. 视觉身份 / 色彩方向 ──
  const visualIdentity =
    primarySw?.visualDirection ||
    st.visualIdentity ||
    `Intent: ${cfg.intent}. Product scale: ${cfg.productScaleStrategy}. Copy: ${cfg.defaultCopyMode}.`;

  const colorDirection =
    primarySw?.colorDirection ||
    st.colorDirection ||
    "Follow the selected style world's palette.";

  // ── 2. 布局硬约束 ──
  const layoutNonNegotiables =
    st.layoutNonNegotiables ||
    buildLayoutNonNegotiables(cfg);

  // ── 3. 视觉复杂度 / 信息密度 / copyProfile（旧枚举映射） ──
  const visualComplexity =
    st.visualComplexity || mapCopyModeToVisualComplexity(cfg.defaultCopyMode, cfg.defaultCreativeFreedom);

  const informationDensity =
    st.informationDensity || mapCopyModeToInformationDensity(cfg.defaultCopyMode);

  const copyProfile =
    st.copyProfile || mapCopyModeToCopyProfile(cfg.defaultCopyMode);

  // ── 4. 结构化规则（合并模板已有 + 自动生成） ──
  const mandatoryVisualRules = mergeRules(
    st.mandatoryVisualRules,
    buildMandatoryVisualRules(cfg, primarySw)
  );

  const avoidRules = mergeRules(
    st.avoidRules,
    buildAvoidRules(cfg, primarySw)
  );

  const sceneRules = mergeRules(
    st.sceneRules,
    buildSceneRules(cfg, primarySw)
  );

  const lightingColorRules = mergeRules(
    st.lightingColorRules,
    buildLightingColorRules(cfg, primarySw)
  );

  const productPlacementRules = mergeRules(
    st.productPlacementRules,
    buildProductPlacementRules(cfg)
  );

  const copyRules = mergeRules(
    st.copyRules,
    buildCopyRules(cfg)
  );

  const userGoalConflictResolution =
    cfg.conflictResolution || st.userGoalConflictResolution;

  // v2.1: 从 configV2 重新生成 allowedStyleIds，保证多样性
  const allowedStyleIds = (st.configV2
    ? buildAllowedStyleIds(st.configV2)
    : st.allowedStyleIds) as VisualStyleId[];

  return {
    ...st,
    visualIdentity,
    colorDirection,
    layoutNonNegotiables,
    visualComplexity,
    informationDensity,
    copyProfile,
    allowedStyleIds,
    mandatoryVisualRules,
    avoidRules,
    sceneRules,
    lightingColorRules,
    productPlacementRules,
    copyRules,
    userGoalConflictResolution,
  };
}

// ── 从 configV2 生成 fallback VisualStyleIds（确保 3 variants 多样性）──
function buildAllowedStyleIds(cfg: SystemTemplate["configV2"]): string[] {
  if (!cfg) return [];
  const mapped = cfg.preferredStyleWorlds
    .map((swId) => getVisualStyleFallbackForStyleWorld(swId as import("../style-worlds").StyleWorldId))
    .filter(Boolean);
  const unique = Array.from(new Set(mapped));
  if (unique.length >= 3) return unique;

  // 不足 3 个时按 intent 补充
  const extras: Record<string, VisualStyleId[]> = {
    hero_main: ["clean_catalog", "premium_black", "light_technical"],
    feature_explain: ["light_technical", "dark_technical", "clean_catalog"],
    brand_mood: ["premium_black", "macro_chiaroscuro", "clean_catalog"],
    usage_scene: ["workshop_lifestyle", "cnc_machine_bed", "clean_catalog"],
    detail_focus: ["macro_chiaroscuro", "premium_black", "clean_catalog"],
    comparison: ["comparison_drama", "high_contrast_promo", "clean_catalog"],
    promo_campaign: ["high_contrast_promo", "bundle_pop", "clean_catalog"],
    bundle_showcase: ["bundle_pop", "clean_catalog", "high_contrast_promo"],
    spec_dimension: ["light_technical", "dark_technical", "clean_catalog"],
    story_sequence: ["workshop_lifestyle", "clean_catalog", "light_technical"],
  };
  const fallbackPool = extras[cfg.intent] || ["clean_catalog", "light_technical", "premium_black"];
  for (const f of fallbackPool) {
    if (!unique.includes(f)) unique.push(f);
    if (unique.length >= 3) break;
  }
  return unique;
}

// ============================================================
// 辅助函数
// ============================================================

function buildLayoutNonNegotiables(cfg: SystemTemplate["configV2"]): string {
  const parts: string[] = [];
  if (!cfg) return "";
  parts.push(`Intent: ${cfg.intent}.`);
  parts.push(`Product scale strategy: ${cfg.productScaleStrategy}.`);
  parts.push(`Headline is ${cfg.headlineRequirement}.`);
  parts.push(`Creative freedom: ${cfg.defaultCreativeFreedom}.`);
  if (cfg.safetyRules.length > 0) {
    parts.push(`Safety: ${cfg.safetyRules.join("; ")}.`);
  }
  return parts.join(" ");
}

function mapCopyModeToVisualComplexity(
  mode: string,
  freedom: string
): SystemTemplate["visualComplexity"] {
  if (mode === "no_text" || mode === "headline_only") return "simple";
  if (mode === "promo_poster" || mode === "story_sequence") return "complex";
  if (freedom === "expressive") return "complex";
  if (freedom === "strict") return "simple";
  return "medium";
}

function mapCopyModeToInformationDensity(
  mode: string
): SystemTemplate["informationDensity"] {
  if (mode === "no_text" || mode === "headline_only") return "low";
  if (mode === "promo_poster" || mode === "story_sequence" || mode === "technical_annotations") return "high";
  return "medium";
}

function mapCopyModeToCopyProfile(
  mode: string
): SystemTemplate["copyProfile"] {
  const map: Record<string, SystemTemplate["copyProfile"]> = {
    no_text: "headline_only",
    headline_only: "headline_only",
    headline_labels: "headline_labels",
    feature_cards: "feature_medium",
    technical_annotations: "technical_medium",
    promo_poster: "promo_rich",
    story_sequence: "application_medium",
  };
  return map[mode] || "headline_only";
}

function mergeRules(
  existing: string[] | undefined,
  generated: string[]
): string[] {
  const set = new Set<string>();
  (existing || []).forEach((r) => set.add(r));
  generated.forEach((r) => set.add(r));
  return Array.from(set);
}

// ── 规则生成器 ──

function buildMandatoryVisualRules(
  cfg: SystemTemplate["configV2"],
  sw: ReturnType<typeof getStyleWorldById>
): string[] {
  const rules: string[] = [];
  if (!cfg) return rules;

  // 标题规则
  if (cfg.headlineRequirement === "required") {
    rules.push("标题区必须存在且作为视觉锚点：headline 是画面最高层级。");
  } else if (cfg.headlineRequirement === "optional") {
    rules.push("标题为 optional：可以有一个 headline，也可以完全无文字，由具体构图决定。");
  } else {
    rules.push("画面中禁止出现任何文字，纯视觉表达。");
  }

  // 产品比例
  const scaleMap: Record<string, string> = {
    dominant: "产品必须是画面中绝对主角，占主导地位，完整展示（除非 intent 为 detail_crop）。",
    balanced: "产品与信息/环境均衡分配画面空间。",
    supporting: "产品为配角，不得大于画面 20%，不得成为视觉焦点。",
    detail_crop: "产品可戏剧性裁切，仅展示 40-60% 以突出细节质感。",
    environment_first: "环境/场景是主角，产品可小可隐，不得喧宾夺主。",
  };
  rules.push(scaleMap[cfg.productScaleStrategy] || `Product scale: ${cfg.productScaleStrategy}.`);

  // 背景规则
  if (sw) {
    rules.push(`背景类型由 styleWorld "${sw.label}" 决定：${sw.typicalBackgrounds.join(", ")}。`);
    rules.push(`光源类型由 styleWorld "${sw.label}" 决定：${sw.typicalLighting.join(", ")}。`);
  }

  // 创意自由度
  if (cfg.defaultCreativeFreedom === "strict") {
    rules.push("strict 模式：规则优先，禁止偏离模板核心约束。背景、色彩、布局必须符合安全规则。");
  } else if (cfg.defaultCreativeFreedom === "expressive") {
    rules.push("expressive 模式：允许在保持产品结构和意图的前提下，探索更强的光影、材质、构图和背景变化。");
  } else {
    rules.push("balanced 模式：在规则框架内允许适度创意，保持产品清晰和信息可读。");
  }

  return rules;
}

function buildAvoidRules(
  cfg: SystemTemplate["configV2"],
  _sw: ReturnType<typeof getStyleWorldById>
): string[] {
  const rules: string[] = [];
  if (!cfg) return rules;

  if (cfg.defaultCreativeFreedom === "strict") {
    rules.push("禁止偏离模板核心约束的背景、色彩或布局。");
    rules.push("禁止过度装饰、粒子、镜头光晕或戏剧性效果（除非 styleWorld 明确允许）。");
  }

  if (cfg.productScaleStrategy === "dominant") {
    rules.push("禁止产品悬浮无 shadow 或 ground contact。");
    rules.push("禁止多产品或产品变体同框（套装模板除外）。");
  }

  if (cfg.headlineRequirement === "none") {
    rules.push("禁止任何文字出现在画面中。");
  }

  rules.push("禁止假数据、假规格、假测量。");
  rules.push("禁止引用真实竞品品牌、logo、可识别产品。");

  return rules;
}

function buildSceneRules(
  cfg: SystemTemplate["configV2"],
  sw: ReturnType<typeof getStyleWorldById>
): string[] {
  const rules: string[] = [];
  if (!cfg) return rules;

  if (sw) {
    const bgMap: Record<string, string> = {
      pure_white: "纯白背景，干净 clinical，无环境暗示。",
      light_neutral: "浅中性灰/米色背景，柔和温暖。",
      soft_gradient: "柔和渐变背景，增加深度但不抢戏。",
      deep_void: "深黑/深灰 void，无环境、无道具、无纹理。",
      warm_studio: "暖色调 studio 环境，舒适、亲和。",
      cool_studio: "冷色调 studio 环境，科技、理性。",
      industrial_environment: "真实工业环境，有使用痕迹和氛围。",
      material_surface: "真实材质台面，产品 grounded 于具体表面。",
      geometric_blocks: "几何色块背景，有图形感和结构。",
      editorial_negative_space: "编辑留白背景，大量负空间，产品像艺术品。",
      cinematic_dark: "电影感暗调背景，戏剧性光源和纵深。",
      colorful_flat: "明快纯色背景，年轻活力。",
      blueprint_grid: "蓝图网格背景，技术文档感。",
      bokeh_scene: "虚化场景背景，有深度感和环境氛围。",
    };
    sw.typicalBackgrounds.forEach((bg: BackgroundType) => {
      if (bgMap[bg]) rules.push(bgMap[bg]);
    });
  }

  // intent 级别的场景规则
  const intentSceneMap: Record<string, string[]> = {
    hero_main: ["背景必须衬托产品，不能分散注意力。"],
    feature_explain: ["环境/背景必须支持信息可读性，不能和信息打架。"],
    detail_focus: ["无环境、无道具、无纹理，焦点完全在材质细节上。"],
    usage_scene: ["环境必须有真实使用痕迹，不能 sterile 或过度美化。"],
    comparison: ["两侧必须在统一背景氛围下对比，禁止左右背景割裂。"],
    spec_dimension: ["纯粹 technical/documentation 氛围，无生活场景。"],
    promo_campaign: ["高能量、高对比，无环境元素、无生活场景。"],
    brand_mood: ["氛围优先，产品融入整体视觉情绪中。"],
    bundle_showcase: ["专业产品目录的组合展示感，无环境。"],
    story_sequence: ["叙事感，有时间和情境的流动。"],
  };

  const intentScenes = intentSceneMap[cfg.intent];
  if (intentScenes) rules.push(...intentScenes);

  return rules;
}

function buildLightingColorRules(
  cfg: SystemTemplate["configV2"],
  sw: ReturnType<typeof getStyleWorldById>
): string[] {
  const rules: string[] = [];
  if (!cfg) return rules;

  if (sw) {
    const lightMap: Record<string, string> = {
      soft_diffused: "柔和漫射光，均匀温暖，适合 clean/catalog/gradient 风格。",
      even_technical: "均匀 technical 照明，flat even，适合 spec/diagram 风格。",
      dramatic_key_rim: "戏剧性 key light + rim light，适合 premium/macro/brand 风格。",
      warm_ambient: "暖环境光，适合 lifestyle/workshop/scene 风格。",
      hard_chiaroscuro: "硬光 chiaroscuro，强烈明暗对比，适合 macro/detail 风格。",
      flat_cad: "flat CAD 式照明，无阴影，适合 technical/diagram 风格。",
      editorial_natural: "编辑自然光，柔和有方向，适合 editorial/gradient 风格。",
      promo_spotlight: "促销聚光灯，强烈明暗，适合 promo/marketplace 风格。",
      cinematic_mixed: "电影混合光源，戏剧性+环境光，适合 cinematic/scene 风格。",
    };
    sw.typicalLighting.forEach((lt: LightingMood) => {
      if (lightMap[lt]) rules.push(lightMap[lt]);
    });
  }

  // intent 级别灯光规则
  if (cfg.intent === "hero_main") {
    rules.push("产品必须被清晰照亮，禁止过暗或方向不自然的阴影。");
  }
  if (cfg.intent === "detail_focus") {
    rules.push("光源必须突出材质纹理和表面细节。");
  }

  return rules;
}

function buildProductPlacementRules(
  cfg: SystemTemplate["configV2"]
): string[] {
  const rules: string[] = [];
  if (!cfg) return rules;

  // v2.1: scale strategy 按 intent 区分，避免 "完整展示" 与 "dramatic crop" 冲突
  const intent = cfg.intent;
  const strategy = cfg.productScaleStrategy;

  const intentScaleMap: Record<string, Record<string, string>> = {
    hero_main: {
      dominant: "产品完整展示，占画面主导地位，居中或按版式规则摆放。禁止戏剧性裁切。",
      balanced: "产品与信息均衡，完整展示，位置由版式决定。",
      supporting: "产品完整展示，但不得大于画面 35%，不得位于正中心。",
      detail_crop: "产品主体完整，但允许局部放大突出关键特征（如倒角、孔位）。",
      environment_first: "产品完整展示于环境场景中，必须是环境的一部分但不失主体地位。",
    },
    feature_explain: {
      dominant: "产品完整展示，占画面 40-55%，留出右侧/下方空间给信息卡片。",
      balanced: "产品与 feature 卡片均衡排布，产品完整展示。",
      supporting: "产品完整展示，但缩小至 25-30%，让 feature 卡片主导阅读。",
      detail_crop: "产品允许局部特写（展示 50-70%），配合箭头/标注线指向被说明部位。",
      environment_first: "产品完整展示于使用环境中，feature 信息以浮层或侧边栏呈现。",
    },
    detail_focus: {
      dominant: "产品戏剧性裁切（展示 40-60%），强调局部质感与纹理，允许非完整展示。",
      balanced: "产品局部特写（展示 50-70%），配合微距景深效果。",
      supporting: "产品仅展示 20-30% 的标志性局部，作为视觉点缀。",
      detail_crop: "产品戏剧性裁切（展示 30-50%），强调单一特征（如孔洞边缘、表面纹理）。",
      environment_first: "产品局部与环境融合，展示 30-50%，环境氛围优先。",
    },
    brand_mood: {
      dominant: "产品完整展示，占画面 30-40%，氛围与光影是主导。",
      balanced: "产品与品牌氛围均衡，完整展示但不过大。",
      supporting: "产品完整展示但缩小（15-25%），让情绪/氛围占据主导。",
      detail_crop: "产品局部裁切（展示 40-60%），融入情绪化光影。",
      environment_first: "产品 optional，若出现必须是环境叙事的一部分。",
    },
    usage_scene: {
      dominant: "产品完整展示于场景中心，占画面 25-35%，场景提供上下文但不喧宾夺主。",
      balanced: "产品与使用场景均衡，产品完整展示。",
      supporting: "产品完整展示但缩小（15-25%），场景叙事主导。",
      detail_crop: "产品局部特写（展示 40-60%）嵌入场景，强调使用中的关键接触面。",
      environment_first: "产品 optional 或仅局部暗示，场景本身是主角。",
    },
    comparison: {
      dominant: "两侧产品均完整展示，各占半幅 35-45%，对比清晰。",
      balanced: "两侧产品完整展示，大小一致，信息对称。",
      supporting: "两侧产品缩小至 25-30%，为底部对比条留出空间。",
      detail_crop: "两侧产品均允许局部裁切（展示 50-60%），但裁切方式必须对称。",
      environment_first: "两侧产品融入各自场景环境，完整展示但受场景制约。",
    },
    promo_campaign: {
      dominant: "产品完整展示，占画面 35-45%，促销信息围绕产品排布。",
      balanced: "产品与促销信息均衡，产品完整展示。",
      supporting: "产品完整展示但缩小（20-30%），让促销标语和氛围主导。",
      detail_crop: "产品戏剧性裁切（展示 40-60%），制造视觉冲击力配合促销氛围。",
      environment_first: "产品融入促销场景（如展台、舞台），完整展示但受场景框架约束。",
    },
    bundle_showcase: {
      dominant: "多件产品完整展示，主产品占 25-35%，配件环绕排列。",
      balanced: "产品组与信息均衡，所有产品完整可见。",
      supporting: "产品组缩小（15-25%），为 bundle 优势说明留出主导空间。",
      detail_crop: "主产品允许局部特写（展示 50-60%），配件完整展示作为陪衬。",
      environment_first: "产品组置于场景环境中，完整展示但受场景叙事支配。",
    },
    spec_dimension: {
      dominant: "产品完整展示，占画面 40-50%，规格标注环绕排布。",
      balanced: "产品与尺寸图/标注均衡，产品完整展示。",
      supporting: "产品缩小至 25-30%，让技术图纸和尺寸标注主导。",
      detail_crop: "产品局部放大（展示 50-70%），配合关键尺寸标注线。",
      environment_first: "产品完整展示于技术场景中（如测试台、测量环境）。",
    },
    story_sequence: {
      dominant: "产品完整展示于叙事场景中，占画面 25-35%。",
      balanced: "产品与叙事元素均衡，产品完整展示。",
      supporting: "产品缩小（15-25%），叙事进程和场景变化主导。",
      detail_crop: "产品局部特写（展示 40-60%）穿插于叙事序列中。",
      environment_first: "产品 optional 或局部暗示，场景叙事是绝对主角。",
    },
  };

  const intentMap = intentScaleMap[intent];
  if (intentMap && intentMap[strategy]) {
    rules.push(intentMap[strategy]);
  } else {
    // fallback generic map
    const genericScaleMap: Record<string, string> = {
      dominant: "产品完整展示，占画面主导地位。",
      balanced: "产品与信息/环境均衡，位置由版式决定。",
      supporting: "产品不得大于画面 20%，不得位于正中心。",
      detail_crop: "产品可戏剧性裁切，展示 40-60%，强调局部质感。",
      environment_first: "产品 optional，若出现必须是环境的一部分，不得喧宾夺主。",
    };
    rules.push(genericScaleMap[strategy] || `Product placement: ${strategy}.`);
  }

  rules.push("产品必须有 grounded contact：subtle shadow、reflection 或 material surface contact，禁止悬浮。");

  if (cfg.defaultCreativeFreedom === "strict") {
    rules.push("strict 模式下产品位置和角度必须保守、标准、可预测。");
  } else if (cfg.defaultCreativeFreedom === "expressive") {
    rules.push("expressive 模式下允许 dynamic angle、partial crop、或非标准构图，只要产品结构清晰可辨。");
  }

  return rules;
}

function buildCopyRules(
  cfg: SystemTemplate["configV2"]
): string[] {
  const rules: string[] = [];
  if (!cfg) return rules;

  const modeMap: Record<string, string> = {
    no_text: "密度：ZERO。画面中完全禁止任何文字。",
    headline_only: "密度：MINIMAL。仅 1 个 headline（2-5 词），可选 small size。",
    headline_labels: "密度：LOW。Headline + 2-3 个短 labels。",
    feature_cards: "密度：MEDIUM。Headline + 3-4 feature points（title + short body）。",
    technical_annotations: "密度：MEDIUM。Headline + placeholder labels + technical notes，禁止真实数字。",
    promo_poster: "密度：RICH。Headline + subheadline + core claim + 3-4 feature points + bottom info。",
    story_sequence: "密度：MEDIUM-RICH。Headline + narrative labels + progression cues。",
  };
  rules.push(modeMap[cfg.defaultCopyMode] || `Copy mode: ${cfg.defaultCopyMode}.`);

  if (cfg.headlineRequirement === "required") {
    rules.push("headline 必须存在且作为视觉锚点。");
  } else if (cfg.headlineRequirement === "optional") {
    rules.push("headline 为 optional，不是强制。");
  } else {
    rules.push("画面中禁止任何文字。");
  }

  rules.push("信息层级之间必须有 generous spacing，优先 negative space 而非填满画面。");

  return rules;
}
