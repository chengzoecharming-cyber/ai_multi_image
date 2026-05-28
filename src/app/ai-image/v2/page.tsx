"use client";

import { Suspense, useState, useCallback } from "react";
import { Wand2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useV2Session } from "./hooks/useV2Session";
import { V2Header } from "./V2Header";
import { SessionsSidebar } from "./SessionsSidebar";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { DetailLeftPanel } from "./DetailLeftPanel";
import { DetailRightPanel } from "./DetailRightPanel";
import PlanTemplateLibraryDrawer from "@/components/template-library/PlanTemplateLibraryDrawer";
import SaveAsTemplateDialog from "@/components/template-library/SaveAsTemplateDialog";
import ImageGalleryDrawer from "./components/ImageGalleryDrawer";
import type { GalleryApplyData } from "./components/ImageGalleryDrawer";

function V2WorkbenchPageInner() {
  const {
    filteredSessions,
    sessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    updateActiveSession,
    createNewSession,
    duplicateSession,
    deleteSession,

    templateLibraryOpen,
    setTemplateLibraryOpen,
    systemTemplates,
    userTemplates,
    refreshUserTemplates,

    saveTemplateOpen,
    setSaveTemplateOpen,
    saveTemplatePlan,
    setSaveTemplatePlan,

    productFileInputRef,
    detailHeroFileInputRef,
    referenceFileInputRef,
    selectedTemplate,

    handleUploadProductImage,
    handleUploadDetailHero,
    handleUploadReferenceImage,
    handleRemoveReferenceImage,
    handleGenerate,
    handleCancelGenerate,
    handleUpdateSinglePlan,
    handleOpenPlanPreview,
    handleOpenSaveTemplate,
    handleSaveTemplate,
    handleUseTemplate,
    handleGenerateImage,
    handleReset,

    setWorkspaceTab,
    toggleDetailType,
    handleGenerateDetail,
    workspaceTab,
    lastDebugPrompt,
  } = useV2Session();

  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);

  const handleApplyGallery = useCallback((data: GalleryApplyData) => {
    // Try to find an existing session that contains this generated image
    const existingSession = sessions.find((s) =>
      s.generatedImages?.some((g) => g.taskId === data.taskId)
    );
    if (existingSession) {
      setActiveSessionId(existingSession.id);
      if ((existingSession.workspaceTab || "product") !== "product") {
        setWorkspaceTab("product");
      }
      // Ensure the session enters preview state for this image
      const matchedImage = existingSession.generatedImages?.find((g) => g.taskId === data.taskId);
      const matchedPlan = existingSession.singlePlans?.find((p) => p.id === matchedImage?.planId);
      if (matchedImage?.planId && matchedPlan) {
        updateActiveSession((s) => ({
          ...s,
          step: "preview" as const,
          previewPlanId: matchedImage.planId ?? null,
        }));
      }
      toast.success("已切换到原会话");
      return;
    }

    toast.error("该记录不存在（修复中）");
  }, [sessions, setActiveSessionId, setWorkspaceTab, updateActiveSession]);

  if (!activeSession) {
    return (
      <div className="flex flex-col h-screen bg-white overflow-hidden items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const step = activeSession.step;
  const tab = workspaceTab;

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <V2Header
        onOpenTemplateLibrary={() => setTemplateLibraryOpen(true)}
        onOpenImageGallery={() => setImageGalleryOpen(true)}
      />

      <main className="flex-1 flex overflow-hidden">
        <SessionsSidebar
          sessions={filteredSessions}
          totalCount={sessions.length}
          activeSessionId={activeSessionId}
          workspaceTab={tab}
          onSelectSession={setActiveSessionId}
          onCreateSession={() => createNewSession({ workspaceTab: tab })}
          onDuplicateSession={duplicateSession}
          onDeleteSession={deleteSession}
          onChangeWorkspaceTab={setWorkspaceTab}
        />

        {tab === "product" ? (
          <LeftPanel
            activeSession={activeSession}
            selectedTemplate={selectedTemplate}
            fileInputRef={productFileInputRef}
            referenceFileInputRef={referenceFileInputRef}
            onUpload={handleUploadProductImage}
            onUploadReference={handleUploadReferenceImage}
            onRemoveReference={handleRemoveReferenceImage}
            onUpdateSession={updateActiveSession}
            onGenerate={handleGenerate}
            onCancelGenerate={handleCancelGenerate}
            onReset={handleReset}
            onOpenTemplateLibrary={() => setTemplateLibraryOpen(true)}
          />
        ) : (
          <DetailLeftPanel
            activeSession={activeSession}
            fileInputRef={detailHeroFileInputRef}
            onUpload={handleUploadDetailHero}
            onUpdateSession={updateActiveSession}
            onToggleDetailType={toggleDetailType}
            onGenerate={handleGenerateDetail}
          />
        )}

        {/* Right Panel — inline because it has many callbacks */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
          <div className="flex-1 flex flex-col overflow-hidden">
            {tab === "product" && step === "input" && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Wand2 className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-base font-medium text-gray-500 mb-1">上传商品图并输入制图目标</p>
              <p className="text-sm text-gray-400">
                AI 将分析商品图片并生成多个方案
              </p>
              {selectedTemplate && (
                <div className="mt-4 px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-100">
                  <p className="text-sm text-indigo-600">已选择模板：{selectedTemplate.name}</p>
                </div>
              )}
            </div>
          )}

          {tab === "product" && step === "generating" && (
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
              {selectedTemplate && (
                <p className="text-xs text-indigo-500 mt-1">基于模板：{selectedTemplate.name}</p>
              )}
            </div>
          )}

          {tab === "product" && (step === "plans" || step === "preview") && (
            <RightPanel
              activeSession={activeSession}
              onSelectPlan={(planId) => updateActiveSession((s) => ({ ...s, expandedSingleId: planId }))}
              onOpenPreview={handleOpenPlanPreview}
              onUpdateSingle={handleUpdateSinglePlan}
              onSave={handleOpenSaveTemplate}
              onGenerateImage={(plan) => {
                handleOpenPlanPreview(plan);
                handleGenerateImage(plan);
              }}
              onGenerateDetails={(plan, imageUrl) =>
                createNewSession({
                  workspaceTab: "detail",
                  goal: activeSession.goal,
                  step: "input",
                  detail: {
                    detailImageUrls: [imageUrl],
                    activeDetailImageIndex: 0,
                    heroPlan: plan,
                    selectedTypes: ["detail", "multi_angle", "lifestyle", "feature", "comparison", "spec"],
                    generating: false,
                    results: [],
                    lastError: null,
                  },
                })
              }
              onClosePreview={() => updateActiveSession((s) => ({ ...s, previewPlanId: null, step: "plans" }))}
            />
          )}

            {tab === "detail" && (
              <DetailRightPanel activeSession={activeSession} />
            )}
          </div>

          {/* 开发调试：Prompt 对比区域 */}
          {lastDebugPrompt && (
            <details className="shrink-0 border-t border-gray-200 bg-white">
              <summary className="px-4 py-2 text-xs font-semibold text-gray-500 cursor-pointer hover:bg-gray-50 select-none flex items-center gap-2">
                <span>🔧</span>
                Debug Prompt Compare
                <span className="ml-auto text-gray-400 font-normal">
                  old: {lastDebugPrompt.oldTemplatePromptLength ?? 0} chars / brief: {lastDebugPrompt.briefPromptLength ?? 0} chars
                </span>
              </summary>
              <div className="px-4 py-3 space-y-3 max-h-[300px] overflow-y-auto">
                {lastDebugPrompt.selectedTemplateId && (
                  <div className="text-xs text-gray-500">selectedTemplateId: {String(lastDebugPrompt.selectedTemplateId)}</div>
                )}
                {lastDebugPrompt.requestId && (
                  <div className="text-xs text-gray-500">requestId: {String(lastDebugPrompt.requestId)}</div>
                )}
                {lastDebugPrompt.briefSourceType && (
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs text-gray-500">
                    <div>source: {String(lastDebugPrompt.briefSourceType)}</div>
                    <div>sourceId: {String(lastDebugPrompt.briefSourceId)}</div>
                    <div>imageType: {String(lastDebugPrompt.briefImageType)}</div>
                    <div>layouts: {String(lastDebugPrompt.briefLayoutCount ?? 0)}</div>
                    <div>variants: {String(lastDebugPrompt.briefVariantCount ?? 0)}</div>
                    <div>style: {String(lastDebugPrompt.briefStyleMode)}</div>
                  </div>
                )}
                {lastDebugPrompt.oldTemplatePrompt && (
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-1">Old Template Prompt</div>
                    <pre className="text-[11px] text-gray-700 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap border border-gray-100">{String(lastDebugPrompt.oldTemplatePrompt)}</pre>
                  </div>
                )}
                {lastDebugPrompt.briefPrompt && (
                  <div>
                    <div className="text-xs font-semibold text-gray-600 mb-1">Brief Prompt</div>
                    <pre className="text-[11px] text-gray-700 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap border border-gray-100">{String(lastDebugPrompt.briefPrompt)}</pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </main>

      {/* Template Library Drawer */}
      <PlanTemplateLibraryDrawer
        open={templateLibraryOpen}
        onClose={() => setTemplateLibraryOpen(false)}
        onUseTemplate={handleUseTemplate}
        systemTemplates={systemTemplates.filter((t) => t.category !== "image_set")}
        userTemplates={userTemplates.filter((t) => t.category !== "image_set")}
      />

      {/* Image Gallery Drawer */}
      <ImageGalleryDrawer
        open={imageGalleryOpen}
        onClose={() => setImageGalleryOpen(false)}
        onApply={handleApplyGallery}
      />

      {/* Save As Template Dialog */}
      <SaveAsTemplateDialog
        open={saveTemplateOpen}
        onClose={() => { setSaveTemplateOpen(false); setSaveTemplatePlan(null); }}
        onSave={handleSaveTemplate}
        defaultName={saveTemplatePlan?.planName || ""}
        defaultCategory="single_image"
        defaultHeadline={saveTemplatePlan?.headline}
        defaultSellingPoints={saveTemplatePlan?.sellingPoints}
        defaultLayoutDirection={saveTemplatePlan?.layoutDirection}
        defaultVisualDirection={saveTemplatePlan?.visualDirection}
        defaultColorDirection={saveTemplatePlan?.colorDirection}
        defaultLayoutOverlay={saveTemplatePlan?.layoutOverlay || null}
      />
    </div>
  );
}

export default function V2WorkbenchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col h-screen bg-white overflow-hidden items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <V2WorkbenchPageInner />
    </Suspense>
  );
}
