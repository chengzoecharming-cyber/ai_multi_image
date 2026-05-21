"use client";

import { useState, useEffect } from "react";
import { X, Save, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PlanTemplate, PlanTemplateCategory } from "@/lib/plan-templates/types";

interface SaveAsTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (template: PlanTemplate) => void;
  defaultName?: string;
  defaultCategory?: PlanTemplateCategory;
  defaultHeadline?: string;
  defaultSellingPoints?: string[];
  defaultLayoutDirection?: string;
  defaultVisualDirection?: string;
  defaultColorDirection?: string;
  defaultLayoutOverlay?: import("@/app/ai-image/v2/types").LayoutOverlay | null;
}

export default function SaveAsTemplateDialog({
  open,
  onClose,
  onSave,
  defaultName = "",
  defaultCategory = "single_image",
  defaultHeadline = "",
  defaultSellingPoints = [],
  defaultLayoutDirection = "",
  defaultVisualDirection = "",
  defaultColorDirection = "",
  defaultLayoutOverlay,
}: SaveAsTemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState<PlanTemplateCategory>(defaultCategory);
  // Rule-template (A): store structure & style rules, not specific copy content.

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setDescription("");
      setTags("");
      // Image set templates are deprecated in the product; force single_image for user templates.
      setCategory("single_image");
    }
  }, [open, defaultName, defaultCategory]);

  const isValid = name.trim() && description.trim();

  const tagList = tags
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const handleSave = () => {
    if (!isValid) return;

    // Keep variables empty; template prompt contains fixed rules & structure.
    const variables: PlanTemplate["variables"] = [];

    const identity: string[] = [];
    if (defaultLayoutDirection) identity.push(`- Layout direction: ${defaultLayoutDirection}`);
    if (defaultVisualDirection) identity.push(`- Visual direction: ${defaultVisualDirection}`);
    if (defaultColorDirection) identity.push(`- Color direction: ${defaultColorDirection}`);
    if (defaultLayoutOverlay) identity.push(`- Layout overlay (JSON guide): ${JSON.stringify(defaultLayoutOverlay)}`);

    const templatePrompt = [
      `You are an expert industrial e-commerce image planning assistant.`,
      ``,
      `MANDATORY (follow exactly):`,
      ...identity,
      ``,
      `Copy strategy:`,
      `- Generate NEW English copy for each product based on the reference image + user goal.`,
      `- Keep copy concise, professional, product-specific.`,
      `- Never invent specs, certifications, prices, logos, or brands.`,
      ``,
      `AVOID:`,
      `- Any product shape change; reference image is the sole authority for structure.`,
      `- Fake UI badges, discount labels, shipping labels, platform branding.`,
    ].join("\n");

    const template: PlanTemplate = {
      id: `user-tpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      description: description.trim(),
      scope: "user",
      category,
      tags: tagList.length > 0 ? tagList : ["用户保存"],
      applicablePlatforms: ["通用"],
      applicableProducts: ["工业品"],
      variables,
      templatePrompt,
      defaultRiskRules: [
        "Do not generate fake logos, fake prices, fake parameters, fake sizes, fake certifications",
        "Do not generate specific technical data not provided by the user",
        "Product reference image is the sole basis for product structure",
      ],
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(template);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[520px] max-h-[85vh] bg-white rounded-2xl shadow-2xl p-6 flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Save className="w-4 h-4 text-indigo-500" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">保存为模板</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1">
          {/* 模板名称 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              模板名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="给模板起个名字..."
              className="h-9 text-sm"
            />
          </div>

          {/* 模板描述 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              模板描述 <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="描述这个模板适合什么场景..."
              className="min-h-[60px] text-sm resize-none"
            />
          </div>

          {/* 标签 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">标签</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="用逗号分隔多个标签..."
              className="h-9 text-sm"
            />
            {tagList.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tagList.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[11px]">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 类别 */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">模板类型</Label>
            <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                onClick={() => setCategory("single_image")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all",
                  category === "single_image"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                单图模板
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5 shrink-0 pt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose} className="h-9 text-sm">
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid}
            className="h-9 text-sm bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            保存为模板
          </Button>
        </div>
      </div>
    </div>
  );
}
