import { getTemplateById } from "../src/lib/plan-templates/store";

const template = getTemplateById("tpl-lifestyle-scene");
if (!template) {
  console.log("Template not found");
  process.exit(1);
}

console.log("\n========== OLD TEMPLATE PROMPT ==========\n");
console.log(template.templatePrompt);
console.log("\n========== END OLD TEMPLATE PROMPT ==========\n");
