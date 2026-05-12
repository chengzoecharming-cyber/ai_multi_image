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
        <div className="w-[720px] max-w-[90%] aspect-square max-h-[60vh] rounded-3xl bg-white shadow-sm flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-[15px] font-medium text-gray-700">生成中...</p>
          <p className="text-[13px] text-gray-400 mt-1">AI 正在创作您的商品图</p>
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
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-[720px] max-w-[90%] aspect-square max-h-[60vh] rounded-3xl bg-white shadow-sm flex flex-col items-center justify-center">
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

  // Empty state
  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Banner placeholder */}
      <div className="w-[720px] max-w-[90%] h-[120px] rounded-2xl bg-gradient-to-r from-indigo-100/60 to-purple-100/60 mb-8 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-indigo-600">轻松上手</span>
          <span className="text-sm text-gray-500">看看让商品图更出彩的秘诀！</span>
        </div>
      </div>

      {/* Main upload area */}
      <div className="w-[720px] max-w-[90%] h-[400px] rounded-3xl bg-white shadow-sm flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-indigo-400" />
        </div>
        <p className="text-xl font-semibold text-gray-700 mb-1">上传图片开始制作吧</p>
        <p className="text-[13px] text-gray-400 text-center max-w-[300px]">
          点击/拖拽/粘贴上传图片
        </p>
        <div className="flex items-center gap-3 mt-6">
          <button className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-[#F8F9FB] hover:bg-gray-100 transition-colors min-w-[140px]">
            <ImageIcon className="w-6 h-6 text-indigo-400" />
            <span className="text-[13px] text-gray-600">从素材库选择</span>
          </button>
          <button className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-[#F8F9FB] hover:bg-gray-100 transition-colors min-w-[140px]">
            <RotateCcw className="w-6 h-6 text-indigo-400" />
            <span className="text-[13px] text-gray-600">从历史记录添加</span>
          </button>
          <button className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-[#F8F9FB] hover:bg-gray-100 transition-colors min-w-[140px]">
            <Wand2 className="w-6 h-6 text-indigo-400" />
            <span className="text-[13px] text-gray-600">我的商品</span>
          </button>
        </div>
      </div>

      {/* Sample products */}
      <div className="w-[720px] max-w-[90%] mt-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] font-semibold text-gray-800">示例商品</span>
          <button className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-700 transition-colors">
            换一换
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="shrink-0 w-20 h-20 rounded-xl bg-white shadow-sm overflow-hidden">
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
