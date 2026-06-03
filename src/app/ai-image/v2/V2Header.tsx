"use client";

import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  BookOpen,
  Images,
  LogOut,
  Users,
  User,
  ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSession, signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function V2Header({
  onOpenTemplateLibrary,
  onOpenImageGallery,
}: {
  onOpenTemplateLibrary: () => void;
  onOpenImageGallery?: () => void;
}) {
  const { data: session, isPending } = useSession();
  const user = session?.user as
    | ({
        id?: string;
        name?: string | null;
        email?: string;
        role?: string;
        imageQuota?: number;
        imageQuotaMax?: number;
        quotaResetHours?: number;
        quotaResetAt?: string;
      })
    | undefined;

  const remainingQuota = user?.imageQuota ?? 9999;
  const quotaMax = user?.imageQuotaMax ?? 9999;
  const quotaExhausted = remainingQuota <= 0;

  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-gray-200 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-semibold text-gray-800">AI 制图工作台</span>
        <Badge variant="secondary" className="text-xs font-medium bg-indigo-50 text-indigo-600 border-indigo-100">V2 任务式</Badge>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenImageGallery}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          <Images className="w-4 h-4" />图片库
        </button>
        <button
          onClick={onOpenTemplateLibrary}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          <BookOpen className="w-4 h-4" />方案模板库
        </button>
        <Link href="/" className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100">
          <ArrowLeft className="w-4 h-4" />返回首页
        </Link>

        {isPending ? (
          <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:inline max-w-[120px] truncate">
                  {user.name || user.email}
                </span>
                <span
                  className={`hidden sm:inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full border ${
                    quotaExhausted
                      ? "bg-red-50 text-red-600 border-red-200"
                      : remainingQuota <= 5
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : "bg-gray-50 text-gray-500 border-gray-200"
                  }`}
                  title="剩余生图配额"
                >
                  <ImageIcon className="w-3 h-3" />
                  {remainingQuota}/{quotaMax}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-3 py-2 text-sm text-gray-500 border-b border-gray-100">
                {user.email}
              </div>
              <div className="px-3 py-2 text-xs text-gray-500 flex items-center gap-1.5">
                <ImageIcon className="w-3 h-3" />
                剩余配额：
                <span className={quotaExhausted ? "text-red-600 font-medium" : "text-gray-700 font-medium"}>
                  {remainingQuota}/{quotaMax}
                </span>
              </div>
              {(user as { role?: string }).role === "admin" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <Link href="/admin/users" className="flex items-center gap-2 w-full">
                      <Users className="w-4 h-4" />
                      用户管理
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <LogOut className="w-4 h-4" />
                登出
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/sign-in"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            登录
          </Link>
        )}
      </div>
    </header>
  );
}
