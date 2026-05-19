"use client";

import { RefObject } from "react";
import {
  ImageIcon, X, Upload, Lightbulb, RotateCcw,
  Sparkles, ChevronRight, LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { GenerationMode, Step, V2Session } from "./types";
import { StepBadge, ModeSelector } from "./components";
import type { PlanTemplate } from "@/lib/plan-templates/types";

export function LeftPanel({
  activeSession,
  selectedTemplate,
  fileInputRef,
  onUpload,
  onUpdateSession,
  onGenerate,
  onReset,
}: {
  activeSession: V2Session | undefined;
  selectedTemplate: PlanTemplate | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateSession: (updater: (s: V2Session) => V2Session) => void;
  onGenerate: () => void;
  onReset: () => void;
}) {
  if (!activeSession) return null;

  const step: Step = activeSession.step;
  const mode: GenerationMode = activeSession.mode;
  const productImageUrl = activeSession.productImageUrl;
  const goal = activeSession.goal;

  return (
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
              onClick={() => onUpdateSession((s) => ({ ...s, selectedTemplateId: null, lastError: null }))}
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
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={onUpload} />
          {productImageUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-[#F5F6F8] group">
              <img src={productImageUrl} alt="商品图" className="w-full aspect-square object-contain" />
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

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-gray-400" />制图目标
          </Label>
          <Textarea
            value={goal}
            onChange={(e) => onUpdateSession((s) => ({ ...s, goal: e.target.value, lastError: null }))}
            placeholder="例如：生成一张钻头产品的电商主图，白底，突出锋利刃口，英文标题"
            className="min-h-[80px] resize-none text-sm"
            disabled={step === "generating"}
          />
          <p className="text-xs text-gray-400">用自然语言描述制图需求，AI 会分析商品图并生成方案。</p>
        </div>

        <ModeSelector
          value={mode}
          onChange={(m) => onUpdateSession((s) => ({ ...s, mode: m, step: "input", previewPlanId: null, lastError: null }))}
        />

        <Button
          onClick={onGenerate}
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
          <Button variant="ghost" size="sm" onClick={onReset} className="w-full text-gray-500">
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />重新开始
          </Button>
        )}
      </div>
    </div>
  );
}
