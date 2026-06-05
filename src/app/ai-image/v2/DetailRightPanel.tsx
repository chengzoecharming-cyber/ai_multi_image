"use client";

import { ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { V2DetailType, V2Session } from "./types";
import { V2_DETAIL_TYPE_LABELS } from "./types";

function isDetailImage(img: { tab?: string; detailType?: V2DetailType }) {
  return (img.tab || "product") === "detail";
}

export function DetailRightPanel({
  activeSession,
  onRetryType,
}: {
  activeSession: V2Session;
  onRetryType?: (type: V2DetailType) => void;
}) {
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
          {heroUrl && (
            <div className="ml-auto flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img src={heroUrl} alt="参考图" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>
      </div>

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
                    <div className="text-xs text-gray-400">
                      {isActive ? "生成中" : isQueued ? "排队中" : failedError ? "失败" : `${imgs.length} 张`}
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
                      <div key={img.id} className="rounded-xl overflow-hidden border border-gray-200 bg-white">
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
    </div>
  );
}
