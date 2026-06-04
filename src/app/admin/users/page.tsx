"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronRight, Loader2, Pencil, Plus, RefreshCw, Shield, Trash2, User } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BoundUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface AuthorizationCodeRow {
  id: string;
  code: string;
  status: string;
  effectiveStatus: string;
  quota: number;
  quotaMax: number;
  resetHours: number;
  resetAt: string | null;
  note: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  user: BoundUser | null;
}

interface AdminGroup {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  authorizationCodes: AuthorizationCodeRow[];
}

interface AdminCodesResponse {
  currentAdminId: string;
  admins: AdminGroup[];
}

const STATUS_LABELS: Record<string, string> = {
  normal: "正常",
  limited: "限流",
  error: "异常",
  disabled: "禁用",
};

const STATUS_CLASSES: Record<string, string> = {
  normal: "bg-emerald-50 text-emerald-700 border-emerald-200",
  limited: "bg-amber-50 text-amber-700 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  disabled: "bg-gray-100 text-gray-500 border-gray-200",
};

function formatResetAt(raw: string | null): { short: string; full: string } {
  if (!raw) return { short: "未设置", full: "" };
  const date = new Date(raw);
  const ms = date.getTime() - Date.now();
  const hours = Math.max(0, Math.ceil(ms / (1000 * 60 * 60)));
  return {
    short: `${hours}h`,
    full: date.toLocaleString("zh-CN", { hour12: false }),
  };
}

function formatHours(hours: number): string {
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  if (days && rest) return `${days}天${rest}小时`;
  if (days) return `${days}天`;
  return `${rest}小时`;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const currentUser = session?.user as { id?: string; role?: string; email?: string; name?: string | null } | undefined;
  const [data, setData] = useState<AdminCodesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<AuthorizationCodeRow | null>(null);
  const [quotaMax, setQuotaMax] = useState(50);
  const [resetHours, setResetHours] = useState(24);
  const [batchCount, setBatchCount] = useState(1);
  const [status, setStatus] = useState("normal");
  const [note, setNote] = useState("");
  const [bindEmail, setBindEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isPending && currentUser && currentUser.role !== "admin") {
      router.replace("/");
    }
  }, [isPending, currentUser, router]);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/authorization-codes");
      if (!res.ok) throw new Error("Failed");
      const json = (await res.json()) as { data?: AdminCodesResponse };
      setData(json.data || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      fetchCodes();
    }
  }, [currentUser?.role, fetchCodes]);

  const currentAdmin = useMemo(
    () => data?.admins.find((admin) => admin.id === data.currentAdminId) || null,
    [data]
  );
  const otherAdmins = useMemo(
    () => (data?.admins || []).filter((admin) => admin.id !== data?.currentAdminId),
    [data]
  );

  const openCreate = () => {
    setEditingCode(null);
    setQuotaMax(50);
    setResetHours(24);
    setBatchCount(1);
    setStatus("normal");
    setNote("");
    setBindEmail("");
    setCodeModalOpen(true);
  };

  const openEdit = (row: AuthorizationCodeRow) => {
    setEditingCode(row);
    setQuotaMax(row.quotaMax);
    setResetHours(row.resetHours);
    setStatus(row.status);
    setNote(row.note || "");
    setBindEmail(row.user?.email || "");
    setCodeModalOpen(true);
  };

  const handleSaveCode = async () => {
    setSubmitting(true);
    try {
      if (editingCode) {
        const res = await fetch(`/api/admin/authorization-codes/${editingCode.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quotaMax, resetHours, status, note, userEmail: bindEmail }),
        });
        if (!res.ok) throw new Error("Update failed");
      } else {
        const res = await fetch("/api/admin/authorization-codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quotaMax, resetHours, note, count: batchCount }),
        });
        if (!res.ok) throw new Error("Create failed");
      }
      setCodeModalOpen(false);
      await fetchCodes();
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async (id: string) => {
    await fetch(`/api/admin/authorization-codes/${id}/refresh`, { method: "POST" });
    await fetchCodes();
  };

  const handleDeleteCode = async (id: string) => {
    if (!confirm("确定删除此授权码？删除后授权码立即失效。")) return;
    await fetch(`/api/admin/authorization-codes/${id}`, { method: "DELETE" });
    await fetchCodes();
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC]">
        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F8FC]">
        <p className="text-gray-500">无权访问</p>
      </div>
    );
  }

  const renderCodeTable = (rows: AuthorizationCodeRow[]) => (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="w-full min-w-[920px] text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left font-medium text-gray-600">授权码</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">状态</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">绑定用户</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">额度</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">恢复时间</th>
            <th className="px-4 py-3 text-left font-medium text-gray-600">备注</th>
            <th className="px-4 py-3 text-right font-medium text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-gray-400">暂无授权码</td>
            </tr>
          ) : (
            rows.map((row) => {
              const resetAt = formatResetAt(row.resetAt);
              const effectiveStatus = row.effectiveStatus || row.status;
              return (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/60">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800">{row.code}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded border text-xs font-medium ${STATUS_CLASSES[effectiveStatus] || STATUS_CLASSES.normal}`}>
                      {STATUS_LABELS[effectiveStatus] || effectiveStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {row.user ? (
                      <div>
                        <div className="font-medium text-gray-800">{row.user.name || "未命名"}</div>
                        <div className="text-xs text-gray-400">{row.user.email}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">未绑定</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.quota}/{row.quotaMax}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{resetAt.short}</div>
                    {resetAt.full && <div className="text-xs text-gray-400">{resetAt.full}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-[220px] truncate">{row.note || "无"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(row)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleRefresh(row.id)}><RefreshCw className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteCode(row.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );

  const renderAdminSection = (admin: AdminGroup, isCurrent = false) => {
    const isCollapsed = collapsed[admin.id] ?? !isCurrent;
    return (
      <section key={admin.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <button
          onClick={() => setCollapsed((prev) => ({ ...prev, [admin.id]: !isCollapsed }))}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              {isCurrent ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-800">{isCurrent ? "本账号" : admin.name || "管理员"}</div>
              <div className="text-xs text-gray-400">{admin.email} · {admin.authorizationCodes.length} 个授权码</div>
            </div>
          </div>
          {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {!isCollapsed && <div className="p-5 pt-0">{renderCodeTable(admin.authorizationCodes)}</div>}
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC]">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Shield className="w-5 h-5 text-indigo-500" />
            <h1 className="text-base font-semibold text-gray-800">授权码管理</h1>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" />
            生成授权码
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {currentAdmin && renderAdminSection(currentAdmin, true)}
        {otherAdmins.map((admin) => renderAdminSection(admin))}
      </main>

      <Dialog open={codeModalOpen} onOpenChange={setCodeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCode ? `编辑授权码 ${editingCode.code}` : "生成授权码"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editingCode && (
              <div className="space-y-1.5">
                <Label>状态</Label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm">
                  <option value="normal">正常</option>
                  <option value="limited">限流</option>
                  <option value="error">异常</option>
                  <option value="disabled">禁用</option>
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>配额上限</Label>
              <Input type="number" min={0} value={quotaMax} onChange={(e) => setQuotaMax(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
            </div>
            {!editingCode && (
              <div className="space-y-1.5">
                <Label>生成数量</Label>
                <Input type="number" min={1} max={100} value={batchCount} onChange={(e) => setBatchCount(Math.min(100, Math.max(1, Math.floor(Number(e.target.value) || 1))))} />
                <p className="text-xs text-gray-400">最多一次生成 100 个授权码</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>重置时间（小时）</Label>
              <Input type="number" min={1} value={resetHours} onChange={(e) => setResetHours(Math.max(1, Math.floor(Number(e.target.value) || 1)))} />
              <p className="text-xs text-gray-400">当前：{formatHours(resetHours)}</p>
            </div>
            {editingCode && (
              <div className="space-y-1.5">
                <Label>换绑用户邮箱</Label>
                <Input value={bindEmail} onChange={(e) => setBindEmail(e.target.value)} placeholder="留空为解绑" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>备注</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="用途、客户、项目等" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCodeModalOpen(false)}>取消</Button>
              <Button onClick={handleSaveCode} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
