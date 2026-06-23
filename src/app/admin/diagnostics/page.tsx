"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw, Search, Shield, Terminal } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DiagnosticTask {
  id: string;
  provider: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  sessionId: string | null;
  planId: string | null;
  source: string | null;
  detailType: string | null;
  model: string | null;
  size: string;
  productImageCount: number;
  styleReferenceCount: number;
  availableReferenceCount: number;
  productImageUrls: string[];
  styleReferenceUrls: string[];
  availableReferenceUrls: string[];
  resultUrls: string[];
  promptPreview: string;
  authorizationCode: {
    code: string;
    note: string | null;
    userEmail: string | null;
    userName: string | null;
  } | null;
}

interface DiagnosticsResponse {
  data: DiagnosticTask[];
  summary: {
    total: number;
    byStatus: Record<string, number>;
    byProvider: Record<string, number>;
  };
}

const statusOptions = [
  { value: "all", label: "全部状态" },
  { value: "processing", label: "处理中" },
  { value: "completed", label: "成功" },
  { value: "failed", label: "失败" },
  { value: "pending", label: "等待中" },
];

const providerOptions = [
  { value: "all", label: "全部 provider" },
  { value: "chatgpt2api", label: "chatgpt2api" },
  { value: "volcano", label: "volcano" },
];

function formatTime(raw: string): string {
  return new Date(raw).toLocaleString("zh-CN", { hour12: false });
}

function statusClass(status: string): string {
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "failed") return "border-red-200 bg-red-50 text-red-700";
  if (status === "processing") return "border-blue-200 bg-blue-50 text-blue-700";
  return "border-stone-200 bg-stone-50 text-stone-700";
}

function CountCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-4 py-3">
      <div className="text-xs text-[#72808a]">{label}</div>
      <div className="mt-1 text-xl font-semibold text-[#0f1419]">{value}</div>
    </div>
  );
}

function UrlList({ title, urls }: { title: string; urls: string[] }) {
  if (urls.length === 0) return null;
  return (
    <div>
      <div className="mb-1 text-xs font-medium text-[#72808a]">{title} ({urls.length})</div>
      <div className="space-y-1">
        {urls.map((url, index) => (
          <div key={`${url}-${index}`} className="truncate rounded border border-stone-100 bg-stone-50 px-2 py-1 text-xs text-[#34404a]" title={url}>
            {index + 1}. {url}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDiagnosticsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const currentUser = session?.user as { role?: string } | undefined;
  const [status, setStatus] = useState("all");
  const [provider, setProvider] = useState("all");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DiagnosticsResponse | null>(null);

  useEffect(() => {
    if (!isPending && currentUser && currentUser.role !== "admin") {
      router.replace("/ai-image/v2");
    }
  }, [currentUser, isPending, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50", status, provider });
      if (sessionId.trim()) params.set("sessionId", sessionId.trim());
      const res = await fetch(`/api/admin/image-diagnostics?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "加载诊断数据失败");
      setData(json as DiagnosticsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载诊断数据失败");
    } finally {
      setLoading(false);
    }
  }, [provider, sessionId, status]);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      void load();
    }
  }, [currentUser?.role, load]);

  const failedCount = data?.summary.byStatus.failed || 0;
  const completedCount = data?.summary.byStatus.completed || 0;
  const processingCount = data?.summary.byStatus.processing || 0;

  const tasks = useMemo(() => data?.data || [], [data]);

  if (isPending) {
    return <main className="min-h-screen bg-[#f7f8fa] px-6 py-8 text-[#0f1419]">加载中...</main>;
  }

  if (!currentUser || currentUser.role !== "admin") {
    return <main className="min-h-screen bg-[#f7f8fa] px-6 py-8 text-[#0f1419]">无权限</main>;
  }

  return (
    <main className="min-h-screen bg-[#f7f8fa] px-6 py-8 text-[#0f1419]">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/users" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-white text-[#34404a]">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-[#72808a]">
                <Shield className="h-3.5 w-3.5" />
                管理员诊断
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-normal">生成任务诊断</h1>
            </div>
          </div>
          <Button onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <CountCard label="任务数" value={data?.summary.total ?? 0} />
          <CountCard label="成功" value={completedCount} />
          <CountCard label="失败" value={failedCount} />
          <CountCard label="处理中" value={processingCount} />
        </div>

        <section className="rounded-lg border border-stone-200 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[180px_180px_1fr_auto] md:items-end">
            <div className="space-y-1.5">
              <Label>状态</Label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm">
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Provider</Label>
              <select value={provider} onChange={(e) => setProvider(e.target.value)} className="h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-sm">
                {providerOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Session ID</Label>
              <Input value={sessionId} onChange={(e) => setSessionId(e.target.value)} placeholder="可选：按 sessionId 过滤" />
            </div>
            <Button onClick={load} disabled={loading} variant="outline" className="gap-2">
              <Search className="h-4 w-4" />
              查询
            </Button>
          </div>
          {error && <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        </section>

        <section className="space-y-3">
          {tasks.map((task) => (
            <article key={task.id} className="rounded-lg border border-stone-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(task.status)}`}>{task.status}</span>
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs text-[#34404a]">{task.provider}</span>
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs text-[#34404a]">{task.model || "default"} · {task.size}</span>
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs text-[#34404a]">images {task.productImageCount}</span>
                  </div>
                  <div className="mt-2 truncate font-mono text-xs text-[#72808a]">{task.id}</div>
                  <div className="mt-1 text-sm text-[#34404a]">{formatTime(task.createdAt)}</div>
                </div>
                <div className="text-right text-xs text-[#72808a]">
                  <div>{task.authorizationCode?.userEmail || "无用户"}</div>
                  <div>{task.authorizationCode?.note || task.authorizationCode?.code || ""}</div>
                </div>
              </div>

              {task.errorMessage && (
                <div className="mt-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{task.errorMessage}</div>
              )}

              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div className="rounded-md border border-stone-100 bg-stone-50 p-3">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#72808a]">
                    <Terminal className="h-3.5 w-3.5" />
                    Prompt
                  </div>
                  <div className="line-clamp-4 whitespace-pre-wrap text-sm text-[#34404a]">{task.promptPreview || "无"}</div>
                </div>
                <div className="space-y-3">
                  <UrlList title="productImageUrls" urls={task.productImageUrls} />
                  <UrlList title="styleReferenceUrls" urls={task.styleReferenceUrls} />
                  <UrlList title="resultUrls" urls={task.resultUrls} />
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-[#72808a] md:grid-cols-3">
                <div className="truncate">session: {task.sessionId || "无"}</div>
                <div className="truncate">plan: {task.planId || "无"}</div>
                <div className="truncate">source: {task.source || task.detailType || "无"}</div>
              </div>
            </article>
          ))}

          {tasks.length === 0 && (
            <div className="rounded-lg border border-stone-200 bg-white p-8 text-center text-sm text-[#72808a]">暂无任务</div>
          )}
        </section>
      </div>
    </main>
  );
}
