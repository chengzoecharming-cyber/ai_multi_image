"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import type { CreativePlan, V2DetailType, V2Session, V2SessionStatus, V2WorkspaceTab } from "../types";
import type { PlanTemplate } from "@/lib/plan-templates/types";
import { getSystemTemplates, getUserTemplates, saveUserTemplate } from "@/lib/plan-templates/store";
import { buildNoTextImagePrompt } from "../lib/noTextPrompt";

const SESSION_STORAGE_KEY = "ai_image_v2_sessions_v3";

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

    workspaceTab: seed?.workspaceTab || "product",

    mode: "single",
    step: seed?.step || "input",
    status: seed?.status,
    lastError: seed?.lastError ?? null,

    productImageUrl: seed?.productImageUrl ?? null,
    productReferenceImageUrl: seed?.productReferenceImageUrl ?? null,
    referenceImageUrls: seed?.referenceImageUrls ?? [],
    goal: seed?.goal ?? "",

    outputWidth: Number.isFinite(seed?.outputWidth) ? Number(seed?.outputWidth) : 1920,
    outputHeight: Number.isFinite(seed?.outputHeight) ? Number(seed?.outputHeight) : 1920,

    selectedTemplateId: seed?.selectedTemplateId ?? null,

    singlePlans: seed?.singlePlans ?? [],
    expandedSingleId: seed?.expandedSingleId ?? null,
    editingSingleId: seed?.editingSingleId ?? null,

    previewPlanId: seed?.previewPlanId ?? null,
    copiedId: seed?.copiedId ?? null,

    generatingImage: seed?.generatingImage ?? false,
    generatedImages: seed?.generatedImages ?? [],

    detail: seed?.detail ?? {
      heroImageUrl: null,
      selectedTypes: [],
      generating: false,
      results: [],
      lastError: null,
    },

    // deprecated (kept for old storage)
    groupId: (seed as any)?.groupId ?? null,
  };
}

function deriveSessionStatus(session: V2Session): V2SessionStatus {
  if (session.lastError) return "failed";
  if (session.workspaceTab === "detail") {
    if (session.detail?.lastError) return "failed";
    if (session.detail?.generating) return "generating";
    if ((session.generatedImages?.filter((g) => (g.tab || "product") === "detail").length || 0) > 0) return "done";
    return "draft";
  }
  if (session.generatingImage) return "generating";
  if (session.step === "generating") return "planning";
  if ((session.singlePlans?.length || 0) > 0) {
    if ((session.generatedImages?.length || 0) > 0) return "done";
    if (session.step === "plans" || session.step === "preview") return "needs_review";
  }
  return "draft";
}

export function useV2Session() {
  const searchParams = useSearchParams();

  const [sessions, setSessions] = useState<V2Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTabState] = useState<V2WorkspaceTab>("product");

  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);
  const [systemTemplates, setSystemTemplates] = useState<PlanTemplate[]>([]);
  const [userTemplates, setUserTemplates] = useState<PlanTemplate[]>([]);

  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [saveTemplatePlan, setSaveTemplatePlan] = useState<CreativePlan | null>(null);

  const productFileInputRef = useRef<HTMLInputElement>(null);
  const detailHeroFileInputRef = useRef<HTMLInputElement>(null);
  const referenceFileInputRef = useRef<HTMLInputElement>(null);
  const generateControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSystemTemplates(getSystemTemplates());
    setUserTemplates(getUserTemplates());
  }, []);

  const refreshUserTemplates = useCallback(() => {
    setUserTemplates(getUserTemplates());
  }, []);

  useEffect(() => {
    const loaded = safeJsonParse<{ sessions: V2Session[]; activeSessionId: string | null }>(localStorage.getItem(SESSION_STORAGE_KEY));
    if (loaded?.sessions?.length) {
      setSessions(loaded.sessions.map((s) => createEmptySession(s)));
      setActiveSessionId(loaded.activeSessionId || loaded.sessions[0].id);
      return;
    }

    // Backward compat: migrate old group storage if present
    const legacyGroups = safeJsonParse<{ groups: Array<{ slots: V2Session[]; activeSlotId: string | null }>; activeGroupId: string | null }>(
      localStorage.getItem("ai_image_v2_sessions_v2_groups")
    );
    if (legacyGroups?.groups?.length) {
      const flat: V2Session[] = [];
      legacyGroups.groups.forEach((g) => {
        (g.slots || []).forEach((s) => flat.push(createEmptySession({ ...s, groupId: null })));
      });
      if (flat.length) {
        setSessions(flat);
        setActiveSessionId(flat[0].id);
        return;
      }
    }

    // Backward compat: migrate old sessions storage if present under previous key.
    const legacy = safeJsonParse<{ sessions: V2Session[]; activeSessionId: string | null }>(localStorage.getItem("ai_image_v2_sessions_v1"));
    if (legacy?.sessions?.length) {
      const migrated = legacy.sessions.map((s) => createEmptySession({ ...s, groupId: null }));
      setSessions(migrated);
      setActiveSessionId(legacy.activeSessionId || migrated[0].id);
      return;
    }

    const seeded = createEmptySession({
      productImageUrl: searchParams.get("productImageUrl"),
      productReferenceImageUrl: searchParams.get("productImageUrl"),
      goal: searchParams.get("goal") || "",
      workspaceTab: "product",
    });
    setSessions([seeded]);
    setActiveSessionId(seeded.id);
    setWorkspaceTabState("product");
  }, [searchParams]);

  useEffect(() => {
    if (!sessions.length) return;
    const t = setTimeout(() => {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ sessions, activeSessionId }));
    }, 150);
    return () => clearTimeout(t);
  }, [sessions, activeSessionId]);

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;
  }, [sessions, activeSessionId]);

  // Keep UI tab aligned with active session kind when possible.
  useEffect(() => {
    if (!activeSession?.workspaceTab) return;
    setWorkspaceTabState(activeSession.workspaceTab);
  }, [activeSession?.id]);

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
          const status = deriveSessionStatus(next);
          return { ...next, updatedAt: nowTs(), status };
        })
      );
    },
    [activeSession]
  );

  const createNewSession = useCallback((seed?: Partial<V2Session>) => {
    const sess = createEmptySession(seed);
    setSessions((prev) => [sess, ...prev]);
    setActiveSessionId(sess.id);
    toast.success("已新增记录");
  }, []);

  const duplicateSession = useCallback(
    (id: string) => {
      const base = sessions.find((s) => s.id === id);
      if (!base) return;
      const cloned = safeJsonParse<V2Session>(JSON.stringify(base)) || base;
      const ts = nowTs();
      const next: V2Session = {
        ...cloned,
        id: globalThis.crypto?.randomUUID?.() || `sess-${ts}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: ts,
        updatedAt: ts,
        lastError: null,
        generatingImage: false,
      };
      setSessions((prev) => [next, ...prev]);
      setActiveSessionId(next.id);
      toast.success("已复制记录");
    },
    [sessions]
  );

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        const fallback = next.length ? next : [createEmptySession({ workspaceTab: "product" })];
        if (activeSessionId === id) setActiveSessionId(fallback[0].id);
        return fallback;
      });
      toast.success("已删除记录");
    },
    [activeSessionId]
  );

  const setWorkspaceTab = useCallback(
    (tab: V2WorkspaceTab) => {
      setWorkspaceTabState(tab);
      // Switch active session to the most recent one in that tab.
      setActiveSessionId((prevId) => {
        const current = sessions.find((s) => s.id === prevId) || null;
        if (current && (current.workspaceTab || "product") === tab) return prevId;
        const candidate = sessions.find((s) => (s.workspaceTab || "product") === tab) || null;
        return candidate?.id || prevId;
      });
    },
    [sessions]
  );

  const handleUploadProductImage = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (productFileInputRef.current) productFileInputRef.current.value = "";
    },
    [activeSession, updateActiveSession]
  );

  const handleUploadDetailHero = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            detail: {
              ...(s.detail || { heroImageUrl: null, selectedTypes: [], generating: false, results: [], lastError: null }),
              heroImageUrl: data.data.url,
              lastError: null,
            },
          }));
          toast.success("主图上传成功");
        } else {
          toast.error(data.error || "上传失败");
        }
      } catch {
        toast.error("上传失败，请重试");
      }
      if (detailHeroFileInputRef.current) detailHeroFileInputRef.current.value = "";
    },
    [activeSession, updateActiveSession]
  );

  const handleUploadReferenceImage = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!activeSession) return;
      const file = e.target.files?.[0];
      if (!file) return;
      if ((activeSession.referenceImageUrls?.length || 0) >= 3) {
        toast.error("参考图最多3张");
        if (referenceFileInputRef.current) referenceFileInputRef.current.value = "";
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok && data.data?.url) {
          updateActiveSession((s) => ({
            ...s,
            referenceImageUrls: [...(s.referenceImageUrls || []), data.data.url],
            lastError: null,
          }));
          toast.success("参考图上传成功");
        } else {
          toast.error(data.error || "上传失败");
        }
      } catch {
        toast.error("上传失败，请重试");
      }
      if (referenceFileInputRef.current) referenceFileInputRef.current.value = "";
    },
    [activeSession, updateActiveSession]
  );

  const handleRemoveReferenceImage = useCallback(
    (index: number) => {
      updateActiveSession((s) => ({
        ...s,
        referenceImageUrls: (s.referenceImageUrls || []).filter((_, i) => i !== index),
      }));
    },
    [updateActiveSession]
  );

  const handleGeneratePlan = useCallback(async () => {
    if (!activeSession) return;
    if (!activeSession.productImageUrl) {
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
      previewPlanId: null,
      expandedSingleId: null,
    }));

    const controller = new AbortController();
    generateControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    try {
      const payload: Record<string, unknown> = {
        rawProductImageUrl: activeSession.productImageUrl,
        productReferenceImageUrl: activeSession.productReferenceImageUrl,
        userGoal: activeSession.goal.trim(),
        mode: "single",
      };
      if (selectedTemplate) payload.selectedTemplateId = selectedTemplate.id;

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
        updateActiveSession((s) => ({
          ...s,
          singlePlans: plans,
          expandedSingleId: plans[0]?.id || null,
          step: "plans",
        }));
        toast.success(`已生成 ${plans.length} 个方案`);
      } else {
        toast.error(data.error || "生成失败");
        updateActiveSession((s) => ({ ...s, step: "input", lastError: data.error || "生成失败" }));
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        toast.error("生成已取消");
      } else {
        toast.error("网络错误，请重试");
      }
      updateActiveSession((s) => ({ ...s, step: "input", lastError: "网络错误或超时" }));
    } finally {
      generateControllerRef.current = null;
    }
  }, [activeSession, selectedTemplate, updateActiveSession]);

  const handleCancelGenerate = useCallback(() => {
    if (generateControllerRef.current) {
      generateControllerRef.current.abort();
      generateControllerRef.current = null;
    }
    updateActiveSession((s) => ({ ...s, step: "input", lastError: null }));
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
      updateActiveSession((s) => ({ ...s, previewPlanId: plan.id, expandedSingleId: plan.id, step: "preview" }));
    },
    [updateActiveSession]
  );

  const handleOpenSaveTemplate = useCallback((plan: CreativePlan) => {
    setSaveTemplatePlan(plan);
    setSaveTemplateOpen(true);
  }, []);

  const handleSaveTemplate = useCallback(
    (template: PlanTemplate) => {
      saveUserTemplate(template);
      refreshUserTemplates();
      toast.success(`模板「${template.name}」已保存`);
    },
    [refreshUserTemplates]
  );

  const handleUseTemplate = useCallback(
    (template: PlanTemplate) => {
      if (template.category === "image_set") {
        toast.error("已下线「5张详情组图」相关模板，请选择单图模板");
        return;
      }
      updateActiveSession((s) => ({
        ...s,
        selectedTemplateId: template.id,
        mode: "single",
        lastError: null,
      }));
      toast.success(`已选择模板：${template.name}`);
    },
    [updateActiveSession]
  );

  const handleGenerateImage = useCallback(
    async (plan: CreativePlan) => {
      if (!activeSession?.productImageUrl) {
        toast.error("请先上传商品图");
        return;
      }
      updateActiveSession((s) => ({ ...s, generatingImage: true, lastError: null }));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      try {
        const styleRefs = [
          ...(activeSession.productReferenceImageUrl ? [activeSession.productReferenceImageUrl] : []),
          ...(activeSession.referenceImageUrls || []),
        ];
        const res = await fetch("/api/ai-image/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            promptContent: buildNoTextImagePrompt(plan),
            productImageUrl: activeSession.productImageUrl,
            styleReferenceUrls: styleRefs,
            negativePrompt:
              "text, typography, letters, words, numbers, watermark, ai generated mark, logo, signature, corner badge, copyright stamp, generated by, ai watermark, brand mark, label, stamp, qr code",
            config: {
              width: activeSession.outputWidth,
              height: activeSession.outputHeight,
              model: "default",
              generationModeId: "conservative_enhancement",
              strictSize: true,
            },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (res.ok && data.data?.resultImageUrl) {
          const urls = JSON.parse(data.data.resultImageUrl);
          const imageUrl = urls[0];
          const imageBase64 = data.imageBase64 || "";
          updateActiveSession((s) => ({
            ...s,
            generatingImage: false,
            generatedImages: [
              {
                id: globalThis.crypto?.randomUUID?.() || `img-${nowTs()}-${Math.random().toString(36).slice(2, 6)}`,
                planId: plan.id,
                taskId: data.data?.id,
                tab: "product",
                imageUrl,
                imageBase64,
                createdAt: nowTs(),
              },
              ...s.generatedImages,
            ],
            productReferenceImageUrl: s.productReferenceImageUrl || imageUrl,
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
    },
    [activeSession, updateActiveSession]
  );

  const handleReset = useCallback(() => {
    updateActiveSession((s) =>
      createEmptySession({
        id: s.id,
        createdAt: s.createdAt,
        workspaceTab: s.workspaceTab || "product",
      })
    );
  }, [updateActiveSession]);

  const toggleDetailType = useCallback(
    (type: V2DetailType) => {
      updateActiveSession((s) => {
        const prev = s.detail || { heroImageUrl: null, selectedTypes: [], generating: false, results: [], lastError: null };
        const exists = prev.selectedTypes.includes(type);
        const nextSelected = exists ? prev.selectedTypes.filter((t) => t !== type) : [...prev.selectedTypes, type];
        return { ...s, detail: { ...prev, selectedTypes: nextSelected, lastError: null } };
      });
    },
    [updateActiveSession]
  );

  const handleGenerateDetail = useCallback(async () => {
    if (!activeSession) return;
    const detail = activeSession.detail;
    const heroImageUrl = detail?.heroImageUrl || null;
    const selectedTypes = detail?.selectedTypes || [];
    if (!heroImageUrl) {
      toast.error("请先上传主图");
      return;
    }
    if (!activeSession.goal.trim() || activeSession.goal.trim().length < 3) {
      toast.error("请输入商品描述（至少3个字）");
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error("请先勾选要生成的素材类型");
      return;
    }

    updateActiveSession((s) => ({
      ...s,
      detail: {
        ...(s.detail || { heroImageUrl: null, selectedTypes: [], generating: false, results: [], lastError: null }),
        generating: true,
        lastError: null,
      },
    }));

    try {
      const res = await fetch("/api/ai-image/v2/detail/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroImageUrl,
          productDescription: activeSession.goal,
          selectedTypes,
          output: { width: activeSession.outputWidth, height: activeSession.outputHeight },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "生成失败";
        toast.error(msg);
        updateActiveSession((s) => ({
          ...s,
          detail: { ...(s.detail as any), generating: false, lastError: msg },
        }));
        return;
      }

      const pages: Array<{ type: V2DetailType; imageUrl: string; taskId?: string; imageBase64?: string }> = Array.isArray(data?.pages)
        ? data.pages
        : [];
      const now = nowTs();
      updateActiveSession((s) => {
        const prevDetail = s.detail || { heroImageUrl: null, selectedTypes: [], generating: false, results: [], lastError: null };
        const newImages = pages
          .filter((p) => p?.imageUrl && p?.type)
          .map((p) => {
            const id = globalThis.crypto?.randomUUID?.() || `img-${now}-${Math.random().toString(36).slice(2, 6)}`;
            return {
              id,
              taskId: p.taskId,
              tab: "detail" as const,
              detailType: p.type,
              imageUrl: p.imageUrl,
              imageBase64: p.imageBase64,
              createdAt: nowTs(),
            };
          });
        const resultPairs: Array<{ type: V2DetailType; imageId: string }> = [];
        newImages.forEach((img) => {
          if (img.detailType) resultPairs.push({ type: img.detailType, imageId: img.id });
        });
        return {
          ...s,
          generatedImages: [...newImages, ...(s.generatedImages || [])],
          detail: {
            ...prevDetail,
            generating: false,
            lastError: null,
            results: [...resultPairs, ...(prevDetail.results || [])],
          },
        };
      });
      toast.success("商详图已生成");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "网络错误";
      toast.error("网络错误，请重试");
      updateActiveSession((s) => ({
        ...s,
        detail: { ...(s.detail as any), generating: false, lastError: msg },
      }));
    }
  }, [activeSession, updateActiveSession]);

  const filteredSessions = useMemo(
    () => sessions.filter((s) => (s.workspaceTab || "product") === workspaceTab),
    [sessions, workspaceTab]
  );
  const activeTabSessionId = activeSessionId;

  return {
    sessions,
    filteredSessions,
    activeSessionId: activeTabSessionId,
    setActiveSessionId,
    activeSession,
    updateActiveSession,
    createNewSession,
    duplicateSession,
    deleteSession,

    workspaceTab,
    setWorkspaceTab,

    templateLibraryOpen,
    setTemplateLibraryOpen,
    systemTemplates,
    userTemplates,
    refreshUserTemplates,

    saveTemplateOpen,
    setSaveTemplateOpen,
    saveTemplatePlan,
    setSaveTemplatePlan,

    productFileInputRef,
    detailHeroFileInputRef,
    referenceFileInputRef,
    selectedTemplate,

    handleUploadProductImage,
    handleUploadDetailHero,
    handleUploadReferenceImage,
    handleRemoveReferenceImage,
    handleGenerate: handleGeneratePlan,
    handleCancelGenerate,
    handleUpdateSinglePlan,
    handleOpenPlanPreview,
    handleOpenSaveTemplate,
    handleSaveTemplate,
    handleUseTemplate,
    handleGenerateImage,
    handleReset,

    toggleDetailType,
    handleGenerateDetail,
  };
}
