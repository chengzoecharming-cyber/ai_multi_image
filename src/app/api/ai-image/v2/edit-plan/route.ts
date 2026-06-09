import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { CreativePlan } from "@/app/ai-image/v2/types";
import {
  buildPlanBriefFromSystemTemplate,
  buildEmptyPlanBrief,
} from "@/app/ai-image/v2/domain/plan-brief";
import { buildPromptFromBrief } from "../plan/lib/brief-prompt-builder";
import { LLM_API_URL, LLM_MODEL } from "../plan/lib/llm-client";

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}

interface EditPlanRequest {
  plan: CreativePlan;
  instruction: string;
}

function safeTrim(s: unknown): string {
  return typeof s === "string" ? s.trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const body = (await request.json()) as EditPlanRequest;
    const instruction = safeTrim(body.instruction);
    const plan = body.plan as CreativePlan | undefined;

    if (!plan || typeof plan !== "object") {
      return NextResponse.json({ error: "缺少 plan" }, { status: 400 });
    }
    if (!instruction) {
      return NextResponse.json({ error: "请输入编辑指令" }, { status: 400 });
    }

    const apiKey = process.env.VOLCANO_API_KEY || process.env.KIMI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "未配置 LLM API Key" }, { status: 500 });
    }

    // Build PlanBrief from the plan's template (or empty fallback)
    let briefPrompt = "";
    try {
      const planBrief = plan.templateId
        ? buildPlanBriefFromSystemTemplate(plan.templateId, plan.productName || "")
        : buildEmptyPlanBrief(plan.productName || "");
      if (planBrief) {
        briefPrompt = buildPromptFromBrief(planBrief, {
          userInput: plan.productName || "",
          mode: "edit",
        });
      }
    } catch (e) {
      // Graceful fallback: briefPrompt remains empty
      if (process.env.NODE_ENV !== "production") {
        console.debug("[EditPlanBrief] failed to build prompt:", e);
      }
    }

    const systemPrompt = [
      `You are an assistant that edits a structured CreativePlan JSON for an e-commerce image plan.`,
      `Return ONLY valid JSON with a single top-level key "plan".`,
      ``,
      `ABSOLUTE PRIORITY RULE:`,
      `The user's instruction is the HIGHEST authority. If the user says "only change X" or "keep everything else the same", you MUST comply strictly.`,
      `You must NOT add new elements (headlines, feature points, badges, icons, etc.) that the user did not explicitly request.`,
      `You must NOT remove existing elements unless the user explicitly asks to remove them.`,
      `You must NOT broaden the scope of the edit. If the user wants to change just one text label, change ONLY that label.`,
      ``,
      `Rules:`,
      `- Preserve product identity: do NOT invent a different product.`,
      `- Keep the plan.id unchanged.`,
      `- Apply user's instruction by updating relevant fields (headline/subtitle/sellingPoints/copyBlocks/layoutDirection/visualDirection/colorDirection/layoutOverlay/riskWarnings).`,
      `- Keep productAnalysis if present; do not remove it.`,
      `- Keep text language English; user will see Chinese explanation elsewhere.`,
      `- If a field is not mentioned, keep it as-is.`,
      briefPrompt ? `\n${briefPrompt}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch(LLM_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `User instruction:\n${instruction}` },
              { type: "text", text: `Current plan JSON:\n${JSON.stringify(plan)}` },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 4096,
        thinking: { type: "disabled" },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: `LLM API 错误: ${JSON.stringify(err)}` }, { status: 502 });
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "LLM 返回为空" }, { status: 502 });
    }

    const parsed = JSON.parse(content) as { plan?: CreativePlan };
    if (!parsed.plan) {
      return NextResponse.json({ error: "LLM 返回缺少 plan" }, { status: 502 });
    }
    if (parsed.plan.id !== plan.id) {
      // hard guard: keep original id
      parsed.plan.id = plan.id;
    }

    return NextResponse.json({ data: parsed.plan });
  } catch (e) {
    console.error("Edit plan failed:", e);
    return NextResponse.json({ error: "编辑失败" }, { status: 500 });
  }
}

