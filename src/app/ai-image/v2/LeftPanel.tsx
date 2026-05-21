"use client";

import { RefObject, useState } from "react";
import {
  ImageIcon, X, Upload, Lightbulb, RotateCcw,
  Sparkles, ChevronRight, BookOpen, Square, SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Step, V2Session } from "./types";
import { StepBadge } from "./components";
import type { PlanTemplate } from "@/lib/plan-templates/types";

export function LeftPanel({
  activeSession,
  selectedTemplate,
  fileInputRef,
  onUpload,
  onUpdateSession,
  onGenerate,
  onReset,
  onOpenTemplateLibrary,
  onCancelGenerate,
}: {
  activeSession: V2Session | undefined;
  selectedTemplate: PlanTemplate | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateSession: (updater: (s: V2Session) => V2Session) => void;
  onGenerate: () => void;
  onReset: () => void;
  onOpenTemplateLibrary?: () => void;
  onCancelGenerate?: () => void;
}) {
  if (!activeSession) return null;

  const step: Step = activeSession.step;
  const productImageUrl = activeSession.productImageUrl;
  const goal = activeSession.goal;
  const outputWidth = activeSession.outputWidth;
  const outputHeight = activeSession.outputHeight;
  const [customSizeOpen, setCustomSizeOpen] = useState(false);

  const PRESET_1_1 = { w: 1920, h: 1920 };
  const PRESET_3_4 = { w: 1920, h: 2560 };
  const PRESET_2_4 = { w: 1440, h: 2880 };

  const isPreset = (p: { w: number; h: number }) => outputWidth === p.w && outputHeight === p.h;

  return (
    <div className="w-[320px] h-full flex flex-col border-r border-gray-200 bg-white overflow-hidden shrink-0">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stepper */}
        <div className="flex items-center gap-1.5">
          <StepBadge n={1} active={step === "input" || step === "generating"} done={step === "plans" || step === "preview"} />
          <span className="text-xs font-medium text-gray-700">输入任务</span>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <StepBadge n={2} active={step === "plans"} done={step === "preview"} />
          <span className="text-xs font-medium text-gray-700">选方案</span>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <StepBadge n={3} active={step === "preview"} done={false} />
          <span className="text-xs font-medium text-gray-700">生图</span>
          <div className="flex-1" />
          {(step === "plans" || step === "preview") && (
            <button
              onClick={onReset}
              className="inline-flex items-center justify-center w-6 h-6 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              title="重新开始"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

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

        {/* Product Image — max 280px */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3 text-gray-400" />商品图
          </Label>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={onUpload} />
          {productImageUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-[#F5F6F8] group max-w-[280px]">
              <img src={productImageUrl} alt="商品图" className="w-full max-w-[280px] aspect-square object-contain" />
              <button onClick={() => onUpdateSession((s) => ({ ...s, productImageUrl: null, productReferenceImageUrl: null, lastError: null }))} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
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

        {/* Goal */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <Lightbulb className="w-3 h-3 text-gray-400" />制图目标
          </Label>
          <Textarea
            value={goal}
            onChange={(e) => onUpdateSession((s) => ({ ...s, goal: e.target.value, lastError: null }))}
            placeholder="例如：生成一张钻头产品的电商主图，白底，突出锋利刃口，英文标题"
            className="min-h-[70px] resize-none text-xs"
            disabled={step === "generating"}
          />
          <p className="text-xs text-gray-400">用自然语言描述制图需求，AI 会分析商品图并生成方案。</p>
        </div>

        {/* Output Size */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3 text-gray-400" />输出尺寸
          </Label>
          <div className="grid grid-cols-4 gap-2">
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
              1:1
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
              3:4
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
              2:4
            </button>
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
          </div>
          {customSizeOpen && (
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
            说明：Seedream 对像素有下限，过小会提示尺寸不支持；文字将由前端自动叠加，不需要你手动排版。
          </p>
        </div>
      </div>

      {/* Sticky bottom action area */}
      <div className="shrink-0 px-4 pb-3 pt-0">
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
            disabled={!productImageUrl || !goal.trim()}
            className="w-full h-10 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0 shadow-lg shadow-indigo-200"
          >
            <Sparkles className="w-4 h-4 mr-2" />AI 生成方案
          </Button>
        )}
      </div>
    </div>
  );
}
