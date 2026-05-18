"use client";

import { useState, useMemo, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  PromptFragment,
  PromptFragmentGroup,
  FRAGMENT_GROUPS,
  getFragmentsByGroup,
} from "@/lib/prompt";
import type { PromptTag } from "@/lib/prompt";

import type { PromptGroup } from "@/lib/types";
import { getPromptGroups, updatePromptGroup, deletePromptGroup } from "@/lib/api";
import PromptFragmentCard from "./PromptFragmentCard";
import MyTemplateCard from "./MyTemplateCard";
import TemplateDetailDialog from "./TemplateDetailDialog";

type TabKey = PromptFragmentGroup | "my_templates";

const TAB_LIST: { key: TabKey; label: string }[] = [
  ...FRAGMENT_GROUPS.filter((g) => g.key !== "generation_mode"),
  { key: "my_templates", label: "我的模板" },
];

interface TemplateLibraryDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Insert a tag into the prompt editor */
  onInsertTag: (tag: PromptTag) => void;
  /** Remove a tag from the prompt editor by id */
  onRemoveTag?: (tagId: string) => void;
  onUseMyTemplate: (template: PromptGroup) => void;

  selectedFragmentIds?: string[];
}

export default function TemplateLibraryDrawer({
  open,
  onClose,
  onInsertTag,
  onRemoveTag,
  onUseMyTemplate,

  selectedFragmentIds = [],
}: TemplateLibraryDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("product_category");

  // -- Fragment tab state --
  const selectedIdSet = useMemo(
    () => new Set(selectedFragmentIds),
    [selectedFragmentIds]
  );

  const fragmentsToShow = useMemo(() => {
    if (activeTab === "my_templates") return [];
    return getFragmentsByGroup(activeTab as PromptFragmentGroup);
  }, [activeTab]);

  // -- My templates tab state --
  const [myTemplates, setMyTemplates] = useState<PromptGroup[]>([]);

  useEffect(() => {
    if (open && activeTab === "my_templates") {
      loadMyTemplates();
    }
  }, [open, activeTab]);

  const loadMyTemplates = async () => {
    try {
      const res = await getPromptGroups();
      setMyTemplates(res.data);
    } catch (err) {
      console.error("Failed to load my templates:", err);
    }
  };

  // -- Detail dialog --
  const [detailTemplate, setDetailTemplate] = useState<PromptGroup | null>(null);

  const handleDetailSave = async (id: string, data: { name: string; promptContent: string }) => {
    try {
      await updatePromptGroup(id, data);
      setDetailTemplate(null);
      loadMyTemplates();
    } catch (err) {
      console.error("Failed to update template:", err);
    }
  };

  const handleDelete = async (template: PromptGroup) => {
    if (!window.confirm(`确定要删除模板「${template.name}」吗？`)) return;
    try {
      await deletePromptGroup(template.id);
      loadMyTemplates();
    } catch (err) {
      console.error("Failed to delete template:", err);
    }
  };

  if (!open) return null;

  return (
    <div className="absolute left-full top-0 w-[960px] h-full bg-[#F7F8FA] flex flex-col z-50">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#F7F8FA] border-b border-gray-100">
          <h2 className="text-[14px] font-semibold text-gray-800">模板库</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 py-2 bg-[#F7F8FA] border-b border-gray-100 overflow-x-auto">
          {TAB_LIST.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors",
                activeTab === tab.key
                  ? "bg-[#EEF0FF] text-[#4F46E5]"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "my_templates" ? (
            /* My Templates Tab */
            <div className="px-5 py-5">
              {myTemplates.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <p className="text-sm text-gray-500">暂无模板</p>
                  <p className="text-xs text-gray-400 mt-1">
                    你可以将当前 Prompt 组合保存为模板，方便下次复用。
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {myTemplates.map((template) => (
                    <MyTemplateCard
                      key={template.id}
                      template={template}
                      onUse={(t) => {
                        onUseMyTemplate(t);
                        onClose();
                      }}
                      onDetail={(t) => setDetailTemplate(t)}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Fragment Grid */
            <div className="px-5 py-5 grid grid-cols-4 gap-4">
              {fragmentsToShow.map((fragment) => {
                const isSelected = selectedIdSet.has(fragment.id);
                return (
                  <PromptFragmentCard
                    key={fragment.id}
                    fragment={fragment}
                    onAdd={(frag) => {
                      // Single-selection per group: deselect any other fragment in the same group first
                      // Use getFragmentsByGroup so it works across tabs (fragmentsToShow only contains current tab)
                      const allInGroup = getFragmentsByGroup(frag.group);
                      for (const f of allInGroup) {
                        if (f.id !== frag.id && selectedIdSet.has(f.id) && onRemoveTag) {
                          onRemoveTag(f.id);
                        }
                      }
                      const tag: PromptTag = {
                        id: frag.id,
                        type: "fragment",
                        name: frag.name,
                        prompt: frag.promptFragment,
                      };
                      onInsertTag(tag);
                    }}
                    onRemove={
                      isSelected && onRemoveTag
                        ? (frag) => {
                            onRemoveTag(frag.id);
                          }
                        : undefined
                    }
                    isSelected={isSelected}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Template Detail Dialog */}
        <TemplateDetailDialog
          open={!!detailTemplate}
          template={detailTemplate}
          onClose={() => setDetailTemplate(null)}
          onSave={handleDetailSave}
        />
      </div>
    );
}
