"use client";

import { useState } from "react";
import { Save, Info, Wand2, Eye, Sparkles, Languages } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPlanTags } from "../domain/plan-tags";
import type { CreativePlan } from "../types";
import { getPlanMeta } from "../types";

export interface PlanCardProps {
  plan: CreativePlan;
  index: number;
  isActive: boolean;
  hasGeneratedImage: boolean;
  isGenerating: boolean;
  onSave: (plan: CreativePlan) => void;
  onGenerateImage: (plan: CreativePlan) => void;
  onViewImage: (plan: CreativePlan) => void;
  onOpenInfo: (plan: CreativePlan) => void;
}

export function PlanCard({
  plan,
  index,
  isActive,
  hasGeneratedImage,
  isGenerating,
  onSave,
  onGenerateImage,
  onViewImage,
  onOpenInfo,
}: PlanCardProps) {
  const meta = getPlanMeta(plan);
  const [showCn, setShowCn] = useState(false);
  const hasCn = !!(plan.headlineCn || plan.subtitleCn || (plan.sellingPointsCn && plan.sellingPointsCn.length > 0) || (plan.copyBlocksCn && plan.copyBlocksCn.length > 0));

  const displayHeadline = showCn && plan.headlineCn ? plan.headlineCn : plan.headline;
  const displaySubtitle = showCn && plan.subtitleCn ? plan.subtitleCn : plan.subtitle;
  const displaySellingPoints = (showCn && plan.sellingPointsCn ? plan.sellingPointsCn : plan.sellingPoints || []).filter(Boolean);
  const displayCopyBlocks = showCn && plan.copyBlocksCn && plan.copyBlocksCn.length > 0
    ? plan.copyBlocksCn
    : plan.copyBlocks || [];
  const filteredCopyBlocks = displayCopyBlocks
    .filter((b) =>
      b.role !== "headline" &&
      b.role !== "subheadline" &&
      b.role !== "feature_point" &&
      b.role !== "technical_point"
    );

  const ROLE_LABELS: Record<string, string> = {
    core_claim: "核心卖点",
    comparison_label: "对比标签",
    bottom_info: "底部信息",
    application_label: "应用标签",
    badge: "标签",
  };

  const isBlank = plan.templateId === "tpl-blank-free";
  const tags = getPlanTags(plan);

  return (
    <div
      className={cn(
        "w-[438px] bg-white rounded-[16px] overflow-hidden flex flex-col transition-opacity duration-500",
        isActive ? "opacity-100" : "opacity-85"
      )}
      style={{ height: "578px" }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="px-6 pt-5 pb-2 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold", meta.bg, meta.color)}>
              {index + 1}
            </div>
            <div className="min-w-0">
              <h3 className="text-[14px] font-normal text-[#0f1419] leading-tight truncate">{plan.planName}</h3>
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowCn((v) => !v); }}
              className="w-6 h-6 flex items-center justify-center text-[#72808a] hover:text-[#0f1419] active:text-[#0f1419] transition-colors"
              title={showCn ? "English" : "中文"}
            >
              <Languages className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSave(plan); }}
              className="w-6 h-6 flex items-center justify-center text-[#72808a] hover:text-[#0f1419] active:text-[#0f1419] transition-colors"
              title="保存为模板"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onOpenInfo(plan); }}
              className="w-6 h-6 flex items-center justify-center text-[#72808a] hover:text-[#0f1419] active:text-[#0f1419] transition-colors"
              title="详情"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-3 shrink-0">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className={cn("text-[11px] h-5 px-2 font-normal", meta.color, meta.border)}>
            {meta.label}
          </Badge>
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[11px] h-5 px-2 font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex-1 px-6 py-1 overflow-y-auto min-h-0">
        <div className="space-y-4">
          {!isBlank && (displayHeadline || displaySubtitle || displaySellingPoints.length > 0 || filteredCopyBlocks.length > 0) && (
            <div>
              {displayHeadline && (
                <div className="mb-3">
                  <div className="text-[14px] font-normal text-[#72808a] mb-1">标题</div>
                  <p className="text-[14px] font-normal text-[#0f1419] leading-snug">{displayHeadline}</p>
                </div>
              )}

              {displaySubtitle && (
                <div className="mb-3">
                  <div className="text-[14px] font-normal text-[#72808a] mb-1">副标题</div>
                  <p className="text-[14px] font-normal text-[#0f1419] leading-snug">{displaySubtitle}</p>
                </div>
              )}

              {displaySellingPoints.length > 0 && (
                <div className="mb-3">
                  <div className="text-[14px] font-normal text-[#72808a] mb-1">卖点</div>
                  <ul className="space-y-2">
                    {displaySellingPoints.map((sp, i) => (
                      <li key={i} className="text-[14px] font-normal text-[#0f1419] leading-snug flex gap-1.5">
                        <span className="shrink-0 mt-[5px] w-1 h-1 rounded-full bg-[#72808a]" />
                        <span>{sp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {filteredCopyBlocks.length > 0 && (
                <div className="space-y-3">
                  {(() => {
                    const groups = new Map<string, typeof filteredCopyBlocks>();
                    filteredCopyBlocks.forEach((block) => {
                      const list = groups.get(block.role) || [];
                      list.push(block);
                      groups.set(block.role, list);
                    });
                    return Array.from(groups.entries()).map(([role, blocks]) => (
                      <div key={role}>
                        <div className="text-[14px] font-normal text-[#72808a] mb-1">{ROLE_LABELS[role] || role}</div>
                        {blocks.length === 1 ? (
                          <p className="text-[14px] font-normal text-[#0f1419] leading-snug">{blocks[0].title}</p>
                        ) : (
                          <ul className="space-y-2">
                            {blocks.map((block) => (
                              <li key={block.id} className="text-[14px] font-normal text-[#0f1419] leading-snug flex gap-1.5">
                                <span className="shrink-0 mt-[5px] w-1 h-1 rounded-full bg-[#72808a]" />
                                <span>{block.title}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}

          {!isBlank && plan.visualPresentation && (
            <div className="pt-1">
              <div className="text-[14px] font-normal text-[#72808a] mb-2">风格</div>
              <p className="text-[14px] font-normal text-[#0f1419] leading-snug">{plan.visualPresentation}</p>
            </div>
          )}

          {isBlank && (
            <div className="pt-1">
              <div className="text-[14px] font-normal text-[#72808a] mb-2">空白模板</div>
              <p className="text-[14px] font-normal text-[#0f1419] leading-snug">
                此方案使用空白模板，不注入任何系统方向。生成指令完全由用户配置决定。
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========== 按钮区 ========== */}
      <div className={cn("px-6 py-4 shrink-0 flex gap-2.5", hasGeneratedImage || isGenerating ? "flex-row" : "flex-col")}>
        {isGenerating && (
          <Button
            variant="outline"
            onClick={() => onViewImage(plan)}
            className="h-10 flex-[3] border-amber-200 text-amber-600 bg-amber-50/50 text-sm font-semibold cursor-pointer"
          >
            <Sparkles className="w-4 h-4 mr-1.5 animate-pulse" />生成中
          </Button>
        )}
        {hasGeneratedImage && !isGenerating && (
          <Button
            variant="outline"
            onClick={() => onViewImage(plan)}
            className="h-10 flex-[3] border-gray-300 text-[#0f1419] hover:bg-gray-50 text-sm font-semibold"
          >
            <Eye className="w-4 h-4 mr-1.5" />查看图片
          </Button>
        )}
        <Button
          onClick={() => onGenerateImage(plan)}
          disabled={isGenerating}
          className={cn(
            "bg-bbg hover:bg-bbg-hover text-[#0f1419] border-0 shadow-sm text-sm font-semibold",
            hasGeneratedImage || isGenerating ? "h-10 flex-[2]" : "w-full h-10",
            isGenerating && "opacity-50 cursor-not-allowed"
          )}
        >
          <Wand2 className="w-4 h-4 mr-1.5" />
          {hasGeneratedImage ? "重新生成" : "生成图片"}
        </Button>
      </div>
    </div>
  );
}
