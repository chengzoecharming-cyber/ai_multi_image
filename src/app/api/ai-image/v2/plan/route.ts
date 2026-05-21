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
import { applyTemplateRuleToPlan } from "./lib/template-rules";

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

          let plans = (result as CreativePlan[]).map((p) => normalizeCreativePlan(p));
          if (selectedTemplate && templatePrompt) {
            plans = plans.map((plan, index) => applyTemplateRuleToPlan(plan, selectedTemplate.id, index, templatePrompt));
          } else {
            plans.forEach((plan) => {
              plan.finalPrompt = plan.imageGenerationPrompt;
            });
          }
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

    if (selectedTemplate && templatePrompt) {
      return NextResponse.json({
        data: plans.map((plan, index) => applyTemplateRuleToPlan(plan, selectedTemplate.id, index, templatePrompt)),
        mode: "single",
      });
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
