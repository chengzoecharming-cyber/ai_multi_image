import type { PlanBrief, StyleStrategy, EmptyTemplateMode, EmptyTemplatePlanConfig, EmptyTemplatePlanType } from "./types";
import type { SavedTemplate } from "../templates";
import type { V2DetailType } from "../detail-assets";
import { getSystemTemplateProfile } from "../templates";
import { DETAIL_ASSET_TO_IMAGE_TYPE, IMAGE_TYPE_TO_ALLOWED_LAYOUTS, IMAGE_TYPE_TO_DEFAULT_COPY_DENSITY } from "../taxonomy";
import type { VisualStyleId } from "../visual-styles";

/**
 * 默认视觉风格策略：从候选池选出 3 个不同风格。
 */
function defaultStyleStrategy(pool: string[]): StyleStrategy {
  return {
    mode: "pick_from_pool",
    pool: pool as StyleStrategy["pool"],
    count: 3,
  };
}

function freeStyleStrategy(): StyleStrategy {
  return {
    mode: "free",
    pool: [],
    count: 3,
  };
}

// ============================================================
// 空模板 Light/Dark 推断引擎
// ============================================================

const LIGHT_KEYWORDS = [
  "白底", "干净", "简约", "清新", "家居", "白色", "浅色", "明亮",
  "clean", "white", "light", "bright", "minimal", "fresh", "home",
];

const DARK_KEYWORDS = [
  "科技", "力量", "高端", "工业", "暗色", "黑色", "深色", "暗调",
  "tech", "power", "premium", "industrial", "dark", "black", "night",
  "machining", "cnc", "cutting", "metal", "steel", "carbide",
];

const DARK_MATERIALS = [
  "metal", "steel", "carbide", "titanium", "aluminum", "iron",
  "chrome", "nickel", "carbon", " alloy",
];

const DARK_CATEGORIES = [
  "drill", "mill", "cutter", "bit", "tool", "blade", "gear",
  "flange", "bearing", "fastener", "screw", "bolt", "nut",
  "cnc", "machined", "industrial", "hardware",
];

/**
 * 从产品名称/goal 中提取关键词进行 Light/Dark 评分。
 * 这是简化版推断引擎（MVP），后续可接入 LLM 视觉分析。
 */
function inferEmptyTemplateMode(
  userGoal: string = "",
  productContext?: { productName?: string; productType?: string }
): EmptyTemplateMode {
  const text = `${userGoal} ${productContext?.productName || ""} ${productContext?.productType || ""}`.toLowerCase();

  let lightScore = 0;
  let darkScore = 0;

  // 关键词匹配
  for (const kw of LIGHT_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) lightScore += 2;
  }
  for (const kw of DARK_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) darkScore += 2;
  }

  // 材质推断
  for (const mat of DARK_MATERIALS) {
    if (text.includes(mat)) darkScore += 1.5;
  }

  // 产品类别推断
  for (const cat of DARK_CATEGORIES) {
    if (text.includes(cat)) darkScore += 1;
  }

  // 判断
  if (darkScore > lightScore + 1.5) {
    return "dark";
  }
  if (lightScore > darkScore + 1.5) {
    return "light";
  }
  return "mixed";
}

/**
 * 根据推断模式，为 3 个方案分配 type + mode + style。
 *
 * 空模版 3 方案 = 主图 / 详情图 范畴，聚焦电商营销直接转化：
 * 方案 A: platform_hero — 第一眼主图（冲击力最大化）
 * 方案 B: feature_showcase — 卖点爆破图（信息+美学平衡）
 * 方案 C: info_dense — 高密度信息板（参数/优势/信任状全开）
 *
 * 注意：应用场景 lifestyle 图已提取为独立系统模板 tpl-lifestyle-scene，
 *       不在空模版中混排。
 */
function buildEmptyTemplatePlanConfigs(
  mode: EmptyTemplateMode
): EmptyTemplatePlanConfig[] {
  const lightStyles: VisualStyleId[] = [
    "empty_light_clean",
    "empty_light_bold",
    "empty_light_technical",
  ];
  const darkStyles: VisualStyleId[] = [
    "empty_dark_tech",
    "empty_dark_luxury",
    "empty_dark_dynamic",
  ];

  // 分配函数：确保 3 个方案用 3 个不同风格
  const assign = (
    type: EmptyTemplatePlanConfig["type"],
    planMode: "light" | "dark",
    styleIndex: number,
    layoutType: string,
    description: string
  ): EmptyTemplatePlanConfig => ({
    type,
    mode: planMode,
    styleId: planMode === "light" ? lightStyles[styleIndex] : darkStyles[styleIndex],
    layoutType,
    description,
  });

  if (mode === "dark") {
    return [
      assign("platform_hero", "dark", 0, "premium_center_product_minimal_text",
        "第一眼主图：产品占画面 65-80%，大到近乎出界；深色背景+强烈轮廓光+极简超大标题；拒绝居中对称，产品必须倾斜/旋转/打破画面平衡，有侵略性张力"),
      assign("feature_showcase", "dark", 1, "hero_right_product_left_features",
        "卖点爆破图：产品占 40-50%，深色玻璃态/毛玻璃信息卡片环绕产品；3-4 个卖点以几何区块+单色图标组织；信息丰富但层次分明"),
      assign("info_dense", "dark", 2, "large_headline_with_bottom_info_bar",
        "高密度信息板：顶部超大标题+产品主体 45-55%+底部信息条贯穿；同时展示核心参数、优势对比条、信任徽章；像一张完整的产品海报，信息满载但不杂乱"),
    ];
  }

  if (mode === "light") {
    return [
      assign("platform_hero", "light", 0, "premium_center_product_minimal_text",
        "第一眼主图：产品占画面 65-80%，大到近乎出界；浅色背景+强烈方向投影+极简超大标题；拒绝居中对称，产品必须倾斜/旋转/打破画面平衡，有侵略性张力"),
      assign("feature_showcase", "light", 1, "hero_right_product_left_features",
        "卖点爆破图：产品占 40-50%，浅色卡片式信息面板环绕；3-4 个卖点以几何区块+深色图标组织；信息清晰可信，有目录级精致感"),
      assign("info_dense", "light", 2, "large_headline_with_bottom_info_bar",
        "高密度信息板：顶部超大标题+产品主体 45-55%+底部信息条贯穿；同时展示核心参数、优势对比条、信任徽章；像一张完整的产品海报，信息满载但呼吸感充足"),
    ];
  }

  // Mixed：默认 Dark 略多（工业品场景倾向）
  return [
    assign("platform_hero", "dark", 0, "premium_center_product_minimal_text",
      "第一眼主图：深色科技风，产品 65-80% 大到出界，强烈轮廓光，拒绝对称，倾斜构图有侵略性"),
    assign("feature_showcase", "light", 1, "hero_right_product_left_features",
      "卖点爆破图：浅色 clean 风，产品 40-50%，卡片式卖点环绕，信息清晰易读"),
    assign("info_dense", "dark", 2, "large_headline_with_bottom_info_bar",
      "高密度信息板：深色背景，顶部标题+产品主体+底部信息条全开，参数/优势/信任状密集呈现"),
  ];
}

// ============================================================
// 空模板通用约束
// ============================================================

const EMPTY_TEMPLATE_RISK_RULES: string[] = [
  "产品必须完整可见，边缘不得裁切",
  "不得虚构技术参数（硬度、转速、扭矩、材质等级、涂层类型、寿命、保修、价格、认证）",
  "英文文案必须简洁有力，主标题不超过 6 个词，卖点描述不超过 15 个词",
  "产品必须占据画面至少 40% 区域（Hero 方案必须 65-80%）",
  "禁止元素贴边（产品、文字、图标均需留 5% 以上呼吸空间）",
  "每图不超过 3 种主色（背景色 + 文字色 + 强调色）",
];

const EMPTY_TEMPLATE_MANDATORY_RULES: string[] = [
  "必须有明确的视觉锚点（超大标题、超大产品、或强烈色彩对比）",
  "必须有大小对比（主标题字号至少是副标题的 3 倍）",
  "必须有留白（画面边缘至少 5% 呼吸空间，标题周围至少 10%）",
  "背景必须有微妙纹理或渐变（禁止纯平色）",
  "产品必须有材质质感表现（金属反光、塑料哑光、玻璃折射等）",
  "【Plan A Hero 专属】产品必须打破画面平衡：倾斜、旋转、对角线放置、部分出界，绝不允许居中对称",
  "【Plan A Hero 专属】产品必须有强烈方向投影或轮廓光，形成与背景的锐度分离",
  "【Plan A Hero 专属】标题必须是画面第二大视觉元素，字号大到占据画面宽度的 40-60%",
  "【Plan A Hero 专属】必须有至少一个打破常规的视觉元素：飞溅的金属屑、放射光线、速度线、或几何色块穿插",
];

const EMPTY_TEMPLATE_AVOID_RULES: string[] = [
  "禁止文字堆叠成列表（不允许左对齐文字一行一行往下排）",
  "禁止廉价 clipart 或 emoji 风格图标",
  "禁止高饱和度冲突色同时大面积使用（如红+绿、紫+黄）",
  "禁止产品与背景融为一体（必须有清晰边缘分离）",
  "禁止所有元素对称居中排列（必须有错落和动势）",
  "【Plan A Hero 专属】禁止产品端端正正居中摆放，像证件照",
  "【Plan A Hero 专属】禁止产品过小（<50% 画面）导致画面空洞",
  "【Plan A Hero 专属】禁止三个卖点卡片整齐排列在底部，像超市促销单",
  "【Plan A Hero 专属】禁止背景纯平无纹理，像 PPT 默认背景",
  "【Plan C InfoDense 专属】禁止信息堆叠成无层级的大段文字",
  "【Plan C InfoDense 专属】禁止信息密度高到无法快速扫读",
];

const EMPTY_TEMPLATE_COPY_RULES: string[] = [
  "主标题：2-4 个英文大写词，如 SMOOTH CHIP FLOW、DRY CUT ALUMINUM",
  "副标题：1 行，8-15 个英文词，补充上下文",
  "卖点标题：2-3 个英文大写词",
  "卖点描述：1 行，8-12 个英文词",
  "Feature 卖点必须配单色图标（线框或实心风格统一）",
  "【Plan C InfoDense 专属】允许数据可视化标签（如 3X FASTER、50% LONGER），但必须用视觉区块组织",
  "【Plan C InfoDense 专属】底部信息条必须包含：1 个核心参数条 + 2-3 个信任徽章 + 1 个价值主张",
];

// ============================================================
// PlanBrief builders
// ============================================================

/**
 * 构建空模板 PlanBrief。
 *
 * 空模板是"智能开放生成模式"：
 * - 自动推断 Light/Dark 倾向，但不强制
 * - 给出 3 个方案的方向参考，由 LLM 根据产品特征自行决定最佳组合
 * - 提供通用电商约束 + 产品特征上下文，让 LLM 自行发挥构图创意
 */
export function buildEmptyPlanBrief(
  userGoal?: string,
  productContext?: { productName?: string; productType?: string }
): PlanBrief {
  const inferredMode = inferEmptyTemplateMode(userGoal, productContext);

  // 方案方向参考：不强制绑定，作为 LLM 的参考池
  const suggestedPlanDirections = [
    { type: "platform_hero", description: "第一眼主图：产品占画面 65-80%，打破对称，有侵略性张力，极简大字" },
    { type: "feature_showcase", description: "卖点爆破图：产品+环绕信息卡片，3-4个卖点几何组织，层次分明" },
    { type: "info_dense", description: "高密度信息板：标题+产品+底部信息条全开，参数/优势/信任状满载" },
  ];

  return {
    sourceType: "empty",
    sourceId: "auto",
    imageType: "auto",
    allowedLayoutTypes: [],
    defaultCopyDensity: "rich",
    riskRules: EMPTY_TEMPLATE_RISK_RULES,
    styleStrategy: freeStyleStrategy(),
    variants: [],
    userGoal,
    productContext,
    mandatoryVisualRules: EMPTY_TEMPLATE_MANDATORY_RULES,
    avoidRules: EMPTY_TEMPLATE_AVOID_RULES,
    copyRules: EMPTY_TEMPLATE_COPY_RULES,
    inferredMode,
    emptyTemplatePlans: suggestedPlanDirections.map((d) => ({
      type: d.type as EmptyTemplatePlanType,
      mode: inferredMode === "mixed" ? "dark" : inferredMode,
      styleId: "free",
      layoutType: "auto",
      description: d.description,
    })),
  };
}

/**
 * 从系统模板构建 PlanBrief。
 */
export function buildPlanBriefFromSystemTemplate(
  templateId: string,
  userGoal?: string
): PlanBrief | null {
  const template = getSystemTemplateProfile(templateId);
  if (!template) return null;

  return {
    sourceType: "system_template",
    sourceId: templateId,
    imageType: template.imageType,
    allowedLayoutTypes: template.allowedLayoutTypes,
    defaultCopyDensity: template.defaultCopyDensity,
    riskRules: template.riskRules,
    styleStrategy: defaultStyleStrategy(template.allowedStyleIds),
    variants: template.variants,
    userGoal,
    mandatoryVisualRules: template.mandatoryVisualRules,
    avoidRules: template.avoidRules,
    sceneRules: template.sceneRules,
    lightingColorRules: template.lightingColorRules,
    productPlacementRules: template.productPlacementRules,
    copyRules: template.copyRules,
    userGoalConflictResolution: template.userGoalConflictResolution,
  };
}

/**
 * 从用户保存的模板构建 PlanBrief。
 */
export function buildPlanBriefFromSavedTemplate(
  saved: SavedTemplate,
  userGoal?: string
): PlanBrief {
  const base = saved.baseTemplateId
    ? getSystemTemplateProfile(saved.baseTemplateId)
    : undefined;

  const imageType = saved.imageType ?? base?.imageType ?? "auto";
  const allowedLayoutTypes = saved.allowedLayoutTypes ?? base?.allowedLayoutTypes ?? [];
  const defaultCopyDensity = saved.defaultCopyDensity ?? base?.defaultCopyDensity ?? "medium";
  const riskRules = [
    ...(base?.riskRules ?? []),
    ...(saved.riskRules ?? []),
  ];
  const styleStrategy = freeStyleStrategy();
  const variants = base?.variants ?? [];

  return {
    sourceType: "saved_template",
    sourceId: saved.id,
    imageType,
    allowedLayoutTypes,
    defaultCopyDensity,
    riskRules,
    styleStrategy,
    variants,
    userGoal,
  };
}

/**
 * 从商详图素材类型构建 PlanBrief。
 */
export function buildPlanBriefFromDetailAsset(
  detailType: V2DetailType,
  userGoal?: string
): PlanBrief | null {
  const imageType = DETAIL_ASSET_TO_IMAGE_TYPE[detailType];
  if (!imageType) return null;

  return {
    sourceType: "detail_asset",
    sourceId: detailType,
    imageType,
    allowedLayoutTypes: IMAGE_TYPE_TO_ALLOWED_LAYOUTS[imageType],
    defaultCopyDensity: IMAGE_TYPE_TO_DEFAULT_COPY_DENSITY[imageType],
    riskRules: [],
    styleStrategy: freeStyleStrategy(),
    variants: [],
    userGoal,
  };
}
