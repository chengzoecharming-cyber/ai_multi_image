"use client";

import { useState } from "react";
import {
  ChevronDown, Wand2, Pencil, Save, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPlanMeta, IMAGE_TYPE_LABELS } from "../../types";
import { ProductAnalysisBlock } from "../blocks/ProductAnalysisBlock";
import { LayoutOverlayBlock } from "../blocks/LayoutOverlayBlock";
import { RiskWarningsBlock } from "../blocks/RiskWarningsBlock";
import { PlanEditableFields } from "../plan/PlanEditableFields";
import { PlanInfoDialog } from "../plan/PlanInfoDialog";
import type { CreativePlan } from "../../types";

export function SinglePlanCard({
  plan,
  index,
  isExpanded,
  isEditing,
  onToggle,
  onEdit,
  onUpdate,
  onOpenPreview,
  onSave,
  onGenerateImage,
  copiedId,
  variant = "default",
}: {
  plan: CreativePlan;
  index: number;
  isExpanded: boolean;
  isEditing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onUpdate: (p: CreativePlan) => void;
  onOpenPreview: (p: CreativePlan) => void;
  onSave: (p: CreativePlan) => void;
  onGenerateImage: (p: CreativePlan) => void;
  copiedId: string | null;
  variant?: "default" | "compact";
}) {
  const meta = getPlanMeta(plan);
  const Icon = meta.icon;
  const [infoOpen, setInfoOpen] = useState(false);

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "rounded-xl border p-4 transition-all hover:border-gray-300 hover:shadow-sm",
          index % 3 === 0
            ? "bg-indigo-50/60 border-indigo-100"
            : index % 3 === 1
              ? "bg-emerald-50/60 border-emerald-100"
              : "bg-amber-50/60 border-amber-100",
          isExpanded ? "shadow-sm" : ""
        )}
      >
        <button
          onClick={() => onOpenPreview(plan)}
          className="w-full text-left"
          title="查看详情"
        >
          <div className="flex items-start gap-3">
            <div className={cn("shrink-0 w-9 h-9 rounded-lg flex items-center justify-center", meta.bg)}>
              <Icon className={cn("w-4 h-4", meta.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700">方案 {index + 1}</span>
                <Badge variant="outline" className={cn("text-[10px] h-4 px-1 font-normal", meta.color, meta.border)}>
                  {meta.label}
                </Badge>
                <Badge variant="secondary" className="text-[10px] h-4 px-1 font-normal">
                  {IMAGE_TYPE_LABELS[plan.imageType] || plan.imageType}
                </Badge>
              </div>
              <div className="mt-1 flex items-start gap-2">
                <div className="flex-1 text-sm font-medium text-gray-800 line-clamp-2">{plan.headline}</div>
                <button
                  type="button"
                  className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100"
                  title="信息/编辑"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setInfoOpen(true);
                  }}
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                {plan.visualDirection || plan.layoutDirection}
              </div>
            </div>
          </div>
        </button>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            onClick={() => onSave(plan)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white/60 hover:bg-white text-gray-600"
            title="保存为模板"
          >
            <Save className="w-4 h-4" />
          </button>
          <Button
            size="sm"
            onClick={() => { onOpenPreview(plan); onGenerateImage(plan); }}
            className="h-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
          >
            <Wand2 className="w-3.5 h-3.5 mr-1.5" />生成图片
          </Button>
        </div>
        <PlanInfoDialog
          open={infoOpen}
          onOpenChange={setInfoOpen}
          plan={plan}
          onPersist={onUpdate}
        />
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-white transition-shadow", isExpanded ? "shadow-md border-gray-300" : "shadow-sm border-gray-200 hover:border-gray-300")}>
      {/* Card header — clickable to expand/collapse */}
      <button onClick={onToggle} className="w-full flex items-start gap-2.5 p-3 text-left">
        <div className={cn("shrink-0 w-7 h-7 rounded-lg flex items-center justify-center", meta.bg)}>
          <Icon className={cn("w-3.5 h-3.5", meta.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-semibold text-gray-800">方案 {index + 1}</span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1 font-normal">
              {IMAGE_TYPE_LABELS[plan.imageType] || plan.imageType}
            </Badge>
          </div>
          <p className="text-sm font-medium text-gray-700 truncate">{plan.headline}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {(plan.sellingPoints || []).slice(0, 3).map((sp, i) => (
              <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{sp}</span>
            ))}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-0.5 mt-0.5">
          <button
            type="button"
            className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 text-gray-500"
            title="保存为模板"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(plan); }}
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 text-gray-500"
            title="信息/编辑"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setInfoOpen(true); }}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <ChevronDown className={cn("w-4 h-4 text-gray-400 shrink-0 transition-transform", isExpanded && "rotate-180")} />
        </div>
      </button>

      {/* Collapsed state: description + generate button */}
      {!isExpanded && (
        <div className="px-3 pb-3">
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{plan.visualDirection || plan.layoutDirection}</p>
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); onOpenPreview(plan); onGenerateImage(plan); }}
              className="h-7 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            >
              <Wand2 className="w-3 h-3 mr-1" />生成图片
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-400" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Pencil className="w-3 h-3 mr-1" />编辑
            </Button>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2 py-2.5">
            <Button
              size="sm"
              onClick={() => { onOpenPreview(plan); onGenerateImage(plan); }}
              className="h-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            >
              <Wand2 className="w-3.5 h-3.5 mr-1.5" />生成图片
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />{isEditing ? "完成编辑" : "编辑"}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400" onClick={() => onSave(plan)}>
              <Save className="w-3.5 h-3.5 mr-1.5" />保存为模板
            </Button>
          </div>

          {plan.productAnalysis && <ProductAnalysisBlock analysis={plan.productAnalysis} />}

          {plan.layoutOverlay && (
            <div className="mt-3">
              <LayoutOverlayBlock overlay={plan.layoutOverlay} />
            </div>
          )}

          <div className="mt-4">
            <PlanEditableFields plan={plan} isEditing={isEditing} onUpdate={onUpdate} />
          </div>
          <div className="mt-4">
            <RiskWarningsBlock warnings={plan.riskWarnings} />
          </div>
        </div>
      )}

      <PlanInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        plan={plan}
        onPersist={onUpdate}
      />
    </div>
  );
}
