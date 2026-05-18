"use client";

import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import {
  RotateCcw,
  Loader2,
  Trash2,
  Search,
  X,
  Download,
  MoreVertical,
  Info,
  Play,
  Heart,
  CheckSquare,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImageTask, PromptGroupConfig } from "@/lib/types";
import ImagePreviewModal from "./ImagePreviewModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PreviewPanelProps {
  productImageUrl: string | null;
  styleReferenceUrls: string[];
  latestTask: ImageTask | null;
  generatingTasks: ImageTask[];
  taskHistory: ImageTask[];
  showHistory: boolean;
  onRetry?: () => void;
  onDownload?: () => void;
  onRemoveProductImage?: () => void;
  onRemoveStyleReference?: (index: number) => void;
  onSelectTask?: (task: ImageTask) => void;
  onCloseHistory?: () => void;
  onOpenHistory?: () => void;
  onUploadFile?: (files: FileList) => void;
  onDeleteTask?: (taskId: string) => void;
  onRefreshTasks?: () => void;
  onLoadTaskConfig?: (task: ImageTask) => void;
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

function formatTaskDate(iso?: string): string {
  if (!iso) return "今天";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "今天";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "昨天";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isToday(iso?: string): boolean {
  if (!iso) return true;
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
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
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

function parseConfigSnapshot(
  config: PromptGroupConfig | string | undefined
): PromptGroupConfig | null {
  if (!config) return null;
  if (typeof config === "object") return config;
  try {
    return JSON.parse(config) as PromptGroupConfig;
  } catch {
    return null;
  }
}

function reorderForMasonry<T>(items: T[], columnCount: number): T[] {
  const total = items.length;
  if (total === 0 || columnCount <= 0) return items;
  const cols: T[][] = Array.from({ length: columnCount }, () => []);
  let colIdx = 0;
  for (const item of items) {
    cols[colIdx].push(item);
    colIdx = (colIdx + 1) % columnCount;
  }
  return cols.flat();
}

function getTaskAspectRatio(task: ImageTask): string {
  const config = parseConfigSnapshot(task.configSnapshot);
  if (config?.ratio) {
    const [w, h] = config.ratio.split(":").map(Number);
    if (w && h) return `${w}/${h}`;
  }
  return "1/1";
}

/* ─── Shared hover overlay + dropdown ─────────────────────────────── */

function ImageActions({
  task,
  imageUrl,
  onImageClick,
  onDownload,
  onUse,
  onDelete,
  onShowDetail,
}: {
  task: ImageTask;
  imageUrl: string;
  onImageClick?: (url: string, task: ImageTask) => void;
  onDownload?: (url: string) => void;
  onUse?: (task: ImageTask) => void;
  onDelete?: (taskId: string) => void;
  onShowDetail?: (task: ImageTask) => void;
}) {
  return (
    <>
      {/* Bottom hover action bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload?.(imageUrl);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-gray-800 text-[12px] font-medium rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            下载
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUse?.(task);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/90 hover:bg-indigo-500 text-white text-[12px] font-medium rounded-lg transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            使用
          </button>
        </div>
      </div>

      {/* Top-right more dropdown */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="w-7 h-7 flex items-center justify-center bg-white/80 hover:bg-white rounded-lg backdrop-blur-sm transition-colors cursor-pointer">
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={4}>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onShowDetail?.(task);
              }}
            >
              <Info className="w-4 h-4 mr-2" />
              详情
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(task.id);
              }}
              variant="destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                const { toast } = require("sonner");
                toast.success("已添加到素材库");
              }}
            >
              <Heart className="w-4 h-4 mr-2" />
              添加到素材库
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

/* ─── Masonry item (Pinterest-style) for generate list ────────────── */

function MasonryImageItem({
  task,
  imageUrl,
  onImageClick,
  onDownload,
  onUse,
  onDelete,
  onShowDetail,
}: {
  task: ImageTask;
  imageUrl: string;
  onImageClick?: (url: string, task: ImageTask) => void;
  onDownload?: (url: string) => void;
  onUse?: (task: ImageTask) => void;
  onDelete?: (taskId: string) => void;
  onShowDetail?: (task: ImageTask) => void;
}) {
  const ratio = getTaskAspectRatio(task);
  const isPlaceholder = !imageUrl;
  const isGenerating = task.status === "processing" || task.status === "pending";
  return (
    <div className="group relative bg-gray-100 break-inside-avoid" style={{ aspectRatio: ratio }}>
      {!isPlaceholder && (
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onClick={() => onImageClick?.(imageUrl, task)}
        />
      )}
      {!isPlaceholder && (
        <ImageActions
          task={task}
          imageUrl={imageUrl}
          onImageClick={onImageClick}
          onDownload={onDownload}
          onUse={onUse}
          onDelete={onDelete}
          onShowDetail={onShowDetail}
        />
      )}
      {isGenerating && (
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 z-30">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <span className="text-[12px] text-white">生成中...</span>
        </div>
      )}
    </div>
  );
}

/* ─── Square card item for history list ───────────────────────────── */

function SquareImageItem({
  task,
  imageUrl,
  selected,
  batchMode,
  onToggleSelect,
  onImageClick,
  onDownload,
  onUse,
  onDelete,
  onShowDetail,
}: {
  task: ImageTask;
  imageUrl: string;
  selected?: boolean;
  batchMode?: boolean;
  onToggleSelect?: (taskId: string) => void;
  onImageClick?: (url: string, task: ImageTask) => void;
  onDownload?: (url: string) => void;
  onUse?: (task: ImageTask) => void;
  onDelete?: (taskId: string) => void;
  onShowDetail?: (task: ImageTask) => void;
}) {
  return (
    <div className="group relative w-[160px] h-[160px] bg-gray-100 overflow-hidden">
      {batchMode && (
        <div
          className="absolute top-2 left-2 z-40"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.(task.id);
          }}
        >
          <div
            className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors",
              selected
                ? "bg-indigo-500 border-indigo-500"
                : "bg-white/80 border-white/60 hover:border-white"
            )}
          >
            {selected && (
              <svg
                className="w-3 h-3 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}
      <img
        src={imageUrl}
        alt=""
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onClick={() => {
          if (batchMode) {
            onToggleSelect?.(task.id);
          } else {
            onImageClick?.(imageUrl, task);
          }
        }}
      />
      {!batchMode && (
        <ImageActions
          task={task}
          imageUrl={imageUrl}
          onImageClick={onImageClick}
          onDownload={onDownload}
          onUse={onUse}
          onDelete={onDelete}
          onShowDetail={onShowDetail}
        />
      )}
      {task.status === "processing" && (
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 z-30">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <span className="text-[12px] text-white">生成中...</span>
        </div>
      )}
    </div>
  );
}

/* ─── Delete confirmation dialog ──────────────────────────────────── */

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

/* ─── Task detail dialog ──────────────────────────────────────────── */

function TaskDetailDialog({
  open,
  task,
  onClose,
}: {
  open: boolean;
  task: ImageTask | null;
  onClose: () => void;
}) {
  if (!task) return null;
  const config = parseConfigSnapshot(task.configSnapshot);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>生成详情</DialogTitle>
          <DialogDescription>
            {formatTaskTime(task.createdAt)} · {task.id.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <h4 className="text-[12px] font-semibold text-gray-500 mb-2">提示词</h4>
            <div className="p-3 bg-[#F5F6F8] rounded-xl text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap">
              {task.promptSnapshot || "—"}
            </div>
          </div>

          {task.negativePromptSnapshot && (
            <div>
              <h4 className="text-[12px] font-semibold text-gray-500 mb-2">排除内容</h4>
              <div className="p-3 bg-[#F5F6F8] rounded-xl text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                {task.negativePromptSnapshot}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-[#F5F6F8] rounded-xl">
              <span className="text-[11px] text-gray-400 block mb-1">尺寸</span>
              <span className="text-[13px] text-gray-700 font-medium">
                {config?.width ?? "—"} × {config?.height ?? "—"}
              </span>
            </div>
            <div className="p-3 bg-[#F5F6F8] rounded-xl">
              <span className="text-[11px] text-gray-400 block mb-1">比例</span>
              <span className="text-[13px] text-gray-700 font-medium">
                {config?.ratio ?? "—"}
              </span>
            </div>
            <div className="p-3 bg-[#F5F6F8] rounded-xl">
              <span className="text-[11px] text-gray-400 block mb-1">质量</span>
              <span className="text-[13px] text-gray-700 font-medium">
                {config?.quality ?? "—"}
              </span>
            </div>
            <div className="p-3 bg-[#F5F6F8] rounded-xl">
              <span className="text-[11px] text-gray-400 block mb-1">模型</span>
              <span className="text-[13px] text-gray-700 font-medium">
                {config?.model ?? "—"}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main component ──────────────────────────────────────────────── */

export default function PreviewPanel({
  productImageUrl,
  styleReferenceUrls,
  latestTask,
  generatingTasks,
  taskHistory,
  showHistory,
  onRetry,
  onDownload,
  onRemoveProductImage,
  onRemoveStyleReference,
  onSelectTask,
  onCloseHistory,
  onOpenHistory,
  onUploadFile,
  onDeleteTask,
  onRefreshTasks,
  onLoadTaskConfig,
}: PreviewPanelProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; task: ImageTask } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);

  // Detail dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<ImageTask | null>(null);

  // Batch selection
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  const toggleSelectTask = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedTaskIds(new Set());
    setBatchMode(false);
  };

  const handleBatchDelete = () => {
    setPendingDeleteIds(Array.from(selectedTaskIds));
    setDeleteDialogOpen(true);
  };

  const handleBatchDownload = () => {
    selectedTaskIds.forEach((taskId) => {
      const task = taskHistory.find((t) => t.id === taskId);
      if (task?.resultImageUrl) {
        parseResultImages(task.resultImageUrl).forEach((url) => {
          handleDownloadSingle(url);
        });
      }
    });
  };

  // Responsive column count for masonry reorder
  const [columnCount, setColumnCount] = useState(3);
  useEffect(() => {
    function updateColumns() {
      const w = window.innerWidth;
      if (w >= 1280) setColumnCount(5);
      else if (w >= 1024) setColumnCount(4);
      else setColumnCount(3);
    }
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // Filter and sort result tasks
  const resultTasks = useMemo(
    () =>
      taskHistory
        .filter((t) => t.status === "completed" || t.status === "failed")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [taskHistory]
  );

  const hasGenerating = generatingTasks.length > 0;

  const handleDownloadSingle = (url: string) => {
    downloadImage(url, `ai-image-${Date.now()}.png`);
  };

  const handleSingleDelete = (taskId: string) => {
    setPendingDeleteIds([taskId]);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    pendingDeleteIds.forEach((id) => {
      onDeleteTask?.(id);
    });
    setDeleteDialogOpen(false);
    setPendingDeleteIds([]);
  };

  const handleShowDetail = (task: ImageTask) => {
    setDetailTask(task);
    setDetailDialogOpen(true);
  };

  // Images for masonry generate-list view
  const masonryImages = useMemo(() => {
    const items: { task: ImageTask; url: string }[] = [];
    const seenIds = new Set<string>();

    for (const task of generatingTasks) {
      seenIds.add(task.id);
      const urls = parseResultImages(task.resultImageUrl);
      if (urls.length === 0) {
        items.push({ task, url: "" });
      } else {
        for (const url of urls) {
          items.push({ task, url });
        }
      }
    }

    if (
      latestTask &&
      (latestTask.status === "pending" || latestTask.status === "processing") &&
      !seenIds.has(latestTask.id)
    ) {
      const urls = parseResultImages(latestTask.resultImageUrl);
      if (urls.length === 0) {
        items.push({ task: latestTask, url: "" });
      } else {
        for (const url of urls) {
          items.push({ task: latestTask, url });
        }
      }
    }

    for (const task of resultTasks) {
      for (const url of parseResultImages(task.resultImageUrl)) {
        items.push({ task, url });
      }
    }

    const sorted = items.sort(
      (a, b) => new Date(b.task.createdAt).getTime() - new Date(a.task.createdAt).getTime()
    );
    return reorderForMasonry(sorted, columnCount);
  }, [generatingTasks, resultTasks, latestTask, columnCount]);

  // Images grouped by date for history view
  const historyByDate = useMemo(() => {
    const all = [...generatingTasks, ...resultTasks].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const groups: Record<string, { task: ImageTask; url: string }[]> = {};
    for (const task of all) {
      const key = formatTaskDate(task.createdAt);
      if (!groups[key]) groups[key] = [];
      for (const url of parseResultImages(task.resultImageUrl)) {
        groups[key].push({ task, url });
      }
    }
    return groups;
  }, [generatingTasks, resultTasks]);

  const toggleSelectAll = () => {
    const allIds = new Set<string>();
    Object.values(historyByDate).forEach((images) => {
      images.forEach(({ task }) => allIds.add(task.id));
    });
    const isAllSelected = allIds.size > 0 && selectedTaskIds.size === allIds.size;
    if (isAllSelected) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(allIds);
    }
  };

  // Check if any reference images exist for the preview state
  const hasAnyReferences = !!productImageUrl || styleReferenceUrls.length > 0;

  /* ─── Full history view ─────────────────────────────────────────── */
  if (showHistory) {
    return (
      <>
        <div id="history-feed-start" className="flex flex-col h-full">
          {/* History header */}
          <div className="px-6 pt-6">
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
            <div className="flex items-center justify-between mb-3">
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
                  onClick={() => {
                    if (batchMode) {
                      setBatchMode(false);
                      setSelectedTaskIds(new Set());
                    } else {
                      setBatchMode(true);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors border",
                    batchMode
                      ? "bg-indigo-50 text-indigo-600 border-indigo-200"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  )}
                >
                  {batchMode ? "取消选择" : "批量选择"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-600"
                />
                <span className="text-gray-400 text-[12px]">至</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 px-3 text-[13px] bg-white border border-gray-200 rounded-lg outline-none text-gray-600"
                />
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(""); setDateTo(""); }}
                    className="text-[12px] text-gray-400 hover:text-gray-600 ml-1"
                  >
                    清除
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* History image wall — grouped by date, square cards */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {(() => {
              // Filter by date range if set
              let entries = Object.entries(historyByDate);
              if (dateFrom || dateTo) {
                const fromTime = dateFrom ? new Date(dateFrom).getTime() : 0;
                const toTime = dateTo ? new Date(dateTo).getTime() + 86400000 : Infinity;
                entries = entries.filter(([_, images]) => {
                  if (images.length === 0) return false;
                  const taskTime = new Date(images[0].task.createdAt).getTime();
                  return taskTime >= fromTime && taskTime < toTime;
                });
              }
              return entries;
            })().length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-[13px]">暂无生成记录</span>
              </div>
            ) : (
              <div className="space-y-6">
                {(() => {
                  let entries = Object.entries(historyByDate);
                  if (dateFrom || dateTo) {
                    const fromTime = dateFrom ? new Date(dateFrom).getTime() : 0;
                    const toTime = dateTo ? new Date(dateTo).getTime() + 86400000 : Infinity;
                    entries = entries.filter(([_, images]) => {
                      if (images.length === 0) return false;
                      const taskTime = new Date(images[0].task.createdAt).getTime();
                      return taskTime >= fromTime && taskTime < toTime;
                    });
                  }
                  return entries;
                })().map(([date, images]) => (
                  <div key={date}>
                    <h3 className="text-[13px] font-semibold text-gray-700 mb-3">
                      {date}
                    </h3>
                    <div className="rounded-xl overflow-hidden">
                      <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1">
                        {images.map(({ task, url }, idx) => (
                          <SquareImageItem
                            key={`${task.id}-${idx}`}
                            task={task}
                            imageUrl={url}
                            selected={selectedTaskIds.has(task.id)}
                            batchMode={batchMode}
                            onToggleSelect={toggleSelectTask}
                            onImageClick={(url, task) => setSelectedImage({ url, task })}
                            onDownload={handleDownloadSingle}
                            onUse={(t) => onLoadTaskConfig?.(t)}
                            onDelete={handleSingleDelete}
                            onShowDetail={handleShowDetail}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>


        {/* Image preview modal */}
        {selectedImage && (
          <ImagePreviewModal
            imageUrl={selectedImage.url}
            task={selectedImage.task}
            onClose={() => setSelectedImage(null)}
            onDownload={() => handleDownloadSingle(selectedImage.url)}
            onAddToLibrary={() => {
              const { toast } = require("sonner");
              toast.success("已添加到素材库");
            }}
            onDelete={() => handleSingleDelete(selectedImage.task.id)}
          />
        )}

        {/* Delete confirmation dialog */}
        <DeleteDialog
          open={deleteDialogOpen}
          count={pendingDeleteIds.length}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
        />

        {/* Task detail dialog */}
        <TaskDetailDialog
          open={detailDialogOpen}
          task={detailTask}
          onClose={() => setDetailDialogOpen(false)}
        />

        {/* Floating batch action bar */}
        {batchMode && (
          <div className="fixed bottom-20 left-[calc(50vw+200px)] -translate-x-1/2 z-50 rounded-full bg-gradient-to-r from-blue-100/90 to-purple-100/90 backdrop-blur-sm shadow-lg px-10 py-6 flex items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-[13px] text-gray-700 hover:text-gray-900 font-medium transition-colors whitespace-nowrap"
              >
                {(() => {
                  const allIds = new Set<string>();
                  Object.values(historyByDate).forEach((images) => {
                    images.forEach(({ task }) => allIds.add(task.id));
                  });
                  const isAllSelected = allIds.size > 0 && selectedTaskIds.size === allIds.size;
                  return isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-500 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400 shrink-0" />
                  );
                })()}
                全选
              </button>
              <span className="text-[13px] text-gray-500 whitespace-nowrap">
                已选 {selectedTaskIds.size} 项
              </span>
            </div>
            <div className="w-[150px] flex justify-center">
              <div className="w-px h-4 bg-gray-300" />
            </div>
            <div className="flex items-center gap-[100px]">
              <button
                onClick={handleBatchDownload}
                className="flex items-center gap-1 text-[13px] text-gray-700 hover:text-gray-900 font-medium transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                下载
              </button>
              <button
                onClick={handleBatchDelete}
                className="flex items-center gap-1 text-[13px] text-red-600 hover:text-red-700 font-medium transition-colors whitespace-nowrap"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                删除
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ─── Generating / result list view — masonry wall ──────────────── */
  if (hasGenerating || latestTask !== null) {
    return (
      <>
        <div className="flex flex-col gap-3 px-6 pt-6">
          {masonryImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-[13px]">暂无图片</span>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden">
              <div className="columns-3 lg:columns-4 xl:columns-5 gap-1 space-y-1">
                {masonryImages.map(({ task, url }, idx) => (
                  <MasonryImageItem
                    key={`${task.id}-${idx}`}
                    task={task}
                    imageUrl={url}
                    onImageClick={(url, task) => setSelectedImage({ url, task })}
                    onDownload={handleDownloadSingle}
                    onUse={(t) => onLoadTaskConfig?.(t)}
                    onDelete={handleSingleDelete}
                    onShowDetail={handleShowDetail}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Image preview modal */}
        {selectedImage && (
          <ImagePreviewModal
            imageUrl={selectedImage.url}
            task={selectedImage.task}
            onClose={() => setSelectedImage(null)}
            onDownload={() => handleDownloadSingle(selectedImage.url)}
            onAddToLibrary={() => {
              const { toast } = require("sonner");
              toast.success("已添加到素材库");
            }}
            onDelete={() => handleSingleDelete(selectedImage.task.id)}
          />
        )}

        {/* Delete confirmation dialog */}
        <DeleteDialog
          open={deleteDialogOpen}
          count={pendingDeleteIds.length}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
        />

        {/* Task detail dialog */}
        <TaskDetailDialog
          open={detailDialogOpen}
          task={detailTask}
          onClose={() => setDetailDialogOpen(false)}
        />
      </>
    );
  }

  /* ─── Reference preview state ───────────────────────────────────── */
  if (hasAnyReferences) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6">
        <div className="relative w-full max-w-3xl rounded-3xl overflow-hidden bg-white border border-gray-100">
          {productImageUrl ? (
            <img
              src={productImageUrl}
              alt="商品主体图"
              className="w-full h-auto object-contain max-h-[60vh]"
            />
          ) : styleReferenceUrls.length > 0 ? (
            <img
              src={styleReferenceUrls[0]}
              alt="风格参考图"
              className="w-full h-auto object-contain max-h-[60vh]"
            />
          ) : null}
        </div>

        {/* Style reference thumbnails */}
        {styleReferenceUrls.length > 0 && (
          <div className="flex items-center gap-2 mt-4">
            {productImageUrl && (
              <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-indigo-300">
                <img
                  src={productImageUrl}
                  alt="商品主体图"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {styleReferenceUrls.map((url, i) => (
              <div
                key={i}
                className="relative w-14 h-14 rounded-xl overflow-hidden ring-1 ring-gray-200 group"
              >
                <img
                  src={url}
                  alt={`风格参考 ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => onRemoveStyleReference?.(i)}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mt-4">
          {productImageUrl && (
            <button
              onClick={onRemoveProductImage}
              className="flex items-center gap-1 text-[13px] text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              删除商品图
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ─── Empty state — default upload area ─────────────────────────── */
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
      {selectedImage && (
        <ImagePreviewModal
          imageUrl={selectedImage.url}
          task={selectedImage.task}
          onClose={() => setSelectedImage(null)}
          onDownload={() => handleDownloadSingle(selectedImage.url)}
          onAddToLibrary={() => {
            const { toast } = require("sonner");
            toast.success("已添加到素材库");
          }}
          onDelete={() => handleSingleDelete(selectedImage.task.id)}
        />
      )}
    </>
  );
}
