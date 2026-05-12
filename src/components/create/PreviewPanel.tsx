"use client";

import {
  ImageIcon,
  Download,
  RotateCcw,
  Wand2,
  Loader2,
  Trash2,
  History,
  FolderOpen,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ImageTask, ReferenceImage } from "@/lib/types";

interface PreviewPanelProps {
  references: ReferenceImage[];
  latestTask: ImageTask | null;
  isGenerating: boolean;
  onRetry?: () => void;
  onDownload?: () => void;
  onClearReferences?: () => void;
}

function CircularProgress({ percent }: { percent: number }) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative w-12 h-12">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="24"
          cy="24"
          r={r}
          stroke="#E5E7EB"
          strokeWidth="3"
          fill="none"
        />
        <circle
          cx="24"
          cy="24"
          r={r}
          stroke="#6366F1"
          strokeWidth="3"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-medium text-indigo-600">
        {percent}%
      </span>
    </div>
  );
}

export default function PreviewPanel({
  references,
  latestTask,
  isGenerating,
  onRetry,
  onDownload,
  onClearReferences,
}: PreviewPanelProps) {
  // Generating state — show progress cards
  if (isGenerating) {
    return (
      <div className="flex flex-col h-full px-6 pt-4">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-5">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            <History className="w-3.5 h-3.5" />
            历史记录
          </button>
        </div>

        {/* Generating cards */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              { id: "1x8f6a", percent: 14 },
              { id: "2b3c9d", percent: 8 },
              { id: "4e5f7a", percent: 3 },
              { id: "8g9h0i", percent: 1 },
            ].map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-white p-4 shadow-sm flex flex-col"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[12px] text-gray-600">智能推荐</span>
                  <span className="text-[12px] text-gray-400">| {item.id}</span>
                </div>
                <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center mb-3">
                  <CircularProgress percent={item.percent} />
                </div>
                <p className="text-[12px] text-gray-500 text-center">
                  努力生成中
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Result state
  if (latestTask?.status === "completed" && latestTask.resultImageUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="relative w-full max-w-3xl rounded-3xl overflow-hidden bg-white shadow-sm">
          <img
            src={latestTask.resultImageUrl}
            alt="生成结果"
            className="w-full h-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-2 mt-5">
          <Button
            size="sm"
            variant="ghost"
            onClick={onDownload}
            className="h-9 px-4 text-[13px] text-gray-600 hover:bg-gray-100 hover:text-gray-800"
          >
            <Download className="w-4 h-4 mr-1.5" />
            下载图片
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRetry}
            className="h-9 px-4 text-[13px] text-gray-600 hover:bg-gray-100 hover:text-gray-800"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            重新生成
          </Button>
        </div>
      </div>
    );
  }

  // Failed state
  if (latestTask?.status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="w-full max-w-3xl rounded-3xl bg-white shadow-sm flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <Wand2 className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-[15px] font-medium text-gray-700">生成失败</p>
          <p className="text-[13px] text-gray-400 mt-1 max-w-[240px] text-center">
            {latestTask.errorMessage || "请检查配置后重试"}
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={onRetry}
            className="mt-5 h-9 px-4 text-[13px] text-gray-600 hover:bg-gray-100 hover:text-gray-800"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            重新生成
          </Button>
        </div>
      </div>
    );
  }

  // Reference preview state (has uploaded images but not generated yet)
  if (references.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="relative w-full max-w-3xl rounded-3xl overflow-hidden bg-white shadow-sm">
          <img
            src={references[0].imageUrl}
            alt="参考图"
            className="w-full h-auto object-contain max-h-[60vh]"
          />
        </div>
        {references.length > 1 && (
          <div className="flex items-center gap-2 mt-4">
            {references.map((ref, i) => (
              <div
                key={i}
                className={cn(
                  "w-14 h-14 rounded-xl overflow-hidden cursor-pointer",
                  i === 0 ? "ring-2 ring-indigo-300" : "ring-1 ring-gray-200"
                )}
              >
                <img
                  src={ref.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
        {onClearReferences && (
          <button
            onClick={onClearReferences}
            className="flex items-center gap-1 mt-4 text-[13px] text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            清空参考图
          </button>
        )}
      </div>
    );
  }

  // Empty state — default upload area
  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      {/* Main upload container */}
      <div className="w-full max-w-3xl rounded-3xl bg-white shadow-sm flex flex-col items-center">
        {/* Top section — main upload */}
        <div className="w-full flex flex-col items-center justify-center py-12 border-b border-gray-50">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
            <ImageIcon className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-[18px] font-semibold text-gray-800 mb-1">
            上传图片 开始制作
          </p>
          <p className="text-[14px] text-gray-400">
            点击/拖拽/粘贴上传图片
          </p>
        </div>

        {/* Bottom section — entry cards */}
        <div className="w-full flex items-center justify-center gap-0 py-6">
          <button className="flex items-center gap-2 px-8 py-3 text-[14px] text-gray-600 hover:bg-gray-50 transition-colors rounded-xl">
            <FolderOpen className="w-5 h-5 text-gray-400" />
            从素材库选择
          </button>
          <div className="w-px h-6 bg-gray-100" />
          <button className="flex items-center gap-2 px-8 py-3 text-[14px] text-gray-600 hover:bg-gray-50 transition-colors rounded-xl">
            <History className="w-5 h-5 text-gray-400" />
            从历史记录添加
          </button>
        </div>
      </div>

      {/* Sample products */}
      <div className="w-full max-w-3xl mt-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[14px] font-bold text-gray-800">示例商品</span>
          <button className="flex items-center gap-1 text-[12px] text-gray-500 hover:text-gray-700 transition-colors">
            换一换
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="shrink-0 w-20 h-20 rounded-xl bg-white shadow-sm overflow-hidden"
            >
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-300" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
