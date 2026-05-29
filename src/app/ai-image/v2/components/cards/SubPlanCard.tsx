"use client";

import { ChevronDown, Wand2, Pencil, Save, Copy, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SUB_PLAN_META, IMAGE_TYPE_LABELS } from "../../types";
import { LayoutOverlayBlock } from "../blocks/LayoutOverlayBlock";
import { RiskWarningsBlock } from "../blocks/RiskWarningsBlock";
import { PlanEditableFields } from "../plan/PlanEditableFields";
import type { CreativePlan } from "../../types";

export function SubPlanCard({
  plan,
  index,
  isExpanded,
  isEditing,
  onToggle,
  onEdit,
  onUpdate,
  onGenerate,
  onCopy,
  onSave,
  copiedId,
}: {
  plan: CreativePlan;
  index: number;
  isExpanded: boolean;
  isEditing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onUpdate: (p: CreativePlan) => void;
  onGenerate: (p: CreativePlan) => void;
  onCopy: (p: CreativePlan) => void;
  onSave: (p: CreativePlan) => void;
  copiedId: string | null;
}) {
  const meta = SUB_PLAN_META[index % SUB_PLAN_META.length];
  const Icon = meta.icon;

  return (
    <div className={cn("rounded-lg border bg-white transition-shadow", isExpanded ? "shadow-sm border-gray-300" : "border-gray-200 hover:border-gray-300")}>
      <button onClick={onToggle} className="w-full flex items-center gap-2.5 p-3 text-left">
        <div className={cn("shrink-0 w-7 h-7 rounded-md flex items-center justify-center", meta.bg)}>
          <Icon className={cn("w-3.5 h-3.5", meta.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500">图 {index + 1}</span>
            <span className="text-sm font-medium text-gray-800 truncate">{plan.planName}</span>
            <Badge variant="secondary" className="text-[10px] h-3.5 px-1 font-normal">
              {IMAGE_TYPE_LABELS[plan.imageType] || plan.imageType}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{plan.headline}</p>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform", isExpanded && "rotate-180")} />
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 py-2">
            <Button size="sm" onClick={() => onGenerate(plan)} className="h-7 text-xs bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0">
              <Wand2 className="w-3 h-3 mr-1" />生成制图 Prompt
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onEdit}>
              <Pencil className="w-3 h-3 mr-1" />{isEditing ? "完成" : "编辑"}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onCopy(plan)}>
              {copiedId === plan.id ? <CheckCheck className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-400" onClick={() => onSave(plan)}>
              <Save className="w-3 h-3" />
            </Button>
          </div>

          {plan.layoutOverlay && (
            <div className="mb-2">
              <LayoutOverlayBlock overlay={plan.layoutOverlay} />
            </div>
          )}

          <PlanEditableFields plan={plan} isEditing={isEditing} onUpdate={onUpdate} />
          <div className="mt-3">
            <RiskWarningsBlock warnings={plan.riskWarnings} />
          </div>
        </div>
      )}
    </div>
  );
}
