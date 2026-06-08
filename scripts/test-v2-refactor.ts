/**
 * 验证 v2 prompt 重构是否正确
 * 运行: cd ai-image-mvp && npx tsx scripts/test-v2-refactor.ts
 */

// ===== 1. system-prompt.ts =====
import { buildSystemPrompt } from "../src/app/api/ai-image/v2/plan/lib/system-prompt";

const sysPrompt = buildSystemPrompt("single", undefined);
console.log("=== SYSTEM PROMPT LENGTH ===", sysPrompt.length);
console.log("=== CONTAINS industrial ===", sysPrompt.toLowerCase().includes("industrial"));
console.log("=== CONTAINS 电商 ===", sysPrompt.includes("电商"));
console.log("=== CONTAINS fixed color strategy ===", /color strategy|配色策略/.test(sysPrompt));
console.log("=== CONTAINS archetype DIFFERENT ===", /must use DIFFERENT archetypes/.test(sysPrompt));
console.log("=== CONTAINS user intent priority ===", sysPrompt.includes("用户意图是最高优先级"));
console.log("=== CONTAINS no watermark ===", sysPrompt.includes("水印"));
console.log("=== FIRST 500 CHARS ===\n", sysPrompt.slice(0, 500));
console.log();

// ===== 2. brief-prompt-builder.ts =====
import { buildPromptFromBrief } from "../src/app/api/ai-image/v2/plan/lib/brief-prompt-builder";
import type { PlanBrief } from "../src/app/ai-image/v2/domain/plan-brief";

const mockBrief: PlanBrief = {
  sourceType: "empty",
  sourceId: "auto",
  imageType: "auto",
  allowedLayoutTypes: [],
  defaultCopyDensity: "rich",
  riskRules: [],
  styleStrategy: { mode: "free", pool: [], count: 3 },
  variants: [],
  userGoal: "生成一张电商主图",
};

const briefPrompt = buildPromptFromBrief(mockBrief, { userInput: "生成一张电商主图", mode: "generate" });
console.log("=== BRIEF PROMPT LENGTH ===", briefPrompt.length);
console.log("=== CONTAINS perPlanDensityTargets ===", briefPrompt.includes("informationDensity = low"));
console.log("=== CONTAINS 版式约束 ===", briefPrompt.includes("版式约束"));
console.log("=== CONTAINS 视觉硬约束 ===", briefPrompt.includes("视觉硬约束"));
console.log("=== CONTAINS 用户意图优先 ===", briefPrompt.includes("用户意图"));
console.log("=== FIRST 800 CHARS ===\n", briefPrompt.slice(0, 800));
console.log();

// ===== 3. prompt-builders.ts =====
import { buildImageGenerationPrompt } from "../src/app/api/ai-image/v2/plan/lib/prompt-builders";
import type { CreativePlan } from "../src/app/ai-image/v2/types";

const mockPlan: CreativePlan = {
  id: "test-plan",
  planName: "Test Plan",
  planArchetype: "product_hero",
  templateId: "",
  imageType: "product_showcase",
  productName: "Test Product",
  headline: "PREMIUM QUALITY",
  subtitle: "Built to Last",
  sellingPoints: ["Durable", "Reliable"],
  copyBlocks: [
    { id: "cb-1", title: "PREMIUM QUALITY", role: "headline", priority: 1 },
    { id: "cb-2", title: "Built to Last", role: "subheadline", priority: 2 },
    { id: "cb-3", title: "DURABLE", role: "feature_point", priority: 3, body: "Long lasting material" },
  ],
  visualDirection: "Clean studio lighting",
  colorDirection: "Blue and white",
  layoutDirection: "Product centered",
  visualComplexity: "simple",
  informationDensity: "low",
  copySource: "auto",
  riskWarnings: [],
  productAnalysis: {
    productName: "Test Product",
    productType: "General",
    productSubjectDescription: "A test product",
    visibleFeatures: ["body"],
    structureRisks: ["preserve shape"],
    detectedNonProductElements: [],
    isolationInstruction: "isolate",
  },
};

const imgPrompt = buildImageGenerationPrompt(mockPlan);
console.log("=== IMAGE GEN PROMPT LENGTH ===", imgPrompt.length);
console.log("=== CONTAINS HEADLINE RENDERING ===", imgPrompt.includes("HEADLINE RENDERING"));
console.log("=== CONTAINS FEATURE POINT RENDERING ===", imgPrompt.includes("FEATURE POINT RENDERING"));
console.log("=== CONTAINS layoutOverlay ===", imgPrompt.includes("Layout Type:"));
console.log("=== CONTAINS model should decide ===", imgPrompt.includes("model should decide"));
console.log("=== FIRST 800 CHARS ===\n", imgPrompt.slice(0, 800));
console.log();

// ===== 4. template-rules.ts =====
import { getTemplateRulePrompt } from "../src/app/api/ai-image/v2/plan/lib/template-rules";

const tplPrompt = getTemplateRulePrompt("tpl-product-hero");
console.log("=== TEMPLATE RULE PROMPT ===");
console.log(tplPrompt || "(empty - template may not exist)");
console.log("=== CONTAINS MUST FOLLOW ===", tplPrompt.includes("MUST FOLLOW"));
console.log();

// ===== 5. plan-brief/builder.ts =====
import { buildEmptyPlanBrief } from "../src/app/ai-image/v2/domain/plan-brief/builder";

const emptyBrief = buildEmptyPlanBrief("生成一张漂亮的产品图", { productName: "螺丝刀", productType: "工具" });
console.log("=== EMPTY BRIEF inferredMode ===", emptyBrief.inferredMode);
console.log("=== EMPTY BRIEF emptyTemplatePlans ===");
console.log(JSON.stringify(emptyBrief.emptyTemplatePlans, null, 2));
console.log();

// ===== Summary =====
console.log("===== SUMMARY =====");
const checks = [
  { name: "system prompt < 4000 chars", pass: sysPrompt.length < 4000 },
  { name: "no industrial in system prompt", pass: !sysPrompt.toLowerCase().includes("industrial") },
  { name: "no fixed density gradient in brief", pass: !briefPrompt.includes("informationDensity = low") },
  { name: "no 版式约束 section in brief", pass: !briefPrompt.includes("版式约束") },
  { name: "no role rendering rules in image prompt", pass: !imgPrompt.includes("HEADLINE RENDERING") },
  { name: "no layoutOverlay in image prompt", pass: !imgPrompt.includes("Layout Type:") },
  { name: "empty brief mode is free", pass: emptyBrief.emptyTemplatePlans?.every((p: { mode: string }) => p.mode === "free") ?? false },
];

let allPass = true;
for (const c of checks) {
  const status = c.pass ? "PASS" : "FAIL";
  console.log(`[${status}] ${c.name}`);
  if (!c.pass) allPass = false;
}

if (allPass) {
  console.log("\nAll checks passed!");
  process.exit(0);
} else {
  console.log("\nSome checks failed.");
  process.exit(1);
}
