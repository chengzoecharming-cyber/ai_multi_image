"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { X, Download, ImageIcon, Loader2, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { enqueuePersist } from "@/lib/persist-queue";
import type { ImageDetailData } from "./ImageDetailOverlay";

interface TaskItem {
  id: string;
  status: string;
  resultImageUrl: string | null;
  thumbImageUrl: string | null;
  createdAt: string;
  userPrompt: string | null;
  promptSnapshot: string | null;
  referenceImagesSnapshot: string | null;
  configSnapshot: string | null;
}

interface ImageItem {
  url: string;
  thumbUrl: string | null;
  taskId: string;
  createdAt: string;
  userPrompt: string | null;
  promptSnapshot: string | null;
  referenceImagesSnapshot: string | null;
  configSnapshot: string | null;
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
  onOpenImageDetail?: (data: ImageDetailData) => void;
}

const PAGE_SIZE = 10;

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

/**
 * IntersectionObserver hook for lazy image loading.
 *
 * If thumbUrl is already local (pre-generated at generation time),
 * show it immediately when entering viewport — no API call needed.
 *
 * Only falls back to the slow persist API for old tasks without
 * a pre-generated thumbnail.
 */
function useLazyImage(src: string, taskId: string, initialThumb?: string | null) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displaySrc, setDisplaySrc] = useState<string | null>(initialThumb ?? null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(
    initialThumb ? "ready" : "idle"
  );
  const persistedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            observer.disconnect();

            if (!persistedRef.current) {
              persistedRef.current = true;
              const origin = window.location.origin;
              const isExternal =
                src.startsWith("http") && !src.startsWith(origin);

              // Already have a local thumbnail — nothing to do
              if (!isExternal || initialThumb) {
                setDisplaySrc(initialThumb ?? src);
                setState("ready");
                return;
              }

              // Old task without pre-generated thumbnail — enqueue persist job
              setState("loading");
              enqueuePersist(taskId, src, (data) => {
                if (data.thumbUrl) {
                  setDisplaySrc(data.thumbUrl);
                } else if (data.localUrl) {
                  setDisplaySrc(data.localUrl);
                } else {
                  setDisplaySrc(src);
                }
                setState("ready");
              });
            }
          }
        });
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src, taskId, initialThumb]);

  return { containerRef, displaySrc, state };
}

function LazyImage({
  src,
  thumbUrl,
  taskId,
  alt,
  className,
}: {
  src: string;
  thumbUrl?: string | null;
  taskId: string;
  alt: string;
  className: string;
}) {
  const { containerRef, displaySrc, state } = useLazyImage(src, taskId, thumbUrl);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {displaySrc && state !== "loading" ? (
        <img
          src={displaySrc}
          data-src={src}
          alt={alt}
          className={className}
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
        </div>
      )}
    </div>
  );
}

export default function ImageGalleryDrawer({ open, onClose, onApply, onOpenImageDetail }: ImageGalleryDrawerProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset when drawer opens
  useEffect(() => {
    if (!open) return;
    setImages([]);
    setOffset(0);
    setHasMore(true);
    setLoading(true);
    fetchPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchPage = useCallback(async (pageOffset: number) => {
    try {
      const res = await fetch(`/api/ai-image/tasks?limit=${PAGE_SIZE}&offset=${pageOffset}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = (await res.json()) as {
        data?: TaskItem[];
        total?: number;
      };
      const tasks = Array.isArray(data?.data) ? data.data : [];
      const completed = tasks.filter((t) => t.status === "completed" && t.resultImageUrl);
      const newImages = completed.flatMap((task) =>
        parseResultImages(task.resultImageUrl).map((url) => ({
          url,
          thumbUrl: task.thumbImageUrl ?? null,
          taskId: task.id,
          createdAt: task.createdAt,
          userPrompt: task.userPrompt,
          promptSnapshot: task.promptSnapshot,
          referenceImagesSnapshot: task.referenceImagesSnapshot,
          configSnapshot: task.configSnapshot,
        }))
      );
      setImages((prev) => (pageOffset === 0 ? newImages : [...prev, ...newImages]));
      // FIX: hasMore should be based on whether we got a full page of TASKS,
      // not whether we got a full page of completed images.
      // Some tasks may be pending/failed and produce 0 images, but there may still be more tasks on next page.
      setHasMore(tasks.length === PAGE_SIZE);
    } catch {
      toast.error("加载图片库失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // Infinite scroll via IntersectionObserver on sentinel
  useEffect(() => {
    if (!open || loading || !hasMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setOffset((prev) => {
              const next = prev + PAGE_SIZE;
              setLoading(true);
              fetchPage(next);
              return next;
            });
          }
        });
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [open, loading, hasMore, fetchPage]);

  const imagesByDate = useMemo(() => {
    const sorted = [...images].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const groups: Record<string, ImageItem[]> = {};
    for (const item of sorted) {
      const key = formatDateLabel(item.createdAt);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [images]);

  const totalCount = useMemo(() => images.length, [images]);

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

  const handleApply = (item: ImageItem) => {
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
            <span className="text-xs text-gray-400">{totalCount} 张</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {loading && images.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              <p className="text-sm text-gray-400">加载中...</p>
            </div>
          )}

          {!loading && images.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <ImageIcon className="w-10 h-10 text-gray-300" />
              <p className="text-sm text-gray-400">暂无生成记录</p>
            </div>
          )}

          {Object.entries(imagesByDate).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <h3 className="text-xs font-semibold text-gray-500 mb-3 sticky top-0 bg-white py-1 z-10">
                {dateLabel}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {items.map((img, idx) => (
                  <div
                    key={`${img.taskId}-${idx}`}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer"
                    onClick={() => {
                      if (onOpenImageDetail) {
                        onOpenImageDetail({
                          imageUrl: img.url,
                          prompt: img.promptSnapshot,
                          referenceImageUrls: undefined,
                          taskId: img.taskId,
                          createdAt: img.createdAt,
                        });
                      } else {
                        setPreviewUrl(img.url);
                      }
                    }}
                  >
                    <LazyImage
                      src={img.url}
                      thumbUrl={img.thumbUrl}
                      taskId={img.taskId}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-4" />

          {loading && images.length > 0 && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            </div>
          )}

          {!hasMore && images.length > 0 && (
            <p className="text-center text-xs text-gray-400 py-4">没有更多了</p>
          )}
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
