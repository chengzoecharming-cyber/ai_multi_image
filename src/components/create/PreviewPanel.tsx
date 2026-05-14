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
  Download,
  PlusCircle,
  Square,
  SquareCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageTask, ReferenceImage } from "@/lib/types";
import ImagePreviewModal from "./ImagePreviewModal";
import { Button } from "@/components/ui/button";

interface PreviewPanelProps {
  references: ReferenceImage[];
  latestTask: ImageTask | null;
  generatingTasks: ImageTask[];
  taskHistory: ImageTask[];
  showHistory: boolean;
  onRetry?: () => void;
  onDownload?: () => void;
  onClearReferences?: () => void;
  onSelectTask?: (task: ImageTask) => void;
  onCloseHistory?: () => void;
  onOpenHistory?: () => void;
  onUploadFile?: (files: FileList) => void;
  onDeleteTask?: (taskId: string) => void;
  onRefreshTasks?: () => void;
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

async function downloadImage(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    // Fallback: direct link download
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/** Single image card component */
function ImageCard({
  task,
  isLoading,
  imageUrl,
  onRetry,
  onImageClick,
  onDeleteTask,
  batchMode,
  selected,
  onToggleSelect,
}: {
  task: ImageTask | null;
  isLoading: boolean;
  imageUrl?: string;
  onRetry?: () => void;
  onImageClick?: (url: string) => void;
  onDeleteTask?: (taskId: string) => void;
  batchMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const timeStr = formatTaskTime(task?.createdAt);
  const promptText = task?.promptSnapshot || "";
  const taskIdShort = task?.id?.slice(0, 6) || "";

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 overflow-hidden relative">
      {/* Batch select checkbox (top-left) */}
      {batchMode && task && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.();
          }}
          className="absolute top-3 left-3 z-10"
        >
          {selected ? (
            <SquareCheck className="w-5 h-5 text-indigo-600" />
          ) : (
            <Square className="w-5 h-5 text-gray-300 hover:text-gray-500" />
          )}
        </button>
      )}

      {/* Top-right action icons */}
      {!batchMode && task && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRetry?.();
            }}
            className="p-1 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-gray-50 transition-colors"
            title="刷新"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask?.(task.id);
            }}
            className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex gap-4">
        {/* Left: info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center pr-2">
          <div className="text-[14px] font-semibold text-gray-800 mb-1 truncate">
            智能推荐(本次免费生成)
          </div>
          <div className="text-[12px] text-gray-400 mb-2">
            {timeStr} | {taskIdShort}
          </div>
          {promptText && (
            <div className="text-[12px] text-gray-500 line-clamp-3 leading-relaxed">
              {promptText}
            </div>
          )}
        </div>

        {/* Right: image */}
        <div
          className={cn(
            "w-[160px] h-[160px] rounded-lg overflow-hidden bg-gray-100 shrink-0 relative",
            batchMode && selected && "ring-2 ring-indigo-400"
          )}
        >
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <span className="text-[12px] text-gray-500">loading</span>
            </div>
          ) : imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => onImageClick?.(imageUrl)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[12px] text-gray-400">暂无图片</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Batch action toolbar */
function BatchToolbar({
  selectedCount,
  onDownload,
  onAddToLibrary,
  onDelete,
  onCancel,
}: {
  selectedCount: number;
  onDownload: () => void;
  onAddToLibrary: () => void;
  onDelete: () => void;
  onCancel: () => void;
}) {
  const disabled = selectedCount === 0;

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-100">
      <div className="flex items-center gap-2 text-[13px] text-gray-600">
        <span>
          已选择 <span className="font-semibold text-indigo-600">{selectedCount}</span> 项
        </span>
        <button
          onClick={onCancel}
          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          取消
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onDownload}
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors border",
            disabled
              ? "text-gray-300 border-gray-100 cursor-not-allowed"
              : "text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-800"
          )}
        >
          <Download className="w-3.5 h-3.5" />
          下载
        </button>
        <button
          onClick={onAddToLibrary}
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors border",
            disabled
              ? "text-gray-300 border-gray-100 cursor-not-allowed"
              : "text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-800"
          )}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          添加至素材库
        </button>
        <button
          onClick={onDelete}
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] transition-colors border",
            disabled
              ? "text-gray-300 border-gray-100 cursor-not-allowed"
              : "text-red-500 border-red-100 hover:bg-red-50 hover:text-red-600"
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
          删除
        </button>
      </div>
    </div>
  );
}

/** Delete confirmation dialog - styled like SaveTemplateDialog */
function DeleteDialog({
  open,
  count,
  onClose,
  onConfirm,
}: {
  open: boolean;
  count: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-[400px] bg-white rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-[15px] font-semibold text-gray-800">确认删除</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <p className="text-[13px] text-gray-600 mb-6">
          确定要删除{count > 1 ? `选中的 ${count} 条` : "这条"}生成记录吗？此操作不可恢复。
        </p>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-9 px-4 text-[13px] rounded-xl"
          >
            取消
          </Button>
          <Button
            onClick={onConfirm}
            className="h-9 px-4 text-[13px] rounded-xl bg-red-500 hover:bg-red-600 text-white"
          >
            确认删除
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PreviewPanel({
  references,
  latestTask,
  generatingTasks,
  taskHistory,
  showHistory,
  onRetry,
  onDownload,
  onClearReferences,
  onSelectTask,
  onCloseHistory,
  onOpenHistory,
  onUploadFile,
  onDeleteTask,
  onRefreshTasks,
}: PreviewPanelProps) {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Batch mode state (only in history view)
  const [batchMode, setBatchMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  // Filter and sort result tasks for the feed
  const resultTasks = taskHistory
    .filter((t) => t.status === "completed" || t.status === "failed")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const hasGenerating = generatingTasks.length > 0;

  const handleDownloadSingle = (url: string) => {
    downloadImage(url, `ai-image-${Date.now()}.png`);
  };

  const toggleBatchMode = () => {
    if (batchMode) {
      setBatchMode(false);
      setSelectedTaskIds(new Set());
    } else {
      setBatchMode(true);
    }
  };

  const toggleSelectTask = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleBatchDownload = async () => {
    const selectedTasks = resultTasks.filter((t) => selectedTaskIds.has(t.id));
    for (const task of selectedTasks) {
      const urls = parseResultImages(task.resultImageUrl);
      for (let i = 0; i < urls.length; i++) {
        await downloadImage(urls[i], `ai-image-${task.id.slice(0, 8)}-${i + 1}.png`);
      }
    }
  };

  const handleBatchAddToLibrary = () => {
    // Placeholder: show toast for now
    // In real implementation, call API to add images to material library
    const { toast } = require("sonner");
    toast.success(`已将 ${selectedTaskIds.size} 张图片添加至素材库`);
  };

  const handleBatchDelete = () => {
    setPendingDeleteIds(Array.from(selectedTaskIds));
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    pendingDeleteIds.forEach((id) => {
      onDeleteTask?.(id);
    });
    setDeleteDialogOpen(false);
    setPendingDeleteIds([]);
    setSelectedTaskIds(new Set());
  };

  const handleSingleDelete = (taskId: string) => {
    setPendingDeleteIds([taskId]);
    setDeleteDialogOpen(true);
  };

  // Full history view
  if (showHistory) {
    return (
      <>
        <div id="history-feed-start" className="flex flex-col">
          {/* History header */}
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
                <button
                  onClick={toggleBatchMode}
                  className={cn(
                    "h-9 px-3 text-[13px] border rounded-lg transition-colors",
                    batchMode
                      ? "text-indigo-600 border-indigo-200 bg-indigo-50"
                      : "text-gray-600 bg-white border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {batchMode ? "退出批量" : "批量操作"}
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

          {/* Batch toolbar */}
          {batchMode && (
            <BatchToolbar
              selectedCount={selectedTaskIds.size}
              onDownload={handleBatchDownload}
              onAddToLibrary={handleBatchAddToLibrary}
              onDelete={handleBatchDelete}
              onCancel={() => {
                setBatchMode(false);
                setSelectedTaskIds(new Set());
              }}
            />
          )}

          <div className="flex flex-col gap-3 px-6 py-4">
            {/* Result task cards */}
            {resultTasks.map((task) => {
              const urls = parseResultImages(task.resultImageUrl);
              const firstUrl = urls[0];
              return (
                <ImageCard
                  key={task.id}
                  task={task}
                  isLoading={false}
                  imageUrl={firstUrl}
                  onRetry={onRetry}
                  onImageClick={setSelectedImageUrl}
                  onDeleteTask={handleSingleDelete}
                  batchMode={batchMode}
                  selected={selectedTaskIds.has(task.id)}
                  onToggleSelect={() => toggleSelectTask(task.id)}
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

        {/* Delete confirmation dialog */}
        <DeleteDialog
          open={deleteDialogOpen}
          count={pendingDeleteIds.length}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
        />
      </>
    );
  }

  // Generating / result list view
  if (hasGenerating || latestTask !== null) {
    return (
      <>
        <div className="flex flex-col gap-3 px-6 pt-6">
          {/* Generating cards at top */}
          {generatingTasks.map((task) => (
            <ImageCard
              key={task.id}
              task={task}
              isLoading={true}
            />
          ))}

          {/* Result task cards */}
          {resultTasks.map((task) => {
            const urls = parseResultImages(task.resultImageUrl);
            const firstUrl = urls[0];
            return (
              <ImageCard
                key={task.id}
                task={task}
                isLoading={false}
                imageUrl={firstUrl}
                onRetry={onRetry}
                onImageClick={setSelectedImageUrl}
                onDeleteTask={handleSingleDelete}
              />
            );
          })}
        </div>

        {/* Image preview modal */}
        {selectedImageUrl && (
          <ImagePreviewModal
            imageUrl={selectedImageUrl}
            onClose={() => setSelectedImageUrl(null)}
            onDownload={() => handleDownloadSingle(selectedImageUrl)}
          />
        )}

        {/* Delete confirmation dialog */}
        <DeleteDialog
          open={deleteDialogOpen}
          count={pendingDeleteIds.length}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
        />
      </>
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
