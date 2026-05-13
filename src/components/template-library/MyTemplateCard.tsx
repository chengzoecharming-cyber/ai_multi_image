"use client";

import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PromptGroup } from "@/lib/types";

interface MyTemplateCardProps {
  template: PromptGroup;
  onUse: (template: PromptGroup) => void;
}

export default function MyTemplateCard({
  template,
  onUse,
}: MyTemplateCardProps) {
  const fragmentIds: string[] =
    template.config?.selectedFragmentIds ||
    (template.configJson
      ? (() => {
          try {
            const parsed = JSON.parse(template.configJson);
            return parsed?.selectedFragmentIds || [];
          } catch {
            return [];
          }
        })()
      : []);

  return (
    <div className="flex flex-col rounded-[14px] bg-white p-4 hover:bg-[#F8F9FB] transition-all duration-150">
      {/* Cover image if any */}
      {template.coverImageUrl && (
        <div className="aspect-[16/10] rounded-[12px] overflow-hidden mb-3">
          <img
            src={template.coverImageUrl}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <h3 className="text-[14px] font-semibold text-gray-800">
        {template.name}
      </h3>
      {template.remark && (
        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
          {template.remark}
        </p>
      )}

      {fragmentIds.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {fragmentIds.map((id) => (
            <span
              key={id}
              className="px-1.5 py-0.5 rounded-md text-[10px] bg-[#F5F6F8] text-gray-500"
            >
              {id}
            </span>
          ))}
        </div>
      )}

      <Button
        size="sm"
        onClick={() => onUse(template)}
        className="mt-3 h-8 text-[12px] bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
      >
        <Wand2 className="w-3.5 h-3.5 mr-1" />
        使用
      </Button>
    </div>
  );
}
