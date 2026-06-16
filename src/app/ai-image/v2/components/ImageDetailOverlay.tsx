"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  X,
  Download,
  Heart,
  Wand2,
  RefreshCw,
  MapPin,
  AlertCircle,
  Grid3x3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CreativePlan } from "../types";

import { GBG, P0, P2 } from "../design-tokens";

export type ImageDetailStatus = "loading" | "success" | "error";

export interface ImageDetailData {
  imageUrl: string;
  prompt?: string | null;
  referenceImageUrls?: string[];
  productImageUrls?: string[];
  plan?: CreativePlan | null;
  /** 图片来源/类型 */
  source?: "product" | "detail" | "asset" | "gallery";
  /** 图片库素材的额外信息 */
  createdAt?: string;
  taskId?: string;
  /** 状态：loading 生成中, success 成功, error 失败 */
  status?: ImageDetailStatus;
  /** 错误信息（status=error 时展示） */
  errorMessage?: string;
}

export { ImageDetailOverlay as default };

interface ImageDetailOverlayProps {
  data: ImageDetailData | null;
  onClose: () => void;
  onRetry?: (plan: CreativePlan) => void;
  onGenerateDetails?: (plan: CreativePlan | null, imageUrl: string) => void;
}

/* ── Lightbox for reference thumbnails ── */
function Lightbox({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      <div onClick={(e) => e.stopPropagation()}>
        <img
          src={imageUrl}
          alt=""
          className="max-w-[85vw] max-h-[80vh] object-contain rounded-lg"
        />
      </div>
    </div>
  );
}

/* ── Action group button ── */
function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-[#0f1419] hover:bg-gray-50 transition-colors rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

function ImageDetailOverlay({
  data,
  onClose,
  onRetry,
  onGenerateDetails,
}: ImageDetailOverlayProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset imageLoaded when imageUrl changes
  useEffect(() => {
    setImageLoaded(false);
  }, [data?.imageUrl]);

  const openLightbox = useCallback((url: string) => setLightboxUrl(url), []);
  const closeLightbox = useCallback(() => setLightboxUrl(null), []);

  const handleDownload = useCallback(async () => {
    if (!data?.imageUrl || data.status === "loading" || data.status === "error") return;
    try {
      const source = data.imageUrl;
      if (source.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = source;
        a.download = `image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("下载已开始");
        return;
      }
      const res = await fetch(source);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("下载已开始");
    } catch {
      toast.error("下载失败，请重试");
    }
  }, [data?.imageUrl, data?.status]);

  const handleFavorite = useCallback(() => {
    if (data?.status === "loading" || data?.status === "error") return;
    setFavorited((v) => {
      const next = !v;
      toast.success(next ? "已收藏" : "已取消收藏");
      return next;
    });
  }, [data?.status]);

  const handleRetry = useCallback(() => {
    if (data?.plan && onRetry) {
      onRetry(data.plan);
    }
  }, [data?.plan, onRetry]);

  // Parse prompt lines for display
  const promptLines = useMemo(() => {
    if (!data?.prompt) return [];
    const text = data.prompt.trim();
    if (text.length > 200) {
      return text
        .split(/(?<=[.!?。！？])\s+|\n+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [text];
  }, [data?.prompt]);

  const refs = data?.referenceImageUrls || [];

  if (!data) return null;

  const status = data.status || "success";
  const isLoading = status === "loading";
  const isError = status === "error";
  const isSuccess = status === "success";

  return (
    <>
      {/* Full-screen overlay */}
      <div
        className="fixed inset-0 z-[90] flex"
        style={{ backgroundColor: GBG, padding: 24 }}
      >
        {/* ── Left: Image area (5 parts) ── */}
        <div
          className="relative flex items-center justify-center"
          style={{ flex: 5 }}
        >
          {/* Close button — top-right of left area */}
          <button
            onClick={onClose}
            className="absolute top-0 right-0 z-10 flex items-center justify-center rounded-lg transition-colors bg-bbg hover:bg-bbg-hover"
            style={{ width: 40, height: 40 }}
            title="关闭"
          >
            <X className="w-5 h-5" style={{ color: P0 }} />
          </button>

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-4">
              <LoadingPlaceholder width={121} height={121} />
              <p className="text-base font-medium text-gray-600">AI 正在生成图片...</p>
              <p className="text-xs text-gray-400">约需 30-60 秒，请耐心等待</p>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-base font-medium text-gray-700">图片生成失败</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-bbg hover:bg-bbg-hover text-[#0f1419]"
              >
                <RefreshCw className="w-4 h-4" />
                重新生成
              </button>
            </div>
          )}

          {/* Success state */}
          {isSuccess && (
            <div
              className="flex items-center justify-center"
              style={{
                maxHeight: "calc(100vh - 48px)",
                maxWidth: "calc(100% - 120px)",
                padding: "0 60px",
              }}
            >
              {!imageLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <LoadingPlaceholder width={121} height={121} />
                  <p className="text-sm text-gray-400">图片加载中...</p>
                </div>
              )}
              <img
                src={data.imageUrl}
                alt=""
                className={cn(
                  "object-contain rounded-lg shadow-sm transition-opacity duration-300",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                style={{
                  maxHeight: "calc(100vh - 48px)",
                  maxWidth: "100%",
                }}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
              />
            </div>
          )}
        </div>

        {/* ── Right: Info area (2 parts) ── */}
        <div className="flex flex-col overflow-hidden" style={{ flex: 2, marginLeft: 24 }}>
          {/* 1. Top action bar — fixed, does not scroll */}
          <div className="flex items-center justify-between mb-5 shrink-0">
            <button
              onClick={handleDownload}
              disabled={!isSuccess}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-bbg hover:bg-bbg-hover disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: P0 }}
            >
              <Download className="w-4 h-4" />
              下载
            </button>
            <button
              onClick={handleFavorite}
              disabled={!isSuccess}
              className="flex items-center justify-center rounded-lg transition-colors bg-bbg hover:bg-bbg-hover disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ width: 40, height: 40 }}
              title={favorited ? "取消收藏" : "收藏"}
            >
              <Heart
                className="w-5 h-5"
                style={{
                  color: favorited ? "#ef4444" : P0,
                  fill: favorited ? "#ef4444" : "none",
                }}
              />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto pr-1">
            {/* 2. Prompt section */}
            {data.prompt && (
              <div className="mb-5">
                <div className="text-sm mb-2" style={{ color: P2 }}>
                  图片提示词
                </div>
                <div className="space-y-1.5">
                  {promptLines.map((line, i) => (
                    <p key={i} className="text-sm leading-relaxed" style={{ color: P0 }}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Product image thumbnails */}
            {data.productImageUrls && data.productImageUrls.length > 0 && (
              <div className="mb-5">
                <div className="text-sm mb-2" style={{ color: P2 }}>
                  用户上传商品图
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.productImageUrls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => openLightbox(url)}
                      className="w-[50px] h-[50px] rounded-lg overflow-hidden border border-gray-200 bg-white hover:ring-2 hover:ring-gray-300 transition-all"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Reference image thumbnails */}
            {refs.length > 0 && (
              <div className="mb-5">
                <div className="text-sm mb-2" style={{ color: P2 }}>
                  参考图
                </div>
                <div className="flex flex-wrap gap-2">
                  {refs.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => openLightbox(url)}
                      className="w-[50px] h-[50px] rounded-lg overflow-hidden border border-gray-200 bg-white hover:ring-2 hover:ring-gray-300 transition-all"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Generate details button */}
            {data.source === "product" && isSuccess && onGenerateDetails && (
              <div className="mb-5">
                <Button
                  onClick={() => onGenerateDetails(data.plan ?? null, data.imageUrl)}
                  className="w-full h-12 bg-[#0f1419] hover:bg-[#1a1f2e] text-white border-0 shadow-lg text-sm font-medium"
                >
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  生成商详图
                </Button>
              </div>
            )}

            {/* 6. Action groups */}
            <div className="space-y-1">
              {/* Group 1 */}
              <div className="bg-white rounded-lg p-2 grid grid-cols-2 gap-1">
                <button className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-[#0f1419] hover:bg-gray-50 transition-colors rounded-lg">
                  <span className="w-4 h-4 inline-flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-300 rounded-sm">
                    HQ
                  </span>
                  <span>超清</span>
                </button>
                <ActionButton icon={Wand2} label="局部重绘" disabled={!isSuccess} />
                <ActionButton icon={MapPin} label="扩图" disabled={!isSuccess} />
              </div>

              {/* Group 2 */}
              <div className="bg-white rounded-lg p-2 grid grid-cols-2 gap-1">
                <ActionButton
                  icon={RefreshCw}
                  label="重新编辑"
                  onClick={() => toast.info("重新编辑功能即将上线")}
                  disabled={!isSuccess}
                />
                <ActionButton
                  icon={Wand2}
                  label="再次生成"
                  onClick={() => toast.info("再次生成功能即将上线")}
                  disabled={!isSuccess}
                />
                <ActionButton
                  icon={MapPin}
                  label="定位"
                  onClick={() => toast.info("定位功能即将上线")}
                  disabled={!isSuccess}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox for reference images */}
      {lightboxUrl && <Lightbox imageUrl={lightboxUrl} onClose={closeLightbox} />}
    </>
  );
}
