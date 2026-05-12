"use client";

import { Textarea } from "@/components/ui/textarea";
import { QUICK_PROMPT_TAGS } from "@/lib/prompt/rules";
import { cn } from "@/lib/utils";
import { Library, Plus } from "lucide-react";

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  onOpenTemplateLibrary: () => void;
  disabled?: boolean;
}

export default function PromptEditor({
  value,
  onChange,
  onOpenTemplateLibrary,
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
          placeholder="描述你想生成的商品图效果，例如：突出金属质感，纯白背景，45度角商业摄影，保持产品结构不变"
          disabled={disabled}
          className="min-h-[100px] text-sm bg-white border-gray-200 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 resize-none"
        />
      </div>

      {/* Quick tags */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PROMPT_TAGS.map((tag) => (
          <button
            key={tag.id}
            onClick={() => insertTag(tag.text)}
            disabled={disabled}
            className={cn(
              "px-2 py-1 rounded-md text-[11px] transition-colors border",
              "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50"
            )}
          >
            <Plus className="w-2.5 h-2.5 inline mr-0.5 -mt-0.5" />
            {tag.label}
          </button>
        ))}
      </div>

      {/* Template library entry */}
      <button
        onClick={onOpenTemplateLibrary}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium border transition-colors",
          "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30"
        )}
      >
        <Library className="w-3.5 h-3.5" />
        从模板库添加
        <span className="ml-auto text-gray-400">{'>'}</span>
      </button>
    </div>
  );
}
