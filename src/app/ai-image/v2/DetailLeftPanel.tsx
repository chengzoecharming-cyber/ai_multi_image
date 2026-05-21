"use client";

import { RefObject } from "react";
import { ImageIcon, Upload, Sparkles, Aperture, Focus, Layers, Box } from "lucide-react";
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
  onToggleType,
  onGenerate,
}: {
  activeSession: V2Session | undefined;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpdateSession: (updater: (s: V2Session) => V2Session) => void;
  onToggleType: (type: V2DetailType) => void;
  onGenerate: () => void;
}) {
  if (!activeSession) return null;

  const productDescription = activeSession.goal;
  const detail = activeSession.detail;
  const heroImageUrl = detail?.heroImageUrl || null;
  const selectedTypes = detail?.selectedTypes || [];
  const generating = detail?.generating || false;
  const iconMap: Record<V2DetailType, { icon: typeof Box; bg: string; fg: string }> = {
    detail: { icon: Focus, bg: "bg-indigo-50", fg: "text-indigo-600" },
    multi_angle: { icon: Layers, bg: "bg-violet-50", fg: "text-violet-600" },
    lifestyle: { icon: Aperture, bg: "bg-amber-50", fg: "text-amber-600" },
    feature: { icon: Box, bg: "bg-emerald-50", fg: "text-emerald-600" },
  };

  return (
    <div className="w-[320px] h-full flex flex-col border-r border-gray-200 bg-white overflow-hidden shrink-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
            <ImageIcon className="w-3 h-3 text-gray-400" />
            主图上传
          </Label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={onUpload}
          />
          {heroImageUrl ? (
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-[#F5F6F8] max-w-[280px]">
              <img src={heroImageUrl} alt="主图" className="w-full max-w-[280px] aspect-square object-contain" />
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-2 aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm text-gray-500">点击上传主图</span>
              <span className="text-xs text-gray-400">jpg、png、webp，最大 10MB</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">商品描述（组内统一）</Label>
          <Textarea
            value={productDescription}
            onChange={(e) => onUpdateSession((s) => ({ ...s, goal: e.target.value, lastError: null }))}
            placeholder="例如：彩虹镀膜钨钢立铣刀，突出锋利刃口、镀层质感与耐磨性"
            className="min-h-[70px] resize-none text-xs"
            disabled={generating}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium text-gray-700">选择生成素材图类型</Label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(V2_DETAIL_TYPE_LABELS) as V2DetailType[]).map((t) => {
              const checked = selectedTypes.includes(t);
              const meta = iconMap[t];
              const Icon = meta.icon;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onToggleType(t)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 p-0 transition-colors"
                  )}
                >
                  <div
                    style={{ width: 66, height: 66 }}
                    className={cn(
                      "rounded-xl flex items-center justify-center border border-transparent",
                      meta.bg,
                      checked && "border-[0.5px] border-indigo-500"
                    )}
                  >
                    <Icon className={cn("w-7 h-7", meta.fg)} />
                  </div>
                  <div className={cn("text-[11px] leading-tight text-center", checked ? "text-indigo-800" : "text-gray-700")}>
                    {V2_DETAIL_TYPE_LABELS[t]}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400">勾选后将按主图风格批量生成多页素材图（无方案对比）。</p>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100">
        <Button
          onClick={onGenerate}
          disabled={generating}
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
              开始生成（多页）
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
