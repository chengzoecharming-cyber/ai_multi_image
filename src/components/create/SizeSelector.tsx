"use client";

import { cn } from "@/lib/utils";
import { SIZE_OPTIONS } from "@/lib/prompt/rules";
import { Settings2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface SizeSelectorProps {
  value: string;
  width?: number;
  height?: number;
  onChange: (value: string, width: number, height: number) => void;
}

const MAIN_SIZE_OPTIONS = SIZE_OPTIONS.filter((o) =>
  ["1:1", "3:4", "2:3"].includes(o.value)
);

export default function SizeSelector({ value, width, height, onChange }: SizeSelectorProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customW, setCustomW] = useState(width || 1024);
  const [customH, setCustomH] = useState(height || 1024);

  const isCustom = value === "custom";

  const handleSelect = (v: string) => {
    if (v === "custom") {
      setCustomOpen(true);
      onChange("custom", customW, customH);
    } else {
      setCustomOpen(false);
      const opt = SIZE_OPTIONS.find((o) => o.value === v);
      if (opt) {
        onChange(v, opt.width, opt.height);
      }
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        {MAIN_SIZE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-[4px] text-[12px] font-medium transition-colors border-0",
              value === opt.value
                ? "bg-indigo-50 text-indigo-600"
                : "bg-transparent text-gray-600 hover:bg-gray-50"
            )}
          >
            <span className={cn(
              "w-3.5 h-3.5 rounded-[2px] shrink-0",
              value === opt.value ? "bg-indigo-500/20" : "bg-gray-300/40"
            )} />
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => handleSelect("custom")}
          className={cn(
            "flex items-center gap-1 px-3 py-2 rounded-[4px] text-[12px] font-medium transition-colors border-0",
            isCustom
              ? "bg-indigo-50 text-indigo-600"
              : "bg-transparent text-gray-600 hover:bg-gray-50"
          )}
        >
          <Settings2 className="w-3 h-3" />
          自定义
        </button>
      </div>

      {isCustom && (
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-gray-500">宽</span>
            <Input
              type="number"
              value={customW}
              onChange={(e) => {
                const w = parseInt(e.target.value) || 1024;
                setCustomW(w);
                onChange("custom", w, customH);
              }}
              className="h-8 w-20 text-[12px] bg-[#F5F6F8] border-0 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <span className="text-[12px] text-gray-400">×</span>
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-gray-500">高</span>
            <Input
              type="number"
              value={customH}
              onChange={(e) => {
                const h = parseInt(e.target.value) || 1024;
                setCustomH(h);
                onChange("custom", customW, h);
              }}
              className="h-8 w-20 text-[12px] bg-[#F5F6F8] border-0 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
