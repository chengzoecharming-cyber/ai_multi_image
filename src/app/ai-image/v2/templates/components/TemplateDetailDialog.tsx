"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PlanTemplate } from "@/lib/plan-templates/types";
import { getTemplateThumbnail } from "./template-thumbnails";
import { Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateDetailDialogProps {
  open: boolean;
  template: PlanTemplate | null;
  onClose: () => void;
  onUseTemplate: (template: PlanTemplate) => void;
}

export function TemplateDetailDialog({
  open,
  template,
  onClose,
  onUseTemplate,
}: TemplateDetailDialogProps) {
  if (!template) return null;

  const thumbnail = getTemplateThumbnail(template.id);
  const Icon = thumbnail.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Thumbnail */}
        <div
          className={cn(
            "relative flex items-center justify-center h-48 bg-gradient-to-br",
            thumbnail.gradient
          )}
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/80 shadow-sm">
            <Icon className={cn("w-8 h-8", thumbnail.iconColor)} />
          </div>
        </div>

        <div className="px-6 pb-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-semibold text-stone-900">
              {template.name}
            </DialogTitle>
          </DialogHeader>

          {/* Description */}
          <p className="text-sm text-stone-600 leading-relaxed mb-4">
            {template.description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {template.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs font-normal bg-stone-100 text-stone-600 hover:bg-stone-200"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-3 mb-5 text-xs text-stone-500">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400">来源：</span>
              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                {template.scope === "system" ? "系统预置" : "我的模板"}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-stone-400">类型：</span>
              <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                {template.category === "image_set" ? "组图" : "单图"}
              </Badge>
            </div>
          </div>

          {/* Action */}
          <Button
            onClick={() => {
              onUseTemplate(template);
              onClose();
            }}
            className="w-full h-10 bg-[#000012] hover:bg-[#0f1419] text-white"
          >
            <Wand2 className="w-4 h-4 mr-1.5" />
            使用此模版
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
