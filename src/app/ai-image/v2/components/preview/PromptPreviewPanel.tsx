"use client";

import { useEffect, useState } from "react";
import {
  Ban, Copy, Download, ImageIcon, RotateCcw, Sparkles, Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CopySourceBadge } from "../ui/CopySourceBadge";
import { IMAGE_TYPE_LABELS } from "../../types";
import type { CreativePlan } from "../../types";

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
      // roundRect is available in modern browsers but not in older TS DOM types
      const ctxWithRoundRect = context as unknown as CanvasRenderingContext2D & {
        roundRect(x: number, y: number, w: number, h: number, radii: number | number[]): void;
      };
      if (ctxWithRoundRect.roundRect) {
        context.beginPath();
        ctxWithRoundRect.roundRect(x, y, w, h, radius);
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
            placeholder='例如：把标题改得更"高级质感"，卖点改成3条，强调"耐磨/高精度/长寿命"，去掉任何促销语气。'
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
            <Label className="text-[11px] text-gray-500">文案要点（可选）</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {(plan.sellingPoints || []).map((s, idx) => (
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
                      <span className="font-medium text-gray-700">文案要点{idx + 1}：</span>{s}
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
