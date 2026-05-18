"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  PromptFragment,
  PromptFragmentGroup,
  getFragmentsByGroup,
} from "@/lib/prompt";
import type { PromptGroup } from "@/lib/types";

const SELECTOR_TABS: { key: PromptFragmentGroup | "my_templates"; label: string }[] = [
  { key: "platform", label: "电商平台" },
  { key: "image_type", label: "图片类型" },
  { key: "angle", label: "拍摄角度" },
  { key: "material", label: "材质表现" },
  { key: "my_templates", label: "我的模版" },
];

/** Emoji mapping for fragment ids — falls back to a generic icon */
function getEmojiForFragment(fragment: PromptFragment): string {
  const map: Record<string, string> = {
    // platform
    temu: "🛒",
    amazon: "📦",
    ozen: "🏪",
    shein: "👗",
    // image_type
    white_main_image: "⬜",
    single_product_feature_image: "⭐",
    multi_sku_lineup_image: "📊",
    usage_scene_image: "🏭",
    detail_magnifier_image: "🔍",
    compatible_tools_image: "🔧",
    advantage_comparison_image: "⚖️",
    specification_info_image: "📋",
    packaging_image: "📦",
    promo_sales_image: "🎯",
    feature_explanation_image: "💡",
    // material
    metal_texture: "🔩",
    brushed_metal: "✨",
    polished_metal: "💎",
    matte_metal: "🪨",
    black_oxide: "⚫",
    chrome_plated: "🔘",
    cnc_machining_marks: "🔧",
    precision_machining: "📐",
    zinc_plated: "🔷",
    anodized_aluminum: "🟣",
    // angle
    angle_front: "⬆️",
    angle_45: "↗️",
    angle_top: "⬇️",
    angle_closeup: "🔍",
  };
  return map[fragment.id] || "🏷️";
}

/** Background color for the emoji box based on group */
function getEmojiBg(group: PromptFragmentGroup | "my_templates"): string {
  switch (group) {
    case "platform":
      return "bg-orange-50";
    case "image_type":
      return "bg-sky-50";
    case "material":
      return "bg-stone-50";
    case "angle":
      return "bg-emerald-50";
    case "my_templates":
      return "bg-amber-50";
    default:
      return "bg-gray-50";
  }
}

interface ProductTagSelectorProps {
  selectedIds: string[];
  onToggleFragment: (fragment: PromptFragment, selected: boolean) => void;
  myTemplates?: PromptGroup[];
  onUseMyTemplate?: (template: PromptGroup) => void;
}

export default function ProductTagSelector({
  selectedIds = [],
  onToggleFragment,
  myTemplates = [],
  onUseMyTemplate,
}: ProductTagSelectorProps) {
  const [activeTab, setActiveTab] = useState<PromptFragmentGroup | "my_templates">("platform");

  const fragments = useMemo(
    () => activeTab === "my_templates" ? [] : getFragmentsByGroup(activeTab as PromptFragmentGroup),
    [activeTab]
  );

  /** Handle fragment click with single-selection-per-group logic */
  const handleFragmentClick = (fragment: PromptFragment) => {
    const isSelected = selectedIds.includes(fragment.id);
    if (isSelected) {
      // Deselect
      onToggleFragment(fragment, false);
    } else {
      // Single-selection per group: deselect any other fragment in the same group first
      // Use getFragmentsByGroup so it works across tabs (fragments only contains current tab)
      const allInGroup = getFragmentsByGroup(fragment.group);
      const sameGroupSelected = allInGroup.filter((f) => selectedIds.includes(f.id));
      for (const f of sameGroupSelected) {
        onToggleFragment(f, false);
      }
      // Then select the clicked one
      onToggleFragment(fragment, true);
    }
  };

  return (
    <div className="bg-white rounded-xl flex overflow-hidden h-[280px] gap-3">
      {/* Left tabs */}
      <div className="w-[90px] shrink-0 py-2">
        {SELECTOR_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "w-full text-left px-3 py-2 text-[12px] transition-colors rounded-lg mx-2",
              activeTab === tab.key
                ? "text-indigo-600 bg-indigo-50 font-medium"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right content */}
      <div className="flex-1 pt-2 pr-2 pb-2 overflow-y-auto">
        {activeTab === "my_templates" ? (
          /* My Templates Grid — same 3x3 style as fragment tabs */
          <div className="grid grid-cols-3 gap-x-2 gap-y-3">
            {myTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => onUseMyTemplate?.(template)}
                className="flex flex-col items-center gap-1 group"
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center text-2xl transition-all border-2",
                    getEmojiBg("my_templates"),
                    "border-transparent group-hover:border-gray-200"
                  )}
                >
                  📝
                </div>
                <span className="text-[12px] leading-tight text-center px-1 text-gray-600 group-hover:text-indigo-600 transition-colors">
                  {template.name}
                </span>
              </button>
            ))}
            {myTemplates.length === 0 && (
              <div className="col-span-3 flex flex-col items-center justify-center h-48 text-center">
                <p className="text-sm text-gray-500">暂无模板</p>
                <p className="text-xs text-gray-400 mt-1">
                  你可以将当前 Prompt 组合保存为模板
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Fragment Grid */
          <div className="grid grid-cols-3 gap-x-2 gap-y-3">
            {fragments.map((fragment) => {
              const isSelected = selectedIds.includes(fragment.id);
              return (
                <button
                  key={fragment.id}
                  onClick={() => handleFragmentClick(fragment)}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div
                    className={cn(
                      "w-16 h-16 rounded-xl flex items-center justify-center text-2xl transition-all border-2",
                      getEmojiBg(activeTab as PromptFragmentGroup),
                      isSelected
                        ? "border-indigo-400 shadow-sm"
                        : "border-transparent group-hover:border-gray-200"
                    )}
                  >
                    {getEmojiForFragment(fragment)}
                  </div>
                  <span
                    className={cn(
                      "text-[12px] leading-tight text-center px-1 transition-colors",
                      isSelected ? "text-indigo-600 font-medium" : "text-gray-600"
                    )}
                  >
                    {fragment.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
