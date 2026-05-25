import { buildPlanBriefFromSystemTemplate } from "../src/app/ai-image/v2/domain/plan-brief";
import { buildPromptFromBrief } from "../src/app/api/ai-image/v2/plan/lib/brief-prompt-builder";
import { getTemplateById } from "../src/lib/plan-templates/store";

const templateId = "tpl-white-bg-hero";
const userGoal = "生成中心轴件的主图";

const brief = buildPlanBriefFromSystemTemplate(templateId, userGoal);
if (!brief) {
  console.log("Failed to build brief for template:", templateId);
  process.exit(1);
}

const briefPrompt = buildPromptFromBrief(brief, { userInput: userGoal });

const template = getTemplateById(templateId);

console.log("\n========== OLD TEMPLATE PROMPT ==========\n");
console.log(template?.templatePrompt || "NOT FOUND");
console.log("\n========== END OLD TEMPLATE PROMPT ==========\n");

console.log("\n========== BRIEF PROMPT ==========\n");
console.log(briefPrompt);
console.log("\n========== END BRIEF PROMPT ==========\n");
