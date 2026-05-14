"use client";

import { useState, useRef, useEffect } from "react";
import { Wand2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PromptGroup } from "@/lib/types";

interface MyTemplateCardProps {
  template: PromptGroup;
  onUse: (template: PromptGroup) => void;
  onDetail?: (template: PromptGroup) => void;
  onDelete?: (template: PromptGroup) => void;
}

export default function MyTemplateCard({
  template,
  onUse,
  onDetail,
  onDelete,
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

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <div className="flex flex-col rounded-[14px] bg-white p-4 hover:bg-[#F8F9FB] transition-all duration-150 relative">
      {/* More dropdown */}
      <div className="absolute top-3 right-3 z-10" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="w-6 h-6 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-24 bg-white rounded-lg shadow-md ring-1 ring-black/5 py-1 z-20">
            {onDetail && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDetail(template);
                }}
                className="w-full px-3 py-1.5 text-left text-[12px] text-gray-700 hover:bg-gray-50 transition-colors"
              >
                详情
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(template);
                }}
                className="w-full px-3 py-1.5 text-left text-[12px] text-red-600 hover:bg-red-50 transition-colors"
              >
                删除
              </button>
            )}
          </div>
        )}
      </div>

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

      <h3 className="text-[14px] font-semibold text-gray-800 pr-6">
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
