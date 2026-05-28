"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Download, ImageIcon, Loader2, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";

interface TaskItem {
  id: string;
  status: string;
  resultImageUrl: string | null;
  createdAt: string;
  userPrompt: string | null;
  promptSnapshot: string | null;
  referenceImagesSnapshot: string | null;
  configSnapshot: string | null;
  negativePromptSnapshot: string | null;
}

export interface GalleryApplyData {
  taskId: string;
  imageUrl: string;
  userPrompt: string;
  productImageUrl: string | null;
  promptSnapshot: string;
  configSnapshot: Record<string, unknown>;
}

interface ImageGalleryDrawerProps {
  open: boolean;
  onClose: () => void;
  onApply?: (data: GalleryApplyData) => void;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "今天";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "昨天";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseResultImages(resultImageUrl?: string | null): string[] {
  if (!resultImageUrl) return [];
  try {
    const parsed = JSON.parse(resultImageUrl);
    if (Array.isArray(parsed)) return parsed;
    return [resultImageUrl];
  } catch {
    return [resultImageUrl];
  }
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function ImageGalleryDrawer({ open, onClose, onApply }: ImageGalleryDrawerProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/ai-image/tasks?limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          const completed = data.data.filter((t: TaskItem) => t.status === "completed" && t.resultImageUrl);
          setTasks(completed);
        }
      })
      .catch(() => toast.error("加载图片库失败"))
      .finally(() => setLoading(false));
  }, [open]);

  const imagesByDate = useMemo(() => {
    const all = tasks
      .flatMap((task) =>
        parseResultImages(task.resultImageUrl).map((url) => ({
          url,
          taskId: task.id,
          createdAt: task.createdAt,
          userPrompt: task.userPrompt,
          promptSnapshot: task.promptSnapshot,
          referenceImagesSnapshot: task.referenceImagesSnapshot,
          configSnapshot: task.configSnapshot,
        }))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const groups: Record<string, typeof all> = {};
    for (const item of all) {
      const key = formatDateLabel(item.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [tasks]);

  const handleDownload = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      toast.success("下载已开始");
    } catch {
      toast.error("下载失败，可能受跨域限制");
    }
  };

  const handleApply = (item: {
    url: string;
    taskId: string;
    userPrompt: string | null;
    promptSnapshot: string | null;
    referenceImagesSnapshot: string | null;
    configSnapshot: string | null;
  }) => {
    if (!onApply) return;
    const refs = safeJsonParse<{ productImageUrl?: string | null; styleReferenceUrls?: string[] }>(
      item.referenceImagesSnapshot
    );
    const config = safeJsonParse<Record<string, unknown>>(item.configSnapshot) || {};
    onApply({
      taskId: item.taskId,
      imageUrl: item.url,
      userPrompt: item.userPrompt || "",
      productImageUrl: refs?.productImageUrl || null,
      promptSnapshot: item.promptSnapshot || "",
      configSnapshot: config,
    });
    onClose();
    // Toast is handled by the caller (page.tsx) to show correct message
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-[480px] bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-500" />
            <h2 className="text-base font-semibold text-gray-800">图片库</h2>
            <span className="text-xs text-gray-400">{Object.values(imagesByDate).flat().length} 张</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              <p className="text-sm text-gray-400">加载中...</p>
            </div>
          )}

          {!loading && Object.keys(imagesByDate).length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <ImageIcon className="w-10 h-10 text-gray-300" />
              <p className="text-sm text-gray-400">暂无生成记录</p>
            </div>
          )}

          {Object.entries(imagesByDate).map(([dateLabel, images]) => (
            <div key={dateLabel}>
              <h3 className="text-xs font-semibold text-gray-500 mb-3 sticky top-0 bg-white py-1 z-10">{dateLabel}</h3>
              <div className="grid grid-cols-2 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={`${img.taskId}-${idx}`}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer"
                    onClick={() => setPreviewUrl(img.url)}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Hover actions */}
                    <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApply(img);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-indigo-500/90 hover:bg-indigo-500 text-white text-[11px] font-medium rounded-md transition-colors"
                        >
                          <ArrowRightLeft className="w-3 h-3" />应用
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(img.url);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-white/90 hover:bg-white text-gray-800 text-[11px] font-medium rounded-md transition-colors"
                        >
                          <Download className="w-3 h-3" />下载
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh] p-2" onClick={(e) => e.stopPropagation()}>
            <img src={previewUrl} alt="" className="max-w-full max-h-[85vh] rounded-lg object-contain" />
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
