#!/usr/bin/env tsx
/**
 * v2.1 Acceptance Report — 最终验收输出
 *
 * 输出 6 个 case 的结构化验收报告，用于人工审查
 */

import type { CreativePlan } from "../src/app/ai-image/v2/types";
import {
  getSystemTemplateProfile,
  resolveTemplateFields,
} from "../src/app/ai-image/v2/domain/templates";
import {
  buildEmptyPlanBrief,
  buildPlanBriefFromSystemTemplate,
} from "../src/app/ai-image/v2/domain/plan-brief";
import { applyTemplateRuleToPlan } from "../src/app/api/ai-image/v2/plan/lib/template-rules";
import { buildImageGenerationPrompt } from "../src/app/api/ai-image/v2/plan/lib/prompt-builders";
import { getStyleWorldById } from "../src/app/ai-image/v2/domain/style-worlds";

function divider(label: string) {
  console.log("\n" + "=".repeat(80));
  console.log(label);
  console.log("=".repeat(80));
}

function section(label: string) {
  console.log("\n─── " + label + " ───");
}

function sub(label: string) {
  console.log("\n  ▸ " + label);
}

// ── Mock CreativePlan ──
function createMockPlan(templateId: string, archetype: string): CreativePlan {
  return {
    id: "plan-mock",
    planName: "Mock Plan",
    planArchetype: archetype as any,
    templateId,
    imageType: "main",
    productName: "Carbide Drill Bit",
    headline: "PRECISION CUT EVERY TIME",
    subtitle: "Engineered for high-speed steel drilling with extended tool life",
    sellingPoints: [
      "FAST CHIP REMOVAL / Optimized flute geometry clears chips rapidly",
      "LESS HEAT BUILD-UP / Advanced edge geometry reduces friction",
      "HIGH FEED EFFICIENCY / Supports aggressive feed rates",
    ],
    copyBlocks: [
      { id: "cb-1", title: "PRECISION CUT EVERY TIME", role: "headline", priority: 1 },
      { id: "cb-2", title: "Engineered for high-speed steel drilling", role: "subheadline", priority: 2 },
      { id: "cb-3", title: "FAST CHIP REMOVAL", body: "Optimized flute geometry clears chips rapidly", role: "feature_point", priority: 3 },
      { id: "cb-4", title: "LESS HEAT BUILD-UP", body: "Advanced edge geometry reduces friction", role: "feature_point", priority: 4 },
      { id: "cb-5", title: "HIGH FEED EFFICIENCY", body: "Supports aggressive feed rates", role: "feature_point", priority: 5 },
      { id: "cb-6", title: "OPTIMIZED HELIX ANGLE", body: "35-degree helix for smooth entry", role: "technical_point", priority: 6 },
      { id: "cb-7", title: "REINFORCED CORE", body: "Stronger core for deep hole drilling", role: "technical_point", priority: 7 },
      { id: "cb-8", title: "BUILT TO PERFORM", role: "core_claim", priority: 8 },
      { id: "cb-9", title: "DRY CUT READY", role: "bottom_info", priority: 9 },
      { id: "cb-10", title: "CNC OPTIMIZED", role: "bottom_info", priority: 10 },
      { id: "cb-11", title: "LONGER TOOL LIFE", role: "bottom_info", priority: 11 },
    ],
    layoutDirection: "Product centered with text blocks arranged in clean hierarchy",
    visualDirection: "Professional studio lighting with crisp edge highlights",
    colorDirection: "Metallic silver tones with dark charcoal background",
    visualComplexity: "medium",
    informationDensity: "medium",
    riskWarnings: ["Preserve original product structure", "No fake specifications"],
    copySource: "ai_suggested" as const,
    textLanguage: "English" as const,
  };
}

// ── 从prompt中提取最重要的5条视觉指令 ──
function extractTop5VisualCommands(prompt: string): string[] {
  const lines = prompt.split("\n").map((l) => l.trim()).filter((l) => l.length > 10);
  // 按优先级排序：StyleWorld 开头 > MANDATORY > 具体指令 > 其他
  const scored = lines.map((line) => {
    let score = 0;
    if (line.startsWith("StyleWorld:")) score += 100;
    if (line.startsWith("=== VISUAL STYLE")) score += 90;
    if (line.startsWith("Photography style,")) score += 85;
    if (line.startsWith("Color palette")) score += 80;
    if (line.startsWith("Composition,")) score += 75;
    if (line.startsWith("Layout type:")) score += 70;
    if (line.startsWith("HEADLINE (")) score += 60;
    if (line.startsWith("Visual complexity:")) score += 50;
    if (line.startsWith("Diversity requirement:")) score += 40;
    if (line.includes("MANDATORY")) score += 30;
    if (/^(NO |No )/.test(line)) score += 20;
    return { line, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 5).map((s) => s.line);
}

// ── 冲突检查 ──
function checkConflicts(prompt: string): { hasConflict: boolean; issues: string[] } {
  const issues: string[] = [];
  const checks = [
    {
      name: "白色/纯白 vs 渐变/暗色 背景冲突",
      patterns: [/纯白|white background|pure white/i, /渐变|gradient|暗色|dark|deep void/i],
    },
    {
      name: "标题 required vs optional 冲突",
      patterns: [/必须存在|required|必须作为视觉锚点/i, /optional|为 optional|不是强制/i],
    },
    {
      name: "产品完整展示 vs dramatic crop 冲突",
      patterns: [/完整展示|full product|完整可见/i, /dramatic crop|裁切|crop|局部|40-60%/i],
    },
    {
      name: "strict vs expressive 自由度冲突",
      patterns: [/strict.*禁止偏离|strict.*禁止过度|strict 模式/i, /expressive.*允许|expressive 模式|探索更强的/i],
    },
    {
      name: "改变产品结构 vs 保留结构 冲突",
      patterns: [/不要改变产品结构|保留.*结构|preserve.*structure|exact product structure/i, /改变.*结构|alter.*shape|modify.*structure/i],
    },
    {
      name: "pure white / no gradient 残留 (Case C 特检)",
      patterns: [/must be pure white|必须为纯白|禁止任何非纯白|禁止渐变|no gradient|strict.*禁止.*背景/i],
    },
  ];
  for (const check of checks) {
    const hits = check.patterns.map((p) => prompt.match(p));
    const allHit = hits.every((h) => h && h.length > 0);
    if (allHit) {
      issues.push(check.name);
    }
  }
  return { hasConflict: issues.length > 0, issues };
}

// ── 解释图会长什么样 ──
function describeExpectedLook(plan: CreativePlan, planBrief: any): string {
  const sw = planBrief?.resolvedPrimaryStyleWorld;
  const freedom = planBrief?.resolvedCreativeFreedom;
  const templateId = plan.templateId;
  
  if (!templateId || templateId === "empty") {
    return `一张${sw === "editorial_product_ad" ? "杂志广告风" : sw === "gradient_modern_showcase" ? "现代渐变展示" : "设计感"}的产品主图，${freedom === "expressive" ? "背景允许有设计感元素" : "背景干净简洁"}，产品结构不变，文字仅 headline + 少量标签。`;
  }
  if (templateId.includes("white-bg")) {
    if (freedom === "expressive") {
      return `白底主图变体：采用 StyleWorld 的柔和渐变或材质背景替代纯白，产品居中展示，文字精简（headline + 2-3 标签），整体偏向杂志广告或现代展示风格。`;
    }
    return `标准白底电商主图：产品完整居中，纯白/浅灰背景，柔和漫射光，标题在上方或下方，2-3 个短标签，干净可信的货架感。`;
  }
  if (templateId.includes("feature")) {
    return `功能卖点图：产品占据画面一侧作为视觉主角，另一侧用玻璃态面板/渐变卡片展示 3-4 个卖点，背景浅灰或纯白，信息密度中等，不像说明书而像技术产品页。`;
  }
  if (templateId.includes("premium")) {
    return `高端质感展示图：深色 void 或雾蓝背景，戏剧性明暗对比，产品如艺术物件般摆放，文字极少（仅 headline 或完全无字），电影感、奢华感、静默感。`;
  }
  return `产品商业摄影图：背景由 StyleWorld 决定，产品为主角，文字按需排版，整体风格统一。`;
}

// ── 运行单个 case ──
function runAcceptanceCase(
  label: string,
  templateId: string | null,
  userGoal: string,
  productContext?: { productName?: string; productType?: string }
) {
  divider(label);

  let planBrief = templateId
    ? buildPlanBriefFromSystemTemplate(templateId, userGoal)
    : buildEmptyPlanBrief(userGoal, productContext);

  if (!planBrief) {
    console.log("❌ PlanBrief 构建失败");
    return;
  }

  const archetype = "hero_feature";
  const mockPlan = createMockPlan(templateId || "empty", archetype);

  const appliedPlan = applyTemplateRuleToPlan(
    mockPlan,
    templateId || undefined,
    0,
    planBrief.styleWorldPromptHints,
    planBrief.resolvedPrimaryStyleWorld
  );

  const finalPrompt = appliedPlan.imageGenerationPrompt || buildImageGenerationPrompt(appliedPlan);

  // 1. PlanBrief 摘要
  section("1. PlanBrief 摘要");
  console.log(`  sourceType: ${planBrief.sourceType}`);
  console.log(`  sourceId: ${planBrief.sourceId}`);
  console.log(`  resolvedCreativeFreedom: ${planBrief.resolvedCreativeFreedom}`);
  console.log(`  resolvedPrimaryStyleWorld: ${planBrief.resolvedPrimaryStyleWorld}`);
  console.log(`  styleWorldPool: [${(planBrief.styleStrategy.styleWorldPool || []).join(", ")}]`);
  console.log(`  recommendedCopyMode: ${planBrief.styleStrategy.recommendedCopyMode}`);

  // 2. CreativePlan 摘要
  section("2. CreativePlan 摘要");
  console.log(`  planName: ${appliedPlan.planName}`);
  console.log(`  templateId: ${appliedPlan.templateId}`);
  console.log(`  imageType: ${appliedPlan.imageType}`);
  console.log(`  visualComplexity: ${appliedPlan.visualComplexity}`);
  console.log(`  informationDensity: ${appliedPlan.informationDensity}`);
  console.log(`  copyBlocks 角色分布: ${Array.from(new Set(appliedPlan.copyBlocks?.map((b) => b.role))).join(", ")}`);
  console.log(`  riskWarnings 数量: ${appliedPlan.riskWarnings?.length}`);

  // 3. 最终 prompt
  section("3. 最终 Prompt（完整）");
  console.log(finalPrompt);

  // 4. Negative / avoid rules
  section("4. Negative / Avoid Rules");
  const avoidRules = appliedPlan.riskWarnings?.filter((w) =>
    /禁止|No |no |不要|Do NOT|Avoid|avoid|no gradient|no fake|no cropped/i.test(w)
  ) || [];
  if (avoidRules.length === 0) {
    console.log("  （无显式 avoid rules — 由 StyleWorld 的 extraAvoidRules 通过 riskWarnings 注入）");
  } else {
    avoidRules.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
  }

  // 5. 这张图理论上会长什么样
  section("5. 预期视觉效果（一句话）");
  console.log("  " + describeExpectedLook(appliedPlan, planBrief));

  // 6. 最重要的5条视觉指令
  section("6. Top 5 视觉指令");
  const top5 = extractTop5VisualCommands(finalPrompt);
  top5.forEach((cmd, i) => console.log(`  ${i + 1}. ${cmd}`));

  // 7. 潜在冲突
  section("7. 潜在冲突检查");
  const { hasConflict, issues } = checkConflicts(finalPrompt);
  if (hasConflict) {
    issues.forEach((issue) => console.log(`  ⚠️  ${issue}`));
  } else {
    console.log("  ✅ 未检测到冲突");
  }

  // 统计
  sub(`Prompt 长度: ${finalPrompt.length} 字符 | 行数: ${finalPrompt.split("\n").filter((l) => l.trim()).length}`);
}

// ═══════════════════════════════════════════════════════════════
// 6 个验收用例
// ═══════════════════════════════════════════════════════════════

// A. 空模板 auto
runAcceptanceCase(
  "A. 空模板 / auto — userGoal: 更高级，有设计感，不改变产品结构",
  null,
  "帮我做一张主图，更高级一点，背景可以有设计感，但不要改变产品结构。",
  { productName: "硬质合金钻头", productType: "drill" }
);

// B. 白底主图 strict
runAcceptanceCase(
  "B. 白底主图 (tpl-white-bg-hero) — userGoal: 干净的电商主图",
  "tpl-white-bg-hero",
  "做一张干净的电商主图，产品完整展示，少量文字。"
);

// C. 白底主图 + 风格冲突
runAcceptanceCase(
  "C. 白底主图 + 用户风格冲突 — userGoal: 不要纯白，要柔和渐变",
  "tpl-white-bg-hero",
  "做一张主图，但不要纯白背景，希望有柔和渐变和高级质感。"
);

// D. 功能卖点说明图
runAcceptanceCase(
  "D. 功能卖点说明图 (tpl-feature-explanation) — userGoal: 突出耐用锋利，不像说明书",
  "tpl-feature-explanation",
  "做一张功能卖点图，突出耐用、锋利、精密加工，但不要像普通说明书。"
);

// E. 高端质感展示图
runAcceptanceCase(
  "E. 高端质感展示图 (tpl-premium-luxury) — userGoal: 高级感+电影感，少文字",
  "tpl-premium-luxury",
  "做一张高级感产品图，可以暗色、电影感、少文字。"
);

// F. 详情/材质方向（允许局部裁切）
runAcceptanceCase(
  "F. 详情/材质方向 (tpl-macro-detail) — userGoal: 突出材质纹理，允许局部裁切",
  "tpl-macro-detail",
  "做一张产品材质细节图，展示表面纹理和精密加工，可以局部裁切。"
);

console.log("\nDone.");
