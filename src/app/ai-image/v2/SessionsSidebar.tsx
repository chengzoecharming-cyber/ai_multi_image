"use client";

import {
  LayoutGrid,
  Plus,
  MoreHorizontal,
  Copy,
  Trash2,
  Image as ImageLucide,
  Layers as LayersLucide,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { V2Session, V2SessionStatus, V2WorkspaceTab } from "./types";

function deriveSessionStatus(session: V2Session): V2SessionStatus {
  if ((session.workspaceTab || "product") === "detail") {
    if ((session.detail?.failedTypes?.length || 0) > 0) return "failed";
    if (session.detail?.lastError) return "failed";
    if (session.detail?.generating) return "generating";
    if ((session.generatedImages?.filter((g) => (g.tab || "product") === "detail").length || 0) > 0) return "done";
    return "draft";
  }
  if (session.lastError) return "failed";
  if (session.generatingImage) return "generating";
  if (session.step === "generating") return "planning";
  if ((session.generatedImages?.length || 0) > 0) return "done";
  if ((session.singlePlans?.length || 0) > 0) {
    if (session.step === "plans" || session.step === "preview") return "needs_review";
  }
  return "draft";
}

const MIN_WIDTH = 80;
const DEFAULT_WIDTH = 220;
const MAX_WIDTH = 320;

function getSessionThumbnail(session: V2Session): string | null {
  // Prefer generated image, fallback to placeholder
  const genImg = session.generatedImages?.[0]?.imageUrl;
  if (genImg) return genImg;
  return null;
}

function getSessionTitle(session: V2Session): string {
  if (session.goal?.trim()) {
    const title = session.goal.trim().slice(0, 20);
    return session.goal.trim().length > 20 ? `${title}…` : title;
  }
  return "新会话";
}

export function SessionsSidebar({
  sessions,
  totalCount,
  activeSessionId,
  workspaceTab,
  onSelectSession,
  onCreateSession,
  onDuplicateSession,
  onDeleteSession,
  onChangeWorkspaceTab,
}: {
  sessions: V2Session[];
  totalCount: number;
  activeSessionId: string | null;
  workspaceTab: V2WorkspaceTab;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
  onDuplicateSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onChangeWorkspaceTab: (tab: V2WorkspaceTab) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(DEFAULT_WIDTH);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidthRef.current + delta));
      setWidth(newWidth);
      setIsCollapsed(newWidth < 140);
    };
    const onUp = () => {
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startDrag = (e: React.MouseEvent) => {
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const list = sessions;

  const tabItemBase =
    "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors";
  const tabActive = "bg-[rgb(235,236,237)] text-[#0f1419]";
  const tabIdle = "text-gray-500 hover:text-[#0f1419]";

  return (
    <aside
      ref={rootRef}
      style={{ width }}
      className="relative h-full border-r-[0.5px] border-gray-200 bg-white overflow-y-auto shrink-0 flex flex-col"
    >
      <div
        onMouseDown={startDrag}
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 hover:bg-stone-300/50 transition-colors"
      />

      {/* Top-level workspace tabs */}
      <div className="p-3 border-b border-gray-100 space-y-2">
        {!isCollapsed && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onChangeWorkspaceTab("product")}
              className={cn(tabItemBase, workspaceTab === "product" ? tabActive : tabIdle)}
              title="商品图"
            >
              <ImageLucide className="w-4 h-4" />
              商品图
            </button>
            <button
              type="button"
              onClick={() => onChangeWorkspaceTab("detail")}
              className={cn(tabItemBase, workspaceTab === "detail" ? tabActive : tabIdle)}
              title="商详图"
            >
              <LayersLucide className="w-4 h-4" />
              商详图
            </button>
          </div>
        )}

        {/* Small create button below tabs */}
        {!isCollapsed && (
          <button
            onClick={onCreateSession}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-[11px] font-medium transition-colors"
            title="新增记录"
          >
            <Plus className="w-3.5 h-3.5" />
            新增记录
          </button>
        )}
      </div>

      {/* Collapsed create button (icon only) */}
      {isCollapsed && (
        <div className="p-2 flex justify-center border-b border-gray-100">
          <button
            onClick={onCreateSession}
            className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-gray-100 text-gray-600 shrink-0"
            title="新增记录"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="p-1.5 space-y-0.5">
        {list.map((s) => {
          const isActive = s.id === activeSessionId;
          const thumbnail = getSessionThumbnail(s);
          const title = isCollapsed
            ? (s.goal?.trim()?.slice(0, 2) || "新")
            : getSessionTitle(s);

          return (
            <div key={s.id} className="relative group">
              <button
                onClick={() => onSelectSession(s.id)}
                className={cn(
                  "w-full text-left rounded-lg px-2 py-1.5 transition-colors flex items-center gap-2",
                  isActive
                    ? "bg-[rgb(235,236,237)] text-[#0f1419]"
                    : "hover:bg-gray-50"
                )}
              >
                {/* Thumbnail */}
                <div className="shrink-0 w-9 h-9 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <LayoutGrid className="w-4 h-4 text-gray-300" />
                  )}
                </div>

                {/* Title */}
                {!isCollapsed && (
                  <span className="text-[13px] text-gray-700 truncate flex-1 min-w-0">
                    {title}
                  </span>
                )}
              </button>

              {/* Hover overlay with more button */}
              {!isCollapsed && (
                <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId((prev) => (prev === s.id ? null : s.id));
                    }}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-100/90 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                    title="更多操作"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {openMenuId === s.id && (
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-20 w-32">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          onDuplicateSession(s.id);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-gray-700 hover:bg-gray-50"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        复制
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          onDeleteSession(s.id);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        删除
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
