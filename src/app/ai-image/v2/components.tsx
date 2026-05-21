"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check, AlertTriangle, Eye, Layout, Palette, Type,
  ChevronDown, Copy, CheckCheck, Wand2, Pencil, Save, Download, Info,
  Grid3x3, ImageIcon, Ban, FileText, Layers, RotateCcw,
  Sparkles, BookOpen, Box, Shield, SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  CreativePlan, ImageSetPlan, GenerationMode, ProductAnalysis, LayoutOverlay,
} from "./types";
import {
  IMAGE_TYPE_LABELS, getPlanMeta, SUB_PLAN_META, LAYOUT_TYPE_LABELS,
} from "./types";

// ==================== StepBadge ====================

export function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-semibold",
        done ? "bg-green-500 text-white" : active ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-500"
      )}
    >
      {done ? <Check className="w-3 h-3" /> : n}
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
      </div>
      <p className="text-xs text-gray-400">
        生成多个单图方案，任选其一。
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
  onOpenPreview,
  onSave,
  onGenerateImage,
  copiedId,
  variant = "default",
}: {
  plan: CreativePlan;
  index: number;
  isExpanded: boolean;
  isEditing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onUpdate: (p: CreativePlan) => void;
  onOpenPreview: (p: CreativePlan) => void;
  onSave: (p: CreativePlan) => void;
  onGenerateImage: (p: CreativePlan) => void;
  copiedId: string | null;
  variant?: "default" | "compact";
}) {
  const meta = getPlanMeta(plan);
  const Icon = meta.icon;
  const [infoOpen, setInfoOpen] = useState(false);

  function PlanInfoDialog({
    open,
    onOpenChange,
    plan,
    onPersist,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plan: CreativePlan;
    onPersist: (p: CreativePlan) => void;
  }) {
    const [manualEditing, setManualEditing] = useState(false);
    const [aiPanelOpen, setAiPanelOpen] = useState(false);
    const [draft, setDraft] = useState<CreativePlan>(plan);
    const [aiInstruction, setAiInstruction] = useState("");
    const [aiBusy, setAiBusy] = useState(false);

    useEffect(() => {
      if (!open) return;
      setManualEditing(false);
      setAiPanelOpen(false);
      setAiInstruction("");
      setDraft(plan);
    }, [open, plan]);

    const updateDraft = <K extends keyof CreativePlan>(key: K, value: CreativePlan[K]) => {
      setDraft((p) => ({ ...p, [key]: value }));
    };

    const sellingPointsText = (draft.sellingPoints || []).join("\n");
    const copyBlocksJson = JSON.stringify(draft.copyBlocks || [], null, 2);
    // layoutOverlay is intentionally not exposed in this dialog (kept internal for rendering/layout).

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 max-h-[600px]">
            {/* Left: fields */}
            <div className="p-5 space-y-4 overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-800">方案信息</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={cn(
                        "inline-flex items-center justify-center w-8 h-8 rounded-md border text-gray-600 hover:bg-gray-50",
                        manualEditing ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white"
                      )}
                      title="编辑"
                      onClick={() => setManualEditing((v) => !v)}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => setAiPanelOpen((v) => !v)}
                    >
                      <Sparkles className="w-4 h-4 mr-1.5" />AI 编辑
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] text-gray-500">产品</Label>
                  {manualEditing ? (
                    <Input value={draft.productName} onChange={(e) => updateDraft("productName", e.target.value)} className="h-9 text-sm mt-1" />
                  ) : (
                    <div className="text-sm text-gray-800 mt-1">{draft.productName}</div>
                  )}
                </div>
                <div>
                  <Label className="text-[11px] text-gray-500">图类型</Label>
                  {manualEditing ? (
                    <Input value={draft.imageType} onChange={(e) => updateDraft("imageType", e.target.value)} className="h-9 text-sm mt-1" />
                  ) : (
                    <div className="text-sm text-gray-800 mt-1">{IMAGE_TYPE_LABELS[draft.imageType] || draft.imageType}</div>
                  )}
                </div>
                <div className="col-span-2">
                  <Label className="text-[11px] text-gray-500">主标题</Label>
                  {manualEditing ? (
                    <Textarea value={draft.headline} onChange={(e) => updateDraft("headline", e.target.value)} className="min-h-[60px] text-sm mt-1" />
                  ) : (
                    <div className="text-sm text-gray-800 mt-1">{draft.headline}</div>
                  )}
                </div>
                <div className="col-span-2">
                  <Label className="text-[11px] text-gray-500">副标题</Label>
                  {manualEditing ? (
                    <Textarea value={draft.subtitle || ""} onChange={(e) => updateDraft("subtitle", e.target.value)} className="min-h-[50px] text-sm mt-1" />
                  ) : (
                    <div className="text-sm text-gray-800 mt-1">{draft.subtitle || "—"}</div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-[11px] text-gray-500">卖点（每行一条）</Label>
                {manualEditing ? (
                  <Textarea
                    value={sellingPointsText}
                    onChange={(e) => updateDraft("sellingPoints", e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))}
                    className="min-h-[90px] text-sm mt-1"
                  />
                ) : (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(draft.sellingPoints || []).map((s, idx) => (
                      <span key={`${idx}-${s}`} className="text-[11px] px-2 py-1 rounded bg-gray-100 text-gray-700">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label className="text-[11px] text-gray-500">版式方向</Label>
                {manualEditing ? (
                  <Textarea value={draft.layoutDirection} onChange={(e) => updateDraft("layoutDirection", e.target.value)} className="min-h-[70px] text-sm mt-1" />
                ) : (
                  <div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{draft.layoutDirection}</div>
                )}
              </div>

              <div>
                <Label className="text-[11px] text-gray-500">视觉方向</Label>
                {manualEditing ? (
                  <Textarea value={draft.visualDirection} onChange={(e) => updateDraft("visualDirection", e.target.value)} className="min-h-[70px] text-sm mt-1" />
                ) : (
                  <div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{draft.visualDirection}</div>
                )}
              </div>

              <div>
                <Label className="text-[11px] text-gray-500">色彩方向</Label>
                {manualEditing ? (
                  <Textarea value={draft.colorDirection} onChange={(e) => updateDraft("colorDirection", e.target.value)} className="min-h-[60px] text-sm mt-1" />
                ) : (
                  <div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{draft.colorDirection}</div>
                )}
              </div>

              <div>
                <Label className="text-[11px] text-gray-500">copyBlocks（JSON，可选）</Label>
                {manualEditing ? (
                  <Textarea
                    value={copyBlocksJson}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        updateDraft("copyBlocks", parsed);
                      } catch {
                        updateDraft("copyBlocks", draft.copyBlocks);
                      }
                    }}
                    className="min-h-[120px] text-[11px] font-mono mt-1"
                  />
                ) : (
                  <pre className="mt-1 text-[11px] leading-relaxed bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto">
                    {JSON.stringify(draft.copyBlocks || [], null, 2)}
                  </pre>
                )}
              </div>
            </div>

            {/* Right: AI chat */}
            <div className={cn("border-t sm:border-t-0 sm:border-l border-gray-200 bg-gray-50 p-5 overflow-y-auto", !aiPanelOpen && "hidden sm:block")}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-800">AI 编辑</div>
                <button
                  type="button"
                  className="text-xs text-gray-500 hover:text-gray-700 underline sm:hidden"
                  onClick={() => setAiPanelOpen(false)}
                >
                  收起
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                输入你想修改的要求，确认后左侧字段会更新；最后点击“确认修改”才会写入该方案。
              </p>
              <Textarea
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                className="mt-3 min-h-[180px] text-sm"
                placeholder='例如：标题更短更有力量；卖点改成3条；强调“高精度/耐磨/稳定”；整体更偏工业高级灰。'
                disabled={aiBusy}
              />
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  disabled={aiBusy || !aiInstruction.trim()}
                  onClick={async () => {
                    try {
                      setAiBusy(true);
                      const res = await fetch("/api/ai-image/v2/edit-plan", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ plan: draft, instruction: aiInstruction }),
                      });
                      const data = await res.json();
                      if (res.ok && data.data) {
                        setDraft(data.data as CreativePlan);
                        toast.success("AI 已生成修改建议");
                      } else {
                        toast.error(data.error || "AI 编辑失败");
                      }
                    } catch {
                      toast.error("网络错误，请重试");
                    } finally {
                      setAiBusy(false);
                    }
                  }}
                >
                  {aiBusy ? "生成中..." : "生成修改"}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-white" showCloseButton={false}>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              onClick={() => {
                onPersist(draft);
                onOpenChange(false);
                toast.success("方案已更新");
              }}
            >
              确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "rounded-xl border p-4 transition-all hover:border-gray-300 hover:shadow-sm",
          index % 3 === 0
            ? "bg-indigo-50/60 border-indigo-100"
            : index % 3 === 1
              ? "bg-emerald-50/60 border-emerald-100"
              : "bg-amber-50/60 border-amber-100",
          isExpanded ? "shadow-sm" : ""
        )}
      >
        <button
          onClick={() => onOpenPreview(plan)}
          className="w-full text-left"
          title="查看详情"
        >
          <div className="flex items-start gap-3">
            <div className={cn("shrink-0 w-9 h-9 rounded-lg flex items-center justify-center", meta.bg)}>
              <Icon className={cn("w-4 h-4", meta.color)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700">方案 {index + 1}</span>
                <Badge variant="outline" className={cn("text-[10px] h-4 px-1 font-normal", meta.color, meta.border)}>
                  {meta.label}
                </Badge>
                <Badge variant="secondary" className="text-[10px] h-4 px-1 font-normal">
                  {IMAGE_TYPE_LABELS[plan.imageType] || plan.imageType}
                </Badge>
              </div>
              <div className="mt-1 flex items-start gap-2">
                <div className="flex-1 text-sm font-medium text-gray-800 line-clamp-2">{plan.headline}</div>
                <button
                  type="button"
                  className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-500 hover:bg-gray-100"
                  title="信息/编辑"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setInfoOpen(true);
                  }}
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                {plan.visualDirection || plan.layoutDirection}
              </div>
            </div>
          </div>
        </button>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            onClick={() => onSave(plan)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 bg-white/60 hover:bg-white text-gray-600"
            title="保存为模板"
          >
            <Save className="w-4 h-4" />
          </button>
          <Button
            size="sm"
            onClick={() => { onOpenPreview(plan); onGenerateImage(plan); }}
            className="h-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
          >
            <Wand2 className="w-3.5 h-3.5 mr-1.5" />生成图片
          </Button>
        </div>
        <PlanInfoDialog
          open={infoOpen}
          onOpenChange={setInfoOpen}
          plan={plan}
          onPersist={onUpdate}
        />
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border bg-white transition-shadow", isExpanded ? "shadow-md border-gray-300" : "shadow-sm border-gray-200 hover:border-gray-300")}>
      {/* Card header — clickable to expand/collapse */}
      <button onClick={onToggle} className="w-full flex items-start gap-2.5 p-3 text-left">
        <div className={cn("shrink-0 w-7 h-7 rounded-lg flex items-center justify-center", meta.bg)}>
          <Icon className={cn("w-3.5 h-3.5", meta.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm font-semibold text-gray-800">方案 {index + 1}</span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1 font-normal">
              {IMAGE_TYPE_LABELS[plan.imageType] || plan.imageType}
            </Badge>
          </div>
          <p className="text-sm font-medium text-gray-700 truncate">{plan.headline}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {plan.sellingPoints.slice(0, 3).map((sp, i) => (
              <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{sp}</span>
            ))}
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-0.5 mt-0.5">
          <button
            type="button"
            className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 text-gray-500"
            title="保存为模板"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSave(plan); }}
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 text-gray-500"
            title="信息/编辑"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setInfoOpen(true); }}
          >
            <Info className="w-3.5 h-3.5" />
          </button>
          <ChevronDown className={cn("w-4 h-4 text-gray-400 shrink-0 transition-transform", isExpanded && "rotate-180")} />
        </div>
      </button>

      {/* Collapsed state: description + generate button */}
      {!isExpanded && (
        <div className="px-3 pb-3">
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{plan.visualDirection || plan.layoutDirection}</p>
          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              onClick={(e) => { e.stopPropagation(); onOpenPreview(plan); onGenerateImage(plan); }}
              className="h-7 text-xs bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            >
              <Wand2 className="w-3 h-3 mr-1" />生成图片
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-400" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
              <Pencil className="w-3 h-3 mr-1" />编辑
            </Button>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2 py-2.5">
            <Button
              size="sm"
              onClick={() => { onOpenPreview(plan); onGenerateImage(plan); }}
              className="h-8 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
            >
              <Wand2 className="w-3.5 h-3.5 mr-1.5" />生成图片
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />{isEditing ? "完成编辑" : "编辑"}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400" onClick={() => onSave(plan)}>
              <Save className="w-3.5 h-3.5 mr-1.5" />保存为模板
            </Button>
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

      <PlanInfoDialog
        open={infoOpen}
        onOpenChange={setInfoOpen}
        plan={plan}
        onPersist={onUpdate}
      />
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
  onUpdatePlan,
  isGeneratingImage,
  generatedImageUrl,
  generatedImageBase64,
}: {
  plan: CreativePlan;
  onClose: () => void;
  copiedId: string | null;
  onCopy: (p: CreativePlan) => void;
  onGenerateImage: (p: CreativePlan) => void;
  onUpdatePlan: (p: CreativePlan) => void;
  isGeneratingImage: boolean;
  generatedImageUrl: string | null;
  generatedImageBase64?: string | null;
}) {
  const [compositedDataUrl, setCompositedDataUrl] = useState<string | null>(null);
  const [aiEditorOpen, setAiEditorOpen] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiEditing, setAiEditing] = useState(false);

  function roleToZh(role: string): string {
    switch (role) {
      case "headline": return "主标题";
      case "subtitle": return "副标题";
      case "selling_point": return "卖点";
      case "badge": return "徽章";
      case "label": return "标签";
      case "feature_title": return "功能标题";
      case "feature_description": return "功能说明";
      case "spec_label": return "规格标签";
      case "spec_value": return "规格值";
      case "section_header": return "区块标题";
      case "callout": return "强调信息";
      default: return "文案";
    }
  }

  function positionToZh(pos: string): string {
    switch (pos) {
      case "top-left": return "左上";
      case "top-right": return "右上";
      case "top": return "顶部";
      case "left": return "左侧";
      case "right": return "右侧";
      case "bottom": return "底部";
      case "center": return "居中";
      default: return pos;
    }
  }

  async function compositeImageWithText(source: string, plan: CreativePlan): Promise<string> {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load base image"));
      img.src = source;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");
    const context = ctx;

    // draw base
    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    const lo = plan.layoutOverlay;
    const padding = Math.round(Math.min(canvas.width, canvas.height) * 0.04);
    const maxBoxWidth = Math.round(canvas.width * 0.55);

    const bgFill = "rgba(17, 24, 39, 0.72)"; // slate-900-ish
    const borderStroke = "rgba(255,255,255,0.10)";
    const textFill = "rgba(255,255,255,0.95)";

    function roundedRect(x: number, y: number, w: number, h: number, r: number) {
      const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
      if ((context as any).roundRect) {
        context.beginPath();
        (context as any).roundRect(x, y, w, h, radius);
        return;
      }
      context.beginPath();
      context.moveTo(x + radius, y);
      context.lineTo(x + w - radius, y);
      context.quadraticCurveTo(x + w, y, x + w, y + radius);
      context.lineTo(x + w, y + h - radius);
      context.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
      context.lineTo(x + radius, y + h);
      context.quadraticCurveTo(x, y + h, x, y + h - radius);
      context.lineTo(x, y + radius);
      context.quadraticCurveTo(x, y, x + radius, y);
    }

    function wrapText(text: string, font: string, maxWidth: number): string[] {
      context.font = font;
      const words = text.split(/\s+/).filter(Boolean);
      if (!words.length) return [];
      const lines: string[] = [];
      let line = words[0];
      for (let i = 1; i < words.length; i++) {
        const test = `${line} ${words[i]}`;
        if (context.measureText(test).width <= maxWidth) {
          line = test;
        } else {
          lines.push(line);
          line = words[i];
        }
      }
      lines.push(line);
      return lines;
    }

    type Block = { text: string; role: string; position: string; priority: number };
    const blocks: Block[] = [];
    if (lo?.textBlocks?.length) {
      blocks.push(...lo.textBlocks.map((b) => ({ text: b.text, role: b.role, position: b.position, priority: b.priority })));
    } else {
      if (plan.headline) blocks.push({ text: plan.headline, role: "headline", position: "top-left", priority: 1 });
      if (plan.subtitle) blocks.push({ text: plan.subtitle, role: "subtitle", position: "top-left", priority: 2 });
      (plan.sellingPoints || []).slice(0, 4).forEach((t, i) => blocks.push({ text: t, role: "selling_point", position: "bottom", priority: 10 + i }));
    }

    // sort by priority (low number = more important)
    blocks.sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

    const roleFont = (role: string) => {
      const base = Math.min(canvas.width, canvas.height);
      if (role === "headline") return `700 ${Math.round(base * 0.055)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
      if (role === "subtitle") return `600 ${Math.round(base * 0.032)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
      if (role === "feature_title" || role === "spec_label" || role === "section_header") return `700 ${Math.round(base * 0.028)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
      return `600 ${Math.round(base * 0.026)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto`;
    };

    const lineHeightForRole = (role: string) => {
      const base = Math.min(canvas.width, canvas.height);
      if (role === "headline") return Math.round(base * 0.072);
      if (role === "subtitle") return Math.round(base * 0.045);
      return Math.round(base * 0.04);
    };

    function anchorForPosition(pos: string) {
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      switch (pos) {
        case "top-left": return { x: padding, y: padding, align: "left" as const, valign: "top" as const };
        case "top-right": return { x: canvas.width - padding, y: padding, align: "right" as const, valign: "top" as const };
        case "top": return { x: cx, y: padding, align: "center" as const, valign: "top" as const };
        case "left": return { x: padding, y: cy, align: "left" as const, valign: "middle" as const };
        case "right": return { x: canvas.width - padding, y: cy, align: "right" as const, valign: "middle" as const };
        case "bottom": return { x: cx, y: canvas.height - padding, align: "center" as const, valign: "bottom" as const };
        case "center":
        default: return { x: cx, y: cy, align: "center" as const, valign: "middle" as const };
      }
    }

    // simple vertical stacking per region
    const regionOffsets = new Map<string, number>();

    for (const b of blocks) {
      const font = roleFont(b.role);
      const lh = lineHeightForRole(b.role);
      const anchor = anchorForPosition(b.position);

      const regionKey = `${b.position}|${anchor.align}|${anchor.valign}`;
      const offset = regionOffsets.get(regionKey) ?? 0;

      const lines = wrapText(String(b.text || "").trim(), font, maxBoxWidth - padding);
      if (!lines.length) continue;

      const boxPaddingX = Math.round(padding * 0.55);
      const boxPaddingY = Math.round(padding * 0.42);
      context.font = font;
      const textWidth = Math.min(
        maxBoxWidth,
        Math.max(...lines.map((ln) => context.measureText(ln).width)) + boxPaddingX * 2
      );
      const textHeight = lines.length * lh + boxPaddingY * 2;

      let x = anchor.x;
      let y = anchor.y;

      if (anchor.align === "center") x = x - textWidth / 2;
      if (anchor.align === "right") x = x - textWidth;
      if (anchor.valign === "middle") y = y - textHeight / 2;
      if (anchor.valign === "bottom") y = y - textHeight;

      // apply stacking offset
      if (anchor.valign === "top") y += offset;
      if (anchor.valign === "bottom") y -= offset;
      if (anchor.valign === "middle") y += offset;

      // clamp
      x = Math.max(padding / 2, Math.min(x, canvas.width - textWidth - padding / 2));
      y = Math.max(padding / 2, Math.min(y, canvas.height - textHeight - padding / 2));

      // box
      roundedRect(x, y, textWidth, textHeight, Math.round(padding * 0.35));
      context.fillStyle = bgFill;
      context.fill();
      context.strokeStyle = borderStroke;
      context.lineWidth = 2;
      context.stroke();

      // text
      context.fillStyle = textFill;
      context.textBaseline = "top";
      context.textAlign = "left";
      let ty = y + boxPaddingY;
      for (const ln of lines) {
        context.font = font;
        context.fillText(ln, x + boxPaddingX, ty);
        ty += lh;
      }

      regionOffsets.set(regionKey, offset + textHeight + Math.round(padding * 0.22));
    }

    return canvas.toDataURL("image/png");
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const source = generatedImageBase64 || generatedImageUrl;
        if (!source) {
          setCompositedDataUrl(null);
          return;
        }
        const url = await compositeImageWithText(source, plan);
        if (!cancelled) setCompositedDataUrl(url);
      } catch {
        if (!cancelled) setCompositedDataUrl(null);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [generatedImageBase64, generatedImageUrl, plan]);

  return (
    <div className="bg-white space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-emerald-500" />图片预览
        </h3>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClose}>
            <Ban className="w-3 h-3 mr-1" />关闭预览
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setAiEditorOpen((v) => !v)}
          >
            <Sparkles className="w-3 h-3 mr-1" />
            AI 编辑
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

      {aiEditorOpen && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
          <Label className="text-xs font-semibold text-gray-600">告诉 AI 你想怎么改（会同步更新卡片字段）</Label>
          <Textarea
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
            className="min-h-[90px] text-sm"
            placeholder='例如：把标题改得更“高级质感”，卖点改成3条，强调“耐磨/高精度/长寿命”，去掉任何促销语气。'
            disabled={aiEditing}
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => { setAiEditorOpen(false); setAiInstruction(""); }}
              disabled={aiEditing}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={aiEditing || !aiInstruction.trim()}
              onClick={async () => {
                try {
                  setAiEditing(true);
                  const res = await fetch("/api/ai-image/v2/edit-plan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plan, instruction: aiInstruction }),
                  });
                  const data = await res.json();
                  if (res.ok && data.data) {
                    onUpdatePlan(data.data as CreativePlan);
                    toast.success("方案已更新");
                    setAiEditorOpen(false);
                    setAiInstruction("");
                  } else {
                    toast.error(data.error || "编辑失败");
                  }
                } catch {
                  toast.error("网络错误，请重试");
                } finally {
                  setAiEditing(false);
                }
              }}
            >
              {aiEditing ? "编辑中..." : "确认修改"}
            </Button>
          </div>
        </div>
      )}

      {/* Full plan fields */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px] text-gray-500">产品</Label>
            <div className="text-sm text-gray-800 mt-0.5">{plan.productName}</div>
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">图类型</Label>
            <div className="text-sm text-gray-800 mt-0.5">{IMAGE_TYPE_LABELS[plan.imageType] || plan.imageType}</div>
          </div>
          <div className="col-span-2">
            <Label className="text-[11px] text-gray-500">主标题</Label>
            <div className="text-sm text-gray-800 mt-0.5">{plan.headline}</div>
          </div>
          {plan.subtitle && (
            <div className="col-span-2">
              <Label className="text-[11px] text-gray-500">副标题</Label>
              <div className="text-sm text-gray-800 mt-0.5">{plan.subtitle}</div>
            </div>
          )}
        </div>

        {(plan.sellingPoints?.length || 0) > 0 && (
          <div>
            <Label className="text-[11px] text-gray-500">卖点</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {plan.sellingPoints.map((s, idx) => (
                <span key={`${idx}-${s}`} className="text-[11px] px-2 py-1 rounded bg-gray-100 text-gray-700">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {(plan.copyBlocks?.length || 0) > 0 && (
          <div>
            <Label className="text-[11px] text-gray-500">文案块（copyBlocks）</Label>
            <div className="mt-1 space-y-1">
              {plan.copyBlocks.map((b) => (
                <div key={b.id} className="text-xs text-gray-700">
                  <span className="text-gray-500">[{b.role}]</span> {b.title}
                  {b.subtitle ? <span className="text-gray-500"> — {b.subtitle}</span> : null}
                  {b.body ? <span className="text-gray-500">（{b.body}）</span> : null}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label className="text-[11px] text-gray-500">版式方向</Label>
            <div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{plan.layoutDirection}</div>
          </div>
          <div className="col-span-2">
            <Label className="text-[11px] text-gray-500">视觉方向</Label>
            <div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{plan.visualDirection}</div>
          </div>
          <div className="col-span-2">
            <Label className="text-[11px] text-gray-500">色彩方向</Label>
            <div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{plan.colorDirection}</div>
          </div>
        </div>

        {(plan.riskWarnings?.length || 0) > 0 && (
          <div>
            <Label className="text-[11px] text-gray-500">风险提示</Label>
            <ul className="mt-1 space-y-1">
              {plan.riskWarnings.map((w, idx) => (
                <li key={`${idx}-${w}`} className="text-xs text-gray-700">- {w}</li>
              ))}
            </ul>
          </div>
        )}

        {plan.layoutOverlay && (
          <div>
            <Label className="text-[11px] text-gray-500">layoutOverlay（完整）</Label>
            <pre className="mt-1 text-[11px] leading-relaxed bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto">
              {JSON.stringify(plan.layoutOverlay, null, 2)}
            </pre>
          </div>
        )}
      </div>

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
            <><Wand2 className="w-4 h-4 mr-2" />生成图片</>
          )}
        </Button>

        {generatedImageUrl && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />生成结果
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-[#F5F6F8]">
                <img src={compositedDataUrl || generatedImageUrl} alt="Generated" className="w-full object-contain" />
              </div>

              {/* Meaning hints (Chinese) */}
              <div className="rounded-xl border border-gray-200 bg-white p-3 overflow-y-auto">
                <p className="text-xs font-medium text-gray-700 mb-2">图片文案（中文释义）</p>
                <div className="space-y-1">
                  <div className="text-[11px] text-gray-600">
                    <span className="font-medium text-gray-700">主标题：</span>{plan.headline || "—"}
                  </div>
                  {plan.subtitle && (
                    <div className="text-[11px] text-gray-600">
                      <span className="font-medium text-gray-700">副标题：</span>{plan.subtitle}
                    </div>
                  )}
                  {(plan.sellingPoints || []).slice(0, 6).map((s, idx) => (
                    <div key={`${idx}-${s}`} className="text-[11px] text-gray-600">
                      <span className="font-medium text-gray-700">卖点{idx + 1}：</span>{s}
                    </div>
                  ))}
                  {plan.layoutOverlay?.textBlocks?.length ? (
                    <div className="pt-2">
                      <p className="text-[10px] text-gray-400">版式块（用于叠字）</p>
                      <div className="space-y-1 mt-1">
                        {plan.layoutOverlay.textBlocks
                          .slice()
                          .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
                          .slice(0, 10)
                          .map((b) => (
                            <div key={b.id} className="text-[11px] text-gray-600">
                              <span className="font-medium text-gray-700">
                                {roleToZh(b.role)}（{positionToZh(b.position)}）：
                              </span>
                              {b.text}
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const source = compositedDataUrl || generatedImageBase64 || generatedImageUrl;
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
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />复制
              </button>
              <button
                onClick={async () => {
                  try {
                    const source = compositedDataUrl || generatedImageBase64 || generatedImageUrl;
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
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />下载
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
