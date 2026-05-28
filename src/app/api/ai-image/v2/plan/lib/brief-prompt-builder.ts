import type { PlanBrief } from "@/app/ai-image/v2/domain/plan-brief";
import {
  IMAGE_TYPE_LABELS,
  getImageTypeLabel,
} from "@/app/ai-image/v2/domain/image-types";
import { LAYOUT_TYPE_LABELS } from "@/app/ai-image/v2/domain/layouts";
import { COPY_DENSITY_PROFILES } from "@/app/ai-image/v2/domain/copy-density";
import { getVisualStyleProfile } from "@/app/ai-image/v2/domain/visual-styles";

/**
 * 全局产品安全规则。
 *
 * 独立于模板，适用于所有生成场景。
 * 后续可扩展为从配置读取。
 */
const GLOBAL_SAFETY_RULES: string[] = [
  "产品图是产品身份的唯一权威。如果用户文字描述与图片冲突，始终以图片为准。",
  "不得修改产品轮廓、比例、孔洞、槽口、螺纹、刀刃、边缘或不规则轮廓。",
  "不得添加或删除产品部件。",
  "不得编造未提供的技术事实：尺寸、硬度、负载能力、扭矩、材质等级、涂层类型、寿命、保修、价格、认证、型号、品牌名或平台标识。",
  "不得生成虚假 Logo、虚假价格、虚假参数、虚假尺寸、虚假认证。",
  "所有画面文字必须是简洁的英文。",
];

/**
 * 把版式类型列表转换为可读标签。
 */
function formatLayoutTypes(layoutTypes: string[]): string {
  if (layoutTypes.length === 0) return "未指定（由模型自由决定）";
  return layoutTypes
    .map((lt) => LAYOUT_TYPE_LABELS[lt as keyof typeof LAYOUT_TYPE_LABELS] || lt)
    .join("、");
}

/**
 * 把文案密度转换为策略描述。
 */
function formatCopyDensity(copyDensityId: string): string {
  const profile = COPY_DENSITY_PROFILES[copyDensityId as keyof typeof COPY_DENSITY_PROFILES];
  if (profile) {
    return `${profile.label}（${profile.description}）`;
  }
  return copyDensityId;
}

/**
 * 把视觉风格策略转换为描述。
 */
function formatStyleStrategy(brief: PlanBrief): string {
  const { styleStrategy } = brief;

  if (styleStrategy.mode === "pick_from_pool") {
    if (styleStrategy.pool.length === 0) {
      return `模式：由模型根据商品图和目标自由选择合适的视觉风格。\n需要生成 ${styleStrategy.count} 个不同风格的方案。`;
    }

    const styleDescriptions = styleStrategy.pool
      .map((id) => {
        const s = getVisualStyleProfile(id);
        return s ? `- ${s.label}` : `- ${id}`;
      })
      .join("\n");

    return `模式：从候选池中选出 ${styleStrategy.count} 个不同视觉风格。\n候选池：\n${styleDescriptions}\n\n要求：每个方案必须使用池中的一个不同风格，确保三个方案在视觉表达上有明显差异。`;
  }

  if (styleStrategy.mode === "free") {
    return `模式：自由选择视觉风格。\n需要生成 ${styleStrategy.count} 个明显不同风格的方案。不要让三个方案只是换文案或换颜色。`;
  }

  return `模式：${styleStrategy.mode}`;
}

/**
 * 把版式变体转换为描述。
 */
function formatVariants(brief: PlanBrief): string {
  if (brief.variants.length === 0) {
    return "未预设版式变体（由模型自由决定构图）";
  }

  return brief.variants
    .map((v, i) => `${i + 1}. ${v.name}（${LAYOUT_TYPE_LABELS[v.layoutType as keyof typeof LAYOUT_TYPE_LABELS] || v.layoutType}）\n   ${v.layoutDirection}`)
    .join("\n\n");
}

/**
 * 根据 PlanBrief 组装生成 prompt。
 *
 * 这个函数只根据结构化字段组装，不接入运行时。
 * 后续替换生成链路时，用它来替代 TemplateRule + system-prompt 的混合组装方式。
 */
function formatRuleList(rules: string[] | undefined, fallback: string): string {
  if (!rules || rules.length === 0) return fallback;
  return rules.map((r) => `- ${r}`).join("\n");
}

export function buildPromptFromBrief(
  brief: PlanBrief,
  options?: {
    userInput?: string;
    productContext?: unknown;
    mode?: "generate" | "edit" | "image";
  }
): string {
  const mode = options?.mode ?? "generate";
  const imageTypeLabel = getImageTypeLabel(brief.imageType);
  const layoutTypesLabel = formatLayoutTypes(brief.allowedLayoutTypes);
  const copyDensityLabel = formatCopyDensity(brief.defaultCopyDensity);
  const styleStrategyLabel = formatStyleStrategy(brief);
  const variantsLabel = formatVariants(brief);

  const riskRulesText = formatRuleList(
    brief.riskRules,
    "无模板级风险规则（仅适用全局安全规则）"
  );

  const globalSafetyText = GLOBAL_SAFETY_RULES.map((r) => `- ${r}`).join("\n");

  const userGoalText = brief.userGoal || options?.userInput || "未提供";

  const productContextText = (() => {
    const ctx = brief.productContext || options?.productContext;
    if (!ctx || typeof ctx !== "object") return "";
    const c = ctx as Record<string, string>;
    const parts: string[] = [];
    if (c.productName) parts.push(`产品名称：${c.productName}`);
    if (c.productType) parts.push(`产品类型：${c.productType}`);
    if (c.productImageUrl) parts.push(`产品图：已上传`);
    return parts.length > 0 ? `\n### 商品上下文\n${parts.join("\n")}` : "";
  })();

  const conflictText = brief.userGoalConflictResolution
    ? `\n\n### 模板用途与用户输入冲突处理\n${brief.userGoalConflictResolution}`
    : "";

  const mandatoryVisualText = formatRuleList(
    brief.mandatoryVisualRules,
    "无额外视觉硬约束（由版式和风格策略决定）"
  );

  const sceneText = formatRuleList(
    brief.sceneRules,
    "无额外场景约束（由风格策略决定）"
  );

  const lightingColorText = formatRuleList(
    brief.lightingColorRules,
    "无额外灯光/色彩约束（由风格策略决定）"
  );

  const placementText = formatRuleList(
    brief.productPlacementRules,
    "无额外产品摆放约束（由版式变体决定）"
  );

  const copyRulesText = formatRuleList(
    brief.copyRules,
    "无额外文案约束（由文案密度策略决定）"
  );

  const avoidText = formatRuleList(
    brief.avoidRules,
    "无额外禁止事项"
  );

  const emptyTemplateGuidance = brief.sourceType === "empty"
    ? `
【空模板智能生成模式】
用户未选择预设模板，系统已自动推断明暗倾向：${brief.inferredMode || "mixed"}（仅作参考，你可根据产品特征自行决定明暗基调）。

你是一个资深电商视觉设计师。请根据【上传的产品图 + 用户目标】自行判断最佳视觉策略，生成 3 个差异最大化的电商营销方案。

=== 你的任务 ===
不要套用固定模板。请仔细观察产品特征，为这个产品量身定制 3 个方案：

**方案必须满足的基本要求：**
1. 3 个方案必须是完全不同的功能定位（例如：搜索主图 / 详情卖点图 / 信息海报 — 但你可以根据产品特征调整这个组合）
2. 每个方案必须有独特的视觉风格、构图逻辑和信息密度

**可选参考方向（不强制，仅启发）：**
- 第一眼主图：产品主体突出，极简文案
- 卖点爆破图：产品+信息卡片，展示核心优势
- 高密度信息板：标题+产品+信息条，信息丰富
- 微距特写：局部放大，突出材质纹理
- 结构解析：爆炸图/分层展示
- 对比论证：before/after 或 对比展示

**视觉创意自由：**
- 你可以自行决定产品的摆放角度、大小、是否倾斜、是否部分出界
- 你可以自行决定背景是纯色/渐变/纹理/几何图形/工业元素
- 你可以自行决定文案密度：从极简大字到信息满载都可以
- 你可以自行选择色彩方向：冷暖、明暗、单色系或多色系
- 你可以自行决定是否使用图标、徽章、线条、色块等视觉元素

让这 3 个方案看起来像是为这个产品"量身定制"的设计，而不是套用同一套模板的 3 个皮肤。
`.trim()
    : "";

  const autoImageTypeGuidance = brief.imageType === "auto"
    ? `
当 imageType = auto 时，你必须结合【用户输入 + 商品图】共同判断图片用途：
- 如果用户明确说“主图/白底主图/Amazon主图/平台主图”，则用途按主图处理（不要自行改成对比图或场景图）。
- 如果用户明确说“对比/对照/VS/优劣对比”，则用途按对比图处理。
- 如果用户明确说“尺寸/标注/规格/参数”，则用途按尺寸标注/规格信息图处理（禁止编造真实数值；可用占位符标签）。
- 如果用户明确说“场景/仿实拍/使用场景”，则用途按场景图处理。
- 如果用户只说“电商图/详情图/卖点图”，则由商品图特征选择最合适用途，但必须能解释选择理由（写在 riskWarnings 或 copyNotes 中）。
`.trim()
    : "";

  const perPlanDensityTargets = `
三方案信息密度目标（必须显式拉开差异，不要只是换颜色或换词）：
- 方案 1（Hero）：informationDensity = low，visualComplexity = simple — 像搜索结果主图，大到不讲理，一眼抓住
- 方案 2（Feature）：informationDensity = medium，visualComplexity = medium — 像详情页卖点图，信息丰富但层次分明
- 方案 3（InfoDense）：informationDensity = rich，visualComplexity = complex — 像完整产品海报，参数/优势/信任状一次给足（禁止编造具体参数，可用占位标签）
`.trim();

  if (mode === "edit") {
    return `
## 编辑任务简报（Plan Brief）

你正在编辑一个已有的结构化创意方案（CreativePlan JSON），而不是从零生成。

### 图片用途
${brief.imageType === "auto" ? "自动判断：先根据商品图和用户目标判断最适合的图片用途，再生成方案。" : imageTypeLabel}

### 版式约束
允许使用的版式结构：${layoutTypesLabel}

### 版式变体
${variantsLabel}

### 文案策略
${copyDensityLabel}

### 视觉风格策略
${styleStrategyLabel}

### 视觉硬约束
${mandatoryVisualText}

### 场景/环境规则
${sceneText}

### 灯光/景深/色彩规则
${lightingColorText}

### 产品摆放规则
${placementText}

### 文案规则
${copyRulesText}

### 禁止事项
${avoidText}

### 安全规则

【全局安全规则】
${globalSafetyText}

【模板级安全规则】
${riskRulesText}

### 用户制图目标
${userGoalText}${productContextText}${conflictText}

---

编辑规则：
1. 保留原有方案的核心身份（plan.id、planArchetype、templateId 不得变更）。
2. 忠于上传的产品图，不得修改产品轮廓、比例、结构特征。
3. 编辑结果必须严格遵守上方「版式约束」「视觉硬约束」「禁止事项」「安全规则」。
4. 画面文字继续使用简洁英文。
5. visualDirection 必须具体详细：描述精确的光照角度、色温、表面反射、背景质感、氛围效果。
6. layoutDirection 必须具体详细：描述精确的产品位置百分比、文字块大小、重叠关系、层级。
7. colorDirection 必须包含精确色值（hex 或命名色），并描述颜色在画面中的过渡方式。
`.trim();
  }

  if (mode === "image") {
    return `
## 图片生成任务简报（Plan Brief）

### 图片用途
${brief.imageType === "auto" ? "自动判断：先根据商品图和用户目标判断最适合的图片用途，再生成方案。" : imageTypeLabel}

### 版式约束
允许使用的版式结构：${layoutTypesLabel}

### 文案策略
${copyDensityLabel}

### 视觉风格策略
${styleStrategyLabel}

### 视觉硬约束
${mandatoryVisualText}

### 场景/环境规则
${sceneText}

### 灯光/景深/色彩规则
${lightingColorText}

### 产品摆放规则
${placementText}

### 文案规则
${copyRulesText}

### 禁止事项
${avoidText}

### 安全规则

【全局安全规则】
${globalSafetyText}

【模板级安全规则】
${riskRulesText}

### 用户制图目标
${userGoalText}${productContextText}${conflictText}

---

请根据以上简报生成一张高质量电商商品图片。要求：
1. 忠于上传的产品图，不得修改产品轮廓、比例、结构特征。
2. 画面不得出现文字、Logo、水印、品牌标识。
3. 保持商业摄影级别的质感：真实材质、自然光影、 clean commercial look。
4. 根据「图片用途」和「版式约束」决定构图策略。
5. 背景简洁、不喧宾夺主，产品必须有清晰的边缘分离。
`.trim();
  }

  return `
## 生成任务简报（Plan Brief）

### 图片用途
${brief.imageType === "auto" ? "自动判断：先根据商品图和用户目标判断最适合的图片用途，再生成方案。" : imageTypeLabel}
${autoImageTypeGuidance ? `\n\n${autoImageTypeGuidance}` : ""}
${emptyTemplateGuidance ? `\n\n${emptyTemplateGuidance}` : ""}

### 版式约束
允许使用的版式结构：${layoutTypesLabel}

### 版式变体
${variantsLabel}

### 文案策略
${copyDensityLabel}

### 视觉风格策略
${styleStrategyLabel}

### 视觉硬约束
${mandatoryVisualText}

### 场景/环境规则
${sceneText}

### 灯光/景深/色彩规则
${lightingColorText}

### 产品摆放规则
${placementText}

### 文案规则
${copyRulesText}

### 禁止事项
${avoidText}

### 安全规则

【全局安全规则】
${globalSafetyText}

【模板级安全规则】
${riskRulesText}

### 用户制图目标
${userGoalText}${productContextText}${conflictText}

---

请根据以上简报生成结构化创意方案。要求：
1. 所有方案必须忠于上传的产品图，不得修改产品结构。
2. 三个方案必须在构图、信息密度、文案节奏、视觉表达上主动拉开差异。
3. 画面文字使用简洁英文。
4. visualDirection 必须具体详细：描述精确的光照角度、色温、表面反射、背景质感、氛围效果。
5. layoutDirection 必须具体详细：描述精确的产品位置百分比、文字块大小、重叠关系、层级。
6. colorDirection 必须包含精确色值（hex 或命名色），并描述颜色在画面中的过渡方式。

${perPlanDensityTargets}
`.trim();
}
