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
  briefPrompt: string | undefined,
  model: string,
  templateId?: string,
  requestId?: string
): Promise<{ plans?: CreativePlan[]; sets?: ImageSetPlan[] }> {
  const apiKey = process.env.VOLCANO_API_KEY || process.env.KIMI_API_KEY;
  if (!apiKey) {
    throw new Error("LLM API key not configured (set VOLCANO_API_KEY or KIMI_API_KEY)");
  }

  const systemPrompt = buildSystemPrompt(mode, templateId);

  // Per-model timeout: keep below frontend 120s, but allow enough time for vision + JSON planning.
  const ctrl = new AbortController();
  const perModelTimeout = setTimeout(() => ctrl.abort(), 110000);

  const llmStart = Date.now();
  let res: Response;
  try {
    res = await fetch(LLM_API_URL, {
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
                text: (() => {
                  const header = templateId
                    ? `[CRITICAL] 首先通过视觉分析图片中的产品形状、结构和可见特征来确定产品身份。图片是产品识别的唯一权威。\n用户需求：${userGoal}\n制图模式：单张图（基于已选模板生成3个方案）\n\n请严格按照 system prompt 的 JSON 结构返回。3个方案必须明显不同（布局/光影/背景/节奏），但都要遵守模板用途与约束。`
                    : `[CRITICAL] 首先通过视觉分析图片中的产品形状、结构和可见特征来确定产品身份。图片是产品识别的唯一权威。\n用户需求：${userGoal}\n制图模式：${mode === "single" ? "单张图（生成3个不同风格的单图方案）" : "五张详情组图（生成1套包含5张图的详情页组图方案）"}\n\n请严格按照 system prompt 中的 JSON 格式返回。`;
                  if (!briefPrompt) return header;
                  return `${header}\n\n=== PLAN BRIEF (MUST FOLLOW) ===\n${briefPrompt}`;
                })(),
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: templateId ? 0.65 : 0.9,
        max_tokens: 8192,
        thinking: { type: "disabled" },
      }),
      signal: ctrl.signal,
    });
  } catch (error) {
    const durationMs = Date.now() - llmStart;
    const err = error as Error;
    const tag = requestId ? `[LLM][${requestId}]` : "[LLM]";
    if (err.name === "AbortError") {
      console.error(`${tag} timeout after ${durationMs}ms (per-model timeout: 60000ms)`);
      throw new Error(`LLM request timeout after ${durationMs}ms`);
    }
    console.error(`${tag} request failed after ${durationMs}ms:`, err.message);
    throw error;
  } finally {
    clearTimeout(perModelTimeout);
  }
  const llmDurationMs = Date.now() - llmStart;
  console.log(`${requestId ? `[LLM][${requestId}]` : "[LLM]"} response received in ${llmDurationMs}ms`);

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
  briefPrompt?: string,
  templateId?: string,
  requestId?: string
): Promise<CreativePlan[] | ImageSetPlan[]> {
  const tag = requestId ? `[LLM][${requestId}]` : "[LLM]";
  console.log(`${tag} using model: ${LLM_MODEL}`);
  const parsed = await tryCallLLM(base64Image, userGoal, mode, briefPrompt, LLM_MODEL, templateId, requestId);

  if (mode === "single") {
    if (!parsed.plans || !Array.isArray(parsed.plans)) {
      throw new Error("LLM response missing 'plans' array");
    }
    console.log(`${tag} success (plans: ${parsed.plans.length})`);
    return parsed.plans;
  } else {
    if (!parsed.sets || !Array.isArray(parsed.sets) || parsed.sets.length === 0) {
      throw new Error("LLM response missing 'sets' array");
    }
    console.log(`${tag} success (sets: ${parsed.sets.length})`);
    return parsed.sets;
  }
}
