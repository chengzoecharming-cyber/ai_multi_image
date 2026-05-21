"use client";

import Link from "next/link";
import { Sparkles, ArrowLeft, BookOpen, Images } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function V2Header({ onOpenTemplateLibrary, onOpenImageGallery }: { onOpenTemplateLibrary: () => void; onOpenImageGallery?: () => void }) {
  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-semibold text-gray-800">AI 制图工作台</span>
        <Badge variant="secondary" className="text-xs font-medium bg-indigo-50 text-indigo-600 border-indigo-100">V2 任务式</Badge>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenImageGallery}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <Images className="w-4 h-4" />图片库
        </button>
        <button
          onClick={onOpenTemplateLibrary}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          <BookOpen className="w-4 h-4" />方案模板库
        </button>
        <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4" />返回首页
        </Link>
      </div>
    </header>
  );
}
