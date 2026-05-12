"use client";

import { Textarea } from "@/components/ui/textarea";
import { QUICK_PROMPT_TAGS } from "@/lib/prompt/rules";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function PromptEditor({
  value,
  onChange,
  disabled,
}: PromptEditorProps) {
  const insertTag = (text: string) => {
    const newValue = value ? `${value}，${text}` : text;
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      {/* Prompt textarea */}
      <div>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="自由输入背景描述，或从模板库中选择"
          disabled={disabled}
          className="min-h-[110px] text-[12px] bg-[#F5F6F8] border-0 rounded-xl resize-none placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* Quick tags — single row horizontal scroll, hide scrollbar */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {QUICK_PROMPT_TAGS.map((tag) => (
          <button
            key={tag.id}
            onClick={() => insertTag(tag.text)}
            disabled={disabled}
            className={cn(
              "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[12px] transition-colors border-0 shrink-0",
              "bg-[#F0F1F4] text-gray-600 hover:bg-indigo-50 hover:text-indigo-600"
            )}
          >
            <Plus className="w-3 h-3" />
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}
