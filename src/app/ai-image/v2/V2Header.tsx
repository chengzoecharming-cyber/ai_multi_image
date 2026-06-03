"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Sparkles,
  ArrowLeft,
  BookOpen,
  Images,
  LogOut,
  Users,
  User,
  ImageIcon,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [scopeInfo, setScopeInfo] = useState<{
    role: string;
    authorizationCode: {
      code: string;
      status: string;
      quota: number;
      quotaMax: number;
      hoursUntilReset: number;
    } | null;
  } | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsName, setSettingsName] = useState("");
  const [settingsPassword, setSettingsPassword] = useState("");
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

  useEffect(() => {
    if (!user) return;
    setSettingsName(user.name || "");
    fetch("/api/auth-code/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: { data?: typeof scopeInfo } | null) => setScopeInfo(json?.data || null))
      .catch(() => setScopeInfo(null));
  }, [user?.id]);

  const isAdmin = scopeInfo?.role === "admin" || user?.role === "admin";
  const remainingQuota = isAdmin ? (user?.imageQuota ?? 9999) : (scopeInfo?.authorizationCode?.quota ?? 0);
  const quotaMax = isAdmin ? (user?.imageQuotaMax ?? 9999) : (scopeInfo?.authorizationCode?.quotaMax ?? 0);
  const quotaExhausted = remainingQuota <= 0;

  const handleSaveSettings = async () => {
    const res = await fetch("/api/auth-code/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: settingsName, password: settingsPassword }),
    });
    if (res.ok) {
      setSettingsPassword("");
      setSettingsOpen(false);
      window.location.reload();
    }
  };

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
              {isAdmin && (
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
              {!isAdmin && (
                <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100">
                  24h
                  <span className={quotaExhausted ? "ml-1 text-red-600 font-medium" : "ml-1 text-gray-700 font-medium"}>
                    {remainingQuota}次
                  </span>
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setSettingsOpen(true)}
                className="cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                设置
              </DropdownMenuItem>
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
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>设置</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="settings-name">用户名</Label>
              <Input id="settings-name" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-password">密码</Label>
              <Input
                id="settings-password"
                type="password"
                value={settingsPassword}
                onChange={(e) => setSettingsPassword(e.target.value)}
                placeholder="留空不修改"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>取消</Button>
              <Button onClick={handleSaveSettings}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
