import { NextRequest, NextResponse } from "next/server";
import type { CreativePlan, PlanArchetype } from "@/app/ai-image/v2/types";
import { getTemplateById } from "@/lib/plan-templates/store";
import type { PlanTemplate } from "@/lib/plan-templates/types";
import { imageUrlToBase64 } from "./lib/image-utils";
import { callLLM } from "./lib/llm-client";
import { detectTemplateArchetype } from "./lib/system-prompt";
import { normalizeCreativePlan } from "./lib/normalize";
import { analyzeProductImage } from "./lib/mock-analysis";
import { generateSinglePlans } from "./lib/mock-plans";

function extractTemplateVisualIdentity(templatePrompt: string): string {
  const lines = templatePrompt.split("\n");
  const result: string[] = [];
  let inMandatory = false;
  let inAvoid = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.includes("MANDATORY")) {
      inMandatory = true;
      inAvoid = false;
    }

    if (trimmed === "AVOID:") {
      inMandatory = false;
      inAvoid = true;
    }

    if (inMandatory || inAvoid) {
      if (trimmed.startsWith("Copy strategy")) {
        inMandatory = false;
        continue;
      }
      if (trimmed.startsWith("${")) {
        break;
      }
      if (trimmed) {
        result.push(line);
      }
    }
  }

  return result.join("\n").trim();
}

function extractKeyPhrases(templatePrompt: string): string[] {
  // Extract unique, specific visual keywords from the template to test
  // whether the LLM-generated prompt already contains template content.
  const phrases: string[] = [];
  const lines = templatePrompt.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Pick lines that contain specific visual directives
    if (
      trimmed.startsWith("-") &&
      (trimmed.includes("Background:") ||
        trimmed.includes("Lighting:") ||
        trimmed.includes("Depth of field:") ||
        trimmed.includes("Product treatment:") ||
        trimmed.includes("Color palette:") ||
        trimmed.includes("Text:"))
    ) {
      // Extract the first 4-6 words after the dash as a key phrase
      const content = trimmed.replace(/^-\s*/, "");
      const words = content.split(/\s+/).slice(0, 6).join(" ");
      if (words.length > 10) phrases.push(words);
    }
  }
  return phrases.slice(0, 3); // Check top 3 specific directives
}

function promptAlreadyContainsTemplate(
  imageGenPrompt: string,
  templatePrompt: string
): boolean {
  const keyPhrases = extractKeyPhrases(templatePrompt);
  if (keyPhrases.length === 0) return false;
  const promptLower = imageGenPrompt.toLowerCase();
  return keyPhrases.every((p) => promptLower.includes(p.toLowerCase()));
}

interface PlanRequest {
  mode: "single";
  rawProductImageUrl?: string;
  productImageUrl?: string; // backward compat
  productReferenceImageUrl?: string;
  styleReferenceUrls?: string[];
  userGoal?: string;
  goal?: string; // backward compat
  selectedTemplateId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PlanRequest;

    const userGoal = body.userGoal || body.goal || "";
    if (!userGoal || userGoal.trim().length < 3) {
      return NextResponse.json(
        { error: "请输入有效的制图目标描述" },
        { status: 400 }
      );
    }

    const mode = body.mode || "single";
    if (mode !== "single") {
      return NextResponse.json(
        { error: "已下线「5张详情组图」模式，请使用单图方案生成" },
        { status: 400 }
      );
    }
    const rawProductImageUrl = body.rawProductImageUrl || body.productImageUrl || "";

    // Get template if selected
    let templatePrompt: string | undefined;
    let selectedTemplate: PlanTemplate | undefined = undefined;
    if (body.selectedTemplateId) {
      selectedTemplate = getTemplateById(body.selectedTemplateId);
      if (selectedTemplate) {
        templatePrompt = selectedTemplate.templatePrompt;
        // Simple variable substitution — frontend has no variable input UI yet
        templatePrompt = templatePrompt
          .replace(/\{\{product_name\}\}/g, userGoal.split(/[，,\.\s]/)[0] || "the product")
          .replace(/\{\{detail_focus\}\}/g, userGoal || "product detail");
        console.log("[Plan] using template:", selectedTemplate.id, selectedTemplate.name);
      } else {
        console.log("[Plan] template not found:", body.selectedTemplateId);
      }
    } else {
      console.log("[Plan] no template selected");
    }

    // Try LLM (Volcano Engine / Kimi)
    const apiKey = process.env.VOLCANO_API_KEY || process.env.KIMI_API_KEY;
    if (apiKey && apiKey !== "sk-your-kimi-key-here") {
      try {
        const base64Image = await imageUrlToBase64(rawProductImageUrl);
        if (base64Image) {
          const result = await callLLM(base64Image, userGoal, "single", templatePrompt, body.selectedTemplateId);

          const plans = (result as CreativePlan[]).map((p) => {
            const plan = normalizeCreativePlan(p);
            // Inject template visual identity into imageGenerationPrompt
            // ONLY if the LLM didn't already embed template content.
            // normalize.ts now preserves LLM-generated prompts, so we must avoid
            // double-injecting and destroying the LLM's carefully crafted prompt.
            if (selectedTemplate && plan.imageGenerationPrompt && templatePrompt) {
              const alreadyHasTemplate = promptAlreadyContainsTemplate(
                plan.imageGenerationPrompt,
                templatePrompt
              );
              if (alreadyHasTemplate) {
                console.log("[Plan] LLM prompt already contains template content — skipping injection for plan:", plan.planName);
              } else {
                const templateIdentity = extractTemplateVisualIdentity(templatePrompt);
                if (templateIdentity) {
                  plan.imageGenerationPrompt = `=== MANDATORY VISUAL IDENTITY (OVERRIDE ALL GENERIC INSTRUCTIONS) ===\n${templateIdentity}\n=== END MANDATORY VISUAL IDENTITY ===\n\n${plan.imageGenerationPrompt}`;
                  console.log("[Plan] injected template visual identity into imageGenerationPrompt for plan:", plan.planName);
                }
              }
            }
            // CRITICAL: finalPrompt must always match imageGenerationPrompt because
            // the frontend generate API sends finalPrompt to the image generator.
            plan.finalPrompt = plan.imageGenerationPrompt;
            return plan;
          });
          return NextResponse.json({ data: plans, mode: "single" });
        }
      } catch (e) {
        console.error("[LLM] failed, fallback to mock:", e);
      }
    }

    // Fallback: mock generation
    await new Promise((resolve) => setTimeout(resolve, 500));

    const analysis = analyzeProductImage(rawProductImageUrl, userGoal);

    // When a template is selected, force the mock plans to use the template's archetype
    const forcedArchetype = selectedTemplate
      ? (detectTemplateArchetype(selectedTemplate.id) as PlanArchetype)
      : undefined;
    const plans = generateSinglePlans(analysis, userGoal, forcedArchetype);

    // Inject template visual identity into mock plans too
    if (selectedTemplate && templatePrompt) {
      const templateIdentity = extractTemplateVisualIdentity(templatePrompt);
      for (const plan of plans) {
        if (templateIdentity && plan.imageGenerationPrompt) {
          plan.imageGenerationPrompt = `=== MANDATORY VISUAL IDENTITY (OVERRIDE ALL GENERIC INSTRUCTIONS) ===\n${templateIdentity}\n=== END MANDATORY VISUAL IDENTITY ===\n\n${plan.imageGenerationPrompt}`;
        }
        plan.finalPrompt = plan.imageGenerationPrompt;
      }
    }

    return NextResponse.json({ data: plans, mode: "single" });
  } catch (error) {
    console.error("Plan generation failed:", error);
    return NextResponse.json(
      { error: "生成方案失败，请稍后重试" },
      { status: 500 }
    );
  }
}
