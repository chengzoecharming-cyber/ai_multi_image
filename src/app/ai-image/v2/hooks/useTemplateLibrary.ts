"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { CreativePlan } from "../types";
import type { PlanTemplate } from "@/lib/plan-templates/types";
import {
  getSystemTemplates,
  getSavedTemplatesFromServer,
  migrateLocalSavedTemplatesToServer,
  saveSavedTemplateToServer,
} from "@/app/ai-image/v2/domain/templates";

export interface TemplateLibraryState {
  templateLibraryOpen: boolean;
  setTemplateLibraryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  systemTemplates: PlanTemplate[];
  userTemplates: PlanTemplate[];
  refreshUserTemplates: () => void;

  saveTemplateOpen: boolean;
  setSaveTemplateOpen: React.Dispatch<React.SetStateAction<boolean>>;
  saveTemplatePlan: CreativePlan | null;
  setSaveTemplatePlan: React.Dispatch<React.SetStateAction<CreativePlan | null>>;

  handleOpenSaveTemplate: (plan: CreativePlan) => void;
  handleSaveTemplate: (template: PlanTemplate) => void;
  handleUseTemplate: (template: PlanTemplate) => void;
  resolveTemplateById: (id: string | null | undefined) => PlanTemplate | null;
}

export function useTemplateLibrary(): TemplateLibraryState {
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);
  const [systemTemplates, setSystemTemplates] = useState<PlanTemplate[]>(() => getSystemTemplates());
  const [userTemplates, setUserTemplates] = useState<PlanTemplate[]>([]);

  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [saveTemplatePlan, setSaveTemplatePlan] = useState<CreativePlan | null>(null);

  // ── Load templates on mount ──
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const templates = await migrateLocalSavedTemplatesToServer();
        if (!cancelled) setUserTemplates(templates);
      } catch (error) {
        console.error("[useTemplateLibrary] Failed to load user templates from server:", error);
        if (!cancelled) setUserTemplates([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshUserTemplates = useCallback(() => {
    void (async () => {
      try {
        const templates = await getSavedTemplatesFromServer();
        setUserTemplates(templates);
      } catch (error) {
        console.error("[useTemplateLibrary] Failed to refresh user templates:", error);
      }
    })();
  }, []);

  const handleOpenSaveTemplate = useCallback((plan: CreativePlan) => {
    setSaveTemplatePlan(plan);
    setSaveTemplateOpen(true);
  }, []);

  const handleSaveTemplate = useCallback(
    (template: PlanTemplate) => {
      void (async () => {
        try {
          await saveSavedTemplateToServer(template);
          refreshUserTemplates();
          toast.success(`模板「${template.name}」已保存`);
        } catch (error) {
          console.error("[useTemplateLibrary] Failed to save template:", error);
          toast.error("保存模板失败");
        }
      })();
    },
    [refreshUserTemplates]
  );

  const handleUseTemplate = useCallback(
    (template: PlanTemplate) => {
      if (template.category === "image_set") {
        toast.error("已下线「5张详情组图」相关模板，请选择单图模板");
        return;
      }
      // This will be called from the composite hook which has access to updateActiveSession
      toast.success(`已选择模板：${template.name}`);
    },
    []
  );

  const resolveTemplateById = useCallback(
    (id: string | null | undefined) => {
      if (!id) return null;
      return systemTemplates.find((t) => t.id === id) || userTemplates.find((t) => t.id === id) || null;
    },
    [systemTemplates, userTemplates]
  );

  return {
    templateLibraryOpen,
    setTemplateLibraryOpen,
    systemTemplates,
    userTemplates,
    refreshUserTemplates,

    saveTemplateOpen,
    setSaveTemplateOpen,
    saveTemplatePlan,
    setSaveTemplatePlan,

    handleOpenSaveTemplate,
    handleSaveTemplate,
    handleUseTemplate,
    resolveTemplateById,
  };
}
