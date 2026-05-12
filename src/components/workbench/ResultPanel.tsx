"use client";

import { useState } from "react";
import {
  ImageIcon,
  Loader2,
  Download,
  RefreshCw,
  Wand2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageTask } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface ResultPanelProps {
  latestTask: ImageTask | null;
  onRetry: (taskId: string) => void;
}

export default function ResultPanel({ latestTask, onRetry }: ResultPanelProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleDownload = async () => {
    if (!latestTask?.resultImageUrl) return;
    try {
      const res = await fetch(latestTask.resultImageUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generated-${latestTask.id.slice(0, 8)}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(latestTask.resultImageUrl, "_blank");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">等待中</Badge>;
      case "processing":
        return <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">生成中</Badge>;
      case "completed":
        return <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">已完成</Badge>;
      case "failed":
        return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">失败</Badge>;
      default:
        return null;
    }
  };

  // Empty state
  if (!latestTask) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white p-8">
        <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
          <ImageIcon className="w-8 h-8 text-gray-300" />
        </div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">暂无生成结果</h3>
        <p className="text-xs text-gray-400 text-center max-w-[200px]">
          在中间编辑区填写 Prompt 并点击生成图片
        </p>
      </div>
    );
  }

  const config = latestTask.configSnapshot as unknown as Record<string, unknown>;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-700">生成结果</h2>
        {getStatusBadge(latestTask.status)}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* Generating State */}
        {latestTask.status === "processing" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 animate-pulse" />
              <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-indigo-500 animate-spin" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">正在生成图片</p>
            <p className="text-xs text-gray-400">请稍候，大约需要几秒钟...</p>
          </div>
        )}

        {/* Failed State */}
        {latestTask.status === "failed" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">生成失败</p>
            <p className="text-xs text-red-400 text-center max-w-[220px] mb-4">
              {latestTask.errorMessage || "未知错误"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetry(latestTask.id)}
              className="border-gray-300"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              重新生成
            </Button>
          </div>
        )}

        {/* Completed State */}
        {latestTask.status === "completed" && latestTask.resultImageUrl && (
          <div className="space-y-4">
            {/* Image Preview */}
            <div
              className="relative rounded-xl border border-gray-200 overflow-hidden bg-gray-50 cursor-pointer group"
              onClick={() => setPreviewOpen(true)}
            >
              <img
                src={latestTask.resultImageUrl}
                alt="生成结果"
                className="w-full h-auto object-contain"
              />
              <div className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-4 h-4" />
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2.5 bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                <span className="truncate">
                  {latestTask.promptSnapshot}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {String(config?.width || "")}×{String(config?.height || "")}
                </span>
                <span>比例 {String(config?.ratio || "")}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                variant="outline"
                className="flex-1 h-9 text-sm border-gray-300"
              >
                <Download className="w-4 h-4 mr-1.5" />
                下载图片
              </Button>
              <Button
                onClick={() => onRetry(latestTask.id)}
                variant="outline"
                className="flex-1 h-9 text-sm border-gray-300"
              >
                <RefreshCw className="w-4 h-4 mr-1.5" />
                重新生成
              </Button>
            </div>
          </div>
        )}

        {/* Pending State */}
        {latestTask.status === "pending" && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">等待处理</p>
            <p className="text-xs text-gray-400">任务正在排队...</p>
          </div>
        )}
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/95 border-0">
          <DialogTitle className="sr-only">图片预览</DialogTitle>
          {latestTask.resultImageUrl && (
            <img
              src={latestTask.resultImageUrl}
              alt="生成结果预览"
              className="w-full h-auto"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
