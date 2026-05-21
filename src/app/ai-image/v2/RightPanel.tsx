"use client";

import { Wand2, Sparkles, ImageIcon, Copy, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CreativePlan, Step, V2Session } from "./types";
import { SinglePlanCard } from "./components";
import { toast } from "sonner";

export function RightPanel({
  activeSession,
  onToggleSingle,
  onEditSingle,
  onUpdateSingle,
  onOpenPreview,
  onClosePreview,
  onSave,
  onGenerateImage,
  onGenerateDetails,
  copiedId,
}: {
  activeSession: V2Session | undefined;
  onToggleSingle: (id: string) => void;
  onEditSingle: (id: string) => void;
  onUpdateSingle: (plan: CreativePlan) => void;
  onOpenPreview: (plan: CreativePlan) => void;
  onClosePreview: () => void;
  onSave: (plan: CreativePlan) => void;
  onGenerateImage: (plan: CreativePlan) => void;
  onGenerateDetails: (sourcePlan: CreativePlan) => void;
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
  const selectedTemplate = null; // passed via context if needed

  const singlePlans = activeSession.singlePlans;
  const expandedSingleId = activeSession.expandedSingleId;
  const editingSingleId = activeSession.editingSingleId;

  const allPlans: CreativePlan[] = [...singlePlans];
  const previewPlan =
    activeSession.previewPlanId
      ? allPlans.find((p) => p.id === activeSession.previewPlanId) || null
      : null;

  const generatingImage = activeSession.generatingImage;
  const generatedForPreview = previewPlan
    ? activeSession.generatedImages.find((g) => g.planId === previewPlan.id) || null
    : null;
  const previewImageSrc = generatedForPreview?.imageBase64 || generatedForPreview?.imageUrl || null;

  if (step === "input") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
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

  return (
    <div className="flex-1 flex overflow-hidden bg-[#F6F8FC]">
      {/* Plans column */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-500" />
            AI 生成方案
            <Badge variant="secondary" className="text-xs">
              {singlePlans.length}
            </Badge>
          </h2>
        </div>

        <div className="space-y-3">
          {singlePlans.map((plan, i) => (
            <SinglePlanCard
              key={plan.id}
              plan={plan}
              index={i}
              isExpanded={expandedSingleId === plan.id}
              isEditing={editingSingleId === plan.id}
              onToggle={() => onToggleSingle(plan.id)}
              onEdit={() => onEditSingle(plan.id)}
              onUpdate={onUpdateSingle}
              onOpenPreview={onOpenPreview}
              onSave={onSave}
              onGenerateImage={onGenerateImage}
              copiedId={copiedId}
              variant="default"
            />
          ))}
        </div>
      </div>

      {/* Image column */}
      <div className="w-[460px] border-l border-gray-200 bg-white overflow-y-auto p-5 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-600" />
            图片生成
          </h2>
          <span className="text-xs text-gray-500">{previewPlan ? previewPlan.planName : "请选择方案"}</span>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="h-[300px] bg-[#F5F6F8] flex items-center justify-center">
              {previewImageSrc ? (
                <img src={previewImageSrc} alt="Preview" className="max-h-[300px] w-full object-contain" />
              ) : (
                <div className="text-xs text-gray-400">
                  {previewPlan ? "该方案尚未生成图片" : "请选择一个方案"}
                </div>
              )}
            </div>
            <div className="px-3 py-2 border-t border-gray-100 text-[11px] text-gray-500 flex items-center justify-between">
              <span>{generatingImage ? "生图中..." : previewImageSrc ? "已生成" : "未生成"}</span>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                  onClick={async () => {
                    try {
                      if (!previewImageSrc) return;
                      const res = await fetch(previewImageSrc);
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
                  disabled={!previewImageSrc}
                  title="复制图片"
                >
                  <Copy className="w-3.5 h-3.5" />
                  复制
                </button>
                <button
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                  onClick={async () => {
                    try {
                      if (!previewImageSrc) return;
                      if (previewImageSrc.startsWith("data:")) {
                        const a = document.createElement("a");
                        a.href = previewImageSrc;
                        a.download = `generated-image-${Date.now()}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        toast.success("下载已开始");
                        return;
                      }
                      const res = await fetch(previewImageSrc);
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
                  disabled={!previewImageSrc}
                  title="下载图片"
                >
                  <Download className="w-3.5 h-3.5" />
                  下载
                </button>
              </div>
            </div>
          </div>

          {previewPlan && previewImageSrc ? (
            <button
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => onGenerateDetails(previewPlan)}
              disabled={generatingImage}
              title="基于当前主图风格生成详情图记录"
            >
              <Wand2 className="w-4 h-4" />
              生成详情图
            </button>
          ) : null}

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="text-xs font-medium text-gray-700 mb-2">图片文案（中文释义）</div>
            {previewPlan ? (
              <div className="space-y-1">
                <div className="text-[11px] text-gray-600">
                  <span className="font-medium text-gray-700">产品：</span>{previewPlan.productName || "—"}
                </div>
                <div className="text-[11px] text-gray-600">
                  <span className="font-medium text-gray-700">图类型：</span>{previewPlan.imageType}
                </div>
                <div className="text-[11px] text-gray-600">
                  <span className="font-medium text-gray-700">主标题：</span>{previewPlan.headline || "—"}
                </div>
                {previewPlan.subtitle ? (
                  <div className="text-[11px] text-gray-600">
                    <span className="font-medium text-gray-700">副标题：</span>{previewPlan.subtitle}
                  </div>
                ) : null}
                {(previewPlan.sellingPoints || []).slice(0, 8).map((s, idx) => (
                  <div key={`${idx}-${s}`} className="text-[11px] text-gray-600">
                    <span className="font-medium text-gray-700">卖点{idx + 1}：</span>{s}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400">选择一个方案后，这里展示该方案文案的中文释义</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
