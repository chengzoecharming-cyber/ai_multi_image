"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import {
  Users,
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Shield,
  User,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  imageQuota: number;
  imageQuotaMax: number;
  quotaResetHours: number;
  quotaResetAt: string | null;
  createdAt: string;
}

function formatResetHours(hours: number): string {
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  if (d > 0 && h > 0) return `${d}天${h}小时`;
  if (d > 0) return `${d}天`;
  return `${h}小时`;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const currentUser = session?.user;

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "user">("user");
  const [formQuotaMax, setFormQuotaMax] = useState(9999);
  const [formResetDays, setFormResetDays] = useState(1);
  const [formResetHours, setFormResetHours] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Redirect non-admin
  useEffect(() => {
    if (!isPending && currentUser && (currentUser as { role?: string }).role !== "admin") {
      router.replace("/");
    }
  }, [isPending, currentUser, router]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as { data?: AdminUser[] };
      setUsers(json.data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser && (currentUser as { role?: string }).role === "admin") {
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("user");
    setFormQuotaMax(9999);
    setFormResetDays(1);
    setFormResetHours(0);
    setModalOpen(true);
  };

  const openEdit = (u: AdminUser) => {
    setEditingUser(u);
    setFormName(u.name || "");
    setFormEmail(u.email);
    setFormPassword("");
    setFormRole(u.role as "admin" | "user");
    setFormQuotaMax(u.imageQuotaMax ?? 9999);
    const totalHours = u.quotaResetHours ?? 24;
    setFormResetDays(Math.floor(totalHours / 24));
    setFormResetHours(totalHours % 24);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) return;
    setSubmitting(true);
    try {
      const resetHours = formResetDays * 24 + formResetHours;
      if (editingUser) {
        const res = await fetch(`/api/admin/users/${editingUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            role: formRole,
            password: formPassword || undefined,
            imageQuotaMax: formQuotaMax,
            quotaResetHours: resetHours,
          }),
        });
        if (!res.ok) throw new Error("Update failed");
      } else {
        if (!formPassword.trim()) return;
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName,
            email: formEmail,
            password: formPassword,
            role: formRole,
            imageQuotaMax: formQuotaMax,
            quotaResetHours: resetHours,
          }),
        });
        if (!res.ok) throw new Error("Create failed");
      }
      setModalOpen(false);
      await fetchUsers();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除此用户？此操作不可恢复。")) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await fetchUsers();
    } catch {
      alert("删除失败");
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC]">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!currentUser || (currentUser as { role?: string }).role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC]">
        <p className="text-gray-500">无权访问</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FC]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Shield className="w-5 h-5 text-indigo-500" />
            <h1 className="text-base font-semibold text-gray-800">用户管理</h1>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" />
            新增用户
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600">用户</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">邮箱</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">角色</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">剩余/上限</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">重置周期</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">创建时间</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    加载中...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    暂无用户
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium text-gray-800">
                          {u.name || "未命名"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      {u.role === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Shield className="w-3 h-3" />
                          管理员
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                          用户
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className={u.imageQuota <= 0 ? "text-red-600 font-medium" : ""}>
                        {u.imageQuota}
                      </span>
                      <span className="text-gray-400 mx-1">/</span>
                      {u.imageQuotaMax}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatResetHours(u.quotaResetHours ?? 24)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(u.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "编辑用户" : "新增用户"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                名称
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="可选"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱 <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码 {editingUser ? "（留空不修改）" : <span className="text-red-500">*</span>}
              </label>
              <Input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder={editingUser ? "留空不修改" : "设置密码"}
                required={!editingUser}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                角色
              </label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value as "admin" | "user")}
                className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
              >
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                配额上限
              </label>
              <Input
                type="number"
                min={0}
                value={formQuotaMax}
                onChange={(e) => setFormQuotaMax(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                placeholder="9999"
              />
              <p className="text-xs text-gray-400 mt-1">每次重置后恢复的可用生图次数</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                重置周期
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 h-10 bg-white">
                    <Input
                      type="number"
                      min={0}
                      value={formResetDays}
                      onChange={(e) => setFormResetDays(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                      className="border-0 p-0 h-auto w-16 text-right"
                    />
                    <span className="text-sm text-gray-500">天</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 border border-gray-200 rounded-md px-3 h-10 bg-white">
                    <Input
                      type="number"
                      min={0}
                      max={23}
                      value={formResetHours}
                      onChange={(e) => setFormResetHours(Math.max(0, Math.min(23, Math.floor(Number(e.target.value) || 0))))}
                      className="border-0 p-0 h-auto w-16 text-right"
                    />
                    <span className="text-sm text-gray-500">小时</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">配额自动重置的时间间隔（默认24小时 = 1天0小时）</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "保存"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
