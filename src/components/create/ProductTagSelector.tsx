"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  PromptFragment,
  PromptFragmentGroup,
  getFragmentsByGroup,
} from "@/lib/prompt";

const SELECTOR_TABS: { key: PromptFragmentGroup; label: string }[] = [
  { key: "platform", label: "电商平台" },
  { key: "image_type", label: "图片用途" },
  { key: "visual_style", label: "视觉风格" },
  { key: "angle", label: "拍摄角度" },
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
    white_bg_main: "⬜",
    metal_texture: "🔩",
    structure_detail: "🔍",
    scene_application: "🏭",
    display_pedestal: "🏛",
    premium_poster: "🎨",
    // visual_style
    minimal_white: "⬜",
    premium_light_gray: "🔘",
    dark_metal: "⚫",
    blue_tech: "🔵",
    showcase: "🪟",
    workbench: "🛠",
    macro_detail: "🔬",
    warm_commercial: "🟠",
    // angle
    angle_front: "⬆️",
    angle_45: "↗️",
    angle_top: "⬇️",
    angle_closeup: "🔍",
  };
  return map[fragment.id] || "🏷️";
}

/** Background color for the emoji box based on group */
function getEmojiBg(group: PromptFragmentGroup): string {
  switch (group) {
    case "platform":
      return "bg-orange-50";
    case "image_type":
      return "bg-sky-50";
    case "visual_style":
      return "bg-indigo-50";
    case "angle":
      return "bg-emerald-50";
    default:
      return "bg-gray-50";
  }
}

interface ProductTagSelectorProps {
  selectedIds: string[];
  onToggleFragment: (fragment: PromptFragment, selected: boolean) => void;
}

export default function ProductTagSelector({
  selectedIds = [],
  onToggleFragment,
}: ProductTagSelectorProps) {
  const [activeTab, setActiveTab] = useState<PromptFragmentGroup>("platform");

  const fragments = useMemo(
    () => getFragmentsByGroup(activeTab),
    [activeTab]
  );

  return (
    <div className="bg-white rounded-xl flex overflow-hidden h-[320px] gap-3">
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

      {/* Right grid — scrollable, max 3 rows visible */}
      <div className="flex-1 pt-2 pr-2 pb-2 overflow-y-auto">
        <div className="grid grid-cols-3 gap-x-2 gap-y-3">
          {fragments.map((fragment) => {
            const isSelected = selectedIds.includes(fragment.id);
            return (
              <button
                key={fragment.id}
                onClick={() => onToggleFragment(fragment, !isSelected)}
                className="flex flex-col items-center gap-1 group"
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center text-2xl transition-all border-2",
                    getEmojiBg(activeTab),
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
      </div>
    </div>
  );
}
