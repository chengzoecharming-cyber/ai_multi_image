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
      <div className="flex items-center gap-2 flex-wrap">
        {SIZE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors border-0",
              value === opt.value
                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-200"
                : "bg-[#F5F6F8] text-gray-600 hover:bg-gray-100"
            )}
          >
            <span className={cn(
              "w-4 h-4 rounded-[3px] shrink-0",
              value === opt.value ? "bg-indigo-500/20" : "bg-gray-300/40"
            )} />
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => handleSelect("custom")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-colors border-0",
            isCustom
              ? "bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-200"
              : "bg-[#F5F6F8] text-gray-600 hover:bg-gray-100"
          )}
        >
          <Settings2 className="w-3.5 h-3.5" />
          自定义
        </button>
      </div>

      {isCustom && (
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-gray-500">宽</span>
            <Input
              type="number"
              value={customW}
              onChange={(e) => {
                const w = parseInt(e.target.value) || 1024;
                setCustomW(w);
                onChange("custom", w, customH);
              }}
              className="h-9 w-24 text-[13px] bg-[#F5F6F8] border-0 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <span className="text-[13px] text-gray-400">×</span>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-gray-500">高</span>
            <Input
              type="number"
              value={customH}
              onChange={(e) => {
                const h = parseInt(e.target.value) || 1024;
                setCustomH(h);
                onChange("custom", customW, h);
              }}
              className="h-9 w-24 text-[13px] bg-[#F5F6F8] border-0 rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      )}
    </div>
  );
}
