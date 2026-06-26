"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { Wand2, Sparkles, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { useV2Session } from "./hooks/useV2Session";
import { SessionsSidebar } from "./SessionsSidebar";
import { LeftPanel } from "./LeftPanel";
import { RightPanel } from "./RightPanel";
import { DetailLeftPanel } from "./DetailLeftPanel";
import { DetailRightPanel } from "./DetailRightPanel";
import SaveAsTemplateDialog from "@/components/template-library/SaveAsTemplateDialog";
import PlanTemplateLibraryDrawer from "@/components/template-library/PlanTemplateLibraryDrawer";
import ImageGalleryDrawer from "./components/ImageGalleryDrawer";
import ImageDetailOverlay from "./components/ImageDetailOverlay";
import AssetLibrarySidebar from "./components/AssetLibrarySidebar";
import type { GalleryApplyData } from "./components/ImageGalleryDrawer";
import type { ImageDetailData } from "./components/ImageDetailOverlay";
import type { CreativePlan } from "./types";

function V2WorkbenchPageInner() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";
  const isAdmin = (session?.user as { role?: string })?.role === "admin";
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

    saveTemplateOpen,
    setSaveTemplateOpen,
    saveTemplatePlan,
    setSaveTemplatePlan,

    productFileInputRef,
    detailHeroFileInputRef,
    referenceFileInputRef,
    selectedTemplate,

    templateLibraryOpen,
    setTemplateLibraryOpen,
    systemTemplates,
    userTemplates,

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
    handleRetryDetailType,
    handleRefreshDetailType,
    stopAllDetailGeneration,
    stopDetailTypeGeneration,
    isDetailGenerating,
    workspaceTab,
    lastDebugPrompt,
  } = useV2Session();

  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [imageDetailData, setImageDetailData] = useState<ImageDetailData | null>(null);
  const [assetLibraryOpen, setAssetLibraryOpen] = useState(false);

  const openImageDetail = useCallback((data: ImageDetailData) => setImageDetailData(data), []);
  const closeImageDetail = useCallback(() => setImageDetailData(null), []);

  // ── Load template selection from localStorage (from Templates page) ──
  useEffect(() => {
    if (!activeSession) return;
    try {
      const raw = localStorage.getItem("v2-selected-template");
      if (!raw) return;
      const parsed = JSON.parse(raw) as { id: string; name: string; timestamp: number };
      // Only use if within 5 minutes
      if (Date.now() - parsed.timestamp > 5 * 60 * 1000) {
        localStorage.removeItem("v2-selected-template");
        return;
      }
      // Apply the template
      handleUseTemplate({ id: parsed.id, name: parsed.name } as Parameters<typeof handleUseTemplate>[0]);
      localStorage.removeItem("v2-selected-template");
    } catch {
      localStorage.removeItem("v2-selected-template");
    }
  }, [activeSession, handleUseTemplate]);

  // 当生成的图片被持久化到本地后，同步更新 ImageDetailOverlay 中的 imageUrl
  useEffect(() => {
    if (!imageDetailData || !imageDetailData.taskId) return;
    const match = activeSession?.generatedImages?.find(
      (g) => g.taskId === imageDetailData.taskId && g.imageUrl !== imageDetailData.imageUrl
    );
    if (!match) return;
    setImageDetailData((prev) =>
      prev ? { ...prev, imageUrl: match.imageUrl, thumbImageUrl: match.thumbUrl ?? prev.thumbImageUrl } : prev
    );
  }, [activeSession?.generatedImages, imageDetailData?.taskId]);

  const ensureLocalTaskImage = useCallback(async (taskId: string | undefined, imageUrl: string) => {
    if (!imageUrl) return imageUrl;
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const isRelative = imageUrl.startsWith("/");
      const isSameOriginAbsolute = imageUrl.startsWith(origin);
      if (isRelative || isSameOriginAbsolute) {
        return isRelative ? imageUrl : imageUrl.slice(origin.length) || imageUrl;
      }
    }
    if (!taskId) return imageUrl;
    try {
      const res = await fetch(`/api/ai-image/tasks/${taskId}/persist-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      if (!res.ok) return imageUrl;
      const data = (await res.json()) as { localUrl?: string };
      return data.localUrl || imageUrl;
    } catch {
      return imageUrl;
    }
  }, []);

  const handleApplyGallery = useCallback(async (data: GalleryApplyData) => {
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

  // ── Handle image generation with overlay state ──
  const handleGenerateImageWithOverlay = useCallback(async (plan: CreativePlan) => {
    const userGoal = activeSession?.goal || "";
    const existingImage = activeSession?.generatedImages?.find((g) => g.planId === plan.id);

    if (existingImage) {
      // Re-generate: show loading overlay then trigger generation
      openImageDetail({
        imageUrl: "",
        prompt: userGoal,
        referenceImageUrls: activeSession?.referenceImageUrls,
        productImageUrls: activeSession?.productImageUrls,
        plan,
        source: "product",
        status: "loading",
      });

      const result = await handleGenerateImage(plan);

      if (result.success && result.imageUrl) {
        setImageDetailData((prev) =>
          prev && prev.plan?.id === plan.id
            ? {
                ...prev,
                imageUrl: result.imageBase64 || result.imageUrl!,
                taskId: result.taskId,
                status: "success",
              }
            : prev
        );
      } else {
        setImageDetailData((prev) =>
          prev && prev.plan?.id === plan.id
            ? {
                ...prev,
                status: "error",
                errorMessage: result.error || "生成失败",
              }
            : prev
        );
      }
      return;
    }

    // Open overlay with loading state
    openImageDetail({
      imageUrl: "",
      prompt: userGoal,
      referenceImageUrls: activeSession?.referenceImageUrls,
      productImageUrls: activeSession?.productImageUrls,
      plan,
      source: "product",
      status: "loading",
    });

    // Trigger generation
    const result = await handleGenerateImage(plan);

    // Update overlay based on result
    if (result.success && result.imageUrl) {
      setImageDetailData((prev) =>
        prev && prev.plan?.id === plan.id
          ? {
              ...prev,
              imageUrl: result.imageBase64 || result.imageUrl!,
              taskId: result.taskId,
              status: "success",
            }
          : prev
      );
    } else {
      setImageDetailData((prev) =>
        prev && prev.plan?.id === plan.id
          ? {
              ...prev,
              status: "error",
              errorMessage: result.error || "生成失败",
            }
          : prev
      );
    }
  }, [activeSession, handleGenerateImage, openImageDetail]);

  // ── Handle generate details from overlay / preview panel ──
  const handleGenerateDetails = useCallback(
    async (plan: CreativePlan | null, imageUrl: string) => {
      if (!activeSession) return;
      const matchedGenerated = plan
        ? activeSession.generatedImages?.find(
            (img) => img.planId === plan.id && img.imageUrl === imageUrl
          ) || activeSession.generatedImages?.find((img) => img.planId === plan.id)
        : activeSession.generatedImages?.find((img) => img.imageUrl === imageUrl);
      const safeImageUrl = await ensureLocalTaskImage(matchedGenerated?.taskId, imageUrl);
      createNewSession({
        workspaceTab: "detail",
        goal: activeSession.goal,
        step: "input",
        provider: activeSession.provider,
        detail: {
          detailImageUrls: [safeImageUrl],
          activeDetailImageIndex: 0,
          heroPlan: plan,
          selectedTypes: ["detail", "multi_angle", "lifestyle", "feature", "comparison", "spec"],
          generating: false,
          generatingTypes: [],
          activeGeneratingType: null,
          failedTypes: [],
          results: [],
          lastError: null,
        },
      });
    },
    [activeSession, createNewSession, ensureLocalTaskImage]
  );

  // ── Handle retry from overlay ──
  const handleRetryImage = useCallback(async (plan: CreativePlan) => {
    // Update overlay to loading state
    setImageDetailData((prev) =>
      prev && prev.plan?.id === plan.id
        ? { ...prev, status: "loading", errorMessage: undefined }
        : prev
    );

    // Trigger generation again
    const result = await handleGenerateImage(plan);

    if (result.success && result.imageUrl) {
      setImageDetailData((prev) =>
        prev && prev.plan?.id === plan.id
          ? {
              ...prev,
              imageUrl: result.imageBase64 || result.imageUrl!,
              taskId: result.taskId,
              status: "success",
            }
          : prev
      );
    } else {
      setImageDetailData((prev) =>
        prev && prev.plan?.id === plan.id
          ? {
              ...prev,
              status: "error",
              errorMessage: result.error || "生成失败",
            }
          : prev
      );
    }
  }, [handleGenerateImage]);


  if (!activeSession) {
    return (
      <div className="flex flex-col h-screen bg-[rgb(248,249,250)] overflow-hidden items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0f1419] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const step = activeSession.step;
  const tab = workspaceTab;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[rgb(248,249,250)] overflow-hidden">
      <main className="flex-1 flex overflow-hidden">
        <SessionsSidebar
          sessions={filteredSessions}
          totalCount={sessions.length}
          activeSessionId={activeSessionId}
          workspaceTab={tab}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
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
            onOpenImageDetail={openImageDetail}
          />
        ) : (
          <DetailLeftPanel
            activeSession={activeSession}
            fileInputRef={detailHeroFileInputRef}
            onUpload={handleUploadDetailHero}
            onUpdateSession={updateActiveSession}
            onToggleDetailType={toggleDetailType}
            onGenerate={handleGenerateDetail}
            onStopAll={stopAllDetailGeneration}
            onOpenImageDetail={openImageDetail}
          />
        )}

        {/* Right Panel */}
        <div className="relative flex-1 flex flex-col overflow-hidden bg-[rgb(248,249,250)]">
          {tab === "product" && (
            <div className="flex items-center justify-end px-6 py-3 shrink-0">
              <div className="flex items-center bg-white rounded-lg px-3 py-1.5">
                <button
                  onClick={() => setAssetLibraryOpen((v) => !v)}
                  className="flex items-center gap-1.5 px-1 text-[13px] font-semibold text-[#0f1419] hover:opacity-80 transition-opacity"
                >
                  <ImageIcon className="w-4 h-4" />
                  资产库
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              {tab === "product" && (
                <RightPanel
                  activeSession={activeSession}
                  userGoal={activeSession?.goal}
                  onSelectPlan={(planId) => updateActiveSession((s) => ({ ...s, expandedSingleId: planId }))}
                  onOpenPreview={handleOpenPlanPreview}
                  onUpdateSingle={handleUpdateSinglePlan}
                  onSave={handleOpenSaveTemplate}
                  onGenerateImage={handleGenerateImageWithOverlay}
                  onGenerateDetails={handleGenerateDetails}
                  onClosePreview={() => updateActiveSession((s) => ({ ...s, previewPlanId: null, step: "plans" }))}
                  onOpenImageDetail={openImageDetail}
                />
              )}

              {tab === "detail" && (
                <DetailRightPanel
                  activeSession={activeSession}
                  onRetryType={handleRetryDetailType}
                  onRefreshType={handleRefreshDetailType}
                  onStopType={stopDetailTypeGeneration}
                  onOpenImageDetail={openImageDetail}
                />
              )}
            </div>
          </div>

          {tab === "product" && (
            <AssetLibrarySidebar
              open={assetLibraryOpen}
              onClose={() => setAssetLibraryOpen(false)}
              onOpenImageDetail={openImageDetail}
            />
          )}
        </div>
      </main>

      {/* Image Gallery Drawer */}
      <ImageGalleryDrawer
        open={imageGalleryOpen}
        onClose={() => setImageGalleryOpen(false)}
        onApply={handleApplyGallery}
        onOpenImageDetail={openImageDetail}
      />

      {/* Image Detail Overlay */}
      <ImageDetailOverlay
        data={imageDetailData}
        onClose={closeImageDetail}
        onRetry={handleRetryImage}
        onGenerateDetails={handleGenerateDetails}
      />

      {/* Plan Template Library Drawer */}
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
        <div className="flex flex-col h-screen bg-[rgb(248,249,250)] overflow-hidden items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#0f1419] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <V2WorkbenchPageInner />
    </Suspense>
  );
}
