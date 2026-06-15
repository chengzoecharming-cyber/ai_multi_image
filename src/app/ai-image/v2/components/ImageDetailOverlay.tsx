"use client";

import { useState, useCallback, useMemo } from "react";
import { X, Download, Heart, Wand2, RefreshCw, MapPin } from "lucide-react";
import { toast } from "sonner";
import type { CreativePlan } from "../types";

import { GBG, BBG, P0, P2 } from "../design-tokens";

export interface ImageDetailData {
  imageUrl: string;
  prompt?: string | null;
  referenceImageUrls?: string[];
  productImageUrls?: string[];
  plan?: CreativePlan | null;
  /** 图片库素材的额外信息 */
  createdAt?: string;
  taskId?: string;
}

export { ImageDetailOverlay as default };

interface ImageDetailOverlayProps {
  data: ImageDetailData | null;
  onClose: () => void;
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
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-[#0f1419] hover:bg-gray-50 transition-colors rounded-lg"
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

function ImageDetailOverlay({ data, onClose }: ImageDetailOverlayProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [favorited, setFavorited] = useState(false);

  const openLightbox = useCallback((url: string) => setLightboxUrl(url), []);
  const closeLightbox = useCallback(() => setLightboxUrl(null), []);

  const handleDownload = useCallback(async () => {
    if (!data?.imageUrl) return;
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
  }, [data?.imageUrl]);

  const handleFavorite = useCallback(() => {
    setFavorited((v) => {
      const next = !v;
      toast.success(next ? "已收藏" : "已取消收藏");
      return next;
    });
  }, []);

  // Parse prompt lines for display
  const promptLines = useMemo(() => {
    if (!data?.prompt) return [];
    // If the prompt is very long, try to split by sentences or newlines
    const text = data.prompt.trim();
    if (text.length > 200) {
      // Split by periods followed by space, or newlines
      return text
        .split(/(?<=[.!?。！？])\s+|\n+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [text];
  }, [data?.prompt]);

  const refs = data?.referenceImageUrls || [];

  if (!data) return null;

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
            className="absolute top-0 right-0 z-10 flex items-center justify-center rounded-lg transition-colors hover:opacity-90"
            style={{
              width: 40,
              height: 40,
              backgroundColor: BBG,
            }}
            title="关闭"
          >
            <X className="w-5 h-5" style={{ color: P0 }} />
          </button>

          {/* Image */}
          <div
            className="flex items-center justify-center"
            style={{
              maxHeight: "calc(100vh - 48px)",
              maxWidth: "calc(100% - 120px)",
              padding: "0 60px",
            }}
          >
            <img
              src={data.imageUrl}
              alt=""
              className="object-contain rounded-lg shadow-sm"
              style={{
                maxHeight: "calc(100vh - 48px)",
                maxWidth: "100%",
              }}
            />
          </div>
        </div>

        {/* ── Right: Info area (2 parts) ── */}
        <div className="flex flex-col overflow-hidden" style={{ flex: 2, marginLeft: 24 }}>
          <div className="flex-1 overflow-y-auto pr-1">
            {/* 1. Top action bar */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90"
                style={{ backgroundColor: BBG, color: P0 }}
              >
                <Download className="w-4 h-4" />
                下载
              </button>
              <button
                onClick={handleFavorite}
                className="flex items-center justify-center rounded-lg transition-colors hover:opacity-90"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: BBG,
                }}
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
                      className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white hover:ring-2 hover:ring-gray-300 transition-all"
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
                      className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white hover:ring-2 hover:ring-gray-300 transition-all"
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Action groups */}
            <div className="space-y-1">
              {/* Group 1 */}
              <div className="bg-white rounded-lg p-2 grid grid-cols-2 gap-1">
                <button className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-[#0f1419] hover:bg-gray-50 transition-colors rounded-lg">
                  <span className="w-4 h-4 inline-flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-300 rounded-sm">
                    HQ
                  </span>
                  <span>超清</span>
                </button>
                <ActionButton icon={Wand2} label="局部重绘" />
                <ActionButton icon={MapPin} label="扩图" />
              </div>

              {/* Group 2 */}
              <div className="bg-white rounded-lg p-2 grid grid-cols-2 gap-1">
                <ActionButton
                  icon={RefreshCw}
                  label="重新编辑"
                  onClick={() => toast.info("重新编辑功能即将上线")}
                />
                <ActionButton
                  icon={Wand2}
                  label="再次生成"
                  onClick={() => toast.info("再次生成功能即将上线")}
                />
                <ActionButton
                  icon={MapPin}
                  label="定位"
                  onClick={() => toast.info("定位功能即将上线")}
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
