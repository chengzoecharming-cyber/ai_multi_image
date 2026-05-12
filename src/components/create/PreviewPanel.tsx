"use client";

import { ImageIcon, Download, RotateCcw, Wand2, Loader2, Trash2 } from "lucide-react";
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

export default function PreviewPanel({
  references,
  latestTask,
  isGenerating,
  onRetry,
  onDownload,
  onClearReferences,
}: PreviewPanelProps) {
  // Generating state
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-80 h-80 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-gray-700">生成中...</p>
          <p className="text-xs text-gray-400 mt-1">AI 正在创作您的商品图</p>
        </div>
      </div>
    );
  }

  // Result state
  if (latestTask?.status === "completed" && latestTask.resultImageUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="relative w-full max-w-xl rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
          <img
            src={latestTask.resultImageUrl}
            alt="生成结果"
            className="w-full h-auto object-contain"
          />
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onDownload}
            className="h-8 px-3 text-xs border-gray-300"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            下载图片
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="h-8 px-3 text-xs border-gray-300"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            重新生成
          </Button>
        </div>
      </div>
    );
  }

  // Failed state
  if (latestTask?.status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-80 h-80 rounded-2xl bg-white border border-red-100 shadow-sm flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
            <Wand2 className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">生成失败</p>
          <p className="text-xs text-gray-400 mt-1 max-w-[200px] text-center">
            {latestTask.errorMessage || "请检查配置后重试"}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="mt-4 h-8 px-3 text-xs border-gray-300"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
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
        <div className="relative w-full max-w-xl rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
          <img
            src={references[0].imageUrl}
            alt="参考图"
            className="w-full h-auto object-contain max-h-[60vh]"
          />
        </div>
        {references.length > 1 && (
          <div className="flex items-center gap-2 mt-3">
            {references.map((ref, i) => (
              <div
                key={i}
                className={cn(
                  "w-12 h-12 rounded-lg border-2 overflow-hidden cursor-pointer",
                  i === 0 ? "border-indigo-300" : "border-gray-200"
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
            className="flex items-center gap-1 mt-3 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            清空参考图
          </button>
        )}
      </div>
    );
  }

  // Empty state
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-80 h-80 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-700">上传图片开始制作吧</p>
        <p className="text-xs text-gray-400 mt-1 text-center max-w-[220px]">
          上传产品参考图后，填写创意描述即可生成商品图
        </p>
      </div>
    </div>
  );
}
