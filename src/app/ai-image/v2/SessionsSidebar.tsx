"use client";

import {
  LayoutGrid,
  Plus,
  Clock,
  AlertCircle,
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
    "flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors";
  const tabActive = "bg-indigo-50 text-indigo-700";
  const tabIdle = "text-gray-500 hover:bg-gray-50 hover:text-gray-700";

  return (
    <aside
      ref={rootRef}
      style={{ width }}
      className="relative h-full border-r border-gray-200 bg-white overflow-y-auto shrink-0 flex flex-col"
    >
      <div
        onMouseDown={startDrag}
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 hover:bg-indigo-300/50 transition-colors"
      />

      {/* Tab header with hint style */}
      <div className="p-3 border-b border-gray-100 space-y-2">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-indigo-600 shrink-0" />
          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">记录</span>
              <span
                className="text-[10px] text-gray-300"
                title={`当前工作区 ${list.length} 条 / 共 ${totalCount} 条`}
              >
                {list.length}/{totalCount}
              </span>
            </div>
          )}
        </div>

        {/* Workspace tabs inline */}
        {!isCollapsed && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onChangeWorkspaceTab("product")}
              className={cn(tabItemBase, workspaceTab === "product" ? tabActive : tabIdle)}
              title="商品图"
            >
              <ImageLucide className="w-3.5 h-3.5" />
              商品图
            </button>
            <button
              type="button"
              onClick={() => onChangeWorkspaceTab("detail")}
              className={cn(tabItemBase, workspaceTab === "detail" ? tabActive : tabIdle)}
              title="商详图"
            >
              <LayersLucide className="w-3.5 h-3.5" />
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

      <div className="p-2 space-y-1">
        {list.map((s) => {
          const status = deriveSessionStatus(s);
          const isActive = s.id === activeSessionId;
          const statusLabel =
            status === "planning"
              ? "分析中"
              : status === "needs_review"
                ? "待确认"
                : status === "generating"
                  ? "生图中"
                  : status === "done"
                    ? "已完成"
                    : status === "failed"
                      ? "失败"
                      : "草稿";

          const statusColor =
            status === "failed"
              ? "bg-red-400"
              : status === "done"
                ? "bg-green-400"
                : status === "planning" || status === "generating"
                  ? "bg-amber-400"
                  : status === "needs_review"
                    ? "bg-blue-400"
                    : "bg-gray-300";

          const statusIcon =
            status === "planning" || status === "generating" ? (
              <Clock className="w-3 h-3" />
            ) : status === "failed" ? (
              <AlertCircle className="w-3 h-3" />
            ) : null;

          return (
            <div key={s.id} className="relative group">
              <button
                onClick={() => onSelectSession(s.id)}
                className={`w-full text-left rounded-lg px-2.5 py-2 border transition-all ${
                  isActive ? "bg-indigo-50 border-indigo-200" : "bg-white border-transparent hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {s.goal?.trim() ? (isCollapsed ? s.goal.trim().slice(0, 4) : s.goal.trim().slice(0, 18)) : "新会话"}
                    </div>
                    {!isCollapsed && (
                      <div className="text-xs text-gray-400 truncate">
                        {(s.workspaceTab || "product") === "detail"
                          ? (s.detail?.detailImageUrls?.length ? "已上传参考图" : "未上传参考图")
                          : (s.productImageUrls?.length ? "已上传商品图" : "未上传商品图")}
                      </div>
                    )}
                  </div>
                  {isCollapsed ? (
                    <span className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${statusColor}`} title={statusLabel} />
                  ) : (
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${
                        status === "failed"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : status === "done"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : status === "planning" || status === "generating"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : status === "needs_review"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      {statusIcon}
                      {statusLabel}
                    </span>
                  )}
                </div>
              </button>

              {!isCollapsed && (
                <div className="absolute right-2 bottom-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId((prev) => (prev === s.id ? null : s.id));
                    }}
                    className="inline-flex items-center justify-center w-6 h-6 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="更多操作"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {openMenuId === s.id && (
                    <div className="absolute right-0 bottom-7 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-20 w-32">
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
