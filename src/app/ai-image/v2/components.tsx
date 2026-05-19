"use client";

import { useCallback, useState } from "react";
import {
  Check, AlertTriangle, Eye, Layout, Palette, Type,
  ChevronDown, Copy, CheckCheck, Wand2, Pencil, Save,
  Grid3x3, ImageIcon, Ban, FileText, Layers, RotateCcw,
  Sparkles, BookOpen, Box, Shield, SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type {
  CreativePlan, ImageSetPlan, GenerationMode, ProductAnalysis, LayoutOverlay,
} from "./types";
import {
  IMAGE_TYPE_LABELS, PLAN_META, SUB_PLAN_META, LAYOUT_TYPE_LABELS,
} from "./types";

// ==================== StepBadge ====================

export function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold",
        done ? "bg-green-500 text-white" : active ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-500"
      )}
    >
      {done ? <Check className="w-3.5 h-3.5" /> : n}
    </div>
  );
}

// ==================== ModeSelector ====================

export function ModeSelector({
  value,
  onChange,
}: {
  value: GenerationMode;
  onChange: (v: GenerationMode) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">制图模式</Label>
      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          onClick={() => onChange("single")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all",
            value === "single" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Layers className="w-4 h-4" />
          单张图
        </button>
        <button
          onClick={() => onChange("set")}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all",
            value === "set" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Grid3x3 className="w-4 h-4" />
          五张详情组图
        </button>
      </div>
      <p className="text-xs text-gray-400">
        {value === "single" ? "生成多个单图方案，任选其一。" : "生成一套 5 张详情组图，每张图都有独立方案。"}
      </p>
    </div>
  );
}

// ==================== ProductAnalysisBlock ====================

export function ProductAnalysisBlock({ analysis }: { analysis: ProductAnalysis }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2.5">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
        <Eye className="w-3 h-3" />
        商品分析
      </h4>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-400">产品名称:</span>{" "}
          <span className="text-gray-700 font-medium">{analysis.productName}</span>
        </div>
        <div>
          <span className="text-gray-400">产品类型:</span>{" "}
          <span className="text-gray-700">{analysis.productType}</span>
        </div>
      </div>

      <div className="text-sm">
        <span className="text-gray-400">主体描述:</span>{" "}
        <span className="text-gray-700">{analysis.productSubjectDescription}</span>
      </div>

      <div className="text-sm">
        <span className="text-gray-400">可见结构:</span>{" "}
        <span className="text-gray-700">{analysis.visibleFeatures.join("、")}</span>
      </div>

      {analysis.materialGuess && (
        <div className="text-sm">
          <span className="text-gray-400">预估材质:</span>{" "}
          <span className="text-gray-700">{analysis.materialGuess}</span>
        </div>
      )}

      {analysis.detectedNonProductElements.length > 0 && (
        <div className="text-sm">
          <span className="text-gray-400">检测到的非商品元素:</span>{" "}
          <span className="text-amber-700">{analysis.detectedNonProductElements.join("、")}</span>
        </div>
      )}

      <div className="text-sm bg-white rounded border border-gray-100 p-2">
        <span className="text-gray-400">主体提取说明:</span>{" "}
        <span className="text-gray-700">{analysis.isolationInstruction}</span>
      </div>

      <div className="text-sm">
        <span className="text-gray-400">结构保护:</span>{" "}
        <span className="text-gray-700">{analysis.structureRisks.join("；")}</span>
      </div>
    </div>
  );
}

// ==================== LayoutOverlayBlock ====================

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-4 h-4 rounded border border-gray-200 shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] text-gray-500">{label}</span>
    </div>
  );
}

export function LayoutOverlayBlock({ overlay }: { overlay: LayoutOverlay }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <Layout className="w-3 h-3" />
          AI 自动版式
        </h4>
        <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal">
          {LAYOUT_TYPE_LABELS[overlay.layoutType] || overlay.layoutType}
        </Badge>
      </div>

      <div className="text-[11px] text-gray-400">可编辑</div>

      {/* Color Theme */}
      <div className="space-y-1.5">
        <span className="text-[11px] text-gray-400 font-medium">色彩主题</span>
        <div className="flex flex-wrap gap-3">
          <ColorSwatch color={overlay.colorTheme.primary} label="主色" />
          <ColorSwatch color={overlay.colorTheme.secondary} label="辅色" />
          <ColorSwatch color={overlay.colorTheme.background} label="背景" />
          <ColorSwatch color={overlay.colorTheme.text} label="文字" />
          <ColorSwatch color={overlay.colorTheme.accent} label="强调" />
        </div>
      </div>

      {/* Visual Density */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-400 font-medium">信息密度:</span>
        <Badge variant="secondary" className="text-[10px] h-4 px-1 font-normal">
          {overlay.visualDensity === "clean" ? "简洁" : overlay.visualDensity === "balanced" ? "均衡" : "高信息"}
        </Badge>
      </div>

      {/* Text Blocks */}
      <div className="space-y-1.5">
        <span className="text-[11px] text-gray-400 font-medium">文字块布局</span>
        <div className="space-y-1">
          {overlay.textBlocks.map((tb) => (
            <div key={tb.id} className="flex items-center gap-2 text-sm bg-white rounded border border-gray-100 px-2 py-1">
              <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal shrink-0">
                {tb.role === "headline" ? "标题" : tb.role === "subtitle" ? "副标题" : tb.role === "selling_point" ? "卖点" : tb.role === "label" ? "标签" : "徽章"}
              </Badge>
              <span className="text-gray-700 truncate flex-1">{tb.text}</span>
              <span className="text-[10px] text-gray-400 shrink-0">{tb.position}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== RiskWarningsBlock ====================

export function RiskWarningsBlock({ warnings }: { warnings: string[] }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-gray-500 flex items-center gap-1 text-amber-600">
        <AlertTriangle className="w-3 h-3" />风险约束
      </Label>
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5 space-y-1">
        {warnings.map((w, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-amber-800">
            <span className="mt-1 w-1 h-1 rounded-full bg-amber-400 shrink-0" />
            {w}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== CopySourceBadge ====================

function CopySourceBadge({ source }: { source?: string }) {
  if (!source) return null;
  const styles: Record<string, string> = {
    user_exact: "bg-green-50 text-green-700 border-green-200",
    ai_rewritten: "bg-blue-50 text-blue-700 border-blue-200",
    ai_suggested: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const labels: Record<string, string> = {
    user_exact: "用户原文",
    ai_rewritten: "AI 改写",
    ai_suggested: "AI 建议",
  };
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${styles[source] || "bg-gray-50 text-gray-600 border-gray-200"}`}>
      {labels[source] || source}
    </span>
  );
}

// ==================== PlanEditableFields ====================

export function PlanEditableFields({
  plan,
  isEditing,
  onUpdate,
}: {
  plan: CreativePlan;
  isEditing: boolean;
  onUpdate: (p: CreativePlan) => void;
}) {
  const updateField = useCallback(
    <K extends keyof CreativePlan>(key: K, value: CreativePlan[K]) => {
      onUpdate({ ...plan, [key]: value });
    },
    [plan, onUpdate]
  );

  const updateSellingPoint = (i: number, val: string) => {
    const sp = [...plan.sellingPoints];
    sp[i] = val;
    updateField("sellingPoints", sp);
  };

  const addSellingPoint = () => updateField("sellingPoints", [...plan.sellingPoints, ""]);
  const removeSellingPoint = (i: number) => updateField("sellingPoints", plan.sellingPoints.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {/* AI Auto Copy Section */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
            <Type className="w-3 h-3" />AI 自动文案
          </Label>
          <CopySourceBadge source={plan.copySource} />
          <span className="text-[11px] text-gray-400">可编辑</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
            标题 Headline <Badge variant="outline" className="text-[10px] h-3.5 px-1 font-normal">英文</Badge>
          </Label>
        </div>
        {isEditing ? (
          <Input value={plan.headline} onChange={(e) => updateField("headline", e.target.value)} className="text-sm h-8" />
        ) : (
          <p className="text-sm text-gray-800 font-medium">{plan.headline}</p>
        )}
      </div>

      {plan.subtitle && (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-gray-500">副标题 Subtitle</Label>
          {isEditing ? (
            <Input value={plan.subtitle} onChange={(e) => updateField("subtitle", e.target.value)} className="text-sm h-8" />
          ) : (
            <p className="text-sm text-gray-600">{plan.subtitle}</p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
          卖点 Selling Points <Badge variant="outline" className="text-[10px] h-3.5 px-1 font-normal">英文</Badge>
        </Label>
        <div className="space-y-1.5">
          {plan.sellingPoints.map((sp, i) => (
            <div key={i} className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Input value={sp} onChange={(e) => updateSellingPoint(i, e.target.value)} className="text-sm h-8 flex-1" />
                  {plan.sellingPoints.length > 1 && (
                    <button onClick={() => removeSellingPoint(i)} className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  )}
                </>
              ) : (
                <span className="text-sm text-gray-700 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100">{sp}</span>
              )}
            </div>
          ))}
          {isEditing && (
            <Button variant="ghost" size="sm" className="h-7 text-indigo-600 text-xs" onClick={addSellingPoint}>
              + 添加卖点
            </Button>
          )}
        </div>
      </div>

      {plan.copyNotes && plan.copyNotes.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-gray-400">文案说明</Label>
          {plan.copyNotes.map((note, i) => (
            <p key={i} className="text-[11px] text-gray-400">{note}</p>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Layout className="w-3 h-3" />版式方向
        </Label>
        {isEditing ? (
          <Textarea value={plan.layoutDirection} onChange={(e) => updateField("layoutDirection", e.target.value)} className="text-sm min-h-[60px] resize-none" />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">{plan.layoutDirection}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Eye className="w-3 h-3" />视觉方向
        </Label>
        {isEditing ? (
          <Textarea value={plan.visualDirection} onChange={(e) => updateField("visualDirection", e.target.value)} className="text-sm min-h-[60px] resize-none" />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">{plan.visualDirection}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-medium text-gray-500 flex items-center gap-1">
          <Palette className="w-3 h-3" />色彩方向
        </Label>
        {isEditing ? (
          <Textarea value={plan.colorDirection} onChange={(e) => updateField("colorDirection", e.target.value)} className="text-sm min-h-[60px] resize-none" />
        ) : (
          <p className="text-sm text-gray-700 leading-relaxed">{plan.colorDirection}</p>
        )}
      </div>
    </div>
  );
}

// ==================== SinglePlanCard ====================

export function SinglePlanCard({
  plan,
  index,
  isExpanded,
  isEditing,
  onToggle,
  onEdit,
  onUpdate,
  onGenerate,
  onCopy,
  onSave,
  onExpandToSet,
  copiedId,
}: {
  plan: CreativePlan;
  index: number;
  isExpanded: boolean;
  isEditing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onUpdate: (p: CreativePlan) => void;
  onGenerate: (p: CreativePlan) => void;
  onCopy: (p: CreativePlan) => void;
  onSave: (p: CreativePlan) => void;
  onExpandToSet?: (p: CreativePlan) => void;
  copiedId: string | null;
}) {
  const meta = PLAN_META[index % PLAN_META.length];
  const Icon = meta.icon;

  return (
    <div className={cn("rounded-xl border bg-white transition-shadow", isExpanded ? "shadow-md border-gray-300" : "shadow-sm border-gray-200 hover:border-gray-300")}>
      <button onClick={onToggle} className="w-full flex items-start gap-3 p-4 text-left">
        <div className={cn("shrink-0 w-8 h-8 rounded-lg flex items-center justify-center", meta.bg)}>
          <Icon className={cn("w-4 h-4", meta.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-800">方案 {index + 1}</span>
            <Badge variant="outline" className={cn("text-[10px] h-4 px-1 font-normal", meta.color, meta.border)}>
              {meta.label}
            </Badge>
            <Badge variant="secondary" className="text-[10px] h-4 px-1 font-normal">
              {IMAGE_TYPE_LABELS[plan.imageType] || plan.imageType}
            </Badge>
          </div>
          <p className="text-sm font-medium text-gray-700 truncate">{plan.headline}</p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {plan.sellingPoints.slice(0, 3).map((sp, i) => (
              <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{sp}</span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5 line-clamp-1">{plan.layoutDirection}</p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform", isExpanded && "rotate-180")} />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2 py-3">
            <Button size="sm" onClick={() => onGenerate(plan)} className="h-8 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0">
              <Wand2 className="w-3.5 h-3.5 mr-1.5" />生成制图 Prompt
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />{isEditing ? "完成编辑" : "编辑"}
            </Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => onCopy(plan)}>
              {copiedId === plan.id ? (
                <><CheckCheck className="w-3.5 h-3.5 mr-1.5 text-green-500" />已复制</>
              ) : (
                <><Copy className="w-3.5 h-3.5 mr-1.5" />复制 Prompt</>
              )}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-gray-400" onClick={() => onSave(plan)}>
              <Save className="w-3.5 h-3.5 mr-1.5" />保存为模板
            </Button>
            {onExpandToSet && (
              <Button variant="ghost" size="sm" className="h-8 text-indigo-600" onClick={() => onExpandToSet(plan)}>
                <Grid3x3 className="w-3.5 h-3.5 mr-1.5" />扩展为 5 张详情组图
              </Button>
            )}
          </div>

          {plan.productAnalysis && <ProductAnalysisBlock analysis={plan.productAnalysis} />}

          {plan.layoutOverlay && (
            <div className="mt-3">
              <LayoutOverlayBlock overlay={plan.layoutOverlay} />
            </div>
          )}

          <div className="mt-4">
            <PlanEditableFields plan={plan} isEditing={isEditing} onUpdate={onUpdate} />
          </div>
          <div className="mt-4">
            <RiskWarningsBlock warnings={plan.riskWarnings} />
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== SubPlanCard (compact, for set mode) ====================

export function SubPlanCard({
  plan,
  index,
  isExpanded,
  isEditing,
  onToggle,
  onEdit,
  onUpdate,
  onGenerate,
  onCopy,
  onSave,
  copiedId,
}: {
  plan: CreativePlan;
  index: number;
  isExpanded: boolean;
  isEditing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onUpdate: (p: CreativePlan) => void;
  onGenerate: (p: CreativePlan) => void;
  onCopy: (p: CreativePlan) => void;
  onSave: (p: CreativePlan) => void;
  copiedId: string | null;
}) {
  const meta = SUB_PLAN_META[index % SUB_PLAN_META.length];
  const Icon = meta.icon;

  return (
    <div className={cn("rounded-lg border bg-white transition-shadow", isExpanded ? "shadow-sm border-gray-300" : "border-gray-200 hover:border-gray-300")}>
      <button onClick={onToggle} className="w-full flex items-center gap-2.5 p-3 text-left">
        <div className={cn("shrink-0 w-7 h-7 rounded-md flex items-center justify-center", meta.bg)}>
          <Icon className={cn("w-3.5 h-3.5", meta.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500">图 {index + 1}</span>
            <span className="text-sm font-medium text-gray-800 truncate">{plan.planName}</span>
            <Badge variant="secondary" className="text-[10px] h-3.5 px-1 font-normal">
              {IMAGE_TYPE_LABELS[plan.imageType] || plan.imageType}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">{plan.headline}</p>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform", isExpanded && "rotate-180")} />
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 py-2">
            <Button size="sm" onClick={() => onGenerate(plan)} className="h-7 text-xs bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white border-0">
              <Wand2 className="w-3 h-3 mr-1" />生成制图 Prompt
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onEdit}>
              <Pencil className="w-3 h-3 mr-1" />{isEditing ? "完成" : "编辑"}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onCopy(plan)}>
              {copiedId === plan.id ? <CheckCheck className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-400" onClick={() => onSave(plan)}>
              <Save className="w-3 h-3" />
            </Button>
          </div>

          {plan.layoutOverlay && (
            <div className="mb-2">
              <LayoutOverlayBlock overlay={plan.layoutOverlay} />
            </div>
          )}

          <PlanEditableFields plan={plan} isEditing={isEditing} onUpdate={onUpdate} />
          <div className="mt-3">
            <RiskWarningsBlock warnings={plan.riskWarnings} />
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== SetPlanCard ====================

export function SetPlanCard({
  setPlan,
  isExpanded,
  expandedSubIds,
  editingSubId,
  onToggle,
  onToggleSub,
  onExpandAllSubs,
  onCollapseAllSubs,
  onEditSub,
  onUpdateSub,
  onGenerateSub,
  onCopySub,
  onSaveSub,
  copiedId,
}: {
  setPlan: ImageSetPlan;
  isExpanded: boolean;
  expandedSubIds: string[];
  editingSubId: string | null;
  onToggle: () => void;
  onToggleSub: (id: string) => void;
  onExpandAllSubs: () => void;
  onCollapseAllSubs: () => void;
  onEditSub: (id: string) => void;
  onUpdateSub: (plan: CreativePlan) => void;
  onGenerateSub: (plan: CreativePlan) => void;
  onCopySub: (plan: CreativePlan) => void;
  onSaveSub: (plan: CreativePlan) => void;
  copiedId: string | null;
}) {
  return (
    <div className={cn("rounded-xl border bg-white transition-shadow", isExpanded ? "shadow-md border-gray-300" : "shadow-sm border-gray-200 hover:border-gray-300")}>
      <button onClick={onToggle} className="w-full flex items-start gap-3 p-4 text-left">
        <div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
          <Grid3x3 className="w-4 h-4 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-800">{setPlan.setName}</span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1 font-normal">{setPlan.imageCount} 张</Badge>
            {setPlan.platform && (
              <Badge variant="outline" className="text-[10px] h-4 px-1 font-normal text-gray-500">{setPlan.platform}</Badge>
            )}
          </div>
          <p className="text-xs text-gray-500 line-clamp-2">{setPlan.overallDirection}</p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform", isExpanded && "rotate-180")} />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="py-3">
            <ProductAnalysisBlock analysis={setPlan.productAnalysis} />
          </div>

          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <h4 className="text-xs font-semibold text-gray-500 mb-1">整体方向</h4>
            <p className="text-xs text-gray-600 leading-relaxed">{setPlan.overallDirection}</p>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500">5 张子图</span>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" className="h-6 text-[11px] text-indigo-600" onClick={onExpandAllSubs}>
              展开全部
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-[11px] text-gray-500" onClick={onCollapseAllSubs}>
              收起全部
            </Button>
          </div>
          <div className="space-y-2">
            {setPlan.plans.map((plan, i) => (
              <SubPlanCard
                key={plan.id}
                plan={plan}
                index={i}
                isExpanded={expandedSubIds.includes(plan.id)}
                isEditing={editingSubId === plan.id}
                onToggle={() => onToggleSub(plan.id)}
                onEdit={() => onEditSub(plan.id)}
                onUpdate={onUpdateSub}
                onGenerate={onGenerateSub}
                onCopy={onCopySub}
                onSave={onSaveSub}
                copiedId={copiedId}
              />
            ))}
          </div>

          <div className="mt-3">
            <RiskWarningsBlock warnings={setPlan.riskWarnings} />
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== PromptPreviewPanel ====================

export function PromptPreviewPanel({
  plan,
  onClose,
  copiedId,
  onCopy,
  onGenerateImage,
  isGeneratingImage,
  generatedImageUrl,
}: {
  plan: CreativePlan;
  onClose: () => void;
  copiedId: string | null;
  onCopy: (p: CreativePlan) => void;
  onGenerateImage: (p: CreativePlan) => void;
  isGeneratingImage: boolean;
  generatedImageUrl: string | null;
}) {
  const [imgPromptCollapsed, setImgPromptCollapsed] = useState(false);
  return (
    <div className="w-[460px] border-l border-gray-200 bg-white overflow-y-auto p-5 space-y-4 shrink-0">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-indigo-500" />Prompt 预览
        </h3>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>
            <Ban className="w-3 h-3 mr-1" />关闭预览
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onCopy(plan)}>
            {copiedId === plan.id ? (
              <><CheckCheck className="w-3 h-3 mr-1 text-green-500" />已复制</>
            ) : (
              <><Copy className="w-3 h-3 mr-1" />复制</>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge className="text-xs bg-indigo-50 text-indigo-600 border-indigo-100">
          {plan.planName}
        </Badge>
        <CopySourceBadge source={plan.copySource} />
        <span className="text-xs text-gray-500 truncate">{plan.headline}</span>
      </div>

      {plan.imageGenerationPrompt && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />制图 Prompt (imageGenerationPrompt)
            </h4>
            <button
              onClick={() => setImgPromptCollapsed((v) => !v)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 transition-transform"
              title={imgPromptCollapsed ? "展开" : "折叠"}
            >
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", imgPromptCollapsed && "-rotate-90")} />
            </button>
          </div>
          {!imgPromptCollapsed && (
            <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
              <pre className="text-xs text-gray-100 whitespace-pre-wrap font-mono leading-relaxed">{plan.imageGenerationPrompt}</pre>
            </div>
          )}
        </div>
      )}

      {plan.finalPrompt && plan.finalPrompt !== plan.imageGenerationPrompt && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-500">Final Prompt</h4>
          <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
            <pre className="text-xs text-gray-100 whitespace-pre-wrap font-mono leading-relaxed">{plan.finalPrompt}</pre>
          </div>
        </div>
      )}

      {/* Generate Image Button */}
      <div className="space-y-3">
        <Button
          onClick={() => onGenerateImage(plan)}
          disabled={isGeneratingImage}
          className="w-full h-10 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 shadow-lg shadow-emerald-200"
        >
          {isGeneratingImage ? (
            <><RotateCcw className="w-4 h-4 mr-2 animate-spin" />正在生成图片...</>
          ) : (
            <><Wand2 className="w-4 h-4 mr-2" />生成图片 (SiliconFlow)</>
          )}
        </Button>

        {generatedImageUrl && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />生成结果
            </h4>
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-[#F5F6F8]">
              <img src={generatedImageUrl} alt="Generated" className="w-full object-contain" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
