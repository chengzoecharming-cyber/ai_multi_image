"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  PromptTemplate,
  getAllTemplates,
  filterTemplates,
  PLATFORM_FILTER_OPTIONS,
  PRODUCT_FILTER_OPTIONS,
  TEMPLATE_TYPE_FILTER_OPTIONS,
  TemplateFilterState,
} from "@/lib/prompt/templates";
import { Check } from "lucide-react";

interface TemplateSelectorProps {
  selectedTemplateId: string | null;
  onSelect: (template: PromptTemplate) => void;
}

const TYPE_ICON: Record<string, string> = {
  白底主图: "⬜",
  卖点图: "⭐",
  信息图: "📋",
  组合图: "📊",
  对比图: "⚖️",
  促销图: "🎯",
  场景图: "🏭",
};

function getTemplateIcon(template: PromptTemplate): string {
  for (const tag of template.tags.templateTypeTags) {
    if (TYPE_ICON[tag]) return TYPE_ICON[tag];
  }
  return "🛠️";
}

export default function TemplateSelector({
  selectedTemplateId,
  onSelect,
}: TemplateSelectorProps) {
  const allTemplates = useMemo(() => getAllTemplates(), []);
  const [filters, setFilters] = useState<TemplateFilterState>({
    platformTag: null,
    productTag: null,
    templateTypeTag: null,
  });

  const filteredTemplates = useMemo(
    () => filterTemplates(allTemplates, filters),
    [allTemplates, filters]
  );

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.platformTag || "all"}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              platformTag: e.target.value === "all" ? null : e.target.value,
            }))
          }
          className="text-[12px] px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 outline-none focus:border-indigo-300"
        >
          {PLATFORM_FILTER_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={filters.productTag || "all"}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              productTag: e.target.value === "all" ? null : e.target.value,
            }))
          }
          className="text-[12px] px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 outline-none focus:border-indigo-300"
        >
          {PRODUCT_FILTER_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={filters.templateTypeTag || "all"}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              templateTypeTag: e.target.value === "all" ? null : e.target.value,
            }))
          }
          className="text-[12px] px-2 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 outline-none focus:border-indigo-300"
        >
          {TEMPLATE_TYPE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Template grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredTemplates.map((template) => {
          const isSelected = selectedTemplateId === template.id;
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template)}
              className={cn(
                "relative flex flex-col items-start p-3 rounded-xl border text-left transition-all",
                isSelected
                  ? "border-indigo-500 bg-indigo-50/40 shadow-sm"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="text-xl mb-2">{getTemplateIcon(template)}</span>
              <span
                className={cn(
                  "text-[13px] font-semibold leading-tight",
                  isSelected ? "text-indigo-700" : "text-gray-800"
                )}
              >
                {template.name}
              </span>
              <span className="text-[11px] text-gray-500 mt-1 leading-snug line-clamp-2">
                {template.description}
              </span>
              <div className="flex flex-wrap gap-1 mt-2">
                {template.tags.templateTypeTags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">没有符合条件的模版</p>
          <p className="text-xs text-gray-400 mt-1">请尝试调整筛选条件</p>
        </div>
      )}
    </div>
  );
}
