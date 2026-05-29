"use client";

export function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-4 h-4 rounded border border-gray-200 shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-[10px] text-gray-500">{label}</span>
    </div>
  );
}
