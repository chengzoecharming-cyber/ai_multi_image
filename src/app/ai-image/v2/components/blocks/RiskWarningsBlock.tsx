"use client";

import { AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";

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
