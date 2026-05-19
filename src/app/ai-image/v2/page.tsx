"use client";

import { Suspense } from "react";
import { Wand2, Sparkles } from "lucide-react";
import { useV2Session } from "./hooks/useV2Session";
import { V2Header } from "./V2Header";
import { SessionsSidebar } from "./SessionsSidebar";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import PlanTemplateLibraryDrawer from "@/components/template-library/PlanTemplateLibraryDrawer";
import SaveAsTemplateDialog from "@/components/template-library/SaveAsTemplateDialog";

function V2WorkbenchPageInner() {
  const {
    sessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    updateActiveSession,
    createNewSession,

    templateLibraryOpen,
    setTemplateLibraryOpen,
    systemTemplates,
    userTemplates,
    refreshUserTemplates,

    saveTemplateOpen,
    setSaveTemplateOpen,
    saveTemplatePlan,
    setSaveTemplatePlan,

    fileInputRef,
    selectedTemplate,

    handleUpload,
    handleGenerate,
    handleToggleSub,
    handleExpandAllSubs,
    handleCollapseAllSubs,
    handleUpdateSinglePlan,
    handleUpdateSubPlan,
    handleGeneratePlan,
    handleCopyPrompt,
    handleExpandToSet,
    handleOpenSaveTemplate,
    handleSaveTemplate,
    handleUseTemplate,
    handleGenerateImage,
    handleReset,
  } = useV2Session();

  if (!activeSession) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F6F8FC] items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const step = activeSession.step;
  const mode = activeSession.mode;
  const productImageUrl = activeSession.productImageUrl;
  const goal = activeSession.goal;

  const singlePlans = activeSession.singlePlans;
  const expandedSingleId = activeSession.expandedSingleId;
  const editingSingleId = activeSession.editingSingleId;

  const setPlans = activeSession.setPlans;
  const expandedSetId = activeSession.expandedSetId;
  const expandedSubIds = activeSession.expandedSubIds;
  const editingSubId = activeSession.editingSubId;

  const copiedId = activeSession.copiedId;
  const generatingImage = activeSession.generatingImage;
  const generatedImageUrl = activeSession.generatedImages?.[0]?.imageUrl || null;

  const allPlans = [
    ...singlePlans,
    ...setPlans.flatMap((sp) => sp.plans),
  ];
  const previewPlan =
    activeSession.previewPlanId
      ? allPlans.find((p) => p.id === activeSession.previewPlanId) || null
      : null;

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F8FC]">
      <V2Header onOpenTemplateLibrary={() => setTemplateLibraryOpen(true)} />

      <main className="flex-1 flex overflow-hidden">
        <SessionsSidebar
          sessions={sessions}
          activeSession={activeSession}
          onSelectSession={(id) => setActiveSessionId(id)}
          onCreateSession={createNewSession}
        />

        <LeftPanel
          activeSession={activeSession}
          selectedTemplate={selectedTemplate}
          fileInputRef={fileInputRef}
          onUpload={handleUpload}
          onUpdateSession={updateActiveSession}
          onGenerate={handleGenerate}
          onReset={handleReset}
        />

        {/* Right Panel — inline because it has many callbacks */}
        <div className="flex-1 flex overflow-hidden">
          {step === "input" && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Wand2 className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-base font-medium text-gray-500 mb-1">上传商品图并输入制图目标</p>
              <p className="text-sm text-gray-400">
                {mode === "set" ? "AI 将分析商品图片并生成一套 5 张详情组图方案" : "AI 将分析商品图片并生成多个 CreativePlan 方案"}
              </p>
              {selectedTemplate && (
                <div className="mt-4 px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-100">
                  <p className="text-sm text-indigo-600">已选择模板：{selectedTemplate.name}</p>
                </div>
              )}
            </div>
          )}

          {step === "generating" && (
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
              {selectedTemplate && (
                <p className="text-xs text-indigo-500 mt-1">基于模板：{selectedTemplate.name}</p>
              )}
            </div>
          )}

          {(step === "plans" || step === "preview") && (
            <RightPanel
              activeSession={activeSession}
              onToggleSingle={(id) => updateActiveSession((s) => ({ ...s, expandedSingleId: s.expandedSingleId === id ? null : id }))}
              onToggleSet={(id) => updateActiveSession((s) => ({ ...s, expandedSetId: s.expandedSetId === id ? null : id }))}
              onToggleSub={handleToggleSub}
              onExpandAllSubs={handleExpandAllSubs}
              onCollapseAllSubs={handleCollapseAllSubs}
              onEditSingle={(id) => updateActiveSession((s) => ({ ...s, editingSingleId: s.editingSingleId === id ? null : id }))}
              onEditSub={(id) => updateActiveSession((s) => ({ ...s, editingSubId: s.editingSubId === id ? null : id }))}
              onUpdateSingle={handleUpdateSinglePlan}
              onUpdateSub={handleUpdateSubPlan}
              onGeneratePlan={handleGeneratePlan}
              onCopyPrompt={handleCopyPrompt}
              onSave={handleOpenSaveTemplate}
              onExpandToSet={handleExpandToSet}
              onGenerateImage={handleGenerateImage}
              copiedId={copiedId}
            />
          )}
        </div>
      </main>

      {/* Template Library Drawer */}
      <PlanTemplateLibraryDrawer
        open={templateLibraryOpen}
        onClose={() => setTemplateLibraryOpen(false)}
        onUseTemplate={handleUseTemplate}
        systemTemplates={systemTemplates}
        userTemplates={userTemplates}
      />

      {/* Save As Template Dialog */}
      <SaveAsTemplateDialog
        open={saveTemplateOpen}
        onClose={() => { setSaveTemplateOpen(false); setSaveTemplatePlan(null); }}
        onSave={handleSaveTemplate}
        defaultName={saveTemplatePlan?.planName || ""}
        defaultCategory={mode === "set" ? "image_set" : "single_image"}
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
        <div className="flex flex-col min-h-screen bg-[#F6F8FC] items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <V2WorkbenchPageInner />
    </Suspense>
  );
}
