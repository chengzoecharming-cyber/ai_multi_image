"use client";

import { ChevronDown, Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductAnalysisBlock } from "../blocks/ProductAnalysisBlock";
import { RiskWarningsBlock } from "../blocks/RiskWarningsBlock";
import { SubPlanCard } from "./SubPlanCard";
import type { ImageSetPlan, CreativePlan } from "../../types";

export function SetPlanCard({
  setPlan,
  isExpanded,
  expandedSubIds,
  editingSubId,
  onToggle,
  onToggleSub,
  onExpandAllSubs,
  onCollapseAllSubs,
  onEditSub,
  onUpdateSub,
  onGenerateSub,
  onCopySub,
  onSaveSub,
  copiedId,
}: {
  setPlan: ImageSetPlan;
  isExpanded: boolean;
  expandedSubIds: string[];
  editingSubId: string | null;
  onToggle: () => void;
  onToggleSub: (id: string) => void;
  onExpandAllSubs: () => void;
  onCollapseAllSubs: () => void;
  onEditSub: (id: string) => void;
  onUpdateSub: (plan: CreativePlan) => void;
  onGenerateSub: (plan: CreativePlan) => void;
  onCopySub: (plan: CreativePlan) => void;
  onSaveSub: (plan: CreativePlan) => void;
  copiedId: string | null;
}) {
  return (
    <div className={cn("rounded-xl border bg-white transition-shadow", isExpanded ? "shadow-md border-gray-300" : "shadow-sm border-gray-200 hover:border-gray-300")}>
      <button onClick={onToggle} className="w-full flex items-start gap-3 p-4 text-left">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Grid3x3 className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-800">{setPlan.setName}</span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1 font-normal">{setPlan.imageCount} 张</Badge>
            {setPlan.platform && (
              <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal text-gray-500">{setPlan.platform}</Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 line-clamp-2">{setPlan.overallDirection}</p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform", isExpanded && "rotate-180")} />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="py-3">
            <ProductAnalysisBlock analysis={setPlan.productAnalysis} />
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <h4 className="text-xs font-semibold text-gray-500 mb-1">整体方向</h4>
            <p className="text-xs text-gray-600 leading-relaxed">{setPlan.overallDirection}</p>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500">5 张子图</span>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" className="h-6 text-[11px] text-indigo-600" onClick={onExpandAllSubs}>
              展开全部
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-[11px] text-gray-500" onClick={onCollapseAllSubs}>
              收起全部
            </Button>
          </div>
          <div className="space-y-2">
            {setPlan.plans.map((plan, i) => (
              <SubPlanCard
                key={plan.id}
                plan={plan}
                index={i}
                isExpanded={expandedSubIds.includes(plan.id)}
                isEditing={editingSubId === plan.id}
                onToggle={() => onToggleSub(plan.id)}
                onEdit={() => onEditSub(plan.id)}
                onUpdate={onUpdateSub}
                onGenerate={onGenerateSub}
                onCopy={onCopySub}
                onSave={onSaveSub}
                copiedId={copiedId}
              />
            ))}
          </div>

          <div className="mt-3">
            <RiskWarningsBlock warnings={setPlan.riskWarnings} />
          </div>
        </div>
      )}
    </div>
  );
}
