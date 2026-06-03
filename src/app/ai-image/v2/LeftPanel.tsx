"use client";

import { RefObject, useState } from "react";
import {
  ImageIcon, X, Upload, Lightbulb,
  Sparkles, BookOpen, Square, SlidersHorizontal,
  Plus, Server,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  onOpenTemplateLibrary,
  onCancelGenerate,
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
  onOpenTemplateLibrary?: () => void;
  onCancelGenerate?: () => void;
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

  return (
    <div className="w-[320px] h-full flex flex-col border-r border-gray-200 bg-white overflow-hidden shrink-0">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeSession.authorizationCode?.code && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <div className="text-[11px] text-gray-400 mb-1">授权码</div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-gray-800">
                {activeSession.authorizationCode.code}
              </span>
              <Badge variant="outline" className="text-[10px] h-5">
                {activeSession.authorizationCode.status}
              </Badge>
            </div>
            {activeSession.authorizationCode.note && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{activeSession.authorizationCode.note}</p>
            )}
          </div>
        )}

        {/* Template Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <BookOpen className="w-3 h-3 text-gray-400" />方案模板
          </Label>
          {selectedTemplate ? (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-medium text-indigo-800">{selectedTemplate.name}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal ml-auto">
                  单图
                </Badge>
              </div>
              <p className="text-xs text-indigo-500 line-clamp-2">{selectedTemplate.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateSession((s) => ({ ...s, selectedTemplateId: null, lastError: null }))}
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                >
                  清除选择
                </button>
                <button
                  onClick={onOpenTemplateLibrary}
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline"
                >
                  更换模板
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenTemplateLibrary}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors text-sm text-gray-500"
            >
              <BookOpen className="w-4 h-4" />
              选择方案模板
            </button>
          )}
        </div>

        {/* Product Images — Taobao-style: thumbnail strip left + preview right */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
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
                className="w-full flex flex-col items-center justify-center gap-1.5 aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
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
                        "relative w-12 h-12 rounded-lg overflow-hidden border cursor-pointer group",
                        idx === activeProductImageIndex
                          ? "border-indigo-400 ring-1 ring-indigo-400"
                          : "border-gray-200 hover:border-indigo-300"
                      )}
                      onClick={() => onUpdateSession((s) => ({ ...s, activeProductImageIndex: idx }))}
                      title="点击查看大图"
                    >
                      <img src={url} alt={`商品图 ${idx + 1}`} className="w-full h-full object-cover" />
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
                    className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors flex items-center justify-center text-gray-400 shrink-0"
                    title="添加商品图"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Large preview */}
                <div className="flex-1 min-w-0">
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-[#F5F6F8]">
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
          <p className="text-xs text-gray-400">支持 jpg、png、webp，最大 10MB。可上传多张同一商品的不同形式图。</p>
        </div>

        {/* Goal */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <Lightbulb className="w-3 h-3 text-gray-400" />prompt
          </Label>
          <Textarea
            value={goal}
            onChange={(e) => onUpdateSession((s) => ({ ...s, goal: e.target.value, lastError: null }))}
            placeholder="例如：生成一张钻头产品的电商主图，白底，突出锋利刃口，英文标题"
            className="h-[220px] resize-none text-xs overflow-y-auto"
            disabled={step === "generating"}
          />
          <p className="text-xs text-gray-400">用自然语言描述制图需求，AI 会分析商品图并生成方案。</p>
        </div>

        {/* Provider Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <Server className="w-3 h-3 text-gray-400" />选择模型
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "volcano", label: "火山引擎" },
              { id: "chatgpt2api", label: "ChatGPT2API" },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                className={cn(
                  "px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                  activeSession.provider === p.id
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
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
          <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3 text-gray-400" />输出尺寸
          </Label>
          <div className={cn("grid gap-2", isChatGPT2API ? "grid-cols-3" : "grid-cols-4")}>
            <button
              type="button"
              className={cn(
                "px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                isPreset(PRESET_1_1) && !customSizeOpen
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
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
                "px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                isPreset(PRESET_3_4) && !customSizeOpen
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
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
                "px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                isPreset(PRESET_2_4) && !customSizeOpen
                  ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
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
                  "px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                  customSizeOpen
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
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
          <p className="text-xs text-gray-400">
            {isChatGPT2API
              ? "ChatGPT2API 仅支持 1024×1024、1024×1536、1536×1024 三种尺寸。"
              : "说明：Seedream 对像素有下限，过小会提示尺寸不支持；文字将由前端自动叠加，不需要你手动排版。"}
          </p>
        </div>

        {/* Reference Images — provider-dependent limit */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3 text-gray-400" />
            参考图
            <span className="text-gray-400 font-normal">
              {isChatGPT2API ? "（ChatGPT2API 不支持参考图）" : "（可选，最多3张）"}
            </span>
          </Label>
          {!isChatGPT2API && (
            <>
              <input
                ref={referenceFileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={onUploadReference}
              />
              <div className="flex flex-wrap gap-2">
                {referenceImageUrls.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-[#F5F6F8] group shrink-0">
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
                    className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors flex items-center justify-center text-gray-400 shrink-0"
                    title="添加参考图"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400">支持 jpg、png、webp，用于风格参考</p>
            </>
          )}
          {isChatGPT2API && (
            <p className="text-xs text-gray-400">
              ChatGPT2API 仅支持通过「商品图」进行单张参考图编辑，不支持额外的风格参考图。
            </p>
          )}
        </div>
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
        ) : (
          <Button
            onClick={onGenerate}
            disabled={!activeProductImage || !goal.trim()}
            className="w-full h-10 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0 shadow-lg shadow-indigo-200"
          >
            <Sparkles className="w-4 h-4 mr-2" />AI 生成方案
          </Button>
        )}
      </div>
    </div>
  );
}
