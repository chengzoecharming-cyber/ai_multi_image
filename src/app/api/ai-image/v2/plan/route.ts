import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { CreativePlan, PlanArchetype } from "@/app/ai-image/v2/types";
import { imageUrlToBase64 } from "./lib/image-utils";
import { callLLM } from "./lib/llm-client";
import { detectTemplateArchetype } from "./lib/system-prompt";
import { normalizeCreativePlan } from "./lib/normalize";
import { analyzeProductImage } from "./lib/mock-analysis";
import { generateSinglePlans } from "./lib/mock-plans";
import { applyTemplateRuleToPlan } from "./lib/template-rules";
import {
  buildEmptyPlanBrief,
  buildPlanBriefFromSystemTemplate,
  type PlanBrief,
} from "@/app/ai-image/v2/domain/plan-brief";
import { buildPromptFromBrief } from "./lib/brief-prompt-builder";

async function getAuthUserId(request: NextRequest): Promise<string | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}

interface PlanRequest {
  mode: "single";
  rawProductImageUrl?: string;
  productImageUrl?: string; // backward compat
  productReferenceImageUrl?: string;
  productImageUrls?: string[];
  styleReferenceUrls?: string[];
  userGoal?: string;
  goal?: string; // backward compat
  selectedTemplateId?: string;
  clientRequestId?: string;
  /** 调试开关：在响应中额外返回 briefPrompt */
  debugBriefPrompt?: boolean;
}

function toUpperWords(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9\s\-&]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function sanitizeRiskyCopy(text: string): string {
  // Avoid implied technical guarantees unless user explicitly provided them.
  return text
    .replace(/\bheavy loads?\b/gi, "demanding use")
    .replace(/\bload[-\s]?bearing\b/gi, "reliable fit")
    .replace(/\btorque\b/gi, "performance")
    .replace(/\bhardness\b/gi, "durability")
    .replace(/\bhigh[-\s]?grade\b/gi, "premium");
}

function ensurePlanSkeleton(plans: CreativePlan[]): CreativePlan[] {
  return plans.map((plan) => {
    const blocks = Array.isArray(plan.copyBlocks) ? plan.copyBlocks : [];
    const headline = String(plan.headline || "").trim();
    const subtitle = plan.subtitle ? String(plan.subtitle).trim() : "";

    // Only ADD missing essential blocks, NEVER remove or overwrite existing ones.
    const result: typeof blocks = [...blocks];

    // Ensure headline exists
    const hasHeadline = result.some((b) => b.role === "headline");
    if (!hasHeadline && headline) {
      result.unshift({ id: "cb-headline", title: toUpperWords(headline), role: "headline", priority: 1 });
    }

    // Ensure subheadline exists
    const hasSub = result.some((b) => b.role === "subheadline");
    if (!hasSub && subtitle) {
      // Insert after headline
      const headlineIdx = result.findIndex((b) => b.role === "headline");
      const insertIdx = headlineIdx >= 0 ? headlineIdx + 1 : 0;
      result.splice(insertIdx, 0, { id: "cb-subheadline", title: sanitizeRiskyCopy(subtitle), role: "subheadline", priority: 2 });
    }

    // Non-template mode should stay open and review-first:
    // do not auto-inject feature points or bottom bars.

    plan.copyBlocks = result;
    return plan;
  });
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const body = (await request.json()) as PlanRequest;
    const requestId =
      body.clientRequestId?.trim() ||
      `plan-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const routeStart = Date.now();
    const log = (msg: string, extra?: unknown) => {
      if (extra !== undefined) {
        console.log(`[Plan][${requestId}] ${msg}`, extra);
      } else {
        console.log(`[Plan][${requestId}] ${msg}`);
      }
    };
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
    const extraProductImageUrls = Array.isArray(body.productImageUrls)
      ? body.productImageUrls.filter((u): u is string => typeof u === "string" && u.trim().length > 0 && u !== rawProductImageUrl)
      : [];
    const styleReferenceUrls = Array.isArray(body.styleReferenceUrls)
      ? body.styleReferenceUrls.filter((u): u is string => typeof u === "string" && u.trim().length > 0 && u !== rawProductImageUrl)
      : [];
    const supplementalImageUrls = [...extraProductImageUrls, ...styleReferenceUrls].slice(0, 5);
    log("request received", {
      hasTemplate: Boolean(body.selectedTemplateId),
      hasRawImage: Boolean(rawProductImageUrl),
      extraImageCount: supplementalImageUrls.length,
      goalLength: userGoal.trim().length,
    });

    // Template selection is used for archetype detection and rule enforcement
    const selectedTemplateId = body.selectedTemplateId;
    if (selectedTemplateId) {
      console.log("[Plan] using template:", selectedTemplateId);
    } else {
      console.log("[Plan] no template selected");
    }

    // ── Build PlanBrief prompt ──
    let planBrief: PlanBrief | null = null;
    let briefPrompt: string | undefined;
    try {
      planBrief = body.selectedTemplateId
        ? buildPlanBriefFromSystemTemplate(body.selectedTemplateId, userGoal)
        : buildEmptyPlanBrief(userGoal);

      if (planBrief) {
        briefPrompt = buildPromptFromBrief(planBrief, { userInput: userGoal });
        if (process.env.NODE_ENV !== "production") {
          console.debug(
            "[PlanBrief] prompt generated:",
            planBrief.sourceType,
            planBrief.sourceId,
            "length:",
            briefPrompt.length
          );
        }
      } else if (process.env.NODE_ENV !== "production") {
        console.debug("[PlanBrief] no brief matched:", body.selectedTemplateId);
      }
    } catch (e) {
      // 吞掉错误，不影响旧逻辑
      if (process.env.NODE_ENV !== "production") {
        console.debug("[PlanBrief] failed to build prompt:", e);
      }
    }

    // 安全判断：是否允许返回完整 prompt
    const isDebugAllowed = process.env.NODE_ENV !== "production" || process.env.ENABLE_AI_IMAGE_DEBUG === "true";
    const showFullPrompt = isDebugAllowed && body.debugBriefPrompt;

    // 构建 debug 对象：默认返回 length，完整内容只在安全环境下返回
    const debugPayload = (() => {
      const base: Record<string, unknown> = {
        selectedTemplateId: selectedTemplateId ?? null,
      };
      if (planBrief) {
        base.briefSourceType = planBrief.sourceType;
        base.briefSourceId = planBrief.sourceId;
        base.briefImageType = planBrief.imageType;
        base.briefLayoutCount = planBrief.allowedLayoutTypes.length;
        base.briefVariantCount = planBrief.variants.length;
        base.briefStyleMode = planBrief.styleStrategy.mode;
      }
      if (briefPrompt) {
        base.briefPromptLength = briefPrompt.length;
      }
      // 只有安全环境 + 显式请求时才返回完整 prompt
      if (showFullPrompt) {
        if (briefPrompt) base.briefPrompt = briefPrompt;
      }
      return briefPrompt ? { debug: base } : {};
    })();

    // Try LLM (Volcano Engine / Kimi / chatgpt2api-compatible proxy)
    //
    // NOTE: llm-client.ts falls back to AUTH_KEY="chatgpt2api" when NEXT_PUBLIC_CHATGPT2API_KEY is unset.
    // A prior merge added a stricter check here (requiring an explicit key), which causes the route to
    // skip the real LLM path and always enter mock fallback on servers that rely on the default proxy key.
    const proxyAuthKey = process.env.NEXT_PUBLIC_CHATGPT2API_KEY || "chatgpt2api";
    const hasProxyUrl = Boolean(process.env.LLM_API_URL || process.env.NEXT_PUBLIC_CHATGPT2API_URL);
    const apiKey =
      process.env.VOLCANO_API_KEY ||
      process.env.KIMI_API_KEY ||
      (hasProxyUrl ? proxyAuthKey : undefined);

    // Guard against common placeholder keys.
    const isPlaceholderKey = apiKey === "sk-your-kimi-key-here";
    if (apiKey && !isPlaceholderKey) {
      try {
        const imageStart = Date.now();
        const base64Image = await imageUrlToBase64(rawProductImageUrl);
        log(`imageUrlToBase64 done in ${Date.now() - imageStart}ms`, { hasBase64: Boolean(base64Image) });
        if (base64Image) {
          const llmStart = Date.now();
          // Feed PlanBrief prompt into runtime as extra user constraints (keeps system prompt short).
          const briefPromptForRuntime = briefPrompt;
          const extraBase64Images = (
            await Promise.all(supplementalImageUrls.map((u) => imageUrlToBase64(u)))
          ).filter((v): v is string => Boolean(v));
          const result = await callLLM(base64Image, extraBase64Images, userGoal, "single", briefPromptForRuntime, selectedTemplateId, requestId);
          log(`callLLM done in ${Date.now() - llmStart}ms`);

          const normalizeStart = Date.now();
          let plans = (result as CreativePlan[]).map((p) => normalizeCreativePlan(p));
          log(`normalize done in ${Date.now() - normalizeStart}ms`, { plans: plans.length });
          if (selectedTemplateId) {
            const resolvedPrimaryStyleWorld = planBrief?.resolvedPrimaryStyleWorld;
            plans = plans.map((plan, index) => applyTemplateRuleToPlan(plan, selectedTemplateId, index, undefined, resolvedPrimaryStyleWorld));
          } else {
            plans.forEach((plan) => {
              plan.finalPrompt = plan.imageGenerationPrompt;
            });
            // Non-template mode: enforce minimum usable structure + stable diversity.
            plans = ensurePlanSkeleton(plans);
          }
          log(`request complete in ${Date.now() - routeStart}ms (LLM path)`);
          return NextResponse.json({ data: plans, mode: "single", requestId, ...debugPayload });
        }
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        console.error(`[Plan][${requestId}] ⚠️ LLM FAILED — entering mock fallback. Reason: ${errMsg}`);
      }
    } else {
      console.warn(
        `[Plan][${requestId}] ⚠️ LLM not configured (missing key and no proxy url, or placeholder key) — entering mock fallback.`,
        { hasProxyUrl, hasVolcanoKey: Boolean(process.env.VOLCANO_API_KEY), hasKimiKey: Boolean(process.env.KIMI_API_KEY) }
      );
    }

    // ── Fallback: mock generation ──
    await new Promise((resolve) => setTimeout(resolve, 500));

    const analysis = analyzeProductImage(rawProductImageUrl, userGoal);

    // When a template is selected, force the mock plans to use the template's archetype
    const forcedArchetype = selectedTemplateId
      ? (detectTemplateArchetype(selectedTemplateId) as PlanArchetype)
      : undefined;
    const plans = generateSinglePlans(analysis, userGoal, forcedArchetype);

    const fallbackPayload = {
      fallback: true,
      fallbackReason: "LLM unavailable or request failed — returning demo plans",
    };

    if (selectedTemplateId) {
      const resolvedPrimaryStyleWorld = planBrief?.resolvedPrimaryStyleWorld;
      log(`request complete in ${Date.now() - routeStart}ms (mock path with template)`);
      return NextResponse.json({
        data: plans.map((plan, index) => applyTemplateRuleToPlan(plan, selectedTemplateId, index, undefined, resolvedPrimaryStyleWorld)),
        mode: "single",
        requestId,
        ...fallbackPayload,
        ...debugPayload,
      });
    }

    log(`request complete in ${Date.now() - routeStart}ms (mock path)`);
    return NextResponse.json({ data: plans, mode: "single", requestId, ...fallbackPayload, ...debugPayload });
  } catch (error) {
    console.error("Plan generation failed:", error);
    return NextResponse.json(
      { error: "生成方案失败，请稍后重试" },
      { status: 500 }
    );
  }
}
