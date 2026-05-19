"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import type {
  CreativePlan,
  ImageSetPlan,
  V2Session,
  V2SessionStatus,
} from "../types";
import type { PlanTemplate } from "@/lib/plan-templates/types";
import {
  getSystemTemplates,
  getUserTemplates,
  saveUserTemplate,
} from "@/lib/plan-templates/store";

const SESSION_STORAGE_KEY = "ai_image_v2_sessions_v1";

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function nowTs() {
  return Date.now();
}

function createEmptySession(seed?: Partial<V2Session>): V2Session {
  const ts = nowTs();
  return {
    id: seed?.id || globalThis.crypto?.randomUUID?.() || `sess-${ts}-${Math.random().toString(36).slice(2, 6)}`,
    title: seed?.title,
    createdAt: seed?.createdAt || ts,
    updatedAt: ts,

    mode: seed?.mode || "single",
    step: seed?.step || "input",
    status: seed?.status,
    lastError: seed?.lastError ?? null,

    productImageUrl: seed?.productImageUrl ?? null,
    productReferenceImageUrl: seed?.productReferenceImageUrl ?? null,
    goal: seed?.goal ?? "",

    selectedTemplateId: seed?.selectedTemplateId ?? null,

    singlePlans: seed?.singlePlans ?? [],
    expandedSingleId: seed?.expandedSingleId ?? null,
    editingSingleId: seed?.editingSingleId ?? null,

    setPlans: seed?.setPlans ?? [],
    expandedSetId: seed?.expandedSetId ?? null,
    expandedSubIds: seed?.expandedSubIds ?? [],
    editingSubId: seed?.editingSubId ?? null,

    previewPlanId: seed?.previewPlanId ?? null,
    copiedId: seed?.copiedId ?? null,

    generatingImage: seed?.generatingImage ?? false,
    generatedImages: seed?.generatedImages ?? [],
  };
}

function deriveSessionStatus(session: V2Session): V2SessionStatus {
  if (session.lastError) return "failed";
  if (session.generatingImage) return "generating";
  if (session.step === "generating") return "planning";
  if ((session.singlePlans?.length || 0) > 0 || (session.setPlans?.length || 0) > 0) {
    if ((session.generatedImages?.length || 0) > 0) return "done";
    if (session.step === "plans" || session.step === "preview") return "needs_review";
  }
  return "draft";
}

export function useV2Session() {
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<V2Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);
  const [systemTemplates, setSystemTemplates] = useState<PlanTemplate[]>([]);
  const [userTemplates, setUserTemplates] = useState<PlanTemplate[]>([]);

  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [saveTemplatePlan, setSaveTemplatePlan] = useState<CreativePlan | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSystemTemplates(getSystemTemplates());
    setUserTemplates(getUserTemplates());
  }, []);

  const refreshUserTemplates = useCallback(() => {
    setUserTemplates(getUserTemplates());
  }, []);

  useEffect(() => {
    const loaded = safeJsonParse<{ sessions: V2Session[]; activeSessionId: string | null }>(
      localStorage.getItem(SESSION_STORAGE_KEY)
    );
    if (loaded?.sessions?.length) {
      setSessions(loaded.sessions);
      setActiveSessionId(loaded.activeSessionId || loaded.sessions[0].id);
      return;
    }

    const seeded = createEmptySession({
      productImageUrl: searchParams.get("productImageUrl"),
      productReferenceImageUrl: searchParams.get("productImageUrl"),
      goal: searchParams.get("goal") || "",
    });
    setSessions([seeded]);
    setActiveSessionId(seeded.id);
  }, [searchParams]);

  useEffect(() => {
    if (!sessions.length) return;
    const t = setTimeout(() => {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ sessions, activeSessionId }));
    }, 150);
    return () => clearTimeout(t);
  }, [sessions, activeSessionId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const resolveTemplateById = useCallback(
    (id: string | null | undefined) => {
      if (!id) return null;
      return systemTemplates.find((t) => t.id === id) || userTemplates.find((t) => t.id === id) || null;
    },
    [systemTemplates, userTemplates]
  );

  const selectedTemplate = resolveTemplateById(activeSession?.selectedTemplateId);

  const updateActiveSession = useCallback(
    (updater: (s: V2Session) => V2Session) => {
      if (!activeSession) return;
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSession.id) return s;
          const next = updater(s);
          return { ...next, updatedAt: nowTs(), status: deriveSessionStatus(next) };
        })
      );
    },
    [activeSession]
  );

  const createNewSession = useCallback(() => {
    const next = createEmptySession();
    setSessions((prev) => [next, ...prev]);
    setActiveSessionId(next.id);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeSession) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.data?.url) {
        updateActiveSession((s) => ({
          ...s,
          productImageUrl: data.data.url,
          productReferenceImageUrl: data.data.url,
          lastError: null,
          step: "input",
        }));
        toast.success("商品图上传成功");
      } else {
        toast.error(data.error || "上传失败");
      }
    } catch {
      toast.error("上传失败，请重试");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!activeSession?.productImageUrl) {
      toast.error("请先上传商品图");
      return;
    }
    if (!activeSession.goal.trim() || activeSession.goal.trim().length < 3) {
      toast.error("请输入制图目标描述（至少3个字）");
      return;
    }

    updateActiveSession((s) => ({
      ...s,
      step: "generating",
      lastError: null,
      singlePlans: [],
      setPlans: [],
      previewPlanId: null,
      expandedSingleId: null,
      expandedSetId: null,
      expandedSubIds: [],
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const payload: Record<string, unknown> = {
        rawProductImageUrl: activeSession.productImageUrl,
        productReferenceImageUrl: activeSession.productReferenceImageUrl,
        userGoal: activeSession.goal.trim(),
        mode: activeSession.mode,
      };
      if (selectedTemplate) {
        payload.selectedTemplateId = selectedTemplate.id;
      }

      const res = await fetch("/api/ai-image/v2/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (res.ok && data.data) {
        if (data.mode === "set") {
          const sets: ImageSetPlan[] = data.data;
          updateActiveSession((s) => ({
            ...s,
            setPlans: sets,
            singlePlans: [],
            expandedSetId: sets[0]?.id || null,
            expandedSubIds: sets[0]?.plans.map((p: CreativePlan) => p.id) || [],
            step: "plans",
          }));
        } else {
          const plans: CreativePlan[] = data.data;
          updateActiveSession((s) => ({
            ...s,
            singlePlans: plans,
            setPlans: [],
            expandedSingleId: plans[0]?.id || null,
            step: "plans",
          }));
        }
        toast.success(data.mode === "set" ? `已生成 ${data.data.length} 套组图方案` : `已生成 ${data.data.length} 个单图方案`);
      } else {
        toast.error(data.error || "生成失败");
        updateActiveSession((s) => ({ ...s, step: "input", lastError: data.error || "生成失败" }));
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        toast.error("请求超时，请重试");
      } else {
        toast.error("网络错误，请重试");
      }
      updateActiveSession((s) => ({ ...s, step: "input", lastError: "网络错误或超时" }));
    }
  };

  const handleToggleSub = (id: string) => {
    updateActiveSession((s) => ({
      ...s,
      expandedSubIds: s.expandedSubIds.includes(id) ? s.expandedSubIds.filter((i) => i !== id) : [...s.expandedSubIds, id],
    }));
  };

  const handleExpandAllSubs = (ids: string[]) => updateActiveSession((s) => ({ ...s, expandedSubIds: ids }));
  const handleCollapseAllSubs = () => updateActiveSession((s) => ({ ...s, expandedSubIds: [] }));

  const handleUpdateSinglePlan = (updated: CreativePlan) => {
    updateActiveSession((s) => ({
      ...s,
      singlePlans: s.singlePlans.map((p) => (p.id === updated.id ? updated : p)),
    }));
  };

  const handleUpdateSubPlan = (updated: CreativePlan) => {
    updateActiveSession((s) => ({
      ...s,
      setPlans: s.setPlans.map((set) => ({
        ...set,
        plans: set.plans.map((p) => (p.id === updated.id ? updated : p)),
      })),
    }));
  };

  const handleGeneratePlan = (plan: CreativePlan) => {
    updateActiveSession((s) => ({ ...s, previewPlanId: plan.id, step: "preview" }));
    toast.success(`「${plan.planName}」已生成 Prompt`);
  };

  const handleCopyPrompt = async (plan: CreativePlan) => {
    const text = plan.finalPrompt || plan.planSummaryPrompt || plan.imageGenerationPrompt;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      updateActiveSession((s) => ({ ...s, copiedId: plan.id }));
      toast.success("Prompt 已复制");
      setTimeout(() => updateActiveSession((s) => ({ ...s, copiedId: s.copiedId === plan.id ? null : s.copiedId })), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  const handleExpandToSet = async (basePlan: CreativePlan) => {
    if (!activeSession?.productImageUrl || !activeSession.goal.trim()) {
      toast.error("缺少商品图或制图目标");
      return;
    }
    updateActiveSession((s) => ({ ...s, step: "generating", lastError: null }));
    try {
      const res = await fetch("/api/ai-image/v2/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawProductImageUrl: activeSession.productImageUrl,
          productReferenceImageUrl: activeSession.productReferenceImageUrl,
          userGoal: activeSession.goal.trim(),
          mode: "set",
          basePlan,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const sets: ImageSetPlan[] = data.data;
        updateActiveSession((s) => ({
          ...s,
          mode: "set",
          setPlans: sets,
          singlePlans: [],
          previewPlanId: null,
          expandedSetId: sets[0]?.id || null,
          expandedSubIds: sets[0]?.plans.map((p: CreativePlan) => p.id) || [],
          step: "plans",
        }));
        toast.success("已扩展为 5 张详情组图方案");
      } else {
        toast.error(data.error || "扩展失败");
        updateActiveSession((s) => ({ ...s, step: "plans", lastError: data.error || "扩展失败" }));
      }
    } catch {
      toast.error("网络错误，请重试");
      updateActiveSession((s) => ({ ...s, step: "plans", lastError: "网络错误" }));
    }
  };

  const handleOpenSaveTemplate = (plan: CreativePlan) => {
    setSaveTemplatePlan(plan);
    setSaveTemplateOpen(true);
  };

  const handleSaveTemplate = (template: PlanTemplate) => {
    saveUserTemplate(template);
    refreshUserTemplates();
    toast.success(`模板「${template.name}」已保存`);
  };

  const handleUseTemplate = (template: PlanTemplate) => {
    updateActiveSession((s) => ({
      ...s,
      selectedTemplateId: template.id,
      mode: template.category === "image_set" ? "set" : "single",
      lastError: null,
    }));
    toast.success(`已选择模板：${template.name}`);
  };

  const handleGenerateImage = async (plan: CreativePlan) => {
    if (!activeSession?.productImageUrl) {
      toast.error("请先上传商品图");
      return;
    }
    updateActiveSession((s) => ({ ...s, generatingImage: true, lastError: null }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const res = await fetch("/api/ai-image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptContent: plan.finalPrompt || plan.planSummaryPrompt || "",
          productImageUrl: activeSession.productImageUrl,
          negativePrompt: "watermark, ai generated mark, logo, signature, text overlay, corner badge, copyright stamp, generated by, ai watermark, brand mark, small text in corner",
          config: {
            width: 1024,
            height: 1024,
            model: "default",
            generationModeId: "commercial_showcase",
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (res.ok && data.data?.resultImageUrl) {
        const urls = JSON.parse(data.data.resultImageUrl);
        const imageUrl = urls[0];
        updateActiveSession((s) => ({
          ...s,
          generatingImage: false,
          generatedImages: [
            {
              id: globalThis.crypto?.randomUUID?.() || `img-${nowTs()}-${Math.random().toString(36).slice(2, 6)}`,
              planId: plan.id,
              taskId: data.data?.id,
              imageUrl,
              createdAt: nowTs(),
            },
            ...s.generatedImages,
          ],
        }));
        toast.success("图片生成成功");
      } else {
        toast.error(data.error || "生成失败");
        updateActiveSession((s) => ({ ...s, generatingImage: false, lastError: data.error || "生成失败" }));
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        toast.error("生成超时（90秒），请重试");
        updateActiveSession((s) => ({ ...s, generatingImage: false, lastError: "生成超时（90秒）" }));
      } else {
        toast.error("网络错误，请重试");
        updateActiveSession((s) => ({ ...s, generatingImage: false, lastError: "网络错误" }));
      }
    }
  };

  const handleReset = () => {
    updateActiveSession((s) =>
      createEmptySession({
        id: s.id,
        createdAt: s.createdAt,
      })
    );
  };

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    updateActiveSession,
    createNewSession,

    templateLibraryOpen,
    setTemplateLibraryOpen,
    systemTemplates,
    userTemplates,
    refreshUserTemplates,

    saveTemplateOpen,
    setSaveTemplateOpen,
    saveTemplatePlan,
    setSaveTemplatePlan,

    fileInputRef,
    selectedTemplate,

    handleUpload,
    handleGenerate,
    handleToggleSub,
    handleExpandAllSubs,
    handleCollapseAllSubs,
    handleUpdateSinglePlan,
    handleUpdateSubPlan,
    handleGeneratePlan,
    handleCopyPrompt,
    handleExpandToSet,
    handleOpenSaveTemplate,
    handleSaveTemplate,
    handleUseTemplate,
    handleGenerateImage,
    handleReset,
  };
}
