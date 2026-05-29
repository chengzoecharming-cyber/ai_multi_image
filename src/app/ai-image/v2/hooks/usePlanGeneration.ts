"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { CreativePlan, V2Session } from "../types";
import type { PlanTemplate } from "@/lib/plan-templates/types";
import { createPlanRequestId } from "./utils/session-utils";

export interface UsePlanGenerationOptions {
  activeSession: V2Session | null;
  updateActiveSession: (updater: (s: V2Session) => V2Session) => void;
  selectedTemplate: PlanTemplate | null;
}

export interface PlanGenerationActions {
  handleGenerate: () => Promise<void>;
  handleCancelGenerate: () => void;
  handleUpdateSinglePlan: (updated: CreativePlan) => void;
  handleOpenPlanPreview: (plan: CreativePlan) => void;
  lastDebugPrompt: DebugPromptData | null;
}

export interface DebugPromptData {
  requestId?: string;
  selectedTemplateId?: string | null;
  briefSourceType?: string;
  briefSourceId?: string;
  briefImageType?: string;
  briefLayoutCount?: number;
  briefVariantCount?: number;
  briefStyleMode?: string;
  oldTemplatePromptLength?: number;
  briefPromptLength?: number;
  oldTemplatePrompt?: string;
  briefPrompt?: string;
}

export function usePlanGeneration(options: UsePlanGenerationOptions): PlanGenerationActions {
  const { activeSession, updateActiveSession, selectedTemplate } = options;

  const generateControllerRef = useRef<AbortController | null>(null);
  const [lastDebugPrompt, setLastDebugPrompt] = useState<DebugPromptData | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!activeSession) return;
    const activeProductImage = activeSession.productImageUrls[activeSession.activeProductImageIndex ?? 0];
    if (!activeProductImage) {
      toast.error("请先上传商品图");
      return;
    }
    if (!activeSession.goal.trim() || activeSession.goal.trim().length < 3) {
      toast.error("请输入制图目标描述（至少3个字）");
      return;
    }

    updateActiveSession((s) => ({
      ...s,
      step: "generating" as const,
      lastError: null,
      singlePlans: [],
      previewPlanId: null,
      expandedSingleId: null,
    }));

    const controller = new AbortController();
    generateControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    const clientRequestId = createPlanRequestId();
    setLastDebugPrompt({ requestId: clientRequestId });

    try {
      const payload: Record<string, unknown> = {
        rawProductImageUrl: activeProductImage,
        productReferenceImageUrl: activeSession.productImageUrls[0] || activeProductImage,
        productImageUrls: activeSession.productImageUrls || [],
        styleReferenceUrls: (activeSession.productImageUrls || []).filter((u) => u !== activeProductImage),
        userGoal: activeSession.goal.trim(),
        mode: "single",
        clientRequestId,
      };
      if (selectedTemplate) payload.selectedTemplateId = selectedTemplate.id;
      payload.debugBriefPrompt = true;

      const res = await fetch("/api/ai-image/v2/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (res.ok && data.data) {
        const plans: CreativePlan[] = data.data;
        setLastDebugPrompt(data.debug ? { ...data.debug, requestId: data.requestId } : { requestId: data.requestId || clientRequestId });
        updateActiveSession((s) => ({
          ...s,
          singlePlans: plans,
          expandedSingleId: plans[0]?.id || null,
          step: "plans" as const,
        }));
        if (data.fallback) {
          toast.warning(`已生成 ${plans.length} 个演示方案（LLM 暂不可用）`, { duration: 6000 });
        } else {
          toast.success(`已生成 ${plans.length} 个方案`);
        }
      } else {
        toast.error(data.error || "生成失败");
        updateActiveSession((s) => ({ ...s, step: "input" as const, lastError: data.error || "生成失败" }));
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        toast.error("生成超时（约120秒），请重试");
      } else {
        toast.error("网络错误，请重试");
      }
      updateActiveSession((s) => ({ ...s, step: "input" as const, lastError: "网络错误或超时" }));
    } finally {
      clearTimeout(timeoutId);
      generateControllerRef.current = null;
    }
  }, [activeSession, selectedTemplate, updateActiveSession]);

  const handleCancelGenerate = useCallback(() => {
    if (generateControllerRef.current) {
      generateControllerRef.current.abort();
      generateControllerRef.current = null;
    }
    updateActiveSession((s) => ({ ...s, step: "input" as const, lastError: null }));
  }, [updateActiveSession]);

  const handleUpdateSinglePlan = useCallback(
    (updated: CreativePlan) => {
      updateActiveSession((s) => ({
        ...s,
        singlePlans: s.singlePlans.map((p) => (p.id === updated.id ? updated : p)),
      }));
    },
    [updateActiveSession]
  );

  const handleOpenPlanPreview = useCallback(
    (plan: CreativePlan) => {
      updateActiveSession((s) => ({
        ...s,
        previewPlanId: plan.id,
        expandedSingleId: plan.id,
        step: "preview" as const,
      }));
    },
    [updateActiveSession]
  );

  return {
    handleGenerate,
    handleCancelGenerate,
    handleUpdateSinglePlan,
    handleOpenPlanPreview,
    lastDebugPrompt,
  };
}
