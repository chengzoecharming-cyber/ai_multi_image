import type { PlanBrief } from "@/app/ai-image/v2/domain/plan-brief";
import {
  IMAGE_TYPE_LABELS,
  getImageTypeLabel,
} from "@/app/ai-image/v2/domain/image-types";
import { LAYOUT_TYPE_LABELS } from "@/app/ai-image/v2/domain/layouts";
import { getVisualStyleProfile } from "@/app/ai-image/v2/domain/visual-styles";

/**
 * 全局安全规则（红线）。
 *
 * 适用于所有生成场景，不可违反。
 */
const GLOBAL_SAFETY_RULES: string[] = [
  "用户意图是最高优先级。如果用户的文字描述与任何默认规则冲突，始终以用户意图为准。",
  "不得随意添加 Logo、水印、签名、角标、版权标识、二维码等品牌标识，除非用户明确要求。",
  "不得修改产品轮廓、比例、孔洞、槽口、螺纹、刀刃、边缘或不规则轮廓，除非用户明确要求修改。",
  "不得添加或删除产品部件，除非用户明确要求。",
  "不得编造未提供的技术事实（硬度、负载能力、扭矩、材质等级、涂层类型、寿命、保修、价格、认证、型号、品牌名）。但如果用户明确提供了具体尺寸或参数，必须如实呈现。",
];

/**
 * 把版式类型列表转换为可读标签。
 */
function formatLayoutTypes(layoutTypes: string[]): string {
  if (layoutTypes.length === 0) return "由模型自由决定";
  return layoutTypes
    .map((lt) => LAYOUT_TYPE_LABELS[lt as keyof typeof LAYOUT_TYPE_LABELS] || lt)
    .join("、");
}

/**
 * 把视觉风格策略转换为描述。
 */
function formatStyleStrategy(brief: PlanBrief): string {
  const { styleStrategy } = brief;

  if (styleStrategy.mode === "pick_from_pool") {
    if (styleStrategy.pool.length === 0) {
      return `由模型根据商品图和目标自由选择合适的视觉风格，生成 ${styleStrategy.count} 个不同风格的方案。`;
    }

    const styleDescriptions = styleStrategy.pool
      .map((id) => {
        const s = getVisualStyleProfile(id);
        return s ? `- ${s.label}` : `- ${id}`;
      })
      .join("\n");

    return `从候选视觉风格中选出 ${styleStrategy.count} 个不同风格：\n${styleDescriptions}\n每个方案使用一个不同风格。`;
  }

  if (styleStrategy.mode === "free") {
    return `自由发挥，生成 ${styleStrategy.count} 个视觉风格明显不同的方案。`;
  }

  return `模式：${styleStrategy.mode}`;
}

/**
 * 把版式变体转换为描述。
 */
function formatVariants(brief: PlanBrief): string {
  if (brief.variants.length === 0) {
    return "由模型自由决定构图";
  }

  return brief.variants
    .map((v, i) => `${i + 1}. ${v.name}（${LAYOUT_TYPE_LABELS[v.layoutType as keyof typeof LAYOUT_TYPE_LABELS] || v.layoutType}）\n   ${v.layoutDirection}`)
    .join("\n\n");
}

/**
 * 根据 PlanBrief 组装生成 prompt。
 */
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
  const styleStrategyLabel = formatStyleStrategy(brief);
  const variantsLabel = formatVariants(brief);

  const riskRulesText = brief.riskRules && brief.riskRules.length > 0
    ? brief.riskRules.map((r) => `- ${r}`).join("\n")
    : "";

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
    ? `\n\n### 冲突处理\n${brief.userGoalConflictResolution}`
    : "";

  const emptyTemplateGuidance = brief.sourceType === "empty"
    ? `
【自由生成模式】
用户未选择预设模板。请根据【上传的产品图 + 用户目标】自由发挥，生成 3 个视觉差异最大化的电商营销方案。

**核心原则：**
- 用户的制图目标是最高指令。如果用户明确说"只改X"，则只改X，不得扩展任务范围。
- 3 个方案必须在视觉风格、构图逻辑、信息密度上主动拉开差异，不要只是换颜色或换文案。
- 你可以自行决定：产品摆放、背景类型、文案密度、配色方向、是否使用图标/徽章/线条等视觉元素。
- 如果用户目标范围很小（如只改一个文字、只调一个颜色），生成的方案也必须同样范围很小，不得借机重做整张图。
`.trim()
    : "";

  const autoImageTypeGuidance = brief.imageType === "auto"
    ? `
当 imageType = auto 时，结合【用户输入 + 商品图】共同判断图片用途：
- 用户明确说"主图/白底主图" → 按主图处理
- 用户明确说"对比/对照/VS" → 按对比图处理
- 用户明确说"尺寸/标注/规格" → 按规格信息图处理
- 用户明确说"场景/使用场景" → 按场景图处理
- 用户只说"电商图/详情图" → 由商品图特征选择最合适用途
`.trim()
    : "";

  if (mode === "edit") {
    return `
## 编辑任务简报

你正在编辑一个已有的结构化创意方案（CreativePlan JSON）。

### 图片用途
${brief.imageType === "auto" ? "自动判断：根据商品图和用户目标判断最适合的图片用途。" : imageTypeLabel}

### 版式
${layoutTypesLabel}

### 变体
${variantsLabel}

### 视觉风格
${styleStrategyLabel}

### 安全规则
${globalSafetyText}
${riskRulesText ? `\n【模板级安全规则】\n${riskRulesText}` : ""}

### 用户制图目标
${userGoalText}${productContextText}${conflictText}

---

编辑规则：
1. 保留原有方案的核心身份（plan.id、planArchetype、templateId 不得变更）。
2. 忠于上传的产品图，不得擅自修改产品轮廓、比例、结构特征。
3. 画面文字语言由用户目标决定，默认简洁即可。
4. 用户意图优先于一切默认规则。
`.trim();
  }

  if (mode === "image") {
    return `
## 图片生成任务简报

### 图片用途
${brief.imageType === "auto" ? "自动判断：根据商品图和用户目标判断最适合的图片用途。" : imageTypeLabel}

### 版式
${layoutTypesLabel}

### 视觉风格
${styleStrategyLabel}

### 安全规则
${globalSafetyText}
${riskRulesText ? `\n【模板级安全规则】\n${riskRulesText}` : ""}

### 用户制图目标
${userGoalText}${productContextText}${conflictText}

---

请根据以上简报生成一张高质量电商商品图片：
1. 忠于上传的产品图，不得擅自修改产品轮廓、比例、结构特征。
2. 不得出现未要求的 Logo、水印、品牌标识。
3. 保持商业摄影级别的质感：真实材质、自然光影、干净专业的视觉呈现。
4. 用户意图优先于一切默认规则。
`.trim();
  }

  return `
## 生成任务简报

### 图片用途
${brief.imageType === "auto" ? "自动判断：根据商品图和用户目标判断最适合的图片用途。" : imageTypeLabel}
${autoImageTypeGuidance ? `\n\n${autoImageTypeGuidance}` : ""}
${emptyTemplateGuidance ? `\n\n${emptyTemplateGuidance}` : ""}

### 版式
${layoutTypesLabel}

### 变体
${variantsLabel}

### 视觉风格
${styleStrategyLabel}

### 安全规则
${globalSafetyText}
${riskRulesText ? `\n【模板级安全规则】\n${riskRulesText}` : ""}

### 用户制图目标
${userGoalText}${productContextText}${conflictText}

---

请根据以上简报生成结构化创意方案：
1. 忠于上传的产品图，不得擅自修改产品结构。
2. 三个方案必须在视觉风格、构图、信息密度上主动拉开差异，不要只是换颜色或换文案。
3. 用户意图是最高优先级，优先于一切默认规则。
4. 画面文字语言由用户目标决定，默认简洁即可。
`.trim();
}
