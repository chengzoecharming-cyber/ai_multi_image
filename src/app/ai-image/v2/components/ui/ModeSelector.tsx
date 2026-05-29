"use client";

import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import type { GenerationMode } from "../../types";

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
