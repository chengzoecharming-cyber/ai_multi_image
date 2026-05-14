"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getFragmentById } from "@/lib/prompt";
import type { PromptTag } from "@/lib/prompt";
import type { PromptGroup } from "@/lib/types";
import { extractTags } from "@/components/create/PromptEditor";

interface TemplateDetailDialogProps {
  open: boolean;
  template: PromptGroup | null;
  onClose: () => void;
  onSave: (id: string, data: { name: string; promptContent: string }) => void;
}

export default function TemplateDetailDialog({
  open,
  template,
  onClose,
  onSave,
}: TemplateDetailDialogProps) {
  const [name, setName] = useState("");
  const [userTextState, setUserTextState] = useState("");

  // Parse template data when dialog opens
  const parsed = useMemo(() => {
    if (!template) return { tags: [] as PromptTag[], userText: "" };
    const tags = extractTags(template.promptContent);
    // Remove tag placeholders from content to get user text
    let text = template.promptContent;
    tags.forEach((tag) => {
      text = text
        .replace(
          new RegExp(
            `\\{\\{${tag.type}:${tag.id}\\|[^}]+\\}\\}`,
            "g"
          ),
          ""
        )
        .replace(
          new RegExp(`\\{\\{${tag.type}:${tag.id}\\}\\}`, "g"),
          ""
        );
    });
    return { tags, userText: text.replace(/\s+/g, " ").trim() };
  }, [template]);

  useEffect(() => {
    if (open && template) {
      setName(template.name);
      setUserTextState(parsed.userText);
    }
  }, [open, template, parsed.userText]);

  const allTags = parsed.tags;

  const resolveTagPrompt = (tag: PromptTag): string => {
    if (tag.type === "fragment") {
      const frag = getFragmentById(tag.id);
      return frag?.promptFragment || tag.prompt || "";
    }
    return tag.prompt || "";
  };

  const tagStyle = (type: string) => {
    switch (type) {
      case "product":
        return "bg-sky-50 text-sky-700";
      case "fragment":
        return "bg-[#EEF0FF] text-[#4F46E5]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const hasChanges = useMemo(() => {
    if (!template) return false;
    return (
      name.trim() !== template.name ||
      userTextState.trim() !== parsed.userText
    );
  }, [name, userTextState, template, parsed.userText]);

  const isValid = name.trim() && userTextState.trim();

  if (!open || !template) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[520px] max-h-[80vh] bg-white rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        <div className="flex items-center justify-between mb-5 shrink-0">
          <h3 className="text-[15px] font-semibold text-gray-800">
            {template.name}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto">
          {/* 模板名称 */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              模板名称 <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="给模板起个名字..."
              className="h-10 text-[13px] bg-[#F5F6F8] border-0 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* 创意描述（标签 + 输入框） */}
          <div>
            <label className="block text-[13px] font-medium text-gray-700 mb-1.5">
              创意描述 <span className="text-red-500">*</span>
            </label>
            {allTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {allTags.map((t) => {
                  const prompt = resolveTagPrompt(t);
                  return (
                    <span
                      key={`${t.type}:${t.id}`}
                      title={prompt || undefined}
                      className={`px-2 py-1 rounded-lg text-[12px] cursor-help ${tagStyle(t.type)}`}
                    >
                      {t.name}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="text-[11px] text-gray-400 mb-2">
                未选择任何标签，可从模板库添加
              </div>
            )}
            <textarea
              value={userTextState}
              onChange={(e) => setUserTextState(e.target.value)}
              placeholder="输入创意描述..."
              rows={4}
              className="w-full px-3 py-2.5 text-[13px] bg-[#F5F6F8] border-0 rounded-xl resize-none outline-none placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              模板标签 + 创意描述将合并为模板的完整 Prompt
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 shrink-0 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-9 px-4 text-[13px] rounded-xl"
          >
            取消
          </Button>
          <Button
            onClick={() => {
              if (!isValid || !hasChanges) return;
              const tagPlaceholders = allTags
                .map((t) => `{{${t.type}:${t.id}|${t.name}}}`)
                .join(" ");
              const newPromptContent = tagPlaceholders
                ? `${tagPlaceholders} ${userTextState.trim()}`
                : userTextState.trim();

              onSave(template.id, {
                name: name.trim(),
                promptContent: newPromptContent,
              });
            }}
            disabled={!isValid || !hasChanges}
            className="h-9 px-4 text-[13px] rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}
