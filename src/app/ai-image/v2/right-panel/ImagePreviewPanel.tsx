"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, Wand2, Grid3x3, Copy, Download, Languages, Save, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CreativePlan } from "../types";
import { getPlanMeta, IMAGE_TYPE_LABELS } from "../types";
import type { ImageDetailData } from "../components/ImageDetailOverlay";
import { Lightbox } from "./Lightbox";

export interface ImagePreviewPanelProps {
  plan: CreativePlan;
  generatedImage: { imageUrl: string; imageBase64?: string } | null;
  isGeneratingImage: boolean;
  productImageUrls?: string[];
  referenceImageUrls?: string[];
  onBack: () => void;
  onGenerateImage: (plan: CreativePlan) => void;
  onGenerateDetails: (plan: CreativePlan, imageUrl: string) => void;
  onSave: (plan: CreativePlan) => void;
  onOpenInfo: (plan: CreativePlan) => void;
  onOpenImageDetail: (data: ImageDetailData) => void;
}

export function ImagePreviewPanel({
  plan,
  generatedImage,
  isGeneratingImage,
  productImageUrls,
  referenceImageUrls,
  onBack,
  onGenerateImage,
  onGenerateDetails,
  onSave,
  onOpenInfo,
  onOpenImageDetail,
}: ImagePreviewPanelProps) {
  const [showCn, setShowCn] = useState(false);
  const hasCn = !!(plan.headlineCn || plan.subtitleCn || (plan.sellingPointsCn && plan.sellingPointsCn.length > 0));
  const meta = getPlanMeta(plan);
  const imageSrc = generatedImage?.imageBase64 || generatedImage?.imageUrl || null;
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const openLightbox = useCallback((url: string) => setLightboxUrl(url), []);
  const closeLightbox = useCallback(() => setLightboxUrl(null), []);

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
                showCn ? "bg-gray-100 text-[#0f1419]" : "hover:bg-gray-100 text-gray-500"
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
                  <div className="w-10 h-10 border-2 border-[#0f1419] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">正在生成图片...</p>
                </div>
              ) : imageSrc ? (
                <div
                  className="relative w-full h-full cursor-pointer"
                  onClick={() =>
                    onOpenImageDetail({
                      imageUrl: imageSrc,
                      prompt: plan.imageGenerationPrompt || plan.finalPrompt || plan.planSummaryPrompt,
                      productImageUrls,
                      referenceImageUrls,
                      plan,
                    })
                  }
                  title="点击查看详情"
                >
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
                    className="h-10 bg-[rgb(235,236,237)] hover:bg-[rgb(220,222,224)] text-[#0f1419] border-0"
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
              className="w-full h-12 bg-[#0f1419] hover:bg-[#1a1f2e] text-white border-0 shadow-lg text-sm font-semibold"
            >
              <Grid3x3 className="w-4 h-4 mr-2" />生成商详图
            </Button>
          )}

          {/* Lightbox overlay */}
          {lightboxUrl && <Lightbox imageUrl={lightboxUrl} onClose={closeLightbox} />}

          {/* 双语文案展示 */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-gray-700">{showCn ? "图片文案（中文）" : "图片文案（English）"}</div>
              {hasCn && (
                <button
                  onClick={() => setShowCn((v) => !v)}
                  className="text-[11px] text-[#0f1419] hover:text-[#1a1f2e] font-medium"
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
              {/* copyBlocks 双语文案 */}
              {(showCn ? plan.copyBlocksCn : plan.copyBlocks) && (showCn ? plan.copyBlocksCn : plan.copyBlocks)!.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="text-[11px] font-medium text-gray-700">文案块：</div>
                  {(showCn ? plan.copyBlocksCn : plan.copyBlocks)!.slice(0, 4).map((block, idx) => (
                    <div key={idx} className="text-[11px] text-gray-600">
                      <span className="shrink-0 text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">{block.role}</span>
                      <span className="ml-1">{block.title}</span>
                      {block.body && <span className="ml-1 text-gray-400">— {block.body}</span>}
                    </div>
                  ))}
                  {(showCn ? plan.copyBlocksCn : plan.copyBlocks)!.length > 4 && (
                    <div className="text-[11px] text-gray-400">+{(showCn ? plan.copyBlocksCn : plan.copyBlocks)!.length - 4} 个文案块</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
