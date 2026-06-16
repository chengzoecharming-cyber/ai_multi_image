"use client";

import { useState, useCallback } from "react";
import {
  ChevronLeft,
  Wand2,
  Grid3x3,
  Copy,
  Download,
  Languages,
  Save,
  Info,
  Heart,
  MapPin,
  RefreshCw,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CreativePlan } from "../types";
import { getPlanMeta, IMAGE_TYPE_LABELS } from "../types";
import type { ImageDetailData } from "../components/ImageDetailOverlay";
import { Lightbox } from "./Lightbox";
import {
  isFavorited,
  addFavorite,
  removeFavorite,
  type FavoriteItem,
} from "../lib/favorites";

import { P2, P0, BBG } from "../design-tokens";

export interface ImagePreviewPanelProps {
  plan: CreativePlan;
  generatedImage: { imageUrl: string; imageBase64?: string } | null;
  isGeneratingImage: boolean;
  productImageUrls?: string[];
  referenceImageUrls?: string[];
  userGoal?: string;
  onBack: () => void;
  onGenerateImage: (plan: CreativePlan) => void;
  onGenerateDetails: (plan: CreativePlan, imageUrl: string) => void;
  onSave: (plan: CreativePlan) => void;
  onOpenInfo: (plan: CreativePlan) => void;
  onOpenImageDetail: (data: ImageDetailData) => void;
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

export function ImagePreviewPanel({
  plan,
  generatedImage,
  isGeneratingImage,
  productImageUrls,
  referenceImageUrls,
  userGoal,
  onBack,
  onGenerateImage,
  onGenerateDetails,
  onSave,
  onOpenInfo,
  onOpenImageDetail,
}: ImagePreviewPanelProps) {
  const [showCn, setShowCn] = useState(false);
  const hasCn = !!(
    plan.headlineCn ||
    plan.subtitleCn ||
    (plan.sellingPointsCn && plan.sellingPointsCn.length > 0)
  );
  const meta = getPlanMeta(plan);
  const imageSrc = generatedImage?.imageBase64 || generatedImage?.imageUrl || null;

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const openLightbox = useCallback((url: string) => setLightboxUrl(url), []);
  const closeLightbox = useCallback(() => setLightboxUrl(null), []);

  const [favorited, setFavorited] = useState(() =>
    isFavorited(imageSrc || "")
  );

  const handleDownload = useCallback(async () => {
    if (!imageSrc) return;
    try {
      if (imageSrc.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = imageSrc;
        a.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("下载已开始");
        return;
      }
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("下载已开始");
    } catch {
      toast.error("下载失败，请重试");
    }
  }, [imageSrc]);

  const handleFavorite = useCallback(() => {
    if (!imageSrc) return;
    const next = !favorited;
    setFavorited(next);
    if (next) {
      const item: FavoriteItem = {
        id: globalThis.crypto?.randomUUID?.() || `fav-${Date.now()}`,
        imageUrl: imageSrc,
        prompt: plan.imageGenerationPrompt,
        productImageUrls: productImageUrls || [],
        referenceImageUrls: referenceImageUrls || [],
        planName: plan.planName,
        createdAt: Date.now(),
      };
      addFavorite(item);
      toast.success("已收藏，可在「我的素材-我的收藏」中查看");
    } else {
      removeFavorite(imageSrc);
      toast.success("已取消收藏");
    }
  }, [favorited, imageSrc, plan, productImageUrls, referenceImageUrls]);

  // Parse prompt lines for display — show user-entered goal only
  const promptLines = (() => {
    const prompt = userGoal || plan.imageGenerationPrompt;
    if (!prompt) return [];
    const text = prompt.trim();
    if (text.length > 200) {
      return text
        .split(/(?<=[.!?。！？])\s+|\n+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return [text];
  })();

  const displayHeadline =
    showCn && plan.headlineCn ? plan.headlineCn : plan.headline;
  const displaySubtitle =
    showCn && plan.subtitleCn ? plan.subtitleCn : plan.subtitle;
  const displaySellingPoints = (
    showCn && plan.sellingPointsCn
      ? plan.sellingPointsCn
      : plan.sellingPoints || []
  ).filter(Boolean);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Title bar */}
      <div className="px-6 py-4 border-b border-gray-200/80 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-gray-900">
                {plan.planName}
              </h2>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] h-5 px-2 font-normal",
                  meta.color,
                  meta.border
                )}
              >
                {meta.label}
              </Badge>
              <Badge
                variant="secondary"
                className="text-[10px] h-5 px-2 font-normal"
              >
                {IMAGE_TYPE_LABELS[plan.imageType] || plan.imageType}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {hasCn && (
            <button
              onClick={() => setShowCn((v) => !v)}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                showCn
                  ? "bg-gray-100 text-[#0f1419]"
                  : "hover:bg-gray-100 text-gray-500"
              )}
              title={showCn ? "显示英文" : "显示中文"}
            >
              <Languages className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onSave(plan)}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
            title="保存为模板"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenInfo(plan)}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors"
            title="详情"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main content: left-right split (same as ImageDetailOverlay) */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Left: Image area (5 parts) ── */}
        <div
          className="relative flex items-center justify-center bg-[#F5F6F8]"
          style={{ flex: 5 }}
        >
          {isGeneratingImage ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-[#0f1419] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">正在生成图片...</p>
              <p className="text-xs text-amber-500 font-medium">
                ⏱ 约需 30-90 秒，请耐心等待
              </p>
            </div>
          ) : imageSrc ? (
            <div
              className="flex items-center justify-center"
              style={{
                maxHeight: "calc(100vh - 140px)",
                maxWidth: "calc(100% - 120px)",
                padding: "0 60px",
              }}
            >
              <div
                className="relative cursor-pointer"
                onClick={() =>
                  onOpenImageDetail({
                    imageUrl: imageSrc,
                    prompt: userGoal,
                    productImageUrls,
                    referenceImageUrls,
                    plan,
                  })
                }
                title="点击查看详情"
              >
                <img
                  src={imageSrc}
                  alt="Generated"
                  className="object-contain rounded-lg shadow-sm"
                  style={{
                    maxHeight: "calc(100vh - 140px)",
                    maxWidth: "100%",
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-3">尚未生成图片</p>
              <Button
                onClick={() => onGenerateImage(plan)}
                className="h-10 bg-bbg hover:bg-bbg-hover text-[#0f1419] border-0"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                生成图片
              </Button>
            </div>
          )}
        </div>

        {/* ── Right: Info area (2 parts) ── */}
        <div
          className="flex flex-col overflow-hidden bg-white"
          style={{ flex: 2, marginLeft: 24 }}
        >
          <div className="flex-1 overflow-y-auto p-5">
            {/* 1. Top action bar */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={handleDownload}
                disabled={!imageSrc || isGeneratingImage}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90 disabled:opacity-40"
                style={{ backgroundColor: BBG, color: P0 }}
              >
                <Download className="w-4 h-4" />
                下载
              </button>
              <button
                onClick={handleFavorite}
                disabled={!imageSrc || isGeneratingImage}
                className="flex items-center justify-center rounded-lg transition-colors hover:opacity-90 disabled:opacity-40"
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
            {promptLines.length > 0 && (
              <div className="mb-5">
                <div className="text-sm mb-2" style={{ color: P2 }}>
                  图片提示词
                </div>
                <div className="space-y-1.5">
                  {promptLines.map((line, i) => (
                    <p
                      key={i}
                      className="text-sm leading-relaxed"
                      style={{ color: P0 }}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Product image thumbnails */}
            {productImageUrls && productImageUrls.length > 0 && (
              <div className="mb-5">
                <div className="text-sm mb-2" style={{ color: P2 }}>
                  用户上传商品图
                </div>
                <div className="flex flex-wrap gap-2">
                  {productImageUrls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => openLightbox(url)}
                      className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white hover:ring-2 hover:ring-gray-300 transition-all"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Reference image thumbnails */}
            {referenceImageUrls && referenceImageUrls.length > 0 && (
              <div className="mb-5">
                <div className="text-sm mb-2" style={{ color: P2 }}>
                  参考图
                </div>
                <div className="flex flex-wrap gap-2">
                  {referenceImageUrls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => openLightbox(url)}
                      className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-white hover:ring-2 hover:ring-gray-300 transition-all"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Action groups (same as ImageDetailOverlay) */}
            <div className="space-y-1">
              <div className="bg-white rounded-lg p-2 grid grid-cols-2 gap-1 border border-gray-100">
                <button className="flex items-center justify-center gap-2 px-4 py-3 text-sm text-[#0f1419] hover:bg-gray-50 transition-colors rounded-lg">
                  <span className="w-4 h-4 inline-flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-300 rounded-sm">
                    HQ
                  </span>
                  <span>超清</span>
                </button>
                <ActionButton
                  icon={Wand2}
                  label="局部重绘"
                  onClick={() => toast.info("局部重绘功能即将上线")}
                />
                <ActionButton
                  icon={MapPin}
                  label="扩图"
                  onClick={() => toast.info("扩图功能即将上线")}
                />
              </div>
              <div className="bg-white rounded-lg p-2 grid grid-cols-2 gap-1 border border-gray-100">
                <ActionButton
                  icon={RefreshCw}
                  label="重新编辑"
                  onClick={() => toast.info("重新编辑功能即将上线")}
                />
                <ActionButton
                  icon={Wand2}
                  label="再次生成"
                  onClick={() =>
                    isGeneratingImage
                      ? undefined
                      : onGenerateImage(plan)
                  }
                />
                <ActionButton
                  icon={MapPin}
                  label="定位"
                  onClick={() => toast.info("定位功能即将上线")}
                />
              </div>
            </div>

            {/* 6. Plan bilingual copy section */}
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-700">
                  {showCn ? "图片文案（中文）" : "图片文案（English）"}
                </div>
                {hasCn && (
                  <button
                    onClick={() => setShowCn((v) => !v)}
                    className="text-[11px] text-[#0f1419] hover:text-[#1a1f2e] font-medium"
                  >
                    {showCn ? "切换英文" : "切换中文"}
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {displayHeadline && (
                  <div className="text-[11px] text-gray-600">
                    <span className="font-medium text-gray-700">主标题：</span>
                    {displayHeadline}
                  </div>
                )}
                {displaySubtitle && (
                  <div className="text-[11px] text-gray-600">
                    <span className="font-medium text-gray-700">副标题：</span>
                    {displaySubtitle}
                  </div>
                )}
                {displaySellingPoints.slice(0, 6).map((s, idx) => (
                  <div key={idx} className="text-[11px] text-gray-600">
                    <span className="font-medium text-gray-700">
                      文案要点{idx + 1}：
                    </span>
                    {s}
                  </div>
                ))}
                {(showCn ? plan.copyBlocksCn : plan.copyBlocks) &&
                  (showCn ? plan.copyBlocksCn : plan.copyBlocks)!.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-[11px] font-medium text-gray-700">
                        文案块：
                      </div>
                      {(showCn ? plan.copyBlocksCn : plan.copyBlocks)!
                        .slice(0, 4)
                        .map((block, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] text-gray-600"
                          >
                            <span className="shrink-0 text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                              {block.role}
                            </span>
                            <span className="ml-1">{block.title}</span>
                            {block.body && (
                              <span className="ml-1 text-gray-400">
                                — {block.body}
                              </span>
                            )}
                          </div>
                        ))}
                      {(showCn ? plan.copyBlocksCn : plan.copyBlocks)!.length >
                        4 && (
                        <div className="text-[11px] text-gray-400">
                          +
                          {(showCn ? plan.copyBlocksCn : plan.copyBlocks)!
                            .length - 4}{" "}
                          个文案块
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>

            {/* 7. Generate details button */}
            {imageSrc && !isGeneratingImage && (
              <div className="mt-5">
                <Button
                  onClick={() => onGenerateDetails(plan, imageSrc)}
                  className="w-full h-12 bg-[#0f1419] hover:bg-[#1a1f2e] text-white border-0 shadow-lg text-sm font-semibold"
                >
                  <Grid3x3 className="w-4 h-4 mr-2" />
                  生成商详图
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox overlay */}
      {lightboxUrl && <Lightbox imageUrl={lightboxUrl} onClose={closeLightbox} />}
    </div>
  );
}
