"use client";

import { LayoutGrid, Plus, Clock, AlertCircle } from "lucide-react";
import type { V2Session, V2SessionStatus } from "./types";

function deriveSessionStatus(session: V2Session): V2SessionStatus {
  if (session.lastError) return "failed";
  if (session.generatingImage) return "generating";
  if (session.step === "generating") return "planning";
  if ((session.singlePlans?.length || 0) > 0 || (session.setPlans?.length || 0) > 0) {
    if ((session.generatedImages?.length || 0) > 0) return "done";
    if (session.step === "plans" || session.step === "preview") return "needs_review";
  }
  return "draft";
}

export function SessionsSidebar({
  sessions,
  activeSession,
  onSelectSession,
  onCreateSession,
}: {
  sessions: V2Session[];
  activeSession: V2Session | undefined;
  onSelectSession: (id: string) => void;
  onCreateSession: () => void;
}) {
  return (
    <aside className="w-[260px] border-r border-gray-200 bg-white overflow-y-auto shrink-0">
      <div className="p-4 flex items-center justify-between gap-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-gray-800">会话</span>
        </div>
        <button
          onClick={onCreateSession}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-100 text-gray-600"
          title="新建会话"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="p-2 space-y-1">
        {sessions.map((s) => {
          const status = deriveSessionStatus(s);
          const isActive = s.id === activeSession?.id;
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
          const statusIcon =
            status === "planning" || status === "generating" ? (
              <Clock className="w-3.5 h-3.5" />
            ) : status === "failed" ? (
              <AlertCircle className="w-3.5 h-3.5" />
            ) : null;

          return (
            <button
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className={`w-full text-left rounded-lg px-3 py-2 border transition-all ${
                isActive ? "bg-indigo-50 border-indigo-200" : "bg-white border-transparent hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {s.goal?.trim() ? s.goal.trim().slice(0, 18) : "新会话"}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {s.productImageUrl ? "已上传商品图" : "未上传商品图"} · {s.mode === "set" ? "组图" : "单图"}
                  </div>
                </div>
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
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
