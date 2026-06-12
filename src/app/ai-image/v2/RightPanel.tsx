"use client";

import { useState } from "react";
import { Wand2, Sparkles, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CreativePlan, Step, V2Session } from "./types";
import { PlanInfoDialog } from "./components";
import type { ImageDetailData } from "./components/ImageDetailOverlay";
import { PlanCardStack } from "./right-panel/PlanCardStack";
import { ImagePreviewPanel } from "./right-panel/ImagePreviewPanel";

export interface RightPanelProps {
  activeSession: V2Session | undefined;
  onSelectPlan: (planId: string) => void;
  onOpenPreview: (plan: CreativePlan) => void;
  onSave: (plan: CreativePlan) => void;
  onGenerateImage: (plan: CreativePlan) => void;
  onGenerateDetails: (plan: CreativePlan, imageUrl: string) => void;
  onClosePreview: () => void;
  onUpdateSingle: (plan: CreativePlan) => void;
  onOpenImageDetail: (data: ImageDetailData) => void;
}

export function RightPanel({
  activeSession,
  onSelectPlan,
  onOpenPreview,
  onSave,
  onGenerateImage,
  onGenerateDetails,
  onClosePreview,
  onUpdateSingle,
  onOpenImageDetail,
}: RightPanelProps) {
  const [infoPlan, setInfoPlan] = useState<CreativePlan | null>(null);

  if (!activeSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4">
          <Wand2 className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-base font-medium text-gray-500">加载中...</p>
      </div>
    );
  }

  const step: Step = activeSession.step;
  const singlePlans = activeSession.singlePlans;

  const cardIndex = Math.max(0, singlePlans.findIndex((p) => p.id === activeSession.expandedSingleId));

  const previewPlan =
    activeSession.previewPlanId
      ? singlePlans.find((p) => p.id === activeSession.previewPlanId) || null
      : null;

  const generatingImage = activeSession.generatingImage;
  const generatedForPreview = previewPlan
    ? activeSession.generatedImages.find((g) => g.planId === previewPlan.id) || null
    : null;

  if (step === "input") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4">
          <Wand2 className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-base font-medium text-gray-500 mb-1">上传商品图并输入制图目标</p>
        <p className="text-sm text-gray-400">
          AI 将分析商品图片并生成多个方案
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
          识别产品类型、可见结构、材质预估，生成多组方案...
        </p>
        <p className="text-xs text-amber-500 mt-2 font-medium">
          ⏱ 约需 30-60 秒，请耐心等待
        </p>
      </div>
    );
  }

  if (step === "plans") {
    if (singlePlans.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
          <p className="text-sm text-gray-500">当前会话没有可展示的方案</p>
          <p className="text-xs text-gray-400 mt-2">请返回左侧重新生成方案</p>
        </div>
      );
    }

    const infoDialogPlan = infoPlan || singlePlans[0] || null;

    return (
      <>
        <PlanCardStack
          plans={singlePlans}
          activeIndex={cardIndex}
          generatedImages={activeSession.generatedImages}
          generatingImagePlanId={activeSession.generatingImagePlanId}
          onChangeIndex={(index) => {
            const plan = singlePlans[index];
            if (plan) onSelectPlan(plan.id);
          }}
          onSave={onSave}
          onGenerateImage={onGenerateImage}
          onViewImage={onOpenPreview}
          onOpenInfo={setInfoPlan}
        />
        {infoDialogPlan && (
          <PlanInfoDialog
            open={!!infoPlan}
            onOpenChange={(open) => !open && setInfoPlan(null)}
            plan={infoDialogPlan}
            onPersist={(p) => {
              onUpdateSingle(p);
              setInfoPlan(null);
            }}
          />
        )}
      </>
    );
  }

  // step === "preview"
  if (!previewPlan) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
        <p className="text-sm text-gray-500">未选择方案</p>
        <Button variant="outline" className="mt-4" onClick={onClosePreview}>
          <ChevronLeft className="w-4 h-4 mr-2" />返回方案列表
        </Button>
      </div>
    );
  }

  return (
    <>
      <ImagePreviewPanel
        plan={previewPlan}
        generatedImage={generatedForPreview}
        isGeneratingImage={generatingImage}
        productImageUrls={activeSession.productImageUrls}
        referenceImageUrls={activeSession.referenceImageUrls}
        onBack={onClosePreview}
        onGenerateImage={onGenerateImage}
        onGenerateDetails={onGenerateDetails}
        onSave={onSave}
        onOpenInfo={setInfoPlan}
        onOpenImageDetail={onOpenImageDetail}
      />
      <PlanInfoDialog
        open={!!infoPlan}
        onOpenChange={(open) => !open && setInfoPlan(null)}
        plan={infoPlan || previewPlan}
        onPersist={(p) => {
          onUpdateSingle(p);
          setInfoPlan(null);
        }}
      />
    </>
  );
}
