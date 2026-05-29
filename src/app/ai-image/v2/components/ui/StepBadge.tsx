"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-semibold",
        done ? "bg-green-500 text-white" : active ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-500"
      )}
    >
      {done ? <Check className="w-3 h-3" /> : n}
    </div>
  );
}
