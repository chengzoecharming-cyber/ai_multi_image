import type { CreativePlan, ImageSetPlan } from "@/app/ai-image/v2/types";
import { buildSystemPrompt } from "./system-prompt";

export const LLM_API_URL = process.env.LLM_API_URL || "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
// 日志证明 seed-2-0-lite 60s 内完不成，seed-1-6 也不稳定，
// flash 单独跑只要 ~42s，所以直接用 flash 做主模型，去掉串行 fallback。
export const LLM_MODEL = process.env.LLM_MODEL || "doubao-seed-1-6-flash-250615";

// 如需 fallback，改为并行调用（串行会时间叠加踩前端超时）
export const FALLBACK_VISION_MODELS: string[] = [];

export async function tryCallLLM(
  base64Image: string,
  userGoal: string,
  mode: "single" | "set",
  templatePrompt: string | undefined,
  model: string
): Promise<{ plans?: CreativePlan[]; sets?: ImageSetPlan[] }> {
  const apiKey = process.env.VOLCANO_API_KEY || process.env.KIMI_API_KEY;
  if (!apiKey) {
    throw new Error("LLM API key not configured (set VOLCANO_API_KEY or KIMI_API_KEY)");
  }

  const systemPrompt = buildSystemPrompt(mode, templatePrompt);

  // Per-model timeout: 60 seconds for vision model to analyze image + generate structured JSON
  const ctrl = new AbortController();
  const perModelTimeout = setTimeout(() => ctrl.abort(), 60000);

  const res = await fetch(LLM_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: base64Image },
            },
            {
              type: "text",
              text: `用户需求：${userGoal}\n制图模式：${mode === "single" ? "单张图（生成3个不同风格的单图方案）" : "五张详情组图（生成1套包含5张图的详情页组图方案）"}\n\n请严格按照 system prompt 中的 JSON 格式返回。`,
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 1.0,
      max_tokens: 8192,
      thinking: { type: "disabled" },
    }),
    signal: ctrl.signal,
  });
  clearTimeout(perModelTimeout);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`LLM API error ${res.status}: ${JSON.stringify(errorData)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned empty content");
  }

  return JSON.parse(content) as {
    mode?: string;
    plans?: CreativePlan[];
    sets?: ImageSetPlan[];
  };
}

export async function callLLM(
  base64Image: string,
  userGoal: string,
  mode: "single" | "set",
  templatePrompt?: string
): Promise<CreativePlan[] | ImageSetPlan[]> {
  console.log(`[LLM] using model: ${LLM_MODEL}`);
  const parsed = await tryCallLLM(base64Image, userGoal, mode, templatePrompt, LLM_MODEL);

  if (mode === "single") {
    if (!parsed.plans || !Array.isArray(parsed.plans)) {
      throw new Error("LLM response missing 'plans' array");
    }
    console.log(`[LLM] success`);
    return parsed.plans;
  } else {
    if (!parsed.sets || !Array.isArray(parsed.sets) || parsed.sets.length === 0) {
      throw new Error("LLM response missing 'sets' array");
    }
    console.log(`[LLM] success`);
    return parsed.sets;
  }
}
