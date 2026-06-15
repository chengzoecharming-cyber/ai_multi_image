"use client";

import { useState, useEffect } from "react";
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
import { getFavorites, removeFavorite, type FavoriteItem } from "../lib/favorites";

interface TaskItem {
  id: string;
  status: string;
  resultImageUrl: string | null;
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

export default function AssetsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("image");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ai-image/tasks?limit=50")
      .then((res) => (res.ok ? res.json() : { tasks: [] }))
      .then((data: { tasks?: TaskItem[] }) => {
        setTasks(
          (data.tasks || [])
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

  const handleOpenImage = (url: string) => {
    window.open(url, "_blank");
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
                    ? "text-[#72808a] cursor-default"
                    : "text-[#0f1419] hover:opacity-80"
                )}
                style={{ backgroundColor: BBG }}
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
                    ? "text-[#72808a] cursor-default"
                    : "text-[#0f1419] hover:opacity-80"
                )}
                style={{ backgroundColor: BBG }}
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
                      ? "text-[#72808a] cursor-default"
                      : "text-[#0f1419] hover:opacity-80"
                  )}
                  style={{ backgroundColor: BBG }}
                >
                  <Star className="w-4 h-4" />
                  收藏
                </button>
              )}
              <button
                onClick={exitBatchMode}
                className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] text-[14px] font-medium text-[#0f1419] transition-colors hover:opacity-80"
                style={{ backgroundColor: BBG }}
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

            <div className="mx-auto max-w-7xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-8">
              {filteredItems.map((item) => {
                const isFavorite = activeTab === "favorite";
                const id = item.id;
                const imageUrl = isFavorite ? (item as FavoriteItem).imageUrl : (item as TaskItem).resultImageUrl || "";
                const prompt = isFavorite ? (item as FavoriteItem).prompt : (item as TaskItem).userPrompt;

                return (
                  <div
                    key={id}
                    className={cn(
                      "group relative aspect-square rounded-xl overflow-hidden border border-stone-200 bg-stone-100 hover:shadow-md transition-all",
                      batchMode ? "cursor-pointer" : "cursor-default"
                    )}
                    onClick={() => batchMode && toggleSelect(id)}
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
                            selectedIds.has(id)
                              ? "bg-[#0f1419] border-[#0f1419] text-white"
                              : "bg-white/80 border-stone-300 text-transparent hover:border-[#0f1419]"
                          )}
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <img
                      src={imageUrl}
                      alt={prompt || "图片"}
                      className={cn(
                        "w-full h-full object-cover transition-transform duration-300",
                        !batchMode && "group-hover:scale-105"
                      )}
                      loading="lazy"
                    />

                    {/* Hover overlay */}
                    {!batchMode && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenImage(imageUrl);
                          }}
                          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 text-[#0f1419]"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Selected overlay */}
                    {batchMode && selectedIds.has(id) && (
                      <div className="absolute inset-0 bg-[#0f1419]/10 ring-2 ring-[#0f1419] rounded-xl pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>

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
    </div>
  );
}
