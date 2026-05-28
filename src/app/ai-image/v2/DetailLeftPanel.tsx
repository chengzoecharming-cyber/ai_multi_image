"use client";

import { RefObject } from "react";
import {
  ImageIcon, Upload, Sparkles, Aperture, Focus, Layers, Box,
  FileText, LayoutGrid, Scale, Ruler, X, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { V2DetailType, V2Session } from "./types";
import { V2_DETAIL_TYPE_LABELS } from "./types";

export function DetailLeftPanel({
  activeSession,
  fileInputRef,
  onUpload,
  onUpdateSession,
  onToggleDetailType,
  onGenerate,
}: {
  activeSession: V2Session | undefined;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateSession: (updater: (s: V2Session) => V2Session) => void;
  onToggleDetailType?: (type: V2DetailType) => void;
  onGenerate: () => void;
}) {
  if (!activeSession) return null;

  const productDescription = activeSession.goal;
  const detail = activeSession.detail;
  const detailImageUrls = detail?.detailImageUrls || [];
  const activeDetailImageIndex = detail?.activeDetailImageIndex ?? 0;
  const activeDetailImage = detailImageUrls[activeDetailImageIndex] || null;
  const selectedTypes = detail?.selectedTypes || [];
  const generating = detail?.generating || false;

  const iconMap: Record<V2DetailType, { icon: typeof Box; bg: string; fg: string; ring: string }> = {
    detail: { icon: Focus, bg: "bg-indigo-50", fg: "text-indigo-600", ring: "ring-indigo-400" },
    multi_angle: { icon: Layers, bg: "bg-violet-50", fg: "text-violet-600", ring: "ring-violet-400" },
    lifestyle: { icon: Aperture, bg: "bg-amber-50", fg: "text-amber-600", ring: "ring-amber-400" },
    feature: { icon: Box, bg: "bg-emerald-50", fg: "text-emerald-600", ring: "ring-emerald-400" },
    comparison: { icon: Scale, bg: "bg-rose-50", fg: "text-rose-600", ring: "ring-rose-400" },
    spec: { icon: Ruler, bg: "bg-sky-50", fg: "text-sky-600", ring: "ring-sky-400" },
  };

  return (
    <div className="w-[320px] h-full flex flex-col border-r border-gray-200 bg-white overflow-hidden shrink-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Detail Images — Taobao-style: thumbnail strip left + preview right */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3 text-gray-400" />
            参考图
          </Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={onUpload}
          />
          <div className="flex gap-2">
            {detailImageUrls.length === 0 ? (
              /* Empty state: single large upload area */
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-1.5 aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
              >
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500">点击上传</span>
              </button>
            ) : (
              <>
                {/* Thumbnail strip */}
                <div className="flex flex-col gap-2 shrink-0">
                  {detailImageUrls.map((url, idx) => (
                    <div
                      key={url + idx}
                      className={cn(
                        "relative w-12 h-12 rounded-lg overflow-hidden border cursor-pointer group",
                        idx === activeDetailImageIndex
                          ? "border-indigo-400 ring-1 ring-indigo-400"
                          : "border-gray-200 hover:border-indigo-300"
                      )}
                      onClick={() =>
                        onUpdateSession((s) => ({
                          ...s,
                          detail: {
                            detailImageUrls: s.detail?.detailImageUrls ?? [],
                            activeDetailImageIndex: idx,
                            heroPlan: s.detail?.heroPlan ?? null,
                            selectedTypes: s.detail?.selectedTypes ?? [],
                            generating: s.detail?.generating ?? false,
                            results: s.detail?.results ?? [],
                            lastError: s.detail?.lastError ?? null,
                          },
                        }))
                      }
                      title="点击查看大图"
                    >
                      <img src={url} alt={`参考图 ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateSession((s) => {
                            const prev = s.detail?.detailImageUrls || [];
                            const next = prev.filter((_, i) => i !== idx);
                            return {
                              ...s,
                              detail: {
                                detailImageUrls: next,
                                activeDetailImageIndex: Math.min(s.detail?.activeDetailImageIndex ?? 0, Math.max(0, next.length - 1)),
                                heroPlan: s.detail?.heroPlan ?? null,
                                selectedTypes: s.detail?.selectedTypes ?? [],
                                generating: s.detail?.generating ?? false,
                                results: s.detail?.results ?? [],
                                lastError: null,
                              },
                            };
                          });
                        }}
                        className="absolute top-0 right-0 p-0.5 rounded-bl bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="删除"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors flex items-center justify-center text-gray-400 shrink-0"
                    title="添加参考图"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Large preview */}
                <div className="flex-1 min-w-0">
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-[#F5F6F8]">
                    <img
                      src={activeDetailImage || detailImageUrls[0]}
                      alt="参考图预览"
                      className="w-full aspect-square object-contain"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          <p className="text-xs text-gray-400">支持 jpg、png、webp，最大 10MB。可上传主图、尺寸图、材质图等。</p>
        </div>

        {/* Product Description */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-gray-400" />
            商品描述
          </Label>
          <Textarea
            value={productDescription}
            onChange={(e) => onUpdateSession((s) => ({ ...s, goal: e.target.value, lastError: null }))}
            placeholder="例如：彩虹镀膜钨钢立铣刀，突出锋利刃口、镀层质感与耐磨性"
            className="h-[220px] resize-none text-xs overflow-y-auto"
            disabled={generating}
          />
        </div>

        {/* Generate Image Type — explicit user selection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <LayoutGrid className="w-3 h-3 text-gray-400" />
            生成图片类型
            <span className="text-gray-400 font-normal">（至少选 1 项）</span>
          </Label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(V2_DETAIL_TYPE_LABELS) as V2DetailType[]).map((t) => {
              const meta = iconMap[t];
              const Icon = meta.icon;
              const isSelected = selectedTypes.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  disabled={generating}
                  onClick={() => onToggleDetailType?.(t)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-colors",
                    isSelected
                      ? cn("border-transparent bg-white shadow-sm", meta.ring, "ring-1")
                      : "border-gray-100 bg-gray-50/50 hover:bg-gray-50 opacity-70"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      meta.bg
                    )}
                  >
                    <Icon className={cn("w-5 h-5", meta.fg)} />
                  </div>
                  <div className={cn("text-[11px] leading-tight text-center", isSelected ? "text-gray-800 font-medium" : "text-gray-500")}>
                    {V2_DETAIL_TYPE_LABELS[t]}
                  </div>
                </button>
              );
            })}
          </div>
          {selectedTypes.length > 0 && (
            <p className="text-xs text-indigo-500">
              已选择：{selectedTypes.map((t) => V2_DETAIL_TYPE_LABELS[t]).join("、")}
            </p>
          )}
        </div>
      </div>

      <div className="shrink-0 px-4 pb-3 pt-3 bg-white border-t border-gray-100">
        <Button
          onClick={onGenerate}
          disabled={generating || !activeDetailImage || selectedTypes.length === 0}
          className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0"
        >
          {generating ? (
            <>
              <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              一键生成全套商详图（{selectedTypes.length || 6}张）
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
