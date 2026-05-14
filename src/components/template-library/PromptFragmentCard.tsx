"use client";

import { Plus, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PromptFragment } from "@/lib/prompt";

interface PromptFragmentCardProps {
  fragment: PromptFragment;
  onAdd: (fragment: PromptFragment) => void;
  onRemove?: (fragment: PromptFragment) => void;
  isSelected?: boolean;
  showInfo?: boolean;
}

export default function PromptFragmentCard({
  fragment,
  onAdd,
  onRemove,
  isSelected,
  showInfo,
}: PromptFragmentCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-[14px] bg-white transition-all duration-150",
        "hover:bg-[#F8F9FB]",
        isSelected && "ring-1 ring-indigo-200 bg-indigo-50/30"
      )}
    >
      {/* Image */}
      {fragment.previewImageUrl ? (
        <div className="relative aspect-[4/3] rounded-[12px] overflow-hidden mb-2.5">
          <img
            src={fragment.previewImageUrl}
            alt={fragment.name}
            className="w-full h-full object-cover"
          />
          {/* Hover info icon */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white"
              title={fragment.promptFragment}
              onClick={(e) => e.stopPropagation()}
            >
              <Info className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative aspect-[4/3] rounded-[12px] bg-[#F5F6F8] flex items-center justify-center mb-2.5 overflow-hidden">
          <span className="text-xs text-gray-300">示例图</span>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white"
              title={fragment.promptFragment}
              onClick={(e) => e.stopPropagation()}
            >
              <Info className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-1 pb-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-[13px] font-semibold text-gray-800 leading-tight">
            {fragment.name}
          </h3>
          {isSelected && onRemove ? (
            <button
              onClick={() => onRemove(fragment)}
              className="shrink-0 w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center hover:bg-indigo-200 transition-colors"
            >
              <X className="w-3 h-3 text-indigo-600" />
            </button>
          ) : (
            <button
              onClick={() => onAdd(fragment)}
              className="shrink-0 w-6 h-6 rounded-md bg-[#F5F6F8] flex items-center justify-center hover:bg-indigo-100 hover:text-indigo-600 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-gray-500" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
          {fragment.description}
        </p>
        {fragment.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {fragment.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded-md text-[10px] bg-[#F5F6F8] text-gray-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
