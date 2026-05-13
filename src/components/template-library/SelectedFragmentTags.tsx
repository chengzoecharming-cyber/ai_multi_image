"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PromptFragment } from "@/lib/prompt";

interface SelectedFragmentTagsProps {
  fragments: PromptFragment[];
  onRemove: (fragmentId: string) => void;
  className?: string;
}

export default function SelectedFragmentTags({
  fragments,
  onRemove,
  className,
}: SelectedFragmentTagsProps) {
  if (fragments.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {fragments.map((frag) => (
        <span
          key={frag.id}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[12px] font-medium bg-[#EEF0FF] text-[#4F46E5] border-none"
        >
          {frag.name}
          <button
            onClick={() => onRemove(frag.id)}
            className="w-4 h-4 rounded flex items-center justify-center hover:bg-indigo-200/50 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
