"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import AppHeader from "@/components/common/AppHeader";
import GroupListPanel from "@/components/workbench/GroupListPanel";
import EditorPanel from "@/components/workbench/EditorPanel";
import ResultPanel from "@/components/workbench/ResultPanel";
import {
  getCategories,
  getPromptGroups,
  createPromptGroup,
  updatePromptGroup,
  duplicatePromptGroup,
  generateImage,
  retryTask,
} from "@/lib/api";
import { PromptGroup, PromptCategory, ImageTask, ReferenceImage, PromptFieldSelections } from "@/lib/types";
import { buildPrompt } from "@/lib/prompt/builder";

const DEFAULT_CONFIG = {
  ratio: "1:1" as const,
  width: 1024,
  height: 1024,
  model: "default" as const,
  quality: "standard" as const,
  promptFields: {},
};

function parseGroupConfig(group: PromptGroup): PromptGroup {
  return {
    ...group,
    config:
      typeof group.configJson === "string"
        ? JSON.parse(group.configJson)
        : group.config || DEFAULT_CONFIG,
  };
}

function createEmptyGroup(categoryId: string): PromptGroup {
  return {
    id: "",
    tenantId: "default",
    userId: "default",
    categoryId,
    name: "",
    promptContent: "",
    negativePrompt: "",
    config: DEFAULT_CONFIG,
    remark: "",
    useCount: 0,
    references: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function WorkbenchPage() {
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [groups, setGroups] = useState<PromptGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<PromptGroup | null>(null);
  const [originalGroup, setOriginalGroup] = useState<PromptGroup | null>(null);
  const [latestTask, setLatestTask] = useState<ImageTask | null>(null);
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [catRes, groupRes] = await Promise.all([
        getCategories(),
        getPromptGroups(),
      ]);
      setCategories(catRes.data);
      setGroups(groupRes.data.map(parseGroupConfig));
    } catch (err) {
      toast.error("加载数据失败");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const checkUnsaved = useCallback(
    (current: PromptGroup | null, original: PromptGroup | null): boolean => {
      if (!current && !original) return false;
      if (!current || !original) return true;
      return (
        current.name !== original.name ||
        current.categoryId !== original.categoryId ||
        current.promptContent !== original.promptContent ||
        current.negativePrompt !== original.negativePrompt ||
        current.remark !== original.remark ||
        JSON.stringify(current.config) !== JSON.stringify(original.config) ||
        JSON.stringify(current.references?.map((r) => r.imageUrl)) !==
          JSON.stringify(original.references?.map((r) => r.imageUrl))
      );
    },
    []
  );

  const updateGroupState = useCallback(
    (updater: (g: PromptGroup) => PromptGroup) => {
      setSelectedGroup((prev) => {
        if (!prev) return prev;
        const updated = updater(prev);
        setIsUnsaved(checkUnsaved(updated, originalGroup));
        return updated;
      });
    },
    [originalGroup, checkUnsaved]
  );

  const handleSelectGroup = useCallback(
    (group: PromptGroup) => {
      if (isUnsaved && selectedGroup) {
        const confirmResult = window.confirm(
          "当前提示词组有未保存修改，是否保存后再切换？"
        );
        if (confirmResult) {
          handleSave();
        }
      }
      const parsed = parseGroupConfig(group);
      setSelectedGroup(parsed);
      setOriginalGroup(JSON.parse(JSON.stringify(parsed)));
      setIsUnsaved(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isUnsaved, selectedGroup]
  );

  const handleCreateGroup = useCallback(() => {
    const defaultCategoryId = categories[0]?.id || "";
    const newGroup = createEmptyGroup(defaultCategoryId);
    setSelectedGroup(newGroup);
    setOriginalGroup(null);
    setIsUnsaved(true);
    setLatestTask(null);
  }, [categories]);

  const handleSave = useCallback(async () => {
    if (!selectedGroup) return;
    setIsSaving(true);
    try {
      const payload = {
        name: selectedGroup.name,
        categoryId: selectedGroup.categoryId,
        promptContent: selectedGroup.promptContent,
        negativePrompt: selectedGroup.negativePrompt,
        config: selectedGroup.config,
        remark: selectedGroup.remark,
        references: selectedGroup.references,
      };

      if (selectedGroup.id) {
        const res = await updatePromptGroup(selectedGroup.id, payload);
        const updated = parseGroupConfig(res.data);
        setSelectedGroup(updated);
        setOriginalGroup(JSON.parse(JSON.stringify(updated)));
        setIsUnsaved(false);
        setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        toast.success("保存成功");
      } else {
        const res = await createPromptGroup(payload);
        const created = parseGroupConfig(res.data);
        setSelectedGroup(created);
        setOriginalGroup(JSON.parse(JSON.stringify(created)));
        setIsUnsaved(false);
        setGroups((prev) => [created, ...prev]);
        toast.success("创建成功");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setIsSaving(false);
    }
  }, [selectedGroup]);

  const handleSaveAs = useCallback(async () => {
    if (!selectedGroup) return;
    setIsSaving(true);
    try {
      const payload = {
        name: `${selectedGroup.name || "未命名"} (副本)`,
        categoryId: selectedGroup.categoryId,
        promptContent: selectedGroup.promptContent,
        negativePrompt: selectedGroup.negativePrompt,
        config: selectedGroup.config,
        remark: selectedGroup.remark,
        references: selectedGroup.references,
      };
      const res = await createPromptGroup(payload);
      const created = parseGroupConfig(res.data);
      setSelectedGroup(created);
      setOriginalGroup(JSON.parse(JSON.stringify(created)));
      setIsUnsaved(false);
      setGroups((prev) => [created, ...prev]);
      toast.success("另存为成功");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "另存为失败");
    } finally {
      setIsSaving(false);
    }
  }, [selectedGroup]);

  const handleDuplicate = useCallback(async () => {
    if (!selectedGroup?.id) {
      toast.error("请先保存当前提示词组");
      return;
    }
    setIsSaving(true);
    try {
      const res = await duplicatePromptGroup(selectedGroup.id);
      const duplicated = parseGroupConfig(res.data);
      setGroups((prev) => [duplicated, ...prev]);
      toast.success("复制成功");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "复制失败");
    } finally {
      setIsSaving(false);
    }
  }, [selectedGroup]);

  const handleGenerate = useCallback(async () => {
    if (!selectedGroup || !selectedGroup.promptContent?.trim()) return;
    setIsGenerating(true);
    setLatestTask(null);

    try {
      const res = await generateImage({
        promptGroupId: selectedGroup.id || undefined,
        promptContent: selectedGroup.promptContent,
        negativePrompt: selectedGroup.negativePrompt,
        referenceImageUrls: selectedGroup.references?.map((r) => r.imageUrl) || [],
        config: selectedGroup.config || DEFAULT_CONFIG,
      });

      const task = res.data;
      setLatestTask({
        ...task,
        configSnapshot:
          typeof task.configSnapshot === "string"
            ? JSON.parse(task.configSnapshot)
            : task.configSnapshot,
        referenceImagesSnapshot:
          typeof task.referenceImagesSnapshot === "string"
            ? JSON.parse(task.referenceImagesSnapshot)
            : task.referenceImagesSnapshot,
      });

      if (task.status === "completed" && task.resultImageUrl) {
        toast.success("生成成功");
      } else if (task.status === "failed") {
        toast.error(task.errorMessage || "生成失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "生成失败");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedGroup]);

  const handleRetry = useCallback(async (taskId: string) => {
    try {
      setIsGenerating(true);
      const res = await retryTask(taskId);
      const task = res.data;
      setLatestTask({
        ...task,
        configSnapshot:
          typeof task.configSnapshot === "string"
            ? JSON.parse(task.configSnapshot)
            : task.configSnapshot,
        referenceImagesSnapshot:
          typeof task.referenceImagesSnapshot === "string"
            ? JSON.parse(task.referenceImagesSnapshot)
            : task.referenceImagesSnapshot,
      });
      if (task.status === "completed" && task.resultImageUrl) {
        toast.success("重新生成成功");
      } else if (task.status === "failed") {
        toast.error(task.errorMessage || "重新生成失败");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "重新生成失败");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const filteredGroups = groups.filter((g) => {
    const matchesCategory = selectedCategoryId
      ? g.categoryId === selectedCategoryId
      : true;
    const matchesSearch = searchQuery
      ? g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.promptContent.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col h-screen bg-[#F6F8FC]">
      <AppHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="w-[300px] shrink-0 h-full">
          <GroupListPanel
            groups={filteredGroups}
            categories={categories}
            selectedGroupId={selectedGroup?.id || null}
            onSelectGroup={handleSelectGroup}
            onCreateGroup={handleCreateGroup}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={setSelectedCategoryId}
          />
        </div>

        {/* Middle Panel */}
        <div className="flex-1 min-w-[400px] h-full border-r border-gray-200">
          <EditorPanel
            group={selectedGroup}
            categories={categories}
            isUnsaved={isUnsaved}
            isSaving={isSaving}
            onNameChange={(name) => updateGroupState((g) => ({ ...g, name }))}
            onCategoryChange={(categoryId) =>
              updateGroupState((g) => ({ ...g, categoryId }))
            }
            onPromptChange={(promptContent) =>
              updateGroupState((g) => ({ ...g, promptContent }))
            }
            onNegativePromptChange={(negativePrompt) =>
              updateGroupState((g) => ({ ...g, negativePrompt }))
            }
            onRemarkChange={(remark) =>
              updateGroupState((g) => ({ ...g, remark }))
            }
            onAddReference={(ref: ReferenceImage) =>
              updateGroupState((g) => ({
                ...g,
                references: [...(g.references || []), ref],
              }))
            }
            onRemoveReference={(index: number) =>
              updateGroupState((g) => ({
                ...g,
                references: g.references?.filter((_, i) => i !== index) || [],
              }))
            }
            onConfigChange={(config) =>
              updateGroupState((g) => ({ ...g, config }))
            }
            onPromptFieldsChange={(fields: PromptFieldSelections) =>
              updateGroupState((g) => ({
                ...g,
                config: { ...(g.config || DEFAULT_CONFIG), promptFields: fields },
              }))
            }
            onBuildPrompt={() => {
              if (!selectedGroup) return;
              const fields = selectedGroup.config?.promptFields;
              if (!fields) return;
              const result = buildPrompt({
                fields,
                userPrompt: selectedGroup.promptContent || "",
                negativePrompt: selectedGroup.negativePrompt,
              });
              updateGroupState((g) => ({ ...g, promptContent: result.positivePrompt }));
              if (result.negativePrompt && !selectedGroup.negativePrompt) {
                updateGroupState((g) => ({ ...g, negativePrompt: result.negativePrompt }));
              }
            }}
            onSave={handleSave}
            onSaveAs={handleSaveAs}
            onDuplicate={handleDuplicate}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>

        {/* Right Panel */}
        <div className="w-[340px] shrink-0 h-full">
          <ResultPanel latestTask={latestTask} onRetry={handleRetry} />
        </div>
      </div>
    </div>
  );
}
