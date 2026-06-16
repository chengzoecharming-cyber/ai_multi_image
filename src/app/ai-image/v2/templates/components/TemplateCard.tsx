"use client";

import type { PlanTemplate } from "@/lib/plan-templates/types";
import { getTemplateThumbnail } from "./template-thumbnails";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
  template: PlanTemplate;
  onOpen: () => void;
  onUse: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

import { BBG, P0, P2 } from "../../design-tokens";

export function TemplateCard({ template, onOpen, onUse }: TemplateCardProps) {
  const thumbnail = getTemplateThumbnail(template.id);
  const Icon = thumbnail.icon;

  return (
    <div className="w-[280px] mx-auto flex flex-col transition-all duration-200">
      {/* Cover - opens detail */}
      <button
        type="button"
        className="block text-left"
        onClick={onOpen}
      >
        <div className="relative flex items-center justify-center w-[280px] h-[280px] rounded-[12px] overflow-hidden bg-[rgb(248,249,250)]">
          <Icon className={cn("w-7 h-7", thumbnail.iconColor)} />
        </div>
      </button>

      {/* Content - opens detail */}
      <button
        type="button"
        className="block text-left mt-3"
        onClick={onOpen}
      >
        <h2 className="text-sm font-medium" style={{ color: "#08829B" }}>
          {template.name}
        </h2>
        <p className="mt-1 text-xs text-[#72808a] truncate">
          {template.description}
        </p>
      </button>

      {/* Button */}
      <button
        type="button"
        onClick={onUse}
        className="mt-2 h-10 w-full rounded-lg text-sm font-medium transition-colors hover:opacity-90"
        style={{ backgroundColor: BBG, color: P0 }}
      >
        使用模版
      </button>
    </div>
  );
}
