"use client";

import { useState, useCallback, useRef } from "react";
import {
  Wand2, Sparkles, Save, Info, ChevronLeft, ChevronRight,
  Grid3x3, Eye, Copy, Download, Languages,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { CreativePlan, Step, V2Session, V2GeneratedImage } from "./types";
import { getPlanMeta, IMAGE_TYPE_LABELS } from "./types";
import { PlanInfoDialog } from "./components";

// ==================== PlanCard ====================

function PlanCard({
  plan,
  index,
  isActive,
  hasGeneratedImage,
  isGenerating,
  onSave,
  onGenerateImage,
  onViewImage,
  onOpenInfo,
}: {
  plan: CreativePlan;
  index: number;
  isActive: boolean;
  hasGeneratedImage: boolean;
  isGenerating: boolean;
  onSave: (plan: CreativePlan) => void;
  onGenerateImage: (plan: CreativePlan) => void;
  onViewImage: (plan: CreativePlan) => void;
  onOpenInfo: (plan: CreativePlan) => void;
}) {
  const meta = getPlanMeta(plan);
  const complexityLabel = plan.visualComplexity === "simple" ? "简洁" : plan.visualComplexity === "medium" ? "中等" : "复杂";
  const densityLabel = plan.informationDensity === "low" ? "低密度" : plan.informationDensity === "medium" ? "中密度" : "高密度";
  const optionalNotes = (plan.sellingPoints || []).filter(Boolean);
  const topCopyBlocks = (plan.copyBlocks || [])
    .filter((b) => b.role !== "headline" && b.role !== "subheadline")
    .slice(0, 4);

  return (
    <div
      className={cn(
        "w-[360px] bg-white rounded-[24px] shadow-xl overflow-hidden flex flex-col transition-opacity duration-500",
        isActive ? "opacity-100" : "opacity-85"
      )}
      style={{ height: "500px" }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* 标题区 */}
      <div className="px-5 pt-5 pb-2 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold", meta.bg, meta.color)}>
              {index + 1}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900 leading-tight truncate">{plan.planName}</h3>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onSave(plan); }}
              className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
              title="保存为模板"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenInfo(plan); }}
              className="w-8 h-8 rounded-md hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
              title="详情"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* tag区 */}
      <div className="px-5 pb-3 shrink-0">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={cn("text-[11px] h-5 px-2 font-normal", meta.color, meta.border)}>
            {meta.label}
          </Badge>
          <Badge variant="secondary" className="text-[11px] h-5 px-2 font-normal">
            {IMAGE_TYPE_LABELS[plan.imageType] || plan.imageType}
          </Badge>
          {plan.visualComplexity && (
            <Badge variant="secondary" className="text-[11px] h-5 px-2 font-normal">
              {complexityLabel}
            </Badge>
          )}
          {plan.informationDensity && (
            <Badge variant="secondary" className="text-[11px] h-5 px-2 font-normal">
              {densityLabel}
            </Badge>
          )}
        </div>
      </div>

      {/* 信息区 */}
      <div className="flex-1 px-5 py-1 overflow-y-auto min-h-0">
        <div className="space-y-3">
          {/* Core text (optional) */}
          {plan.headline && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">核心文案（可选）</div>
              <p className="text-sm font-semibold text-gray-800 leading-snug">{plan.headline}</p>
              {plan.subtitle ? (
                <p className="text-sm text-gray-700 leading-snug mt-1">{plan.subtitle}</p>
              ) : null}
            </div>
          )}

          {/* Optional notes */}
          {optionalNotes.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1.5">文案要点（可选）</div>
              <div className="flex flex-wrap gap-1.5">
                {optionalNotes.map((sp, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-medium">{sp}</span>
                ))}
              </div>
            </div>
          )}

          {/* 方向说明 — 视觉呈现（新版）或兼容旧版 */}
          {plan.visualPresentation ? (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-0.5">视觉呈现</div>
              <p className="text-xs text-gray-700 leading-snug line-clamp-3">{plan.visualPresentation}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              <div>
                <div className="text-xs font-medium text-gray-500 mb-0.5">版式方向</div>
                <p className="text-xs text-gray-700 leading-snug line-clamp-2">{plan.layoutDirection}</p>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-0.5">视觉方向</div>
                <p className="text-xs text-gray-700 leading-snug line-clamp-2">{plan.visualDirection}</p>
              </div>
              <div className="col-span-2">
                <div className="text-xs font-medium text-gray-500 mb-0.5">色彩方向</div>
                <p className="text-xs text-gray-700 leading-snug line-clamp-2">{plan.colorDirection}</p>
              </div>
            </div>
          )}

          {/* CopyBlocks */}
          {topCopyBlocks.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">文案块</div>
              <div className="space-y-1">
                {topCopyBlocks.map((block) => (
                  <div key={block.id} className="text-xs text-gray-700 leading-snug flex items-start gap-1.5">
                    <span className="shrink-0 text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{block.role}</span>
                    <span className="flex-1">{block.title}</span>
                  </div>
                ))}
                {plan.copyBlocks.length > topCopyBlocks.length && (
                  <p className="text-xs text-gray-400">+{plan.copyBlocks.length - topCopyBlocks.length} 个文案块</p>
                )}
              </div>
            </div>
          )}

          {/* Risk Warnings */}
          {plan.riskWarnings.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1">注意事项</div>
              <div className="space-y-0.5">
                {plan.riskWarnings.slice(0, 2).map((rw, i) => (
                  <p key={i} className="text-xs text-amber-700 leading-snug">• {rw}</p>
                ))}
                {plan.riskWarnings.length > 2 && (
                  <p className="text-xs text-gray-400">+{plan.riskWarnings.length - 2} 条</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 按钮区 */}
      <div className={cn("px-5 py-4 shrink-0 flex gap-2.5", hasGeneratedImage || isGenerating ? "flex-row" : "flex-col")}>
        {hasGeneratedImage && (
          <Button
            variant="outline"
            onClick={() => onViewImage(plan)}
            className="h-10 flex-[3] border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 text-sm font-semibold"
          >
            <Eye className="w-4 h-4 mr-1.5" />查看图片
          </Button>
        )}
        {isGenerating && (
          <Button
            variant="outline"
            onClick={() => onViewImage(plan)}
            disabled
            className="h-10 flex-[3] border-amber-200 text-amber-600 bg-amber-50/50 text-sm font-semibold cursor-pointer"
          >
            <Sparkles className="w-4 h-4 mr-1.5 animate-pulse" />生成中
          </Button>
        )}
        <Button
          onClick={() => onGenerateImage(plan)}
          disabled={isGenerating}
          className={cn(
            "bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0 shadow-md shadow-indigo-100 text-sm font-semibold",
            hasGeneratedImage || isGenerating ? "h-10 flex-[2]" : "w-full h-10",
            isGenerating && "opacity-50 cursor-not-allowed"
          )}
        >
          <Wand2 className="w-4 h-4 mr-1.5" />生成图片
        </Button>
      </div>
    </div>
  );
}

// ==================== PlanCardStack ====================

function PlanCardStack({
  plans,
  activeIndex,
  generatedImages,
  generatingImagePlanId,
  onChangeIndex,
  onSave,
  onGenerateImage,
  onViewImage,
  onOpenInfo,
}: {
  plans: CreativePlan[];
  activeIndex: number;
  generatedImages: V2GeneratedImage[];
  generatingImagePlanId: string | null;
  onChangeIndex: (index: number) => void;
  onSave: (plan: CreativePlan) => void;
  onGenerateImage: (plan: CreativePlan) => void;
  onViewImage: (plan: CreativePlan) => void;
  onOpenInfo: (plan: CreativePlan) => void;
}) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);

  const goPrev = useCallback(() => {
    const next = activeIndex <= 0 ? plans.length - 1 : activeIndex - 1;
    onChangeIndex(next);
  }, [activeIndex, plans.length, onChangeIndex]);

  const goNext = useCallback(() => {
    const next = activeIndex >= plans.length - 1 ? 0 : activeIndex + 1;
    onChangeIndex(next);
  }, [activeIndex, plans.length, onChangeIndex]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX.current;
    setDragOffset(dx);
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset < -80) {
      goNext();
    } else if (dragOffset > 80) {
      goPrev();
    }
    setDragOffset(0);
  }, [isDragging, dragOffset, goNext, goPrev]);

  if (plans.length === 0) return null;

  const hasImageForPlan = (planId: string) =>
    generatedImages.some((g) => g.planId === planId && g.imageUrl);

  return (
    <div
      className="flex-1 flex items-center justify-center bg-gray-100 relative overflow-hidden select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* 左右切换按钮 */}
      {plans.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-6 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:scale-105 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-6 z-20 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:scale-105 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* 指示器 */}
      {plans.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          {plans.map((_, i) => (
            <button
              key={i}
              onClick={() => onChangeIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex ? "w-6 bg-indigo-500" : "w-1.5 bg-gray-300 hover:bg-gray-400"
              )}
            />
          ))}
        </div>
      )}

      {/* 卡片堆叠 — 使用 plan.id 作为 key 以实现切换动效 */}
      <div className="relative w-[360px] h-[500px]">
        {plans.map((plan, i) => {
          const offset = i - activeIndex;
          let normalizedOffset = offset;
          if (normalizedOffset < -1) normalizedOffset += plans.length;
          if (normalizedOffset > 1) normalizedOffset -= plans.length;

          const isActive = normalizedOffset === 0;
          const isVisible = Math.abs(normalizedOffset) <= 1;

          const baseTransform = isActive
            ? "translateX(0) scale(1) rotate(0deg)"
            : normalizedOffset === -1
              ? "translateX(-35%) scale(0.85) rotate(-5deg)"
              : "translateX(35%) scale(0.85) rotate(5deg)";

          const dragTransform = isDragging && isActive && plans.length > 1
            ? `translateX(${dragOffset}px)`
            : "";

          return (
            <div
              key={plan.id}
              className="absolute inset-0 transition-all duration-500 ease-out will-change-transform"
              style={{
                transform: `${baseTransform} ${dragTransform}`.trim(),
                zIndex: isActive ? 10 : isVisible ? 5 : 0,
                opacity: isVisible ? (isActive ? 1 : 0.6) : 0,
                pointerEvents: isActive ? "auto" : "none",
              }}
            >
              <PlanCard
                plan={plan}
                index={i}
                isActive={isActive}
                hasGeneratedImage={hasImageForPlan(plan.id)}
                isGenerating={generatingImagePlanId === plan.id}
                onSave={onSave}
                onGenerateImage={onGenerateImage}
                onViewImage={onViewImage}
                onOpenInfo={onOpenInfo}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ==================== ImagePreviewPanel ====================

function ImagePreviewPanel({
  plan,
  generatedImage,
  isGeneratingImage,
  onBack,
  onGenerateImage,
  onGenerateDetails,
  onSave,
  onOpenInfo,
}: {
  plan: CreativePlan;
  generatedImage: { imageUrl: string; imageBase64?: string } | null;
  isGeneratingImage: boolean;
  onBack: () => void;
  onGenerateImage: (plan: CreativePlan) => void;
  onGenerateDetails: (plan: CreativePlan, imageUrl: string) => void;
  onSave: (plan: CreativePlan) => void;
  onOpenInfo: (plan: CreativePlan) => void;
}) {
  const [showCn, setShowCn] = useState(false);
  const hasCn = !!(plan.headlineCn || plan.subtitleCn || (plan.sellingPointsCn && plan.sellingPointsCn.length > 0));
  const meta = getPlanMeta(plan);
  const imageSrc = generatedImage?.imageBase64 || generatedImage?.imageUrl || null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 标题区 */}
      <div className="px-6 py-4 border-b border-gray-200/80 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-gray-900">{plan.planName}</h2>
              <Badge variant="outline" className={cn("text-[10px] h-5 px-2 font-normal", meta.color, meta.border)}>
                {meta.label}
              </Badge>
              <Badge variant="secondary" className="text-[10px] h-5 px-2 font-normal">
                {IMAGE_TYPE_LABELS[plan.imageType] || plan.imageType}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {hasCn && (
            <button
              onClick={() => setShowCn((v) => !v)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                showCn ? "bg-indigo-100 text-indigo-600" : "hover:bg-gray-100 text-gray-500"
              )}
              title={showCn ? "显示英文" : "显示中文"}
            >
              <Languages className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onSave(plan)}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
            title="保存为模板"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenInfo(plan)}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
            title="详情"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* 图片区 */}
          <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white mx-auto" style={{ width: 520, height: 520 }}>
            <div className="w-full h-full flex items-center justify-center">
              {isGeneratingImage ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">正在生成图片...</p>
                </div>
              ) : imageSrc ? (
                <div className="relative w-full h-full">
                  <img src={imageSrc} alt="Generated" className="w-full h-full object-contain" />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try {
                          const source = imageSrc;
                          if (!source) return;
                          const res = await fetch(source);
                          const blob = await res.blob();
                          if (navigator.clipboard && navigator.clipboard.write) {
                            await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
                            toast.success("图片已复制到剪贴板");
                          } else {
                            toast.error("当前浏览器不支持复制图片");
                          }
                        } catch {
                          toast.error("复制失败，请重试");
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium hover:bg-black/70 transition-colors backdrop-blur-sm"
                    >
                      <Copy className="w-3.5 h-3.5" />复制
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const source = imageSrc;
                          if (!source) return;
                          if (source.startsWith("data:")) {
                            const a = document.createElement("a");
                            a.href = source;
                            a.download = `generated-image-${Date.now()}.png`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            toast.success("下载已开始");
                            return;
                          }
                          const res = await fetch(source);
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `generated-image-${Date.now()}.png`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          toast.success("下载已开始");
                        } catch {
                          toast.error("下载失败，请重试");
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-medium hover:bg-black/70 transition-colors backdrop-blur-sm"
                    >
                      <Download className="w-3.5 h-3.5" />下载
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-3">尚未生成图片</p>
                  <Button
                    onClick={() => onGenerateImage(plan)}
                    className="h-10 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />生成图片
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 生成商详图按钮 */}
          {imageSrc && (
            <Button
              onClick={() => onGenerateDetails(plan, imageSrc)}
              className="w-full h-12 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0 shadow-lg shadow-indigo-100 text-sm font-semibold"
            >
              <Grid3x3 className="w-4 h-4 mr-2" />生成商详图
            </Button>
          )}

          {/* 双语文案展示 */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-gray-700">{showCn ? "图片文案（中文）" : "图片文案（English）"}</div>
              {hasCn && (
                <button
                  onClick={() => setShowCn((v) => !v)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {showCn ? "切换英文" : "切换中文"}
                </button>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-[11px] text-gray-600">
                <span className="font-medium text-gray-700">主标题：</span>
                {showCn && plan.headlineCn ? plan.headlineCn : plan.headline || "—"}
              </div>
              {(showCn && plan.subtitleCn ? plan.subtitleCn : plan.subtitle) && (
                <div className="text-[11px] text-gray-600">
                  <span className="font-medium text-gray-700">副标题：</span>
                  {showCn && plan.subtitleCn ? plan.subtitleCn : plan.subtitle}
                </div>
              )}
              {(showCn && plan.sellingPointsCn ? plan.sellingPointsCn : plan.sellingPoints || []).slice(0, 6).map((s, idx) => (
                <div key={idx} className="text-[11px] text-gray-600">
                  <span className="font-medium text-gray-700">文案要点{idx + 1}：</span>{s}
                </div>
              ))}
              {(showCn && plan.sellingPointsCn ? plan.sellingPointsCn : plan.sellingPoints || []).length === 0 && (plan.copyBlocks || []).length > 0 && (
                <div className="text-[11px] text-gray-600">
                  <span className="font-medium text-gray-700">说明：</span>本方案以 copyBlocks 组织文案，不强制卖点列表。
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== RightPanel ====================

export function RightPanel({
  activeSession,
  onSelectPlan,
  onOpenPreview,
  onSave,
  onGenerateImage,
  onGenerateDetails,
  onClosePreview,
  onUpdateSingle,
}: {
  activeSession: V2Session | undefined;
  onSelectPlan: (planId: string) => void;
  onOpenPreview: (plan: CreativePlan) => void;
  onSave: (plan: CreativePlan) => void;
  onGenerateImage: (plan: CreativePlan) => void;
  onGenerateDetails: (plan: CreativePlan, imageUrl: string) => void;
  onClosePreview: () => void;
  onUpdateSingle: (plan: CreativePlan) => void;
}) {
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
        onBack={onClosePreview}
        onGenerateImage={onGenerateImage}
        onGenerateDetails={onGenerateDetails}
        onSave={onSave}
        onOpenInfo={setInfoPlan}
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
