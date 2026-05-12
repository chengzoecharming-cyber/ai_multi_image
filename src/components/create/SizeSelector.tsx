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
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
              value === opt.value
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => handleSelect("custom")}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
            isCustom
              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          <Settings2 className="w-3 h-3" />
          自定义
        </button>
      </div>

      {isCustom && (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">宽</span>
            <Input
              type="number"
              value={customW}
              onChange={(e) => {
                const w = parseInt(e.target.value) || 1024;
                setCustomW(w);
                onChange("custom", w, customH);
              }}
              className="h-7 w-20 text-xs bg-white border-gray-200"
            />
          </div>
          <span className="text-xs text-gray-400">×</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">高</span>
            <Input
              type="number"
              value={customH}
              onChange={(e) => {
                const h = parseInt(e.target.value) || 1024;
                setCustomH(h);
                onChange("custom", customW, h);
              }}
              className="h-7 w-20 text-xs bg-white border-gray-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}
