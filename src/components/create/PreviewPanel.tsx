"use client";

import { useState, useRef } from "react";
import {
  RotateCcw,
  Wand2,
  Loader2,
  Trash2,
  Info,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ImageTask, ReferenceImage } from "@/lib/types";
import ImagePreviewModal from "./ImagePreviewModal";

interface PreviewPanelProps {
  references: ReferenceImage[];
  latestTask: ImageTask | null;
  taskHistory: ImageTask[];
  isGenerating: boolean;
  showHistory: boolean;
  onRetry?: () => void;
  onDownload?: () => void;
  onClearReferences?: () => void;
  onSelectTask?: (task: ImageTask) => void;
  onCloseHistory?: () => void;
  onOpenHistory?: () => void;
  onUploadFile?: (files: FileList) => void;
}

function parseResultImages(resultImageUrl?: string): string[] {
  if (!resultImageUrl) return [];
  try {
    const parsed = JSON.parse(resultImageUrl);
    if (Array.isArray(parsed)) return parsed;
    return [resultImageUrl];
  } catch {
    return [resultImageUrl];
  }
}

function formatTaskTime(iso?: string): string {
  if (!iso) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function TaskGroupView({
  isLoading,
  imageUrls,
  task,
  onRetry,
  onSelectTask,
  onImageClick,
  showPrompt = true,
}: {
  isLoading: boolean;
  imageUrls: string[];
  task: ImageTask | null;
  onRetry?: () => void;
  onSelectTask?: (task: ImageTask) => void;
  onImageClick?: (url: string) => void;
  showPrompt?: boolean;
}) {
  const displayItems = isLoading ? [0, 1, 2, 3] : imageUrls.slice(0, 4);
  const taskId = task?.id?.slice(0, 6) || "1x8f6a";
  const timeStr = formatTaskTime(task?.createdAt);
  const promptText = task?.promptSnapshot || "";

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[14px] font-semibold text-gray-800">
            智能推荐(本次免费生成)
          </span>
          <Info className="w-4 h-4 text-gray-400" />
        </div>
        <button
          onClick={onRetry}
          className="flex items-center gap-1 text-[13px] text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          刷新
        </button>
      </div>

      {/* Time + ID */}
      <div className="text-[12px] text-gray-400 mb-3">
        {timeStr} | {taskId}
      </div>

      {/* Prompt text */}
      {showPrompt && promptText && (
        <div className="text-[12px] text-gray-500 mb-3 line-clamp-2">
          {promptText}
        </div>
      )}

      {/* Images row */}
      <div className="flex items-center gap-3">
        {displayItems.map((item, i) => (
          <div
            key={i}
            className="w-[160px] h-[160px] rounded-lg overflow-hidden bg-gray-200 relative shrink-0"
          >
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 gap-2">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <span className="text-[12px] text-gray-500">loading</span>
              </div>
            ) : (
              <img
                src={item as string}
                alt=""
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => onImageClick?.(item as string)}
              />
            )}
          </div>
        ))}
      </div>

    </div>
  );
}

export default function PreviewPanel({
  references,
  latestTask,
  taskHistory,
  isGenerating,
  showHistory,
  onRetry,
  onDownload,
  onClearReferences,
  onSelectTask,
  onCloseHistory,
  onOpenHistory,
  onUploadFile,
}: PreviewPanelProps) {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter and sort completed tasks for the feed
  const completedTasks = taskHistory
    .filter((t) => t.status === "completed" && t.resultImageUrl)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const hasGenerating = isGenerating;
  const hasFeed = hasGenerating || completedTasks.length > 0;

  const handleDownloadSingle = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-image-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  // Feed view: stack of task groups (Midjourney style)
  // Always show during generation; otherwise only when showHistory is true
  if (hasGenerating || showHistory) {
    return (
      <>
        <div id="history-feed-start" className="flex flex-col">
          {/* History header — only when manually showing history */}
          {showHistory && !hasGenerating && (
            <div className="px-6 pt-6">
              {/* Title row */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[14px] font-semibold text-gray-800">
                  历史生成记录
                </h2>
                <button
                  onClick={onCloseHistory}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-sm text-gray-600 hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  <X className="w-3.5 h-3.5" />
                  关闭
                </button>
              </div>

              {/* Filter bar */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="搜索..."
                      className="h-9 w-40 px-3 pr-8 text-[13px] bg-white border border-gray-200 rounded-lg outline-none placeholder:text-gray-400 focus:border-indigo-300"
                    />
                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <button className="h-9 px-3 text-[13px] text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    批量操作
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="h-9 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-600"
                  />
                  <span className="text-gray-400 text-[12px]">至</span>
                  <input
                    type="date"
                    className="h-9 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-600"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 px-6">
            {/* Generating group at top */}
            {hasGenerating && (
              <TaskGroupView
                  isLoading={true}
                  imageUrls={[]}
                  task={latestTask}
                  onRetry={onRetry}
                  showPrompt={false}
                />
            )}

            {/* Completed task groups */}
            {completedTasks.map((task) => {
              const urls = parseResultImages(task.resultImageUrl);
              return (
                <TaskGroupView
                    key={task.id}
                    isLoading={false}
                    imageUrls={urls}
                    task={task}
                    onRetry={onRetry}
                    onSelectTask={onSelectTask}
                    onImageClick={setSelectedImageUrl}
                  />
              );
            })}
          </div>
        </div>

        {/* Image preview modal */}
        {selectedImageUrl && (
          <ImagePreviewModal
            imageUrl={selectedImageUrl}
            onClose={() => setSelectedImageUrl(null)}
            onDownload={() => handleDownloadSingle(selectedImageUrl)}
          />
        )}
      </>
    );
  }

  // Failed state (single task, no feed yet) — only if showing history and not generating
  if (!isGenerating && showHistory && latestTask?.status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="w-full max-w-3xl rounded-3xl bg-white border border-gray-100 flex flex-col items-center justify-center py-16">
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
        <div className="relative w-full max-w-3xl rounded-3xl overflow-hidden bg-white border border-gray-100">
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
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onUploadFile?.(e.target.files);
          }
          if (fileInputRef.current) fileInputRef.current.value = "";
        }}
      />
      <div className="flex flex-col items-center justify-center h-full px-6">
        {/* Title outside card, 24px above */}
        <p className="text-[18px] font-semibold text-gray-800 mb-6">
          上传图片 开始制作
        </p>

        {/* Main upload container — no shadow, light gray border */}
        <div className="w-full max-w-3xl rounded-3xl bg-white border border-gray-100 flex flex-col items-center">
          {/* Top section — main upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center pt-10 pb-8 transition-colors group cursor-grab"
          >
            <img src="/icons/upload.svg" alt="" className="w-[52px] h-[52px]" />
            <p className="text-[14px] text-black font-medium mt-1 group-hover:text-indigo-600 transition-colors">
              点击/拖拽/粘贴上传图片
            </p>
          </button>

          {/* Bottom section — two entry cards side by side */}
          <div className="w-full flex items-stretch px-6 pb-6 gap-5">
            <button className="flex-1 flex flex-col items-center justify-center gap-1 px-8 py-6 text-[14px] text-black font-medium transition-colors rounded-2xl border border-gray-200 group">
              <img src="/icons/material.svg" alt="" className="w-[52px] h-[52px]" />
              <span className="group-hover:text-indigo-600 transition-colors">从素材库选取</span>
            </button>
            <button
              onClick={onOpenHistory}
              className="flex-1 flex flex-col items-center justify-center gap-1 px-8 py-6 text-[14px] text-black font-medium transition-colors rounded-2xl border border-gray-200 group"
            >
              <img src="/icons/history.svg" alt="" className="w-[52px] h-[52px]" />
              <span className="group-hover:text-indigo-600 transition-colors">从历史记录添加</span>
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
                className="shrink-0 w-20 h-20 rounded-xl bg-white border border-gray-100 overflow-hidden"
              >
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <img src="/icons/upload.svg" alt="" className="w-6 h-6 opacity-30" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Image preview modal */}
      {selectedImageUrl && (
        <ImagePreviewModal
          imageUrl={selectedImageUrl}
          onClose={() => setSelectedImageUrl(null)}
          onDownload={() => handleDownloadSingle(selectedImageUrl)}
        />
      )}
    </>
  );
}
