"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { X, ImageIcon, Loader2, Search } from "lucide-react";
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

interface AssetLibrarySidebarProps {
  open: boolean;
  onClose: () => void;
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

/**
 * IntersectionObserver hook for lazy image loading.
 * If thumbUrl is already local, show it immediately.
 * Only falls back to the slow persist API for old tasks without thumbnail.
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
              const isExternal = src.startsWith("http") && !src.startsWith(origin);

              if (!isExternal || initialThumb) {
                setDisplaySrc(initialThumb ?? src);
                setState("ready");
                return;
              }

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

function LazyThumb({
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
          <Loader2 className="w-4 h-4 text-gray-300 animate-spin" />
        </div>
      )}
    </div>
  );
}

export default function AssetLibrarySidebar({
  open,
  onClose,
  onOpenImageDetail,
}: AssetLibrarySidebarProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset when sidebar opens
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
      setHasMore(tasks.length === PAGE_SIZE);
    } catch {
      toast.error("加载资产库失败");
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

  const filteredImagesByDate = useMemo(() => {
    if (!searchQuery.trim()) return imagesByDate;
    const q = searchQuery.toLowerCase();
    const result: Record<string, ImageItem[]> = {};
    for (const [date, items] of Object.entries(imagesByDate)) {
      const filtered = items.filter((img) =>
        (img.userPrompt || "").toLowerCase().includes(q)
      );
      if (filtered.length > 0) result[date] = filtered;
    }
    return result;
  }, [imagesByDate, searchQuery]);

  const handleOpenDetail = (img: ImageItem) => {
    if (!onOpenImageDetail) return;
    onOpenImageDetail({
      imageUrl: img.url,
      thumbImageUrl: img.thumbUrl ?? undefined,
      prompt: img.userPrompt,
      referenceImageUrls: undefined,
      source: "gallery",
      taskId: img.taskId,
      createdAt: img.createdAt,
      status: "success",
    });
  };

  if (!open) return null;

  return (
    <div className="w-[380px] max-w-[90vw] bg-white shadow-[-16px_0_20px_-12px_rgba(0,0,0,0.14)] rounded-l-[12px] rounded-r-none flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
      {/* Header — aligned with message center */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
        <h2 className="text-[20px] font-medium text-[#0f1419]">资产库</h2>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center overflow-hidden">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索..."
              className={`h-7 text-[13px] text-[#0f1419] placeholder:text-[#72808a] outline-none transition-all duration-300 ease-out bg-transparent ${
                searchOpen ? "w-28 px-2" : "w-0 px-0"
              }`}
            />
            <button
              onClick={() => setSearchOpen((v) => !v)}
              className="flex items-center justify-center w-7 h-7 text-[#72808a] hover:text-[#0f1419] transition-colors shrink-0 rounded-md hover:bg-gray-100"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#536471] transition-colors hover:text-[#0f1419] active:text-[#0f1419]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 bg-white">
        {loading && images.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            <p className="text-sm text-gray-400">加载中...</p>
          </div>
        )}

        {!loading && images.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <ImageIcon className="w-8 h-8 text-gray-300" />
            <p className="text-sm text-gray-400">暂无生成记录</p>
          </div>
        )}

        {!loading && searchQuery && Object.keys(filteredImagesByDate).length === 0 && images.length > 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-gray-400">没有找到匹配的图片</p>
          </div>
        )}

        {Object.entries(filteredImagesByDate).map(([dateLabel, items], idx) => (
          <div key={dateLabel} className={`bg-white ${idx > 0 ? "pt-4" : ""}`}>
            <div className="sticky top-0 bg-white z-10 border-b border-gray-100 py-2 -mx-4 px-4">
              <h3 className="text-xs font-semibold text-gray-500">
                {dateLabel}
              </h3>
            </div>
            <div className="flex flex-wrap gap-3 pt-3">
              {items.map((img, idx) => (
                <div
                  key={`${img.taskId}-${idx}`}
                  className="group relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow shrink-0"
                  style={{ width: 120, height: 120 }}
                  onClick={() => handleOpenDetail(img)}
                >
                  <LazyThumb
                    src={img.url}
                    thumbUrl={img.thumbUrl}
                    taskId={img.taskId}
                    alt=""
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Hover: show arrow icon */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/90 text-[#0f1419]">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
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
  );
}
