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
  Bell,
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

const ANNOUNCEMENTS = [
  {
    id: "2026-06-10-detail-refresh",
    date: "2026-06-10",
    title: "商详图支持单图刷新重生成",
    content: "已生成的商详图类型旁新增刷新图标，点击可重新生成该类型图片（替换旧图）。同时优化了 prompt，使每次生成的构图更具多样性，并丰富了产品描述信息。",
  },
  {
    id: "2025-06-09-bilingual",
    date: "2025-06-09",
    title: "支持中英双语方案生成",
    content: "现在生成的方案会同时提供中文和英文版本，可在预览区切换语言显示。",
  },
  {
    id: "2025-06-09-lightbox",
    date: "2025-06-09",
    title: "图片双击放大",
    content: "所有图片区域支持双击放大查看，支持复制和下载。",
  },
  {
    id: "2025-06-09-white-border",
    date: "2025-06-09",
    title: "修复 1024x1024 白边问题",
    content: "优化了参考图预处理逻辑，消除生成图片两侧白边。",
  },
  {
    id: "2025-06-09-optional-copy",
    date: "2025-06-09",
    title: "文案字段可选化",
    content: "headline、sellingPoints 等文案字段改为可选，让模型拥有更大的创意自由度。",
  },
];

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
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>([]);
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

  useEffect(() => {
    try {
      const raw = localStorage.getItem("v2-announcements-read");
      if (raw) setReadIds(JSON.parse(raw));
    } catch {
      setReadIds([]);
    }
  }, []);

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

  const unreadCount = ANNOUNCEMENTS.filter((a) => !readIds.includes(a.id)).length;

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMessagesOpen(true)}
              className="relative flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
              title="消息通知"
            >
              <Bell className="w-4 h-4 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-4 text-[10px] font-bold text-white bg-red-500 rounded-full px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger>
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors cursor-pointer"
                  title={user.name || user.email || "用户菜单"}
                >
                  <User className="w-4 h-4" />
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
          </div>
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

      <Dialog open={messagesOpen} onOpenChange={setMessagesOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>消息通知</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {ANNOUNCEMENTS.map((msg) => {
              const isRead = readIds.includes(msg.id);
              return (
                <div
                  key={msg.id}
                  onClick={() => {
                    if (!isRead) {
                      const next = [...readIds, msg.id];
                      setReadIds(next);
                      localStorage.setItem("v2-announcements-read", JSON.stringify(next));
                    }
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isRead
                      ? "bg-gray-50 border-gray-100 opacity-70"
                      : "bg-white border-indigo-100 hover:bg-indigo-50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800">{msg.title}</span>
                    <span className="text-xs text-gray-400">{msg.date}</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{msg.content}</p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
