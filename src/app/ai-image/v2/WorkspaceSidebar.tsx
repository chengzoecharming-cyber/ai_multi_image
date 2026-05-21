"use client";

import { Image as ImageLucide, Layers as LayersLucide } from "lucide-react";
import { cn } from "@/lib/utils";
import type { V2WorkspaceTab } from "./types";

export function WorkspaceSidebar({
  tab,
  onChange,
}: {
  tab: V2WorkspaceTab;
  onChange: (tab: V2WorkspaceTab) => void;
}) {
  const itemBase =
    "w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-colors";
  const active = "bg-indigo-50 text-indigo-700";
  const idle = "text-gray-600 hover:bg-gray-50 hover:text-gray-800";

  return (
    <aside className="w-[88px] h-full border-r border-gray-200 bg-white shrink-0">
      <div className="p-2 space-y-1">
        <button
          type="button"
          onClick={() => onChange("product")}
          className={cn(itemBase, tab === "product" ? active : idle, "justify-center flex-col")}
          title="商品图"
        >
          <ImageLucide className="w-5 h-5" />
          <span className="text-[11px] font-medium leading-tight">商品图</span>
        </button>

        <button
          type="button"
          onClick={() => onChange("detail")}
          className={cn(itemBase, tab === "detail" ? active : idle, "justify-center flex-col")}
          title="商详图"
        >
          <LayersLucide className="w-5 h-5" />
          <span className="text-[11px] font-medium leading-tight">商详图</span>
        </button>
      </div>
    </aside>
  );
}

