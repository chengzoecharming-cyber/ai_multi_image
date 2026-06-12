"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  LogOut,
  Users,
  User,
  Bell,
  Settings,
  Menu,
  X,
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
import { cn } from "@/lib/utils";
import { V2_NAV_ITEMS } from "./constants/navigation";

/* ── 消息中心 ─────────────────────────────────────── */

type Announcement = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  desc: string;
};

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "2026-06-11-message-center",
    date: "2026-06-11",
    title: "✨ 消息中心全新改版上线啦！",
    desc: "更清爽的卡片布局、更活泼的消息文案，新功能再也不怕错过～",
  },
  {
    id: "2026-06-10-detail-refresh",
    date: "2026-06-10",
    title: "🔄 商详图支持单图刷新",
    desc: "已生成的商详图可以单独点击刷新重新生成，每次都会带来不一样的构图创意！",
  },
  {
    id: "2025-06-09-bilingual",
    date: "2025-06-09",
    title: "🌍 中英双语方案一键切换",
    desc: "生成的方案自带中英双语，随时切换语言展示，出海营销快人一步！",
  },
  {
    id: "2025-06-09-lightbox",
    date: "2025-06-09",
    title: "🔍 双击图片就能放大查看",
    desc: "看到喜欢的图？直接双击放大，还能一键复制或下载，方便到不行！",
  },
  {
    id: "2025-06-09-white-border",
    date: "2025-06-09",
    title: "🛠️ 白边问题终于修好了！",
    desc: "1024×1024 尺寸的图片再也不会出现奇怪的白边了，画面更干净。",
  },
  {
    id: "2025-06-09-optional-copy",
    date: "2025-06-09",
    title: "🎨 文案限制解除，创意更自由",
    desc: "headline、sellingPoints 等字段改为可选，让 AI 拥有更大的发挥空间！",
  },
];

/** 按日期倒序排列 */
const SORTED_ANNOUNCEMENTS = [...ANNOUNCEMENTS].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

/** 读取已读的最晚日期（YYYY-MM-DD） */
function getReadDate(): string | null {
  try {
    return localStorage.getItem("v2-announcements-read-date");
  } catch {
    return null;
  }
}

/** 写入已读的最晚日期 */
function setReadDate(date: string) {
  try {
    localStorage.setItem("v2-announcements-read-date", date);
  } catch {
    /* ignore */
  }
}

/** 比较两个 YYYY-MM-DD 字符串 */
function dateGt(a: string, b: string): boolean {
  return a.replace(/-/g, "") > b.replace(/-/g, "");
}

export function V2Header() {
  const pathname = usePathname();
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  const readDate = getReadDate();
  const unreadCount = SORTED_ANNOUNCEMENTS.filter(
    (a) => !readDate || dateGt(a.date, readDate)
  ).length;

  const openMessages = useCallback(() => {
    setMessagesOpen(true);
    // 标记所有消息为已读（记录最晚一条的日期）
    const latest = SORTED_ANNOUNCEMENTS[0]?.date;
    if (latest) setReadDate(latest);
  }, []);

  const activeSlug = (() => {
    if (pathname === "/ai-image/v2" || pathname === "/ai-image/v2/") return "workbench";
    if (pathname.startsWith("/ai-image/v2/templates")) return "templates";
    if (pathname.startsWith("/ai-image/v2/assets")) return "assets";
    return undefined;
  })();

  return (
    <>
      <header className="sticky top-0 z-20 h-16 shrink-0 border-b border-stone-200 bg-white/90 backdrop-blur-xl dark:border-stone-800">
        <div className="mx-auto flex h-full max-w-7xl items-stretch justify-between gap-5 px-6">
          {/* Left: Logo + Nav */}
          <div className="flex min-w-0 items-center">
            <Link
              href="/"
              className="flex h-full shrink-0 items-center gap-2 text-sm font-semibold leading-none tracking-tight text-[#0f1419] transition hover:text-stone-600"
            >
              <img src="/logo.png" alt="AI制图" className="h-7 w-auto shrink-0" />
              <span className="text-base font-medium">AI制图</span>
            </Link>

            {/* Mobile menu button */}
            <button
              type="button"
              className="ml-3 inline-flex size-8 shrink-0 items-center justify-center text-[#536471] transition-colors hover:text-[#0f1419] active:text-[#0f1419] md:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="打开导航菜单"
              title="导航菜单"
            >
              <Menu className="size-5" />
            </button>

            {/* Desktop Nav */}
            <nav className="ml-8 hidden h-16 min-w-0 items-center gap-7 overflow-x-auto md:flex">
            {V2_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = item.slug === activeSlug;
              return (
                <Link
                  key={item.slug}
                  href={item.href}
                  className={cn(
                    "relative flex h-16 shrink-0 items-center gap-2 text-sm leading-6 transition after:absolute after:inset-x-0 after:bottom-0 after:h-px",
                    active
                      ? "font-medium text-[#0f1419] after:bg-[#0f1419]"
                      : "text-stone-500 after:bg-transparent hover:text-[#0f1419]"
                  )}
                >
                  <Icon className="size-4" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          </div>

          {/* Right: Message + User */}
          <div className="my-auto flex h-9 min-w-0 items-center justify-end gap-2 justify-self-end whitespace-nowrap">
            {isPending ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-gray-100" />
            ) : user ? (
              <div className="flex items-center gap-2">
                {/* Messages */}
                <button
                  onClick={openMessages}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full text-[#536471] transition-colors hover:text-[#0f1419] active:text-[#0f1419]"
                  title="消息通知"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <div
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#536471] transition-colors hover:text-[#0f1419] active:text-[#0f1419]"
                      title={user.name || user.email || "用户菜单"}
                    >
                      <User className="h-4 w-4" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="border-b border-gray-100 px-3 py-2 text-sm text-gray-500">
                      {user.email}
                    </div>
                    {/* Quota */}
                    <div className="px-3 py-2">
                      <span className="text-xs text-gray-400">剩余额度</span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "mt-0.5 border text-xs font-medium",
                          quotaExhausted
                            ? "border-red-100 bg-red-50 text-red-600"
                            : "border-stone-200 bg-stone-100 text-stone-600"
                        )}
                      >
                        {remainingQuota}/{quotaMax}
                      </Badge>
                    </div>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <>
                        <DropdownMenuItem className="cursor-pointer">
                          <Link href="/admin/users" className="flex w-full items-center gap-2">
                            <Users className="h-4 w-4" />
                            用户管理
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => setSettingsOpen(true)}
                      className="cursor-pointer"
                    >
                      <Settings className="h-4 w-4" />
                      设置
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      className="cursor-pointer text-red-600 focus:text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      登出
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Link
                href="/sign-in"
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
              >
                登录
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileNavOpen(false)}
        >
          <div
            className="absolute left-0 top-0 h-full w-64 bg-white p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 text-lg font-semibold text-[#0f1419]">AI制图</div>
            <nav className="flex flex-col gap-1">
              {V2_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = item.slug === activeSlug;
                return (
                  <Link
                    key={item.slug}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                      active
                        ? "bg-[rgb(235,236,237)] font-medium text-[#0f1419]"
                        : "text-stone-600 hover:bg-stone-50"
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Settings Dialog */}
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

      {/* Messages Slide-over Panel */}
      {messagesOpen && (
        <>
          {/* Panel */}
          <div className="fixed right-0 top-16 z-50 h-[calc(100vh-64px)] w-[380px] max-w-[90vw] bg-white shadow-[-16px_0_20px_-12px_rgba(0,0,0,0.14)] rounded-l-[12px] rounded-r-none flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <h2 className="text-[20px] font-medium text-[#0f1419]">消息中心</h2>
              <button
                onClick={() => setMessagesOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#536471] transition-colors hover:text-[#0f1419] active:text-[#0f1419]"
                aria-label="关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message list */}
            <div className="flex-1 overflow-y-auto px-3 pb-4">
              {SORTED_ANNOUNCEMENTS.map((msg) => {
                const isUnread = !readDate || dateGt(msg.date, readDate);
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex items-start gap-2 rounded-[8px] p-2 cursor-pointer transition-colors",
                      isUnread ? "bg-transparent" : "bg-transparent",
                      "hover:bg-[rgb(235,236,237)]"
                    )}
                  >
                    {/* Logo frame */}
                    <div className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center">
                      <img
                        src="/logo.png"
                        alt=""
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                    {/* Content */}
                    <div className="min-w-0 flex-1 py-[1px]">
                      <div className="text-[15px] font-medium text-[#0f1419] truncate leading-tight">
                        {msg.title}
                      </div>
                      <div className="mt-[2px] text-[12px] font-normal text-[var(--primary2)] line-clamp-3 leading-relaxed">
                        {msg.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
