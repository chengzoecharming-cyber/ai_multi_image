"use client";

import { useState } from "react";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PromptGroupConfig } from "@/lib/types";
import type { PromptTag } from "@/lib/prompt";

interface SaveTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    selectedFragmentIds: string[];
    userPrompt: string;
    negativePrompt: string;
    config: PromptGroupConfig;
    referenceImages: string[];
  }) => void;
  /** Tags currently in the prompt editor */
  tags: PromptTag[];
  userPrompt: string;
  negativePrompt: string;
  config: PromptGroupConfig;
  referenceImages: string[];
}

export default function SaveTemplateDialog({
  open,
  onClose,
  onSave,
  tags,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState("");

  const fragmentTags = tags.filter((t) => t.type === "fragment");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[420px] bg-white rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-semibold text-gray-800">
            保存为模板
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              模板名称
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="给模板起个名字..."
              className="h-10 text-[13px] bg-[#F5F6F8] border-0 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {fragmentTags.length > 0 && (
            <div>
              <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
                已选片段
              </label>
              <div className="flex flex-wrap gap-1.5">
                {fragmentTags.map((t) => (
                  <span
                    key={t.id}
                    className="px-2 py-1 rounded-lg text-[11px] bg-[#EEF0FF] text-[#4F46E5]"
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-9 px-4 text-[13px] rounded-xl"
          >
            取消
          </Button>
          <Button
            onClick={() => {
              if (!name.trim()) return;
              onSave({
                name: name.trim(),
                selectedFragmentIds: fragmentTags.map((t) => t.id),
                userPrompt: "",
                negativePrompt: "",
                config: {},
                referenceImages: [],
              });
              setName("");
            }}
            disabled={!name.trim()}
            className="h-9 px-4 text-[13px] rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}
