"use client";

import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import type { V2Session } from "../types";

export function AuthCodeAuditCard({
  authorizationCode,
}: {
  authorizationCode: V2Session["authorizationCode"];
}) {
  const { data: session } = useSession();
  const currentUser = session?.user as { role?: string } | undefined;
  const isAdmin = currentUser?.role === "admin";

  if (!isAdmin || !authorizationCode?.code) return null;

  const authStatus =
    authorizationCode.status === "normal" && (authorizationCode.quota ?? 1) <= 0
      ? "limited"
      : authorizationCode.status;
  const statusDotClass =
    authStatus === "disabled"
      ? "bg-gray-400"
      : authStatus === "error"
        ? "bg-red-500"
        : authStatus === "limited"
          ? "bg-amber-400"
          : "bg-emerald-500";
  const resetTime = authorizationCode.resetAt
    ? new Date(authorizationCode.resetAt).toLocaleString("zh-CN", { hour12: false })
    : "未设置";

  return (
    <div className="group rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 hover:bg-white hover:border-indigo-200 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full shrink-0", statusDotClass)} />
          <span className="font-mono text-sm font-semibold text-gray-800">
            {authorizationCode.code}
          </span>
        </div>
        <span className="text-xs text-gray-500 truncate max-w-[120px]">
          {authorizationCode.user?.name || "未绑定用户"}
        </span>
      </div>
      <div className="hidden group-hover:grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
        <div className="rounded-md border border-gray-100 bg-white px-2 py-1.5">
          <div className="text-[10px] text-gray-400">用户邮箱</div>
          <div className="text-xs text-gray-700 truncate">{authorizationCode.user?.email || "未绑定"}</div>
        </div>
        <div className="rounded-md border border-gray-100 bg-white px-2 py-1.5">
          <div className="text-[10px] text-gray-400">备注</div>
          <div className="text-xs text-gray-700 truncate">{authorizationCode.note || "无"}</div>
        </div>
        <div className="rounded-md border border-gray-100 bg-white px-2 py-1.5">
          <div className="text-[10px] text-gray-400">配额</div>
          <div className="text-xs text-gray-700">{authorizationCode.quota ?? "-"} / {authorizationCode.quotaMax ?? "-"}</div>
        </div>
        <div className="rounded-md border border-gray-100 bg-white px-2 py-1.5">
          <div className="text-[10px] text-gray-400">重置时间</div>
          <div className="text-xs text-gray-700 truncate">{resetTime}</div>
        </div>
      </div>
    </div>
  );
}
