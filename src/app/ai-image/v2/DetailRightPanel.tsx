"use client";

import { useState, useCallback } from "react";
import { ImageIcon, Loader2, RefreshCw, X, Copy, Download, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { V2DetailType, V2Session } from "./types";
import { V2_DETAIL_TYPE_LABELS } from "./types";
import type { ImageDetailData } from "./components/ImageDetailOverlay";

interface LightboxProps {
  imageUrl: string;
  onClose: () => void;
}

function Lightbox({ imageUrl, onClose }: LightboxProps) {
  const handleCopy = async () => {
    try {
      const res = await fetch(imageUrl);
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
  };

  const handleDownload = async () => {
    try {
      if (imageUrl.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = imageUrl;
        a.download = `image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("下载已开始");
        return;
      }
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("下载已开始");
    } catch {
      toast.error("下载失败，请重试");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/70"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image */}
      <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img
          src={imageUrl}
          alt=""
          className="max-w-[85vw] max-h-[70vh] object-contain rounded-lg"
        />

        {/* Toolbar */}
        <div className="mt-6 inline-flex items-center gap-6 px-8 py-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
          >
            <Copy className="w-4 h-4" />
            复制
          </button>
          <div className="w-px h-4 bg-gray-300" />
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            下载
          </button>
        </div>
      </div>

    </div>
  );
}

function isDetailImage(img: { tab?: string; detailType?: V2DetailType }) {
  return (img.tab || "product") === "detail";
}

export function DetailRightPanel({
  activeSession,
  onRetryType,
  onRefreshType,
  onOpenImageDetail,
}: {
  activeSession: V2Session;
  onRetryType?: (type: V2DetailType) => void;
  onRefreshType?: (type: V2DetailType) => void;
  onOpenImageDetail: (data: ImageDetailData) => void;
}) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [refreshDialogType, setRefreshDialogType] = useState<V2DetailType | null>(null);

  const openLightbox = useCallback((url: string) => setLightboxUrl(url), []);
  const closeLightbox = useCallback(() => setLightboxUrl(null), []);

  const detail = activeSession.detail;
  const detailImageUrls = detail?.detailImageUrls || [];
  const activeDetailImageIndex = detail?.activeDetailImageIndex ?? 0;
  const heroUrl = detailImageUrls[activeDetailImageIndex] || null;
  const generating = detail?.generating || false;
  const generatingTypes = detail?.generatingTypes || [];
  const activeGeneratingType = detail?.activeGeneratingType || null;
  const failedTypes = detail?.failedTypes || [];
  const failedMap = new Map(failedTypes.map((item) => [item.type, item.error]));

  const detailImages = (activeSession.generatedImages || []).filter(isDetailImage);

  const grouped = new Map<V2DetailType, typeof detailImages>();
  for (const img of detailImages) {
    const t = img.detailType || "detail";
    const arr = grouped.get(t) || [];
    arr.push(img);
    grouped.set(t, arr);
  }

  const displayTypes = Array.from(
    new Set<V2DetailType>([
      ...(detail?.selectedTypes || []),
      ...(Array.from(grouped.keys()) as V2DetailType[]),
      ...generatingTypes,
      ...failedTypes.map((item) => item.type),
    ])
  );

  const heroPlan = detail?.heroPlan;
  const hasCn = !!(heroPlan?.headlineCn || heroPlan?.subtitleCn || (heroPlan?.sellingPointsCn && heroPlan.sellingPointsCn.length > 0));
  const [showCn, setShowCn] = useState(false);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-800">商详图（多页素材）</div>
            <div className="text-xs text-gray-400 truncate">
              {heroUrl ? "已上传参考图，风格将保持一致" : "未上传参考图：请先上传主图或尺寸图"}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
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
            {heroUrl && (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img src={heroUrl} alt="参考图" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 中文文案展示（来自 heroPlan） */}
      {hasCn && showCn && (
        <div className="px-6 py-3 border-b border-gray-100 bg-indigo-50/40">
          <div className="text-xs font-semibold text-gray-700 mb-1.5">主图文案（中文）</div>
          <div className="space-y-0.5">
            {heroPlan?.headlineCn && (
              <div className="text-[11px] text-gray-600">
                <span className="font-medium text-gray-700">主标题：</span>{heroPlan.headlineCn}
              </div>
            )}
            {heroPlan?.subtitleCn && (
              <div className="text-[11px] text-gray-600">
                <span className="font-medium text-gray-700">副标题：</span>{heroPlan.subtitleCn}
              </div>
            )}
            {(heroPlan?.sellingPointsCn || []).slice(0, 4).map((s, idx) => (
              <div key={idx} className="text-[11px] text-gray-600">
                <span className="font-medium text-gray-700">卖点{idx + 1}：</span>{s}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        {detailImages.length === 0 && !generating && failedTypes.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500 mb-1">还没有生成商详素材图</div>
              <div className="text-xs text-gray-400">选择参考图与类型后点击「一键生成全套商详图」</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-8 content-start">
            {displayTypes.map((type) => {
              const imgs = grouped.get(type) || [];
              const isQueued = generatingTypes.includes(type);
              const isActive = activeGeneratingType === type;
              const failedError = imgs.length === 0 && !isQueued ? failedMap.get(type) : null;
              return (
                <section key={type} className="w-[180px]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-gray-700">{V2_DETAIL_TYPE_LABELS[type] || type}</div>
                    <div className="flex items-center gap-1.5">
                      {!isActive && !isQueued && !failedError && imgs.length > 0 && (
                        <button
                          onClick={() => setRefreshDialogType(type)}
                          className="text-gray-400 hover:text-indigo-500 transition-colors"
                          title="重新生成（替换当前图片）"
                          disabled={generating}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className="text-xs text-gray-400">
                        {isActive ? "生成中" : isQueued ? "排队中" : failedError ? "失败" : `${imgs.length} 张`}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {isQueued && (
                      <div className="relative rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 h-[180px] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/70 via-white/40 to-violet-100/70 animate-pulse" />
                        <div className="absolute inset-3 rounded-lg bg-white/35 animate-pulse" />
                        <Loader2 className="relative w-7 h-7 animate-spin text-indigo-400 mb-3" />
                        <div className="relative text-sm font-medium text-gray-700">{V2_DETAIL_TYPE_LABELS[type] || type}</div>
                        <div className="relative text-xs text-gray-400 mt-1">
                          {isActive ? "AI 正在生成" : "已加入生成队列"}
                        </div>
                      </div>
                    )}
                    {failedError && (
                      <div className="rounded-xl border border-red-100 bg-red-50/70 h-[180px] flex flex-col items-center justify-center text-center px-4">
                        <div className="w-9 h-9 rounded-full bg-white text-red-500 flex items-center justify-center mb-3">
                          <RefreshCw className="w-4 h-4" />
                        </div>
                        <div className="text-sm font-medium text-gray-700">{V2_DETAIL_TYPE_LABELS[type] || type}</div>
                        <div className="text-xs text-red-400 mt-1 line-clamp-2">{failedError}</div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-3 h-7 px-2 text-xs bg-white"
                          onClick={() => onRetryType?.(type)}
                          disabled={!onRetryType || generating}
                        >
                          重新生成
                        </Button>
                      </div>
                    )}
                    {imgs.map((img) => (
                      <div
                        key={img.id}
                        className="rounded-xl overflow-hidden border border-gray-200 bg-white cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all"
                        onClick={() =>
                          onOpenImageDetail({
                            imageUrl: img.imageUrl,
                            prompt: activeSession.detail?.heroPlan?.imageGenerationPrompt || activeSession.detail?.heroPlan?.finalPrompt,
                            plan: activeSession.detail?.heroPlan || null,
                            taskId: img.taskId,
                          })
                        }
                        title="点击查看详情"
                      >
                        <img src={img.imageUrl} alt={V2_DETAIL_TYPE_LABELS[type] || "商详图"} className="w-full aspect-square object-cover" />
                        <div className="px-3 py-2 text-[10px] text-gray-400 truncate">
                          {new Date(img.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
            {generating && displayTypes.length === 0 && (
              <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 w-[180px] h-[180px] flex flex-col items-center justify-center text-center px-4">
                <Loader2 className="w-7 h-7 animate-spin text-indigo-400 mb-3" />
                <div className="text-sm font-medium text-gray-700">商详图</div>
                <div className="text-xs text-gray-400 mt-1">AI 正在生成</div>
              </div>
            )}
                </div>
        )}
      </div>

      {/* Refresh confirmation dialog */}
      <Dialog open={!!refreshDialogType} onOpenChange={(open) => !open && setRefreshDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重新生成图片</DialogTitle>
            <DialogDescription>
              刷新会替换当前类型的旧图片，新的图片将在同一位置生成。
              如需保留旧图，请提前下载保存。
              <br />
              <span className="text-indigo-600 font-medium mt-1 inline-block">
                确定要重新生成「{refreshDialogType ? V2_DETAIL_TYPE_LABELS[refreshDialogType] : ""}」吗？
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setRefreshDialogType(null)}>
              取消
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (refreshDialogType) {
                  onRefreshType?.(refreshDialogType);
                }
                setRefreshDialogType(null);
              }}
            >
              确认重新生成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {lightboxUrl && <Lightbox imageUrl={lightboxUrl} onClose={closeLightbox} />}
    </div>
  );
}
