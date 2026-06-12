"use client";

import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanTemplate } from "@/lib/plan-templates/types";
import { getTemplateThumbnail } from "./template-thumbnails";
import { cn } from "@/lib/utils";

interface TemplateCardProps {
  template: PlanTemplate;
  onOpen: () => void;
  onUse: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function TemplateCard({ template, onOpen, onUse }: TemplateCardProps) {
  const thumbnail = getTemplateThumbnail(template.id);
  const Icon = thumbnail.icon;

  return (
    <div className="group overflow-hidden rounded-xl border border-stone-200 bg-white transition-all duration-200 hover:border-stone-300 hover:shadow-md">
      {/* Cover - opens detail */}
      <button
        type="button"
        className="block w-full text-left"
        onClick={onOpen}
      >
        <div
          className={cn(
            "relative flex items-center justify-center aspect-[4/3] bg-gradient-to-br",
            thumbnail.gradient
          )}
        >
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/80 shadow-sm">
            <Icon className={cn("w-7 h-7", thumbnail.iconColor)} />
          </div>
        </div>
      </button>

      {/* Content - opens detail */}
      <button
        type="button"
        className="block w-full text-left"
        onClick={onOpen}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="line-clamp-1 text-sm font-semibold text-[#0f1419]">
              {template.name}
            </h2>
            {template.updatedAt && (
              <span className="shrink-0 text-xs text-stone-400">
                {formatDate(template.updatedAt)}
              </span>
            )}
          </div>
          <p className="mt-2 line-clamp-3 text-xs leading-5 text-stone-600">
            {template.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {template.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 pb-4">
        <Button
          size="sm"
          className="h-8 bg-[#000012] text-xs text-white hover:bg-[#0f1419]"
          onClick={onUse}
        >
          <Wand2 className="mr-1 h-3.5 w-3.5" />
          使用此模版
        </Button>
      </div>
    </div>
  );
}
