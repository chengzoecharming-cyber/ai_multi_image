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
  onGenerateDetails: (plan: CreativePlan | null, imageUrl: string) => void;
  onClosePreview: () => void;
  onUpdateSingle: (plan: CreativePlan) => void;
  onOpenImageDetail: (data: ImageDetailData) => void;
  userGoal?: string;
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
  userGoal,
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

  const directGenerating = activeSession.directGenerating;
  const directGeneratedImage =
    !directGenerating && activeSession.generatedImages.length > 0
      ? activeSession.generatedImages[activeSession.generatedImages.length - 1]
      : null;

  if (directGenerating) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4 animate-pulse">
          <Sparkles className="w-6 h-6 text-indigo-400" />
        </div>
        <p className="text-base font-medium text-gray-700 mb-1">AI 正在直接生成图片...</p>
        <p className="text-sm text-gray-400">基于用户输入的 prompt 和商品图生成</p>
        <p className="text-xs text-amber-500 mt-2 font-medium">⏱ 约需 30-90 秒，请耐心等待</p>
      </div>
    );
  }

  if (step === "input") {
    if (directGeneratedImage) {
      return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-gray-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-gray-900">直接生成结果</h2>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 bg-[#F5F6F8]">
            <img
              src={directGeneratedImage.imageBase64 || directGeneratedImage.imageUrl}
              alt="直接生成结果"
              className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
            />
          </div>
        </div>
      );
    }

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
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
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
            onViewImage={(plan) => {
              const generatedImage = activeSession.generatedImages.find((g) => g.planId === plan.id);
              if (generatedImage) {
                onOpenImageDetail({
                  imageUrl: generatedImage.imageBase64 || generatedImage.imageUrl,
                  thumbImageUrl: generatedImage.thumbUrl,
                  prompt: userGoal,
                  productImageUrls: activeSession.productImageUrls,
                  referenceImageUrls: activeSession.referenceImageUrls,
                  plan,
                  source: "product",
                  status: "success",
                  taskId: generatedImage.taskId,
                });
              } else if (activeSession.generatingImagePlanId === plan.id) {
                onOpenImageDetail({
                  imageUrl: "",
                  prompt: userGoal,
                  productImageUrls: activeSession.productImageUrls,
                  referenceImageUrls: activeSession.referenceImageUrls,
                  plan,
                  source: "product",
                  status: "loading",
                });
              }
            }}
            onOpenInfo={setInfoPlan}
          />
        </div>
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
      </div>
    );
  }

  // step === "preview"
  if (!previewPlan) {
    if (directGeneratedImage) {
      return (
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-gray-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={onClosePreview}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-bold text-gray-900">直接生成结果</h2>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 bg-[#F5F6F8]">
            <img
              src={directGeneratedImage.imageBase64 || directGeneratedImage.imageUrl}
              alt="直接生成结果"
              className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
            />
          </div>
        </div>
      );
    }

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
    <div className="flex-1 flex flex-col overflow-hidden">
      <ImagePreviewPanel
        plan={previewPlan}
        generatedImage={generatedForPreview}
        isGeneratingImage={generatingImage}
        productImageUrls={activeSession.productImageUrls}
        referenceImageUrls={activeSession.referenceImageUrls}
        userGoal={userGoal}
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
    </div>
  );
}
