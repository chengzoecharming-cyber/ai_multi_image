#!/usr/bin/env tsx
/**
 * v2.1 Full Prompt Audit — 输出 6 个测试用例的最终进入模型的完整 prompt
 *
 * 追踪完整 pipeline:
 *   PlanBrief → applyTemplateRuleToPlan(mockPlan) → buildImageGenerationPrompt()
 *
 * 重点检查冲突:
 * - 是否同时出现"纯白背景"和"渐变背景"
 * - 是否同时出现"标题 optional"和"标题必须存在"
 * - 是否同时出现"产品完整展示"和"dramatic crop"
 * - 旧 VisualStyle fallback 是否仍然压过新 StyleWorld
 * - prompt 是否太长、重复、堆规则
 * - 用户说不要改变产品结构时，prompt 是否明确限制
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

// ── Mock CreativePlan（模拟 LLM 生成的初始 plan）──
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

// ── 审计辅助函数 ──
function auditConflicts(prompt: string, plan: CreativePlan) {
  const checks: { name: string; patterns: RegExp[]; desc: string }[] = [
    {
      name: "白色/纯白 vs 渐变/暗色 背景冲突",
      patterns: [/纯白|white background|pure white/i, /渐变|gradient|暗色|dark|deep void/i],
      desc: "同时出现'纯白背景'和'渐变/暗色背景'指示",
    },
    {
      name: "标题 required vs optional 冲突",
      patterns: [/必须存在|required|必须作为视觉锚点/i, /optional|为 optional|不是强制/i],
      desc: "同时出现'标题必须存在'和'标题optional'",
    },
    {
      name: "产品完整展示 vs dramatic crop 冲突",
      patterns: [/完整展示|full product|完整可见/i, /dramatic crop|裁切|crop|局部|40-60%/i],
      desc: "同时出现'产品完整展示'和'dramatic crop'",
    },
    {
      name: "strict vs expressive 自由度冲突",
      patterns: [/strict.*禁止偏离|strict.*禁止过度|strict 模式/i, /expressive.*允许|expressive 模式|探索更强的/i],
      desc: "同时出现'strict禁止偏离'和'expressive允许探索'",
    },
    {
      name: "改变产品结构 vs 保留结构 冲突",
      patterns: [/不要改变产品结构|保留.*结构|preserve.*structure|exact product structure/i, /改变.*结构|alter.*shape|modify.*structure/i],
      desc: "用户要求保留结构但prompt中出现'改变结构'",
    },
  ];

  console.log("\n【冲突审计结果】");
  let hasConflict = false;
  for (const check of checks) {
    const hits = check.patterns.map((p) => prompt.match(p));
    const allHit = hits.every((h) => h && h.length > 0);
    if (allHit) {
      hasConflict = true;
      console.log(`  ⚠️  ${check.name}: ${check.desc}`);
      hits.forEach((h, i) => {
        if (h) console.log(`      匹配${i + 1}: "${h[0]}"`);
      });
    }
  }
  if (!hasConflict) {
    console.log("  ✅ 未检测到明显冲突");
  }

  // 重复度检查
  const lines = prompt.split("\n").filter((l) => l.trim().length > 0);
  const uniqueLines = new Set(lines.map((l) => l.trim()));
  const dupRatio = lines.length > 0 ? (lines.length - uniqueLines.size) / lines.length : 0;
  console.log(`\n【Prompt 统计】`);
  console.log(`  总字符数: ${prompt.length}`);
  console.log(`  总行数: ${lines.length}`);
  console.log(`  重复行比例: ${(dupRatio * 100).toFixed(1)}%`);
  if (prompt.length > 6000) {
    console.log(`  ⚠️ Prompt 过长 (${prompt.length} chars)，可能超出模型上下文或导致规则稀释`);
  } else if (prompt.length > 4000) {
    console.log(`  ⚠️ Prompt 较长 (${prompt.length} chars)，建议精简`);
  } else {
    console.log(`  ✅ Prompt 长度合理`);
  }

  // Old VisualStyle 影响检查
  const hasOldVisualStyle = /visual style is "[^"]+"/i.test(prompt);
  const hasStyleWorld = /StyleWorld:/i.test(prompt);
  console.log(`\n【StyleWorld vs Old VisualStyle 影响检查】`);
  console.log(`  是否包含旧 VisualStyle 标记: ${hasOldVisualStyle ? "是" : "否"}`);
  console.log(`  是否包含 StyleWorld 标记: ${hasStyleWorld ? "是" : "否"}`);
  if (hasOldVisualStyle && hasStyleWorld) {
    console.log(`  ⚠️ 同时存在旧 VisualStyle 和 StyleWorld 标记，需确认优先级`);
  } else if (!hasStyleWorld && hasOldVisualStyle) {
    console.log(`  ⚠️ 仅有旧 VisualStyle，StyleWorld 未注入 prompt`);
  } else if (hasStyleWorld && !hasOldVisualStyle) {
    console.log(`  ✅ StyleWorld 已注入，旧 VisualStyle 未压过`);
  }

  // styleWorldPromptHints 注入位置检查
  const hintIdx = prompt.indexOf("StyleWorld:");
  const visualSectionIdx = prompt.indexOf("=== VISUAL STYLE AND COMPOSITION");
  if (hintIdx >= 0 && visualSectionIdx >= 0) {
    console.log(`\n【StyleWorld Hints 注入位置】`);
    console.log(`  StyleWorld 提示出现在字符位置: ${hintIdx}`);
    console.log(`  VISUAL STYLE 区块起始位置: ${visualSectionIdx}`);
    if (hintIdx > visualSectionIdx) {
      console.log(`  ✅ StyleWorld 提示在 VISUAL STYLE 区块之后，属于追加注入`);
    } else {
      console.log(`  ℹ️ StyleWorld 提示在 VISUAL STYLE 区块之前`);
    }
  }
}

// ── 运行单个 case ──
function runCase(
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

  section("1. PlanBrief 核心字段");
  console.log("sourceType:", planBrief.sourceType);
  console.log("sourceId:", planBrief.sourceId);
  console.log("styleStrategy.pool (legacy):", planBrief.styleStrategy.pool);
  console.log("styleStrategy.styleWorldPool:", planBrief.styleStrategy.styleWorldPool);
  console.log("styleStrategy.recommendedCopyMode:", planBrief.styleStrategy.recommendedCopyMode);
  console.log("resolvedCreativeFreedom:", planBrief.resolvedCreativeFreedom);
  console.log("resolvedPrimaryStyleWorld:", planBrief.resolvedPrimaryStyleWorld);

  if (planBrief.styleWorldPromptHints) {
    section("2. StyleWorldPromptHints（注入前）");
    console.log("visualDirectionAddendum:", planBrief.styleWorldPromptHints.visualDirectionAddendum);
    console.log("colorDirectionAddendum:", planBrief.styleWorldPromptHints.colorDirectionAddendum);
    console.log("extraMandatoryRules:", planBrief.styleWorldPromptHints.extraMandatoryRules);
    console.log("extraAvoidRules:", planBrief.styleWorldPromptHints.extraAvoidRules);
    console.log("sceneHints:", planBrief.styleWorldPromptHints.sceneHints);
    console.log("lightingHints:", planBrief.styleWorldPromptHints.lightingHints);
  } else {
    section("2. StyleWorldPromptHints: 无");
  }

  // 构造 mock plan 并应用模板规则
  const archetype = templateId ? "hero_feature" : "hero_feature"; // fallback
  const mockPlan = createMockPlan(templateId || "empty", archetype);

  section("3. applyTemplateRuleToPlan 之前 — mockPlan.visualDirection");
  console.log(mockPlan.visualDirection);
  console.log("mockPlan.colorDirection:", mockPlan.colorDirection);

  // 对 3 个 variant 分别执行，但这里我们只取 variant 0 展示完整 prompt
  const appliedPlan = applyTemplateRuleToPlan(
    mockPlan,
    templateId || undefined,
    0,
    planBrief.styleWorldPromptHints
  );

  section("4. applyTemplateRuleToPlan 之后 — final visualDirection");
  console.log(appliedPlan.visualDirection);
  console.log("final colorDirection:", appliedPlan.colorDirection);

  section("5. 最终进入模型的完整 prompt（imageGenerationPrompt）");
  const finalPrompt = appliedPlan.imageGenerationPrompt || buildImageGenerationPrompt(appliedPlan);
  console.log(finalPrompt);

  section("6. 冲突审计");
  auditConflicts(finalPrompt, appliedPlan);

  // 额外：输出 riskWarnings 中的 avoid rules
  section("7. riskWarnings / avoid rules 汇总");
  console.log("riskWarnings:");
  (appliedPlan.riskWarnings || []).forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
}

// ═══════════════════════════════════════════════════════════════
// 6 个测试用例
// ═══════════════════════════════════════════════════════════════

// A. 空模板 / auto
runCase(
  "A. 空模板 / auto — userGoal: 更高级，有设计感",
  null,
  "帮我做一张主图，更高级一点，背景可以有设计感，但不要改变产品结构。",
  { productName: "硬质合金钻头", productType: "drill" }
);

// B. 白底主图（strict 关键词）
runCase(
  "B. 白底主图 (tpl-white-bg-hero) — userGoal: 干净的电商主图",
  "tpl-white-bg-hero",
  "做一张干净的电商主图，产品完整展示，少量文字。"
);

// C. 白底主图 + 风格冲突（expressive 关键词）
runCase(
  "C. 白底主图 + 用户风格冲突 — userGoal: 不要纯白，要柔和渐变",
  "tpl-white-bg-hero",
  "做一张主图，但不要纯白背景，希望有柔和渐变和高级质感。"
);

// D. 功能卖点说明图
runCase(
  "D. 功能卖点说明图 (tpl-feature-explanation) — userGoal: 突出耐用锋利",
  "tpl-feature-explanation",
  "做一张功能卖点图，突出耐用、锋利、精密加工，但不要像普通说明书。"
);

// E. 高端质感展示图
runCase(
  "E. 高端质感展示图 (tpl-premium-luxury) — userGoal: 高级感+电影感",
  "tpl-premium-luxury",
  "做一张高级感产品图，可以暗色、电影感、少文字。"
);

// F. 三方案差异测试（同一模板，不同 variant）
divider("F. 三方案差异测试 (tpl-white-bg-hero, 同一输入，3 variants)");
const goalF = "做一张产品详情图，突出材质、精密和高级感。";
const pbF = buildPlanBriefFromSystemTemplate("tpl-white-bg-hero", goalF);
const mockF = createMockPlan("tpl-white-bg-hero", "hero_feature");

for (let v = 0; v < 3; v++) {
  console.log("\n─── F" + (v + 1) + ". variant " + v + " ───");
  const planF = applyTemplateRuleToPlan(mockF, "tpl-white-bg-hero", v, pbF?.styleWorldPromptHints);
  const promptF = planF.imageGenerationPrompt || buildImageGenerationPrompt(planF);
  console.log("planName:", planF.planName);
  console.log("visualDirection:", planF.visualDirection.slice(0, 200) + "...");
  console.log("colorDirection:", planF.colorDirection.slice(0, 200) + "...");
  console.log("riskWarnings count:", planF.riskWarnings?.length);
  console.log("prompt length:", promptF.length, "chars");
  auditConflicts(promptF, planF);
}

console.log("\nDone.");
