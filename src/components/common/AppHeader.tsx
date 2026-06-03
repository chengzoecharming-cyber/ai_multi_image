"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  LayoutDashboard,
  Wand2,
  FolderOpen,
  LogOut,
  Users,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/", label: "首页", icon: LayoutDashboard },
  { href: "/ai-image/workbench", label: "AI 商品图", icon: Wand2 },
  { href: "/ai-image/prompt-groups", label: "模板管理", icon: FolderOpen },
];

export default function AppHeader() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-14 px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold text-gray-800">AI 商品图</span>
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
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
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2 text-sm text-gray-500 border-b border-gray-100">
                  {user.email}
                </div>
                {(user as { role?: string }).role === "admin" && (
                  <>
                    <DropdownMenuItem className="cursor-pointer">
                      <Link href="/admin/users" className="flex items-center gap-2 w-full">
                        <Users className="w-4 h-4" />
                        用户管理
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
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
            <Link href="/sign-in">
              <Button variant="outline" size="sm">登录</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
