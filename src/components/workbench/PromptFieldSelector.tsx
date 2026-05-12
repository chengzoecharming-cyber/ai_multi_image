"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PromptFieldSelections } from "@/lib/types";
import {
  getEnabledOptions,
  PLATFORM_RULES,
  PRODUCT_CATEGORY_RULES,
  IMAGE_TYPE_RULES,
  VISUAL_TAG_RULES,
  BACKGROUND_RULES,
  ANGLE_RULES,
} from "@/lib/prompt/rules";
import { Wand2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptFieldSelectorProps {
  fields: PromptFieldSelections;
  onChange: (fields: PromptFieldSelections) => void;
  onBuildPrompt: () => void;
  disabled?: boolean;
}

export default function PromptFieldSelector({
  fields,
  onChange,
  onBuildPrompt,
  disabled,
}: PromptFieldSelectorProps) {
  const [expanded, setExpanded] = useState(true);

  const updateField = <K extends keyof PromptFieldSelections>(
    key: K,
    value: PromptFieldSelections[K]
  ) => {
    onChange({ ...fields, [key]: value });
  };

  const toggleVisualTag = (tagId: string) => {
    const current = fields.visualTags || [];
    const updated = current.includes(tagId)
      ? current.filter((id) => id !== tagId)
      : [...current, tagId];
    updateField("visualTags", updated.length > 0 ? updated : undefined);
  };

  const platformOptions = getEnabledOptions(PLATFORM_RULES.key);
  const categoryOptions = getEnabledOptions(PRODUCT_CATEGORY_RULES.key);
  const imageTypeOptions = getEnabledOptions(IMAGE_TYPE_RULES.key);
  const visualTagOptions = getEnabledOptions(VISUAL_TAG_RULES.key);
  const backgroundOptions = getEnabledOptions(BACKGROUND_RULES.key);
  const angleOptions = getEnabledOptions(ANGLE_RULES.key);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-xs font-semibold text-gray-700">结构化配置</span>
          <span className="text-[10px] text-gray-400">
            选择字段辅助生成 Prompt
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Platform */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] text-gray-500 mb-1 block">
                电商平台
              </Label>
              <Select
                value={fields.platform || ""}
                onValueChange={(v) =>
                  updateField("platform", v ? v : undefined)
                }
                disabled={disabled}
              >
                <SelectTrigger className="h-8 text-xs bg-white border-gray-200">
                  <SelectValue placeholder="选择平台" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">不限</SelectItem>
                  {platformOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Category */}
            <div>
              <Label className="text-[11px] text-gray-500 mb-1 block">
                产品类目
              </Label>
              <Select
                value={fields.productCategory || ""}
                onValueChange={(v) =>
                  updateField("productCategory", v ? v : undefined)
                }
                disabled={disabled}
              >
                <SelectTrigger className="h-8 text-xs bg-white border-gray-200">
                  <SelectValue placeholder="选择类目" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">不限</SelectItem>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image Type & Background */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[11px] text-gray-500 mb-1 block">
                图片类型
              </Label>
              <Select
                value={fields.imageType || ""}
                onValueChange={(v) =>
                  updateField("imageType", v ? v : undefined)
                }
                disabled={disabled}
              >
                <SelectTrigger className="h-8 text-xs bg-white border-gray-200">
                  <SelectValue placeholder="选择类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">不限</SelectItem>
                  {imageTypeOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-[11px] text-gray-500 mb-1 block">
                背景
              </Label>
              <Select
                value={fields.background || ""}
                onValueChange={(v) =>
                  updateField("background", v ? v : undefined)
                }
                disabled={disabled}
              >
                <SelectTrigger className="h-8 text-xs bg-white border-gray-200">
                  <SelectValue placeholder="选择背景" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">不限</SelectItem>
                  {backgroundOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Angle */}
          <div>
            <Label className="text-[11px] text-gray-500 mb-1 block">
              拍摄角度
            </Label>
            <Select
              value={fields.angle || ""}
              onValueChange={(v) =>
                updateField("angle", v ? v : undefined)
              }
              disabled={disabled}
            >
              <SelectTrigger className="h-8 text-xs bg-white border-gray-200 w-full">
                <SelectValue placeholder="选择角度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">不限</SelectItem>
                {angleOptions.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visual Tags - Multi-select with badges */}
          <div>
            <Label className="text-[11px] text-gray-500 mb-1.5 block">
              视觉标签
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {visualTagOptions.map((opt) => {
                const isSelected = fields.visualTags?.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleVisualTag(opt.id)}
                    disabled={disabled}
                    className={cn(
                      "px-2 py-1 rounded-md text-[11px] transition-colors border",
                      isSelected
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Build Prompt Button */}
          <button
            onClick={onBuildPrompt}
            disabled={disabled}
            className={cn(
              "w-full py-2 rounded-md text-xs font-medium border transition-colors",
              "bg-white border-indigo-200 text-indigo-600 hover:bg-indigo-50",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            <Wand2 className="w-3 h-3 inline mr-1" />
            根据字段生成 Prompt
          </button>
        </div>
      )}
    </div>
  );
}
