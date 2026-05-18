"use client";

import { useState, useRef, Suspense, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles, Upload, X, Wand2, ArrowLeft,
  Lightbulb, ImageIcon, RotateCcw, ChevronRight,
  Grid3x3, BookOpen, CheckCheck, Copy, Layers,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import type { CreativePlan, ImageSetPlan, GenerationMode, Step } from "./types";
import {
  StepBadge, ModeSelector, SinglePlanCard, SetPlanCard, PromptPreviewPanel,
} from "./components";
import PlanTemplateLibraryDrawer from "@/components/template-library/PlanTemplateLibraryDrawer";
import SaveAsTemplateDialog from "@/components/template-library/SaveAsTemplateDialog";
import type { PlanTemplate } from "@/lib/plan-templates/types";
import {
  getSystemTemplates,
  getUserTemplates,
  saveUserTemplate,
} from "@/lib/plan-templates/store";

function V2WorkbenchPageInner() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<GenerationMode>("single");
  const [step, setStep] = useState<Step>("input");
  const [productImageUrl, setProductImageUrl] = useState<string | null>(searchParams.get("productImageUrl"));
  const [goal, setGoal] = useState(searchParams.get("goal") || "");

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<PlanTemplate | null>(null);
  const [templateLibraryOpen, setTemplateLibraryOpen] = useState(false);
  const [systemTemplates, setSystemTemplates] = useState<PlanTemplate[]>([]);
  const [userTemplates, setUserTemplates] = useState<PlanTemplate[]>([]);

  // Single mode state
  const [singlePlans, setSinglePlans] = useState<CreativePlan[]>([]);
  const [expandedSingleId, setExpandedSingleId] = useState<string | null>(null);
  const [editingSingleId, setEditingSingleId] = useState<string | null>(null);

  // Set mode state
  const [setPlans, setSetPlans] = useState<ImageSetPlan[]>([]);
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);
  const [expandedSubIds, setExpandedSubIds] = useState<string[]>([]);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  // Preview state
  const [previewPlan, setPreviewPlan] = useState<CreativePlan | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Save as template dialog
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [saveTemplatePlan, setSaveTemplatePlan] = useState<CreativePlan | null>(null);

  // Image generation state
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Reference image (after background removal/extraction) — currently same as raw
  const [productReferenceImageUrl, setProductReferenceImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load templates on mount
  useEffect(() => {
    setSystemTemplates(getSystemTemplates());
    setUserTemplates(getUserTemplates());
  }, []);

  const refreshUserTemplates = useCallback(() => {
    setUserTemplates(getUserTemplates());
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.data?.url) {
        setProductImageUrl(data.data.url);
        setProductReferenceImageUrl(data.data.url); // TODO: replace with extracted/cleaned image when extraction is implemented
        toast.success("商品图上传成功");
      } else {
        toast.error(data.error || "上传失败");
      }
    } catch {
      toast.error("上传失败，请重试");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!productImageUrl) {
      toast.error("请先上传商品图");
      return;
    }
    if (!goal.trim() || goal.trim().length < 3) {
      toast.error("请输入制图目标描述（至少3个字）");
      return;
    }

    setStep("generating");
    setSinglePlans([]);
    setSetPlans([]);
    setPreviewPlan(null);
    setExpandedSingleId(null);
    setExpandedSetId(null);
    setExpandedSubIds([]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // LLM 分析需要 60-90 秒

    try {
      const payload: Record<string, unknown> = {
        rawProductImageUrl: productImageUrl,
        productReferenceImageUrl,
        userGoal: goal.trim(),
        mode,
      };
      if (selectedTemplate) {
        payload.selectedTemplateId = selectedTemplate.id;
      }

      const res = await fetch("/api/ai-image/v2/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (res.ok && data.data) {
        if (data.mode === "set") {
          const sets: ImageSetPlan[] = data.data;
          setSetPlans(sets);
          setExpandedSetId(sets[0]?.id || null);
          setExpandedSubIds(sets[0]?.plans.map((p: CreativePlan) => p.id) || []);
        } else {
          const plans: CreativePlan[] = data.data;
          setSinglePlans(plans);
          setExpandedSingleId(plans[0]?.id || null);
        }
        setStep("plans");
        toast.success(data.mode === "set" ? `已生成 ${data.data.length} 套组图方案` : `已生成 ${data.data.length} 个单图方案`);
      } else {
        toast.error(data.error || "生成失败");
        setStep("input");
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        toast.error("请求超时，请重试");
      } else {
        toast.error("网络错误，请重试");
      }
      setStep("input");
    }
  };

  const handleToggleSub = (id: string) => {
    setExpandedSubIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExpandAllSubs = (ids: string[]) => setExpandedSubIds(ids);
  const handleCollapseAllSubs = () => setExpandedSubIds([]);

  const handleUpdateSinglePlan = (updated: CreativePlan) => {
    setSinglePlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (previewPlan?.id === updated.id) setPreviewPlan(updated);
  };

  const handleUpdateSubPlan = (updated: CreativePlan) => {
    setSetPlans((prev) =>
      prev.map((set) => ({
        ...set,
        plans: set.plans.map((p) => (p.id === updated.id ? updated : p)),
      }))
    );
    if (previewPlan?.id === updated.id) setPreviewPlan(updated);
  };

  const handleGeneratePlan = (plan: CreativePlan) => {
    setPreviewPlan(plan);
    setStep("preview");
    toast.success(`「${plan.planName}」已生成 Prompt`);
  };

  const handleCopyPrompt = async (plan: CreativePlan) => {
    const text = plan.finalPrompt || plan.planSummaryPrompt || plan.imageGenerationPrompt;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(plan.id);
      toast.success("Prompt 已复制");
      setTimeout(() => setCopiedId((id) => (id === plan.id ? null : id)), 2000);
    } catch {
      toast.error("复制失败");
    }
  };

  const handleExpandToSet = async (basePlan: CreativePlan) => {
    if (!productImageUrl || !goal.trim()) {
      toast.error("缺少商品图或制图目标");
      return;
    }
    setStep("generating");
    try {
      const res = await fetch("/api/ai-image/v2/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawProductImageUrl: productImageUrl,
          productReferenceImageUrl,
          userGoal: goal.trim(),
          mode: "set",
          basePlan,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const sets: ImageSetPlan[] = data.data;
        setMode("set");
        setSetPlans(sets);
        setSinglePlans([]);
        setPreviewPlan(null);
        setExpandedSetId(sets[0]?.id || null);
        setExpandedSubIds(sets[0]?.plans.map((p: CreativePlan) => p.id) || []);
        setStep("plans");
        toast.success("已扩展为 5 张详情组图方案");
      } else {
        toast.error(data.error || "扩展失败");
        setStep("plans");
      }
    } catch {
      toast.error("网络错误，请重试");
      setStep("plans");
    }
  };

  const handleOpenSaveTemplate = (plan: CreativePlan) => {
    setSaveTemplatePlan(plan);
    setSaveTemplateOpen(true);
  };

  const handleSaveTemplate = (template: PlanTemplate) => {
    saveUserTemplate(template);
    refreshUserTemplates();
    toast.success(`模板「${template.name}」已保存`);
  };

  const handleUseTemplate = (template: PlanTemplate) => {
    setSelectedTemplate(template);
    // Auto-adjust mode based on template category
    if (template.category === "image_set") {
      setMode("set");
    } else {
      setMode("single");
    }
    toast.success(`已选择模板：${template.name}`);
  };

  const handleGenerateImage = async (plan: CreativePlan) => {
    if (!productImageUrl) {
      toast.error("请先上传商品图");
      return;
    }
    setGeneratingImage(true);
    setGeneratedImageUrl(null);
    try {
      const res = await fetch("/api/ai-image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptContent: plan.finalPrompt || plan.planSummaryPrompt || "",
          productImageUrl,
          config: { width: 1024, height: 1024, model: "default" },
        }),
      });
      const data = await res.json();
      if (res.ok && data.data?.resultImageUrl) {
        const urls = JSON.parse(data.data.resultImageUrl);
        setGeneratedImageUrl(urls[0]);
        toast.success("图片生成成功");
      } else {
        toast.error(data.error || "生成失败");
      }
    } catch {
      toast.error("网络错误，请重试");
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleReset = () => {
    setStep("input");
    setSinglePlans([]);
    setSetPlans([]);
    setPreviewPlan(null);
    setExpandedSingleId(null);
    setExpandedSetId(null);
    setExpandedSubIds([]);
    setEditingSingleId(null);
    setEditingSubId(null);
    setProductImageUrl(null);
    setProductReferenceImageUrl(null);
    setGoal("");
    setSelectedTemplate(null);
    setGeneratedImageUrl(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F6F8FC]">
      <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold text-gray-800">AI 制图工作台</span>
          <Badge variant="secondary" className="text-xs font-medium bg-indigo-50 text-indigo-600 border-indigo-100">V2 任务式</Badge>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTemplateLibraryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            <BookOpen className="w-4 h-4" />方案模板库
          </button>
          <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4" />返回首页
          </Link>
          <Link href="/ai-image/workbench" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">
            <Wand2 className="w-4 h-4" />V1 工作台
          </Link>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-[380px] flex flex-col border-r border-gray-200 bg-white overflow-y-auto shrink-0">
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-2">
              <StepBadge n={1} active={step === "input" || step === "generating"} done={step === "plans" || step === "preview"} />
              <span className="text-sm font-medium text-gray-700">输入任务</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <StepBadge n={2} active={step === "plans"} done={step === "preview"} />
              <span className="text-sm font-medium text-gray-700">{mode === "set" ? "选择组图" : "选择方案"}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <StepBadge n={3} active={step === "preview"} done={false} />
              <span className="text-sm font-medium text-gray-700">生成 Prompt</span>
            </div>

            {/* Selected Template */}
            {selectedTemplate && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  {selectedTemplate.category === "image_set" ? (
                    <LayoutGrid className="w-4 h-4 text-violet-500" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                  )}
                  <span className="text-sm font-medium text-indigo-800">当前模板</span>
                  <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal ml-auto">
                    {selectedTemplate.category === "image_set" ? "组图" : "单图"}
                  </Badge>
                </div>
                <p className="text-sm text-indigo-700 font-medium">{selectedTemplate.name}</p>
                <p className="text-xs text-indigo-500 line-clamp-2">{selectedTemplate.description}</p>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                >
                  清除选择
                </button>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-gray-400" />商品图
              </Label>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleUpload} />
              {productImageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-[#F5F6F8] group">
                  <img src={productImageUrl} alt="商品图" className="w-full aspect-square object-contain" />
                  <button onClick={() => setProductImageUrl(null)} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-500">点击上传商品图</span>
                  <span className="text-xs text-gray-400">jpg、png、webp，最大 10MB</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-gray-400" />制图目标
              </Label>
              <Textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="例如：生成一张钻头产品的电商主图，白底，突出锋利刃口，英文标题"
                className="min-h-[80px] resize-none text-sm"
                disabled={step === "generating"}
              />
              <p className="text-xs text-gray-400">用自然语言描述制图需求，AI 会分析商品图并生成方案。</p>
            </div>

            <ModeSelector value={mode} onChange={(m) => { setMode(m); setStep("input"); setPreviewPlan(null); }} />

            <Button
              onClick={handleGenerate}
              disabled={step === "generating" || !productImageUrl || !goal.trim()}
              className="w-full h-10 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0 shadow-lg shadow-indigo-200"
            >
              {step === "generating" ? (
                <><RotateCcw className="w-4 h-4 mr-2 animate-spin" />AI 分析商品并生成{mode === "set" ? "组图" : "方案"}...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />AI 生成{mode === "set" ? "组图" : "方案"}</>
              )}
            </Button>

            {(step === "plans" || step === "preview") && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="w-full text-gray-500">
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />重新开始
              </Button>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
                        onToggle={() => setExpandedSingleId(expandedSingleId === plan.id ? null : plan.id)}
                        onEdit={() => setEditingSingleId(editingSingleId === plan.id ? null : plan.id)}
                        onUpdate={handleUpdateSinglePlan}
                        onGenerate={handleGeneratePlan}
                        onCopy={handleCopyPrompt}
                        onSave={handleOpenSaveTemplate}
                        onExpandToSet={handleExpandToSet}
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
                        onToggle={() => setExpandedSetId(expandedSetId === setPlan.id ? null : setPlan.id)}
                        onToggleSub={handleToggleSub}
                        onExpandAllSubs={() => handleExpandAllSubs(setPlan.plans.map((p) => p.id))}
                        onCollapseAllSubs={handleCollapseAllSubs}
                        onEditSub={(id) => setEditingSubId(editingSubId === id ? null : id)}
                        onUpdateSub={handleUpdateSubPlan}
                        onGenerateSub={handleGeneratePlan}
                        onCopySub={handleCopyPrompt}
                        onSaveSub={handleOpenSaveTemplate}
                        copiedId={copiedId}
                      />
                    ))
                  )}
                </div>
              </div>

              {previewPlan && (
                <PromptPreviewPanel
                  plan={previewPlan}
                  onClose={() => setStep("plans")}
                  copiedId={copiedId}
                  onCopy={handleCopyPrompt}
                  onGenerateImage={handleGenerateImage}
                  isGeneratingImage={generatingImage}
                  generatedImageUrl={generatedImageUrl}
                />
              )}
            </div>
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
