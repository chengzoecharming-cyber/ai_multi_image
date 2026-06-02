"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { V2WorkspaceTab } from "../types";
import type { PlanTemplate } from "@/lib/plan-templates/types";

import { useSessionStore } from "./useSessionStore";
import { useSessionActions } from "./useSessionActions";
import { useUploadHandlers } from "./useUploadHandlers";
import { usePlanGeneration } from "./usePlanGeneration";
import { useImageGeneration } from "./useImageGeneration";
import { useDetailGeneration } from "./useDetailGeneration";
import { useTemplateLibrary } from "./useTemplateLibrary";
import { useSessionPersistence } from "./useSessionPersistence";

export function useV2Session() {
  // ── Core session state ──
  const {
    sessions,
    setSessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    updateActiveSession,
    isHydrated,
  } = useSessionStore("default", "default", "default::default", true);

  // ── Server sync ──
  const persistence = useSessionPersistence({
    sessions,
    isHydrated,
    tenantId: "default",
    userId: "default",
    ownerKey: "default::default",
  });

  // ── Workspace tab (UI state, synced with active session) ──
  const [workspaceTab, setWorkspaceTabState] = useState<V2WorkspaceTab>("product");

  useEffect(() => {
    if (!activeSession?.workspaceTab) return;
    setWorkspaceTabState(activeSession.workspaceTab);
  }, [activeSession?.id, activeSession?.workspaceTab]);

  // ── Derived: filtered sessions by tab ──
  const filteredSessions = useMemo(
    () => sessions.filter((s) => (s.workspaceTab || "product") === workspaceTab),
    [sessions, workspaceTab]
  );

  // ── Template library ──
  const templateLib = useTemplateLibrary();
  const selectedTemplate = useMemo(
    () => templateLib.resolveTemplateById(activeSession?.selectedTemplateId),
    [templateLib, activeSession?.selectedTemplateId]
  );

  // ── Session actions (CRUD, workspace tab) ──
  const sessionActions = useSessionActions({
    sessions,
    setSessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    updateActiveSession,
    workspaceTab,
    setWorkspaceTabState,
    onSessionPersist: persistence.persistSessionImmediately,
    onDeletePersistedSession: persistence.deleteFromServer,
  });

  // ── Upload handlers ──
  const uploadHandlers = useUploadHandlers({
    activeSession,
    updateActiveSession,
    onSessionPersist: persistence.persistSessionImmediately,
  });

  // ── Plan generation ──
  const planGeneration = usePlanGeneration({
    activeSession,
    updateActiveSession,
    selectedTemplate,
    onSessionPersist: persistence.persistSessionImmediately,
  });

  // ── Image generation ──
  const imageGeneration = useImageGeneration({
    activeSession,
    updateActiveSession,
    onSessionPersist: persistence.persistSessionImmediately,
  });

  // ── Detail generation ──
  const detailGeneration = useDetailGeneration({
    activeSession,
    updateActiveSession,
    onSessionPersist: persistence.persistSessionImmediately,
  });

  // ── Override: handleUseTemplate needs updateActiveSession ──
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

  return {
    // Session store
    sessions,
    filteredSessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    updateActiveSession,

    // Session actions
    createNewSession: sessionActions.createNewSession,
    duplicateSession: sessionActions.duplicateSession,
    deleteSession: sessionActions.deleteSession,

    // Workspace tab
    workspaceTab,
    setWorkspaceTab: sessionActions.setWorkspaceTab,

    // Template library
    templateLibraryOpen: templateLib.templateLibraryOpen,
    setTemplateLibraryOpen: templateLib.setTemplateLibraryOpen,
    systemTemplates: templateLib.systemTemplates,
    userTemplates: templateLib.userTemplates,
    refreshUserTemplates: templateLib.refreshUserTemplates,

    saveTemplateOpen: templateLib.saveTemplateOpen,
    setSaveTemplateOpen: templateLib.setSaveTemplateOpen,
    saveTemplatePlan: templateLib.saveTemplatePlan,
    setSaveTemplatePlan: templateLib.setSaveTemplatePlan,

    // Upload refs
    productFileInputRef: uploadHandlers.productFileInputRef,
    detailHeroFileInputRef: uploadHandlers.detailHeroFileInputRef,
    referenceFileInputRef: uploadHandlers.referenceFileInputRef,

    // Selected template
    selectedTemplate,

    // Upload handlers
    handleUploadProductImage: uploadHandlers.handleUploadProductImage,
    handleUploadDetailHero: uploadHandlers.handleUploadDetailHero,
    handleUploadReferenceImage: uploadHandlers.handleUploadReferenceImage,
    handleRemoveReferenceImage: uploadHandlers.handleRemoveReferenceImage,

    // Plan generation
    handleGenerate: planGeneration.handleGenerate,
    handleCancelGenerate: planGeneration.handleCancelGenerate,
    handleUpdateSinglePlan: planGeneration.handleUpdateSinglePlan,
    handleOpenPlanPreview: planGeneration.handleOpenPlanPreview,

    // Template actions
    handleOpenSaveTemplate: templateLib.handleOpenSaveTemplate,
    handleSaveTemplate: templateLib.handleSaveTemplate,
    handleUseTemplate,

    // Image generation
    handleGenerateImage: imageGeneration.handleGenerateImage,

    // Reset
    handleReset: sessionActions.handleReset,

    // Detail generation
    toggleDetailType: detailGeneration.toggleDetailType,
    handleGenerateDetail: detailGeneration.handleGenerateDetail,

    // Debug
    lastDebugPrompt: planGeneration.lastDebugPrompt,

    // Hydration flag (for future sync hooks)
    isHydrated,
    identityReady: true,
  };
}
