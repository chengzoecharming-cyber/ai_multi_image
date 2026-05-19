import { NextRequest, NextResponse } from "next/server";
import type { CreativePlan, ImageSetPlan } from "@/app/ai-image/v2/types";
import { getTemplateById } from "@/lib/plan-templates/store";
import { imageUrlToBase64 } from "./lib/image-utils";
import { callLLM } from "./lib/llm-client";
import { normalizeCreativePlan, normalizeImageSetPlan } from "./lib/normalize";
import { analyzeProductImage } from "./lib/mock-analysis";
import { generateSinglePlans, generateSetPlans } from "./lib/mock-plans";

interface PlanRequest {
  mode: "single" | "set";
  rawProductImageUrl?: string;
  productImageUrl?: string; // backward compat
  productReferenceImageUrl?: string;
  styleReferenceUrls?: string[];
  userGoal?: string;
  goal?: string; // backward compat
  selectedTemplateId?: string;
  basePlan?: CreativePlan;
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
    const rawProductImageUrl = body.rawProductImageUrl || body.productImageUrl || "";

    // Get template if selected
    let templatePrompt: string | undefined;
    if (body.selectedTemplateId) {
      const template = getTemplateById(body.selectedTemplateId);
      if (template) {
        templatePrompt = template.templatePrompt;
      }
    }

    // Try LLM (Volcano Engine / Kimi)
    const apiKey = process.env.VOLCANO_API_KEY || process.env.KIMI_API_KEY;
    if (apiKey && apiKey !== "sk-your-kimi-key-here") {
      try {
        const base64Image = await imageUrlToBase64(rawProductImageUrl);
        if (base64Image) {
          const result = await callLLM(base64Image, userGoal, mode, templatePrompt);

          if (mode === "set") {
            const sets = (result as ImageSetPlan[]).map((s) => normalizeImageSetPlan(s));
            return NextResponse.json({ data: sets, mode: "set" });
          } else {
            const plans = (result as CreativePlan[]).map((p) => normalizeCreativePlan(p));
            return NextResponse.json({ data: plans, mode: "single" });
          }
        }
      } catch (e) {
        console.error("[LLM] failed, fallback to mock:", e);
      }
    }

    // Fallback: mock generation
    await new Promise((resolve) => setTimeout(resolve, mode === "set" ? 800 : 500));

    const analysis = analyzeProductImage(rawProductImageUrl, userGoal);

    if (mode === "set") {
      const sets = generateSetPlans(analysis, userGoal);
      return NextResponse.json({ data: sets, mode: "set" });
    } else {
      const plans = generateSinglePlans(analysis, userGoal);
      return NextResponse.json({ data: plans, mode: "single" });
    }
  } catch (error) {
    console.error("Plan generation failed:", error);
    return NextResponse.json(
      { error: "生成方案失败，请稍后重试" },
      { status: 500 }
    );
  }
}
