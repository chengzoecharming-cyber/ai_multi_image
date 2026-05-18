"use client";

import { useState, useEffect } from "react";
import { X, Save, LayoutGrid, ImageIcon } from "lucide-react";
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
  const [saveHeadline, setSaveHeadline] = useState(false);
  const [saveSellingPoints, setSaveSellingPoints] = useState(false);
  const [saveLayout, setSaveLayout] = useState(false);
  const [saveVisual, setSaveVisual] = useState(false);
  const [saveColor, setSaveColor] = useState(false);
  const [saveLayoutOverlay, setSaveLayoutOverlay] = useState(false);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setDescription("");
      setTags("");
      setCategory(defaultCategory);
      setSaveHeadline(false);
      setSaveSellingPoints(false);
      setSaveLayout(false);
      setSaveVisual(false);
      setSaveColor(false);
      setSaveLayoutOverlay(false);
    }
  }, [open, defaultName, defaultCategory]);

  const isValid = name.trim() && description.trim();

  const tagList = tags
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const handleSave = () => {
    if (!isValid) return;

    const variables: PlanTemplate["variables"] = [
      { key: "product_name", label: "产品名称", type: "text", required: true },
      { key: "product_analysis", label: "产品分析", type: "textarea" },
    ];

    if (saveHeadline && defaultHeadline) {
      variables.push({
        key: "headline",
        label: "主标题 Headline",
        type: "text",
        required: true,
        defaultValue: defaultHeadline,
      });
    } else {
      variables.push({ key: "headline", label: "主标题 Headline", type: "text", required: true });
    }

    if (saveSellingPoints && defaultSellingPoints.length > 0) {
      variables.push({
        key: "selling_points",
        label: "卖点 Selling Points",
        type: "string_list",
        defaultValue: defaultSellingPoints,
      });
    } else {
      variables.push({ key: "selling_points", label: "卖点 Selling Points", type: "string_list" });
    }

    if (saveLayout && defaultLayoutDirection) {
      variables.push({
        key: "layout_direction",
        label: "版式方向",
        type: "textarea",
        defaultValue: defaultLayoutDirection,
      });
    } else {
      variables.push({ key: "layout_direction", label: "版式方向", type: "textarea" });
    }

    if (saveVisual && defaultVisualDirection) {
      variables.push({
        key: "visual_direction",
        label: "视觉方向",
        type: "textarea",
        defaultValue: defaultVisualDirection,
      });
    } else {
      variables.push({ key: "visual_direction", label: "视觉方向", type: "textarea" });
    }

    if (saveColor && defaultColorDirection) {
      variables.push({
        key: "color_direction",
        label: "色彩方向",
        type: "textarea",
        defaultValue: defaultColorDirection,
      });
    } else {
      variables.push({ key: "color_direction", label: "色彩方向", type: "textarea" });
    }

    if (saveLayoutOverlay && defaultLayoutOverlay) {
      variables.push({
        key: "layout_overlay",
        label: "版式覆盖 LayoutOverlay",
        type: "textarea",
        defaultValue: JSON.stringify(defaultLayoutOverlay),
      });
    } else {
      variables.push({ key: "layout_overlay", label: "版式覆盖 LayoutOverlay", type: "textarea" });
    }

    variables.push(
      { key: "scene_direction", label: "场景方向", type: "textarea" },
      { key: "compatible_tools", label: "适配工具", type: "textarea" },
      { key: "detail_focus", label: "细节聚焦", type: "textarea" },
      { key: "comparison_direction", label: "对比方向", type: "textarea" },
      { key: "user_goal", label: "用户需求", type: "textarea" }
    );

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
      templatePrompt: `You are an expert industrial e-commerce image planning assistant.\n\n## Core Task\nCreate a product image plan based on the user-provided product reference image and goal.\n\n## Absolute Rules\n- Product reference image is the sole basis for product structure\n- Do not alter product outline, proportions, holes, teeth, cutting edges, threads, slots, edges, or irregular contours\n- Do not add or remove product parts\n- Do not generate fake logos, fake prices, fake parameters, fake sizes, fake certifications\n- Do not generate specific technical data not provided by the user\n\n## Variables\n- Product Name: {{product_name}}\n- Product Analysis: {{product_analysis}}\n- Headline: {{headline}}\n- Selling Points: {{selling_points}}\n- Layout Direction: {{layout_direction}}\n- Visual Direction: {{visual_direction}}\n- Color Direction: {{color_direction}}\n- Scene Direction: {{scene_direction}}\n- Compatible Tools: {{compatible_tools}}\n- Detail Focus: {{detail_focus}}\n- Comparison Direction: {{comparison_direction}}\n- User Goal: {{user_goal}}\n\nGenerate a CreativePlan or ImageSetPlan accordingly.`,
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
              <button
                onClick={() => setCategory("image_set")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all",
                  category === "image_set"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                组图模板
              </button>
            </div>
          </div>

          {/* 保存默认值选项 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">保存当前值为默认值</Label>
            <div className="space-y-2 bg-gray-50 rounded-xl border border-gray-100 p-3">
              {defaultHeadline && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveHeadline}
                    onChange={(e) => setSaveHeadline(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">保存当前 headline 为默认值</span>
                  <code className="text-[11px] px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-500 truncate max-w-[180px]">
                    {defaultHeadline}
                  </code>
                </label>
              )}
              {defaultSellingPoints.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveSellingPoints}
                    onChange={(e) => setSaveSellingPoints(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">保存当前 sellingPoints 为默认值</span>
                </label>
              )}
              {defaultLayoutDirection && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveLayout}
                    onChange={(e) => setSaveLayout(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">保存当前 layoutDirection 为默认值</span>
                </label>
              )}
              {defaultVisualDirection && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveVisual}
                    onChange={(e) => setSaveVisual(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">保存当前 visualDirection 为默认值</span>
                </label>
              )}
              {defaultColorDirection && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveColor}
                    onChange={(e) => setSaveColor(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">保存当前 colorDirection 为默认值</span>
                </label>
              )}
              {defaultLayoutOverlay && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveLayoutOverlay}
                    onChange={(e) => setSaveLayoutOverlay(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">保存当前 layoutOverlay 为默认值</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal ml-auto">
                    {defaultLayoutOverlay.layoutType}
                  </Badge>
                </label>
              )}
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
