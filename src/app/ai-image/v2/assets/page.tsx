"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ImageIcon,
  Loader2,
  Search,
  Trash2,
  Download,
  Star,
  X,
  CheckSquare,
  Square,
  Play,
  Heart,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getFavorites, removeFavorite, type FavoriteItem } from "../lib/favorites";
import ImageDetailOverlay from "../components/ImageDetailOverlay";
import type { ImageDetailData } from "../components/ImageDetailOverlay";

interface TaskItem {
  id: string;
  status: string;
  resultImageUrl: string | null;
  thumbImageUrl: string | null;
  createdAt: string;
  userPrompt: string | null;
}

type TabKey = "image" | "video" | "favorite";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "image", label: "图片", icon: <ImageIcon className="w-3.5 h-3.5" /> },
  { key: "video", label: "视频", icon: <Play className="w-3.5 h-3.5" /> },
  { key: "favorite", label: "我的收藏", icon: <Heart className="w-3.5 h-3.5" /> },
];

import { BBG } from "../design-tokens";

function formatDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (isToday) return "今天";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate();
  if (isYesterday) return "昨天";

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function groupByDate(items: TaskItem[]): { date: string; items: TaskItem[] }[] {
  const map = new Map<string, TaskItem[]>();
  for (const item of items) {
    const key = formatDateGroup(item.createdAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

export default function AssetsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("image");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageDetailData, setImageDetailData] = useState<ImageDetailData | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/ai-image/tasks?limit=50")
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data: { data?: TaskItem[] }) => {
        setTasks(
          (data.data || [])
            .filter((t) => t.resultImageUrl && t.status === "completed")
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
        );
      })
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    const refresh = () => setFavorites(getFavorites());
    refresh();
    // Listen for storage changes (if other tabs add favorites)
    const handler = (e: StorageEvent) => {
      if (e.key === "ai-image-v2-favorites") refresh();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Reset batch mode when tab changes
  useEffect(() => {
    setBatchMode(false);
    setSelectedIds(new Set());
  }, [activeTab]);

  const filteredItems = activeTab === "favorite" ? favorites : tasks.filter((task) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (task.userPrompt || "").toLowerCase().includes(q) ||
      task.id.toLowerCase().includes(q)
    );
  });

  const groupedItems = useMemo(() => {
    if (activeTab === "favorite") return [];
    return groupByDate(filteredItems as TaskItem[]);
  }, [filteredItems, activeTab]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((t) => t.id)));
    }
  };

  const exitBatchMode = () => {
    setBatchMode(false);
    setSelectedIds(new Set());
  };

  const handleDelete = () => {
    if (activeTab === "favorite") {
      const ids = Array.from(selectedIds);
      ids.forEach((id) => {
        const fav = favorites.find((f) => f.id === id);
        if (fav) removeFavorite(fav.imageUrl);
      });
      setFavorites(getFavorites());
    }
    exitBatchMode();
  };

  const handleDownload = () => {
    // TODO: 批量下载
    console.log("下载选中:", Array.from(selectedIds));
  };

  const handleFavorite = () => {
    // TODO: 批量收藏
    console.log("收藏选中:", Array.from(selectedIds));
    exitBatchMode();
  };

  const openImageDetail = (item: TaskItem | FavoriteItem) => {
    const isFav = activeTab === "favorite";
    const imageUrl = isFav
      ? (item as FavoriteItem).imageUrl
      : (item as TaskItem).resultImageUrl || "";
    const prompt = isFav ? (item as FavoriteItem).prompt : (item as TaskItem).userPrompt;
    const thumbImageUrl = isFav
      ? undefined
      : (item as TaskItem).thumbImageUrl || undefined;

    if (!imageUrl) {
      toast.error("图片地址无效，无法打开");
      return;
    }

    setImageDetailData({
      imageUrl,
      thumbImageUrl,
      prompt: prompt || null,
      source: "asset",
      status: "success",
    });
  };

  const closeImageDetail = () => setImageDetailData(null);

  const renderImageCard = (item: TaskItem | FavoriteItem, isFavoriteTab: boolean) => {
    const id = item.id;
    const taskItem = item as TaskItem;
    const imageUrl = isFavoriteTab
      ? (item as FavoriteItem).imageUrl
      : taskItem.thumbImageUrl || taskItem.resultImageUrl || "";
    const prompt = isFavoriteTab ? (item as FavoriteItem).prompt : taskItem.userPrompt;
    const isSelected = selectedIds.has(id);
    const hasError = imgErrors[id];

    return (
      <div
        key={id}
        className={cn(
          "group relative rounded-xl overflow-hidden border border-stone-200 bg-stone-100 hover:shadow-md transition-all shrink-0",
          batchMode ? "cursor-pointer" : "cursor-pointer"
        )}
        style={{ width: 192, height: 192 }}
        onClick={() => {
          if (batchMode) {
            toggleSelect(id);
          } else {
            openImageDetail(item);
          }
        }}
        onMouseEnter={() => {
          if (!isFavoriteTab && taskItem.resultImageUrl) {
            const img = new Image();
            img.src = taskItem.resultImageUrl;
          }
        }}
      >
        {/* Checkbox */}
        {batchMode && (
          <div className="absolute top-2 left-2 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSelect(id);
              }}
              className={cn(
                "flex items-center justify-center w-5 h-5 rounded border transition-colors",
                isSelected
                  ? "bg-[#0f1419] border-[#0f1419] text-white"
                  : "bg-white/80 border-stone-300 text-transparent hover:border-[#0f1419]"
              )}
            >
              <CheckSquare className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {hasError ? (
          <div className="w-full h-full bg-stone-200 flex flex-col items-center justify-center gap-2">
            <ImageIcon className="w-8 h-8 text-stone-400" />
            <span className="text-xs text-stone-400">图片加载失败</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt={prompt || "图片"}
            className={cn(
              "w-full h-full object-cover transition-transform duration-300",
              !batchMode && "group-hover:scale-105"
            )}
            loading="lazy"
            onError={() => setImgErrors((prev) => ({ ...prev, [id]: true }))}
          />
        )}

        {/* Hover overlay */}
        {!batchMode && !hasError && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 text-[#0f1419]">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Selected overlay */}
        {batchMode && isSelected && (
          <div className="absolute inset-0 bg-[#0f1419]/10 ring-2 ring-[#0f1419] rounded-xl pointer-events-none" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <main
        className="min-h-0 flex-1 overflow-y-auto px-6 py-8"
        style={{ backgroundColor: "rgb(248, 249, 250)" }}
      >
        {/* Header */}
        <div className="mx-auto max-w-7xl flex items-center justify-between mb-6">
          {/* Tabs */}
          <div className="flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium rounded-[8px] transition-colors",
                  activeTab === tab.key
                    ? "text-[#0f1419]"
                    : "text-[#72808a] hover:text-[#0f1419]"
                )}
                style={
                  activeTab === tab.key ? { backgroundColor: BBG } : undefined
                }
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Operations */}
          {batchMode ? (
            /* Batch action buttons - no white bg wrapper */
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                disabled={selectedIds.size === 0}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[14px] font-medium transition-colors",
                  selectedIds.size === 0
                    ? "text-[#72808a] cursor-default bg-bbg"
                    : "text-[#0f1419] bg-bbg hover:bg-bbg-hover"
                )}
              >
                <Trash2 className="w-4 h-4" />
                删除
              </button>
              <button
                onClick={handleDownload}
                disabled={selectedIds.size === 0}
                className={cn(
                  "flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[14px] font-medium transition-colors",
                  selectedIds.size === 0
                    ? "text-[#72808a] cursor-default bg-bbg"
                    : "text-[#0f1419] bg-bbg hover:bg-bbg-hover"
                )}
              >
                <Download className="w-4 h-4" />
                下载
              </button>
              {activeTab !== "favorite" && (
                <button
                  onClick={handleFavorite}
                  disabled={selectedIds.size === 0}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[14px] font-medium transition-colors",
                    selectedIds.size === 0
                      ? "text-[#72808a] cursor-default bg-bbg"
                      : "text-[#0f1419] bg-bbg hover:bg-bbg-hover"
                  )}
                >
                  <Star className="w-4 h-4" />
                  收藏
                </button>
              )}
              <button
                onClick={exitBatchMode}
                className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[14px] font-medium text-[#0f1419] transition-colors bg-bbg hover:bg-bbg-hover"
              >
                <X className="w-4 h-4" />
                退出
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-white rounded-lg px-3 py-1.5">
              {/* Search */}
              <div className="flex items-center overflow-hidden">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索素材..."
                  className={cn(
                    "h-8 text-[13px] text-[#0f1419] placeholder:text-[#72808a] outline-none transition-all duration-300 ease-out",
                    searchOpen ? "w-40 px-2" : "w-0 px-0"
                  )}
                />
                <button
                  onClick={() => setSearchOpen((v) => !v)}
                  className="flex items-center justify-center w-8 h-8 text-[#72808a] hover:text-[#0f1419] transition-colors shrink-0"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
              {/* Divider */}
              <div className="w-px h-4 bg-gray-200 mx-2 shrink-0" />
              {/* Batch Operation */}
              <button
                className="px-1 text-[13px] font-semibold text-[#0f1419] hover:opacity-80 transition-opacity"
                onClick={() => setBatchMode(true)}
              >
                批量操作
              </button>
            </div>
          )}
        </div>

        {loading && activeTab !== "favorite" ? (
          <div className="flex h-60 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-transparent" />
          </div>
        ) : (
          <div>
            {/* Batch select all hint */}
            {batchMode && filteredItems.length > 0 && (
              <div className="mx-auto max-w-7xl mb-3 flex items-center">
                <button
                  onClick={selectAll}
                  className="flex items-center gap-1.5 text-sm text-[#72808a] hover:text-[#0f1419] transition-colors"
                >
                  {selectedIds.size === filteredItems.length ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  全选 ({selectedIds.size}/{filteredItems.length})
                </button>
              </div>
            )}

            {activeTab === "favorite" ? (
              /* Favorite tab: keep original flat grid */
              <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-8">
                {filteredItems.map((item) => renderImageCard(item, true))}
              </div>
            ) : (
              /* Image tab: grouped by date, horizontal masonry */
              <div className="mx-auto max-w-7xl pb-8 space-y-8">
                {groupedItems.map((group) => (
                  <div key={group.date}>
                    <h2
                      className="text-[24px] font-semibold text-[#0f1419] mb-3"
                      style={{ fontWeight: 600, marginBottom: 12 }}
                    >
                      {group.date}
                    </h2>
                    <div className="flex flex-wrap gap-4">
                      {group.items.map((item) => renderImageCard(item, false))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredItems.length === 0 ? (
              <div className="mx-auto flex flex-col items-center justify-center py-16 text-center">
                {activeTab === "favorite" ? (
                  <Heart className="w-10 h-10 text-stone-300 mb-3" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-stone-300 mb-3" />
                )}
                <p className="text-sm text-stone-500">
                  {activeTab === "favorite"
                    ? "暂无收藏"
                    : searchQuery
                      ? "没有找到匹配的素材"
                      : "暂无素材"}
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  {activeTab === "favorite"
                    ? "在图片详情页点击收藏按钮，收藏的素材会显示在这里"
                    : searchQuery
                      ? "尝试调整搜索关键词"
                      : "去生图工作台生成图片后，这里会显示你的作品"}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </main>

      {/* Image Detail Overlay */}
      <ImageDetailOverlay data={imageDetailData} onClose={closeImageDetail} />
    </div>
  );
}
