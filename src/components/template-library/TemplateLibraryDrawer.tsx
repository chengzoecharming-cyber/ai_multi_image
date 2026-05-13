"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Search, Plus, Replace, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  PromptFragment,
  PromptFragmentGroup,
  FRAGMENT_GROUPS,
  getFragmentsByGroup,
} from "@/lib/prompt";
import {
  TEMPLATE_CATEGORY_RULES,
  TEMPLATE_STYLE_RULES,
  TEMPLATE_TYPE_RULES,
  TEMPLATE_SOURCE_OPTIONS,
  getEnabledOptions,
} from "@/lib/prompt/rules";
import type { PromptGroup } from "@/lib/types";
import { getPromptGroups } from "@/lib/api";
import PromptFragmentCard from "./PromptFragmentCard";
import MyTemplateCard from "./MyTemplateCard";

type TabKey = PromptFragmentGroup | "public_templates" | "my_templates";

const TAB_LIST: { key: TabKey; label: string }[] = [
  ...FRAGMENT_GROUPS,
  { key: "public_templates", label: "公共模板" },
  { key: "my_templates", label: "我的模板" },
];

interface TemplateLibraryDrawerProps {
  open: boolean;
  onClose: () => void;
  onAddFragment: (fragment: PromptFragment) => void;
  onRemoveFragment?: (fragmentId: string) => void;
  onUseMyTemplate: (template: PromptGroup) => void;
  onInsertTemplate: (template: PromptGroup) => void;
  onReplaceTemplate: (template: PromptGroup) => void;
  selectedFragmentIds?: string[];
}

export default function TemplateLibraryDrawer({
  open,
  onClose,
  onAddFragment,
  onRemoveFragment,
  onUseMyTemplate,
  onInsertTemplate,
  onReplaceTemplate,
  selectedFragmentIds = [],
}: TemplateLibraryDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("product_category");

  // -- Fragment tab state --
  const selectedIdSet = useMemo(
    () => new Set(selectedFragmentIds),
    [selectedFragmentIds]
  );

  const fragmentsToShow = useMemo(() => {
    if (activeTab === "public_templates" || activeTab === "my_templates") return [];
    return getFragmentsByGroup(activeTab as PromptFragmentGroup);
  }, [activeTab]);

  // -- Public templates tab state --
  const [publicTemplates, setPublicTemplates] = useState<PromptGroup[]>([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [styleFilter, setStyleFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  useEffect(() => {
    if (open && activeTab === "public_templates") {
      loadPublicTemplates();
    }
  }, [open, activeTab]);

  const loadPublicTemplates = async () => {
    setPublicLoading(true);
    try {
      const res = await getPromptGroups();
      setPublicTemplates(res.data);
    } catch (err) {
      console.error("Failed to load templates:", err);
    } finally {
      setPublicLoading(false);
    }
  };

  const filteredPublic = publicTemplates.filter((t) => {
    const matchesSearch = search
      ? t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.promptContent.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesCategory =
      categoryFilter === "all"
        ? true
        : t.category?.name?.toLowerCase().includes(
            getEnabledOptions("templateCategory").find((o) => o.id === categoryFilter)?.label.toLowerCase() || ""
          );
    return matchesSearch && matchesCategory;
  });

  const categoryOptions = getEnabledOptions("templateCategory");
  const styleOptions = getEnabledOptions("templateStyle");
  const typeOptions = getEnabledOptions("templateType");

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-[800px] h-full bg-[#F7F8FA] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100">
          <h2 className="text-[14px] font-semibold text-gray-800">模板库</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-5 py-2 bg-white border-b border-gray-100 overflow-x-auto">
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
          {activeTab === "public_templates" ? (
            /* Public Templates Tab */
            <div className="flex flex-col h-full">
              {/* Filters */}
              <div className="px-5 py-3 space-y-3 bg-white border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索模板..."
                    className="h-9 pl-9 text-[13px] bg-[#F5F6F8] border-0 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {categoryOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setCategoryFilter(opt.id)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[12px] transition-colors border-0",
                        categoryFilter === opt.id
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-[#F5F6F8] text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {styleOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setStyleFilter(opt.id)}
                      className={cn(
                        "px-2.5 py-1.5 rounded-lg text-[12px] transition-colors border-0",
                        styleFilter === opt.id
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-[#F5F6F8] text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-8 px-3 text-[12px] bg-[#F5F6F8] border-0 rounded-lg text-gray-600 outline-none"
                  >
                    {typeOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="h-8 px-3 text-[12px] bg-[#F5F6F8] border-0 rounded-lg text-gray-600 outline-none"
                  >
                    {TEMPLATE_SOURCE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Template list */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {publicLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                ) : filteredPublic.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center">
                    <p className="text-sm text-gray-500">暂无模板</p>
                    <p className="text-xs text-gray-400 mt-1">
                      你可以先保存常用 Prompt 为我的模板
                    </p>
                  </div>
                ) : (
                  filteredPublic.map((template) => (
                    <div
                      key={template.id}
                      className="p-3 rounded-2xl bg-[#F8F9FB] hover:bg-indigo-50/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm font-medium text-gray-800 truncate">
                            {template.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {template.promptContent}
                          </p>
                        </div>
                        <button className="shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-amber-500 transition-colors">
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 mt-2">
                        {template.category?.name && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white text-gray-500">
                            {template.category.name}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          {template.promptContent.length} 字
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            onInsertTemplate(template);
                            onClose();
                          }}
                          className="h-7 px-2 text-[11px] text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                        >
                          <Plus className="w-3 h-3 mr-0.5" />
                          插入
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            onReplaceTemplate(template);
                            onClose();
                          }}
                          className="h-7 px-2 text-[11px] text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                        >
                          <Replace className="w-3 h-3 mr-0.5" />
                          替换
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : activeTab === "my_templates" ? (
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
                    onAdd={onAddFragment}
                    onRemove={
                      onRemoveFragment && isSelected
                        ? () => onRemoveFragment(fragment.id)
                        : undefined
                    }
                    isSelected={isSelected}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
