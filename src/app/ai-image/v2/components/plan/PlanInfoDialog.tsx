"use client";

import { useEffect, useState } from "react";
import { Pencil, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { refreshPlanPrompts } from "@/lib/plan/refresh";
import { IMAGE_TYPE_LABELS } from "../../types";
import type { CreativePlan } from "../../types";

export function PlanInfoDialog({
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
  const isBlank = draft.templateId === "tpl-blank-free";

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
              <Label className="text-[11px] text-gray-500">文案要点（可选，每行一条）</Label>
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

            {!isBlank && (
              <>
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
              </>
            )}

            {isBlank && (
              <div className="pt-1">
                <div className="text-[11px] text-gray-400 mb-1">空白模板</div>
                <p className="text-sm text-gray-600 leading-snug">
                  此方案使用空白模板，不注入任何系统方向。生成指令完全由用户配置决定。
                </p>
              </div>
            )}

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
              输入你想修改的要求，确认后左侧字段会更新；最后点击"确认修改"才会写入该方案。
            </p>
            <Textarea
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
              className="mt-3 min-h-[180px] text-sm"
              placeholder='例如：标题更短更有力量；卖点改成3条；强调"高精度/耐磨/稳定"；整体更偏工业高级灰。'
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
              const refreshed = refreshPlanPrompts(draft);
              onPersist(refreshed);
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
