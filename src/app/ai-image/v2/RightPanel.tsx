"use client";

import { Wand2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CreativePlan, Step, V2Session } from "./types";
import {
  SinglePlanCard, SetPlanCard, PromptPreviewPanel,
} from "./components";

export function RightPanel({
  activeSession,
  onToggleSingle,
  onToggleSet,
  onToggleSub,
  onExpandAllSubs,
  onCollapseAllSubs,
  onEditSingle,
  onEditSub,
  onUpdateSingle,
  onUpdateSub,
  onGeneratePlan,
  onCopyPrompt,
  onSave,
  onExpandToSet,
  onGenerateImage,
  copiedId,
}: {
  activeSession: V2Session | undefined;
  onToggleSingle: (id: string) => void;
  onToggleSet: (id: string) => void;
  onToggleSub: (id: string) => void;
  onExpandAllSubs: (ids: string[]) => void;
  onCollapseAllSubs: () => void;
  onEditSingle: (id: string) => void;
  onEditSub: (id: string) => void;
  onUpdateSingle: (plan: CreativePlan) => void;
  onUpdateSub: (plan: CreativePlan) => void;
  onGeneratePlan: (plan: CreativePlan) => void;
  onCopyPrompt: (plan: CreativePlan) => void;
  onSave: (plan: CreativePlan) => void;
  onExpandToSet: (plan: CreativePlan) => void;
  onGenerateImage: (plan: CreativePlan) => void;
  copiedId: string | null;
}) {
  if (!activeSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Wand2 className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-base font-medium text-gray-500">加载中...</p>
      </div>
    );
  }

  const step: Step = activeSession.step;
  const mode = activeSession.mode;
  const selectedTemplate = null; // passed via context if needed

  const singlePlans = activeSession.singlePlans;
  const expandedSingleId = activeSession.expandedSingleId;
  const editingSingleId = activeSession.editingSingleId;

  const setPlans = activeSession.setPlans;
  const expandedSetId = activeSession.expandedSetId;
  const expandedSubIds = activeSession.expandedSubIds;
  const editingSubId = activeSession.editingSubId;

  const generatingImage = activeSession.generatingImage;
  const generatedImageUrl = activeSession.generatedImages?.[0]?.imageUrl || null;

  const allPlans: CreativePlan[] = [
    ...singlePlans,
    ...setPlans.flatMap((sp) => sp.plans),
  ];
  const previewPlan =
    activeSession.previewPlanId
      ? allPlans.find((p) => p.id === activeSession.previewPlanId) || null
      : null;

  if (step === "input") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Wand2 className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-base font-medium text-gray-500 mb-1">上传商品图并输入制图目标</p>
        <p className="text-sm text-gray-400">
          {mode === "set" ? "AI 将分析商品图片并生成一套 5 张详情组图方案" : "AI 将分析商品图片并生成多个 CreativePlan 方案"}
        </p>
      </div>
    );
  }

  if (step === "generating") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 animate-pulse">
          <Sparkles className="w-6 h-6 text-indigo-400" />
        </div>
        <p className="text-base font-medium text-gray-700 mb-1">AI 正在分析商品图片并生成方案...</p>
        <p className="text-sm text-gray-400">
          {mode === "set" ? "识别产品类型、结构特征，策划 5 张组图的整体方向..." : "识别产品类型、可见结构、材质预估，生成多组方案..."}
        </p>
        <p className="text-xs text-amber-500 mt-2 font-medium">
          ⏱ 约需 30-60 秒，请耐心等待
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className={`flex-1 overflow-y-auto p-5 ${previewPlan ? "max-w-[600px]" : ""}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-500" />
            AI 生成{mode === "set" ? "组图" : "方案"}
            <Badge variant="secondary" className="text-xs">
              {mode === "set" ? setPlans.length : singlePlans.length}
            </Badge>
          </h2>
        </div>

        <div className="space-y-3">
          {mode === "single" ? (
            singlePlans.map((plan, i) => (
              <SinglePlanCard
                key={plan.id}
                plan={plan}
                index={i}
                isExpanded={expandedSingleId === plan.id}
                isEditing={editingSingleId === plan.id}
                onToggle={() => onToggleSingle(plan.id)}
                onEdit={() => onEditSingle(plan.id)}
                onUpdate={onUpdateSingle}
                onGenerate={onGeneratePlan}
                onCopy={onCopyPrompt}
                onSave={onSave}
                onExpandToSet={onExpandToSet}
                copiedId={copiedId}
              />
            ))
          ) : (
            setPlans.map((setPlan) => (
              <SetPlanCard
                key={setPlan.id}
                setPlan={setPlan}
                isExpanded={expandedSetId === setPlan.id}
                expandedSubIds={expandedSubIds}
                editingSubId={editingSubId}
                onToggle={() => onToggleSet(setPlan.id)}
                onToggleSub={onToggleSub}
                onExpandAllSubs={() => onExpandAllSubs(setPlan.plans.map((p) => p.id))}
                onCollapseAllSubs={onCollapseAllSubs}
                onEditSub={onEditSub}
                onUpdateSub={onUpdateSub}
                onGenerateSub={onGeneratePlan}
                onCopySub={onCopyPrompt}
                onSaveSub={onSave}
                copiedId={copiedId}
              />
            ))
          )}
        </div>
      </div>

      {previewPlan && (
        <PromptPreviewPanel
          plan={previewPlan}
          onClose={() => { /* handled by parent */ }}
          copiedId={copiedId}
          onCopy={onCopyPrompt}
          onGenerateImage={onGenerateImage}
          isGeneratingImage={generatingImage}
          generatedImageUrl={generatedImageUrl}
        />
      )}
    </div>
  );
}
