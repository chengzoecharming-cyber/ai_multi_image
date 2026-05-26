#!/usr/bin/env tsx
/**
 * v2.1 Template Refactor — Debug Playground
 *
 * 验证 6 个测试用例的实际输出：
 * A. 空模板 / auto
 * B. 白底主图
 * C. 白底主图 + 风格冲突
 * D. 功能卖点说明图
 * E. 高端质感展示图
 * F. 三方案差异测试
 */

import {
  getSystemTemplateProfile,
  resolveTemplateFields,
} from "../src/app/ai-image/v2/domain/templates";
import {
  buildEmptyPlanBrief,
  buildPlanBriefFromSystemTemplate,
} from "../src/app/ai-image/v2/domain/plan-brief";
import { getStyleWorldById } from "../src/app/ai-image/v2/domain/style-worlds";
import type { SystemTemplate } from "../src/app/ai-image/v2/domain/templates";
import type { PlanBrief } from "../src/app/ai-image/v2/domain/plan-brief";

function divider(label: string) {
  console.log("\n" + "=".repeat(70));
  console.log(label);
  console.log("=".repeat(70));
}

function summarizeCompat(st: SystemTemplate) {
  console.log("  visualIdentity:", st.visualIdentity?.slice(0, 120) + "...");
  console.log("  colorDirection:", st.colorDirection?.slice(0, 120) + "...");
  console.log("  mandatoryVisualRules:", st.mandatoryVisualRules?.join("; ").slice(0, 120) + "...");
  console.log("  avoidRules:", st.avoidRules?.join("; ").slice(0, 120) + "...");
  console.log("  copyRules:", st.copyRules?.join("; ").slice(0, 120) + "...");
}

function summarizePlanBrief(pb: PlanBrief | null) {
  if (!pb) return;
  console.log("  sourceType:", pb.sourceType);
  console.log("  sourceId:", pb.sourceId);
  console.log("  imageType:", pb.imageType);
  console.log("  allowedLayoutTypes:", pb.allowedLayoutTypes);
  console.log("  defaultCopyDensity:", pb.defaultCopyDensity);
  console.log("  styleStrategy.mode:", pb.styleStrategy.mode);
  console.log("  styleStrategy.pool (legacy VS):", pb.styleStrategy.pool);
  console.log("  styleStrategy.styleWorldPool:", pb.styleStrategy.styleWorldPool);
  console.log("  styleStrategy.recommendedCopyMode:", pb.styleStrategy.recommendedCopyMode);
  console.log("  resolvedCreativeFreedom:", pb.resolvedCreativeFreedom);
  console.log("  resolvedPrimaryStyleWorld:", pb.resolvedPrimaryStyleWorld);
  console.log("  riskRules:", pb.riskRules?.slice(0, 3).join("; "), "...");
  console.log("  mandatoryVisualRules:", pb.mandatoryVisualRules?.slice(0, 3).join("; "), "...");
  console.log("  avoidRules:", pb.avoidRules?.slice(0, 3).join("; "), "...");
  console.log("  copyRules:", pb.copyRules?.slice(0, 3).join("; "), "...");
  console.log("  variants:", pb.variants?.map((v) => v.name).join(", "));
  if (pb.styleWorldPromptHints) {
    console.log("  styleWorldPromptHints.visualDir:", pb.styleWorldPromptHints.visualDirectionAddendum.slice(0, 100) + "...");
    console.log("  styleWorldPromptHints.colorDir:", pb.styleWorldPromptHints.colorDirectionAddendum.slice(0, 100) + "...");
    console.log("  styleWorldPromptHints.sceneHints:", pb.styleWorldPromptHints.sceneHints.join(", "));
    console.log("  styleWorldPromptHints.lightingHints:", pb.styleWorldPromptHints.lightingHints.join(", "));
  }
  if ("inferredMode" in pb) {
    console.log("  inferredMode:", pb.inferredMode);
  }
  if ("emptyTemplatePlans" in pb && pb.emptyTemplatePlans) {
    console.log("  emptyTemplatePlans:");
    pb.emptyTemplatePlans.forEach((p, i) => {
      console.log(`    Plan ${i + 1}: type=${p.type}, mode=${p.mode}, styleId=${p.styleId}, layoutType=${p.layoutType}`);
      console.log(`      styleWorldId: ${p.styleWorldId}, copyMode: ${p.copyMode}`);
      console.log(`      desc: ${p.description.slice(0, 90)}...`);
    });
  }
}

function printTemplateV2Meta(st: SystemTemplate) {
  const cfg = st.configV2;
  if (!cfg) {
    console.log("  [Legacy template — no configV2]");
    return;
  }
  const sw = getStyleWorldById(cfg.preferredStyleWorlds[0]);
  console.log("  intent:", cfg.intent);
  console.log("  preferredStyleWorlds:", cfg.preferredStyleWorlds);
  console.log("  primaryStyleWorld:", sw?.id ?? "(fallback to legacy)", "|", sw?.label ?? "?");
  console.log("  preferredLayouts:", cfg.preferredLayouts);
  console.log("  defaultCopyMode:", cfg.defaultCopyMode);
  console.log("  headlineRequirement:", cfg.headlineRequirement);
  console.log("  defaultCreativeFreedom:", cfg.defaultCreativeFreedom);
  console.log("  productScaleStrategy:", cfg.productScaleStrategy);
  console.log("  safetyRules:", cfg.safetyRules);
  console.log("  conflictResolution:", cfg.conflictResolution || "(none)");
}

// ───────────────────────────────────────────────
// A. 空模板 / auto
// ───────────────────────────────────────────────
divider("A. 空模板 / auto — userGoal: 更高级，有设计感");
const goalA = "帮我做一张主图，更高级一点，背景可以有设计感，但不要改变产品结构。";
const pbA = buildEmptyPlanBrief(goalA, { productName: "硬质合金钻头", productType: "drill" });
summarizePlanBrief(pbA);

// ───────────────────────────────────────────────
// B. 白底主图（strict 关键词）
// ───────────────────────────────────────────────
divider("B. 白底主图 (tpl-white-bg-hero) — userGoal: 干净的电商主图");
const stB = getSystemTemplateProfile("tpl-white-bg-hero")!;
printTemplateV2Meta(stB);
console.log("\n  --- compat fields ---");
summarizeCompat(stB);
const pbB = buildPlanBriefFromSystemTemplate("tpl-white-bg-hero", "做一张干净的电商主图，产品完整展示，少量文字。");
summarizePlanBrief(pbB);

// ───────────────────────────────────────────────
// C. 白底主图 + 风格冲突（expressive 关键词）
// ───────────────────────────────────────────────
divider("C. 白底主图 + 用户风格冲突 (tpl-white-bg-hero) — userGoal: 不要纯白，要柔和渐变");
const stC = getSystemTemplateProfile("tpl-white-bg-hero")!;
printTemplateV2Meta(stC);
console.log("\n  conflictResolution:", stC.configV2?.conflictResolution);
console.log("  --- compat fields ---");
summarizeCompat(stC);
const pbC = buildPlanBriefFromSystemTemplate("tpl-white-bg-hero", "做一张主图，但不要纯白背景，希望有柔和渐变和高级质感。");
summarizePlanBrief(pbC);

// ───────────────────────────────────────────────
// D. 功能卖点说明图
// ───────────────────────────────────────────────
divider("D. 功能卖点说明图 (tpl-feature-explanation) — userGoal: 突出耐用锋利");
const stD = getSystemTemplateProfile("tpl-feature-explanation")!;
printTemplateV2Meta(stD);
console.log("\n  --- compat fields ---");
summarizeCompat(stD);
const pbD = buildPlanBriefFromSystemTemplate("tpl-feature-explanation", "做一张功能卖点图，突出耐用、锋利、精密加工，但不要像普通说明书。");
summarizePlanBrief(pbD);

// ───────────────────────────────────────────────
// E. 高端质感展示图
// ───────────────────────────────────────────────
divider("E. 高端质感展示图 (tpl-premium-luxury) — userGoal: 高级感+电影感");
const stE = getSystemTemplateProfile("tpl-premium-luxury")!;
printTemplateV2Meta(stE);
console.log("\n  --- compat fields ---");
summarizeCompat(stE);
const pbE = buildPlanBriefFromSystemTemplate("tpl-premium-luxury", "做一张高级感产品图，可以暗色、电影感、少文字。");
summarizePlanBrief(pbE);

// ───────────────────────────────────────────────
// F. 三方案差异测试
// ───────────────────────────────────────────────
divider("F. 三方案差异测试 (tpl-white-bg-hero, 同一输入)");
const goalF = "做一张产品详情图，突出材质、精密和高级感。";
const stF = getSystemTemplateProfile("tpl-white-bg-hero")!;
printTemplateV2Meta(stF);
console.log("\n  --- Plan Brief ---");
const pbF = buildPlanBriefFromSystemTemplate("tpl-white-bg-hero", goalF);
summarizePlanBrief(pbF);

// 展示 styleWorld pool 中每个 styleWorld 的详细差异
console.log("\n  --- StyleWorld Pool Diversity Check ---");
if (pbF?.styleStrategy.styleWorldPool) {
  pbF.styleStrategy.styleWorldPool.forEach((swId, i) => {
    const sw = getStyleWorldById(swId);
    console.log(`    [${i + 1}] ${swId} | ${sw?.label || "?"}`);
    console.log(`        visualDir: ${sw?.visualDirection?.slice(0, 80)}...`);
    console.log(`        colorDir: ${sw?.colorDirection?.slice(0, 80)}...`);
    console.log(`        typicalBackgrounds: ${sw?.typicalBackgrounds?.join(", ")}`);
    console.log(`        typicalLighting: ${sw?.typicalLighting?.join(", ")}`);
  });
}

console.log("\nDone.");
