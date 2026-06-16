"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanTemplate } from "@/lib/plan-templates/types";
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

type TabKey = "official" | "my";

const TABS: { key: TabKey; label: string }[] = [
  { key: "official", label: "官方模版" },
  { key: "my", label: "我的模版" },
];

import { BBG } from "../design-tokens";

export default function TemplatesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("official");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
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

  const filteredTemplates = useMemo(() => {
    const templates = activeTab === "official" ? systemTemplates : userTemplates;

    if (!searchQuery.trim()) return templates;

    const q = searchQuery.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [activeTab, searchQuery, systemTemplates, userTemplates]);

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
        className="min-h-0 flex-1 overflow-y-auto px-6 py-8"
        style={{ backgroundColor: "rgb(248, 249, 250)" }}
      >
        {/* Header */}
        <div className="mx-auto max-w-7xl flex items-center justify-between mb-6">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-3 py-1.5 text-[13px] font-medium rounded-[8px] transition-colors",
                  activeTab === tab.key
                    ? "text-[#0f1419]"
                    : "text-[#72808a] hover:text-[#0f1419]"
                )}
                style={activeTab === tab.key ? { backgroundColor: BBG } : undefined}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Operations */}
          <div className="flex items-center bg-white rounded-lg px-3 py-1.5">
            {/* Search */}
            <div className="flex items-center overflow-hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索模版..."
                className={cn(
                  "h-8 text-[13px] text-[#0f1419] placeholder:text-[#72808a] outline-none transition-all duration-300 ease-out",
                  searchOpen ? "w-40 px-2" : "w-0 px-0"
                )}
              />
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className="flex items-center justify-center w-8 h-8 text-[#72808a] hover:text-[#0f1419] transition-colors shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            {/* Divider */}
            <div className="w-px h-4 bg-gray-200 mx-2 shrink-0" />
            {/* New Template */}
            <button
              className="px-1 text-[13px] font-semibold text-[#0f1419] hover:opacity-80 transition-opacity"
              onClick={() => {
                // TODO: 新建模版操作
              }}
            >
              新建模版
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-transparent" />
          </div>
        ) : (
          <div>
            <div className="mx-auto grid max-w-7xl gap-x-3 gap-y-[22px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pb-8">
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
        )}
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
