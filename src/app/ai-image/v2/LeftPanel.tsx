"use client";

import { RefObject, useState, useRef } from "react";
import {
  ImageIcon, X, Upload, Lightbulb,
  Sparkles, BookOpen, Square, SlidersHorizontal,
  Plus, Server, Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ImageDetailData } from "./components/ImageDetailOverlay";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AuthCodeAuditCard } from "./components/AuthCodeAuditCard";
import type { Step, V2Session } from "./types";
import type { PlanTemplate } from "@/lib/plan-templates/types";

export function LeftPanel({
  activeSession,
  selectedTemplate,
  fileInputRef,
  referenceFileInputRef,
  onUpload,
  onUploadReference,
  onRemoveReference,
  onUpdateSession,
  onGenerate,
  onReset,
  onCancelGenerate,
  onOpenTemplateLibrary,
  onOpenImageDetail,
}: {
  activeSession: V2Session | undefined;
  selectedTemplate: PlanTemplate | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  referenceFileInputRef?: RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUploadReference?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveReference?: (index: number) => void;
  onUpdateSession: (updater: (s: V2Session) => V2Session) => void;
  onGenerate: () => void;
  onReset: () => void;
  onCancelGenerate?: () => void;
  onOpenTemplateLibrary?: () => void;
  onOpenImageDetail?: (data: ImageDetailData) => void;
}) {
  if (!activeSession) return null;

  const step: Step = activeSession.step;
  const productImageUrls = activeSession.productImageUrls || [];
  const activeProductImageIndex = activeSession.activeProductImageIndex ?? 0;
  const activeProductImage = productImageUrls[activeProductImageIndex] || null;
  const referenceImageUrls = activeSession.referenceImageUrls || [];
  const goal = activeSession.goal;
  const outputWidth = activeSession.outputWidth;
  const outputHeight = activeSession.outputHeight;
  const [customSizeOpen, setCustomSizeOpen] = useState(false);

  const isChatGPT2API = activeSession.provider === "chatgpt2api";

  const VOLCANO_PRESET_1_1 = { w: 1920, h: 1920 };
  const VOLCANO_PRESET_3_4 = { w: 1920, h: 2560 };
  const VOLCANO_PRESET_2_4 = { w: 1440, h: 2880 };

  const GPT_PRESET_1_1 = { w: 1024, h: 1024 };
  const GPT_PRESET_3_4 = { w: 1024, h: 1536 };
  const GPT_PRESET_16_9 = { w: 1536, h: 1024 };

  const PRESET_1_1 = isChatGPT2API ? GPT_PRESET_1_1 : VOLCANO_PRESET_1_1;
  const PRESET_3_4 = isChatGPT2API ? GPT_PRESET_3_4 : VOLCANO_PRESET_3_4;
  const PRESET_2_4 = isChatGPT2API ? GPT_PRESET_16_9 : VOLCANO_PRESET_2_4;

  const maxReferenceImages = isChatGPT2API ? 0 : 3;

  const isPreset = (p: { w: number; h: number }) => outputWidth === p.w && outputHeight === p.h;

  const [templateHover, setTemplateHover] = useState(false);
  const directAbortRef = useRef<AbortController | null>(null);
  const directGenerating = activeSession.directGenerating ?? false;

  const handleDirectGenerate = async () => {
    if (!activeProductImage || !goal.trim() || directGenerating) return;

    directAbortRef.current = new AbortController();
    onUpdateSession((s) => ({ ...s, directGenerating: true, lastError: null }));

    try {
      const res = await fetch("/api/ai-image/v2/direct-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productImageUrls: activeSession.productImageUrls,
          userGoal: goal.trim(),
          width: outputWidth,
          height: outputHeight,
          styleReferenceUrls: referenceImageUrls,
          sessionId: activeSession.id,
        }),
        signal: directAbortRef.current.signal,
      });
      const data = await res.json();
      if (!res.ok || !data.imageUrl) {
        throw new Error(data.error || "直接生成失败");
      }
      onUpdateSession((s) => ({
        ...s,
        directGenerating: false,
        generatedImages: [
          {
            id: `direct-${Date.now()}`,
            taskId: data.data?.id,
            imageUrl: data.imageUrl,
            imageBase64: data.imageBase64,
            tab: "product",
            createdAt: Date.now(),
          },
          ...s.generatedImages,
        ],
        lastError: null,
      }));
      toast.success("图片生成成功");
    } catch (e) {
      const isAbort = e instanceof Error && e.name === "AbortError";
      onUpdateSession((s) => ({ ...s, directGenerating: false, lastError: isAbort ? null : (e instanceof Error ? e.message : "直接生成失败") }));
      if (!isAbort) {
        toast.error(e instanceof Error ? e.message : "直接生成失败");
      } else {
        toast.info("已停止生成");
      }
    } finally {
      directAbortRef.current = null;
    }
  };

  const handleCancelDirectGenerate = () => {
    directAbortRef.current?.abort();
  };

  return (
    <div className="w-[310px] h-full flex flex-col border-r-[0.5px] border-gray-200 bg-white overflow-hidden shrink-0">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        <AuthCodeAuditCard authorizationCode={activeSession.authorizationCode} />

        {/* Template Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-[13px] font-medium text-gray-700 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-gray-400" />方案模板
            </Label>
            {selectedTemplate ? (
              <div
                className="relative flex items-center gap-1"
                onMouseEnter={() => setTemplateHover(true)}
                onMouseLeave={() => setTemplateHover(false)}
              >
                <button
                  onClick={() => onOpenTemplateLibrary?.()}
                  className="text-xs text-gray-700 hover:text-[#0f1419] font-medium"
                  title={selectedTemplate.name || "未命名模板"}
                >
                  {selectedTemplate.name || "未命名模板"}
                </button>
                {templateHover && (
                  <button
                    onClick={() => onUpdateSession((s) => ({ ...s, selectedTemplateId: null, lastError: null }))}
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-500 hover:text-gray-700 transition-colors"
                    title="清除选择"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => onOpenTemplateLibrary?.()}
                className="text-xs text-gray-500 hover:text-[#0f1419] font-medium"
              >
                选择
              </button>
            )}
          </div>
        </div>

        {/* Product Images — Taobao-style: thumbnail strip left + preview right */}
        <div className="space-y-2">
          <Label className="text-[13px] font-medium text-gray-700 flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3 text-gray-400" />商品图
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
            {productImageUrls.length === 0 ? (
              /* Empty state: single large upload area */
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-1.5 aspect-square rounded-xl border border-dashed border-gray-300 hover:border-gray-500 hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500">点击上传</span>
              </button>
            ) : (
              <>
                {/* Thumbnail strip */}
                <div className="flex flex-col gap-2 shrink-0">
                  {productImageUrls.map((url, idx) => (
                    <div
                      key={url + idx}
                      className={cn(
                        "relative w-12 h-12 rounded-lg overflow-hidden cursor-pointer group",
                        idx === activeProductImageIndex
                          ? "ring-1 ring-gray-400"
                          : ""
                      )}
                      onClick={() => onUpdateSession((s) => ({ ...s, activeProductImageIndex: idx }))}
                      title="点击放大"
                    >
                      <img
                        src={url}
                        alt={`商品图 ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenImageDetail?.({ imageUrl: url });
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateSession((s) => {
                            const next = s.productImageUrls.filter((_, i) => i !== idx);
                            return {
                              ...s,
                              productImageUrls: next,
                              activeProductImageIndex: Math.min(s.activeProductImageIndex ?? 0, Math.max(0, next.length - 1)),
                              lastError: null,
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
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-400 shrink-0 self-center"
                    title="添加商品图"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Large preview */}
                <div className="flex-1 min-w-0">
                  <div
                    className="relative rounded-xl overflow-hidden bg-[#F5F6F8] cursor-pointer"
                    title="点击查看详情"
                    onClick={() => onOpenImageDetail?.({ imageUrl: activeProductImage || productImageUrls[0] })}
                  >
                    <img
                      src={activeProductImage || productImageUrls[0]}
                      alt="商品图预览"
                      className="w-full aspect-square object-contain"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Goal */}
        <div className="space-y-2">
          <Label className="text-[13px] font-medium text-gray-700 flex items-center gap-1.5">
            <Lightbulb className="w-3 h-3 text-gray-400" />prompt
          </Label>
          <Textarea
            value={goal}
            onChange={(e) => onUpdateSession((s) => ({ ...s, goal: e.target.value, lastError: null }))}
            placeholder="例如：生成一张钻头产品的电商主图，白底，突出锋利刃口，英文标题"
            className="min-h-[120px] h-[120px] resize-y text-xs overflow-y-auto"
            disabled={step === "generating"}
          />
        </div>

        {/* Provider Selection */}
        <div className="space-y-2">
          <Label className="text-[13px] font-medium text-gray-700 flex items-center gap-1.5">
            <Server className="w-3 h-3 text-gray-400" />选择模型
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "chatgpt2api", label: "GPT Image" },
              { id: "volcano", label: "Seedream 5.0" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                className={cn(
                  "px-2 py-1.5 rounded-lg text-[13px] font-medium transition-colors",
                  activeSession.provider === p.id
                    ? "bg-[rgb(235,236,237)] text-[#0f1419]"
                    : "text-gray-600 hover:text-[#0f1419]"
                )}
                onClick={() => {
                  onUpdateSession((s) => {
                    const isGpt = p.id === "chatgpt2api";
                    return {
                      ...s,
                      provider: p.id,
                      outputWidth: isGpt ? 1024 : 1920,
                      outputHeight: isGpt ? 1024 : 1920,
                      lastError: null,
                    };
                  });
                }}
                disabled={step === "generating"}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Output Size */}
        <div className="space-y-2">
          <Label className="text-[13px] font-medium text-gray-700 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3 text-gray-400" />输出尺寸
          </Label>
          <div className={cn("grid gap-2", isChatGPT2API ? "grid-cols-3" : "grid-cols-4")}>
            <button
              type="button"
              className={cn(
                "px-2 py-1.5 rounded-lg text-[13px] font-medium transition-colors",
                isPreset(PRESET_1_1) && !customSizeOpen
                  ? "bg-[rgb(235,236,237)] text-[#0f1419]"
                  : "text-gray-600 hover:text-[#0f1419]"
              )}
              onClick={() => {
                setCustomSizeOpen(false);
                onUpdateSession((s) => ({ ...s, outputWidth: PRESET_1_1.w, outputHeight: PRESET_1_1.h, lastError: null }));
              }}
              disabled={step === "generating"}
            >
              {isChatGPT2API ? "1024²" : "1:1"}
            </button>
            <button
              type="button"
              className={cn(
                "px-2 py-1.5 rounded-lg text-[13px] font-medium transition-colors",
                isPreset(PRESET_3_4) && !customSizeOpen
                  ? "bg-[rgb(235,236,237)] text-[#0f1419]"
                  : "text-gray-600 hover:text-[#0f1419]"
              )}
              onClick={() => {
                setCustomSizeOpen(false);
                onUpdateSession((s) => ({ ...s, outputWidth: PRESET_3_4.w, outputHeight: PRESET_3_4.h, lastError: null }));
              }}
              disabled={step === "generating"}
            >
              {isChatGPT2API ? "1024×1536" : "3:4"}
            </button>
            <button
              type="button"
              className={cn(
                "px-2 py-1.5 rounded-lg text-[13px] font-medium transition-colors",
                isPreset(PRESET_2_4) && !customSizeOpen
                  ? "bg-[rgb(235,236,237)] text-[#0f1419]"
                  : "text-gray-600 hover:text-[#0f1419]"
              )}
              onClick={() => {
                setCustomSizeOpen(false);
                onUpdateSession((s) => ({ ...s, outputWidth: PRESET_2_4.w, outputHeight: PRESET_2_4.h, lastError: null }));
              }}
              disabled={step === "generating"}
            >
              {isChatGPT2API ? "1536×1024" : "2:4"}
            </button>
            {!isChatGPT2API && (
              <button
                type="button"
                className={cn(
                  "px-2 py-1.5 rounded-lg text-[13px] font-medium transition-colors",
                  customSizeOpen
                    ? "bg-[rgb(235,236,237)] text-[#0f1419]"
                    : "text-gray-600 hover:text-[#0f1419]"
                )}
                onClick={() => setCustomSizeOpen(true)}
                disabled={step === "generating"}
              >
                自定义
              </button>
            )}
          </div>
          {customSizeOpen && !isChatGPT2API && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-gray-500">宽</Label>
                <Input
                  value={String(outputWidth)}
                  inputMode="numeric"
                  onChange={(e) => {
                    const v = Number.parseInt(e.target.value || "0", 10);
                    if (!Number.isFinite(v)) return;
                    onUpdateSession((s) => ({ ...s, outputWidth: Math.max(1, v), lastError: null }));
                  }}
                  disabled={step === "generating"}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-gray-500">高</Label>
                <Input
                  value={String(outputHeight)}
                  inputMode="numeric"
                  onChange={(e) => {
                    const v = Number.parseInt(e.target.value || "0", 10);
                    if (!Number.isFinite(v)) return;
                    onUpdateSession((s) => ({ ...s, outputHeight: Math.max(1, v), lastError: null }));
                  }}
                  disabled={step === "generating"}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Reference Images — hidden for GPT Image */}
        {!isChatGPT2API && (
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-gray-700 flex items-center gap-1.5">
              <ImageIcon className="w-3 h-3 text-gray-400" />
              参考图
              <span className="text-gray-400 font-normal">（可选，最多3张）</span>
            </Label>
            <input
              ref={referenceFileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={onUploadReference}
            />
            <div className="flex flex-wrap gap-2">
              {referenceImageUrls.map((url, i) => (
                <div
                  key={i}
                  className="relative w-16 h-16 rounded-lg overflow-hidden bg-[#F5F6F8] group shrink-0 cursor-pointer"
                  onClick={() => onOpenImageDetail?.({ imageUrl: url })}
                  title="点击查看详情"
                >
                  <img src={url} alt={`参考图 ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => onRemoveReference?.(i)}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {referenceImageUrls.length < maxReferenceImages && (
                <button
                  onClick={() => referenceFileInputRef?.current?.click()}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-400 shrink-0"
                  title="添加参考图"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom action area */}
      <div className="shrink-0 px-4 pb-3 pt-3 bg-white">
        {step === "generating" ? (
          <Button
            onClick={onCancelGenerate}
            variant="outline"
            className="w-full h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Square className="w-4 h-4 mr-2" />停止生成
          </Button>
        ) : directGenerating ? (
          <Button
            onClick={handleCancelDirectGenerate}
            variant="outline"
            className="w-full h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Square className="w-4 h-4 mr-2" />停止直接生成
          </Button>
        ) : (
          <>
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </svg>
            <div className="flex gap-2">
            <Button
              onClick={onGenerate}
              disabled={!activeProductImage || !goal.trim()}
              className="flex-1 h-10 bg-bbg hover:bg-bbg-hover text-[#0f1419] border-0"
            >
              <Sparkles className="w-4 h-4 mr-2" stroke="url(#icon-gradient)" />AI 生成方案
            </Button>
            <Button
               onClick={handleDirectGenerate}
               disabled={!activeProductImage || !goal.trim()}
               className="flex-1 h-10 bg-bbg hover:bg-bbg-hover text-[#0f1419] border-0"
            >
              <Wand2 className="w-4 h-4 mr-2" stroke="url(#icon-gradient)" />直接生成
            </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
