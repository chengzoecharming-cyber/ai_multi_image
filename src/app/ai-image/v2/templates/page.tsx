"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanTemplate, TemplateGroup } from "@/lib/plan-templates/types";
import { TEMPLATE_GROUP_LABELS } from "@/lib/plan-templates/types";
import {
  getSystemTemplates,
  savedTemplateToPlanTemplate,
} from "@/app/ai-image/v2/domain/templates";
import {
  getSavedTemplates,
  getSavedTemplatesFromServer,
} from "@/app/ai-image/v2/domain/templates/user-templates";
import { TemplateCard } from "./components/TemplateCard";
import { TemplateDetailDialog } from "./components/TemplateDetailDialog";

const GROUP_TABS: TemplateGroup[] = [
  "all",
  "ecommerce",
  "character",
  "storyboard",
  "my",
  "favorites",
];

function CheckableTag({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors border",
        checked
          ? "bg-[rgb(235,236,237)] text-[#0f1419] border-[rgb(235,236,237)]"
          : "bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:text-[#0f1419]"
      )}
    >
      {children}
    </button>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [activeGroup, setActiveGroup] = useState<TemplateGroup>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [systemTemplates, setSystemTemplates] = useState<PlanTemplate[]>([]);
  const [userTemplates, setUserTemplates] = useState<PlanTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PlanTemplate | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sys = getSystemTemplates();
    setSystemTemplates(sys);

    const loadUserTemplates = async () => {
      try {
        const serverTemplates = await getSavedTemplatesFromServer();
        setUserTemplates(serverTemplates);
      } catch {
        const localTemplates = await getSavedTemplates();
        setUserTemplates(localTemplates.map(savedTemplateToPlanTemplate));
      }
    };

    loadUserTemplates().finally(() => setIsLoading(false));
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    [...systemTemplates, ...userTemplates].forEach((t) => {
      t.tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [systemTemplates, userTemplates]);

  const filteredTemplates = useMemo(() => {
    let result: PlanTemplate[] = [...systemTemplates, ...userTemplates];

    if (activeGroup === "my") {
      result = userTemplates;
    } else if (activeGroup === "favorites") {
      result = [];
    } else if (activeGroup !== "all") {
      result = result.filter((t) => t.group === activeGroup);
    }

    if (selectedTags.length > 0) {
      result = result.filter((t) =>
        selectedTags.some((tag) => t.tags.includes(tag))
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return result;
  }, [activeGroup, selectedTags, searchQuery, systemTemplates, userTemplates]);

  const totalCount = systemTemplates.length + userTemplates.length;

  const toggleTag = (tag: string) => {
    if (tag === "全部") return setSelectedTags([]);
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleUseTemplate = (template: PlanTemplate) => {
    localStorage.setItem(
      "v2-selected-template",
      JSON.stringify({
        id: template.id,
        name: template.name,
        timestamp: Date.now(),
      })
    );
    router.push("/ai-image/v2");
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <main
        className="min-h-0 flex-1 overflow-y-auto bg-stone-50 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] px-6 py-8 [background-size:16px_16px]"
      >
        <div className="pb-8">
          {/* Title */}
          <div className="mx-auto max-w-5xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-[#0f1419]">
              模版库
            </h1>
            {!isLoading && (
              <p className="mt-3 text-sm text-stone-500">
                共 {totalCount} 个模版，按名称、标签与分类快速查找灵感。
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="flex h-60 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-transparent" />
            </div>
          ) : null}

          {!isLoading ? (
            <>
              {/* Search */}
              <div className="mx-auto mt-8 w-full max-w-2xl">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索模版名称、描述或标签..."
                    className="h-12 w-full rounded-xl border border-stone-200 bg-white pl-12 pr-4 text-base text-stone-700 shadow-sm placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="mx-auto mt-6 grid max-w-6xl gap-3 text-left">
                {/* Category */}
                <div className="grid gap-2 sm:grid-cols-[56px_minmax(0,1fr)] sm:items-start">
                  <div className="pt-2 text-xs font-medium text-stone-500">
                    分类
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {GROUP_TABS.map((group) => (
                      <CheckableTag
                        key={group}
                        checked={activeGroup === group}
                        onChange={() => setActiveGroup(group)}
                      >
                        {TEMPLATE_GROUP_LABELS[group]}
                      </CheckableTag>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="grid gap-2 sm:grid-cols-[56px_minmax(0,1fr)] sm:items-start">
                  <div className="pt-2 text-xs font-medium text-stone-500">
                    标签
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <CheckableTag
                      checked={selectedTags.length === 0}
                      onChange={() => setSelectedTags([])}
                    >
                      全部
                    </CheckableTag>
                    {allTags.map((tag) => (
                      <CheckableTag
                        key={tag}
                        checked={selectedTags.includes(tag)}
                        onChange={() => toggleTag(tag)}
                      >
                        {tag}
                      </CheckableTag>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {!isLoading ? (
          <div>
            <div className="mx-auto grid max-w-7xl gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onOpen={() => {
                    setSelectedTemplate(template);
                    setDetailOpen(true);
                  }}
                  onUse={(e) => {
                    e.stopPropagation();
                    handleUseTemplate(template);
                  }}
                />
              ))}
            </div>

            {filteredTemplates.length === 0 ? (
              <div className="mx-auto flex flex-col items-center justify-center py-16 text-center">
                <p className="text-sm text-stone-500">没有找到匹配的模版</p>
                <p className="mt-1 text-xs text-stone-400">
                  尝试调整筛选条件或搜索关键词
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </main>

      <TemplateDetailDialog
        open={detailOpen}
        template={selectedTemplate}
        onClose={() => setDetailOpen(false)}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
}
