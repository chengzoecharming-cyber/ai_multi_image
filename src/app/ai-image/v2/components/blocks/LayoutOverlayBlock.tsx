"use client";

import { Layout } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ColorSwatch } from "../ui/ColorSwatch";
import { LAYOUT_TYPE_LABELS } from "../../types";
import type { LayoutOverlay } from "../../types";

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
