import {
  buildEmptyPlanBrief,
  buildPlanBriefFromDetailAsset,
  buildPlanBriefFromSystemTemplate,
} from "../src/app/ai-image/v2/domain/plan-brief";
import type { PlanBrief } from "../src/app/ai-image/v2/domain/plan-brief";
import type { V2DetailType } from "../src/app/ai-image/v2/domain/detail-assets";
import { DETAIL_ASSET_PROFILES } from "../src/app/ai-image/v2/domain/detail-assets";
import { SYSTEM_TEMPLATE_PROFILES } from "../src/app/ai-image/v2/domain/templates";
import { buildPromptFromBrief } from "../src/app/api/ai-image/v2/plan/lib/brief-prompt-builder";

const sourceArg = process.argv[2] || "empty";
const userGoal = process.argv.slice(3).join(" ") || "生成中心轴件的主图";

function printUsage() {
  console.log(`
Usage:
  npx tsx scripts/debug-prompt.ts empty "生成中心轴件的主图"
  npx tsx scripts/debug-prompt.ts template:tpl-white-bg-hero "生成中心轴件的主图"
  npx tsx scripts/debug-prompt.ts detail:feature "生成中心轴件的卖点图"

Available templates:
${Object.keys(SYSTEM_TEMPLATE_PROFILES).map((id) => `  - ${id}`).join("\n")}

Available detail asset types:
${Object.keys(DETAIL_ASSET_PROFILES).map((id) => `  - ${id}`).join("\n")}
`.trim());
}

function buildBrief(): PlanBrief | null {
  if (sourceArg === "help" || sourceArg === "--help" || sourceArg === "-h") {
    printUsage();
    process.exit(0);
  }

  if (sourceArg === "empty") {
    return buildEmptyPlanBrief(userGoal);
  }

  if (sourceArg.startsWith("template:")) {
    const templateId = sourceArg.slice("template:".length);
    return buildPlanBriefFromSystemTemplate(templateId, userGoal);
  }

  if (sourceArg.startsWith("detail:")) {
    const detailType = sourceArg.slice("detail:".length) as V2DetailType;
    return buildPlanBriefFromDetailAsset(detailType, userGoal);
  }

  return buildPlanBriefFromSystemTemplate(sourceArg, userGoal);
}

const brief = buildBrief();
if (!brief) {
  console.log("Failed to build brief for source:", sourceArg);
  console.log("");
  printUsage();
  process.exit(1);
}

const briefPrompt = buildPromptFromBrief(brief, { userInput: userGoal });

console.log("\n========== PLAN BRIEF ==========\n");
console.log(JSON.stringify({
  sourceType: brief.sourceType,
  sourceId: brief.sourceId,
  imageType: brief.imageType,
  allowedLayoutTypes: brief.allowedLayoutTypes,
  defaultCopyDensity: brief.defaultCopyDensity,
  styleStrategy: brief.styleStrategy,
  variantCount: brief.variants.length,
}, null, 2));

console.log("\n========== BRIEF PROMPT ==========\n");
console.log(briefPrompt);
console.log("\n========== END BRIEF PROMPT ==========\n");
