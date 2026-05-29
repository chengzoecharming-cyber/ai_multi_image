"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import type { V2Session, V2DetailType } from "../types";
import { nowTs } from "./utils/session-utils";

export interface UseDetailGenerationOptions {
  activeSession: V2Session | null;
  updateActiveSession: (updater: (s: V2Session) => V2Session) => void;
}

export interface DetailGenerationActions {
  toggleDetailType: (type: V2DetailType) => void;
  handleGenerateDetail: () => Promise<void>;
}

export function useDetailGeneration(options: UseDetailGenerationOptions): DetailGenerationActions {
  const { activeSession, updateActiveSession } = options;

  const toggleDetailType = useCallback(
    (type: V2DetailType) => {
      updateActiveSession((s) => {
        const prev = s.detail || { detailImageUrls: [], activeDetailImageIndex: 0, selectedTypes: [], generating: false, results: [], lastError: null };
        const exists = prev.selectedTypes.includes(type);
        const nextSelected = exists ? prev.selectedTypes.filter((t) => t !== type) : [...prev.selectedTypes, type];
        return { ...s, detail: { ...prev, selectedTypes: nextSelected, lastError: null } };
      });
    },
    [updateActiveSession]
  );

  const handleGenerateDetail = useCallback(async () => {
    if (!activeSession) return;
    const detail = activeSession.detail;
    const activeDetailImage = detail?.detailImageUrls?.[detail?.activeDetailImageIndex ?? 0] || null;
    const selectedTypes = detail?.selectedTypes || [];
    if (!activeDetailImage) {
      toast.error("请先上传参考图");
      return;
    }
    if (!activeSession.goal.trim() || activeSession.goal.trim().length < 3) {
      toast.error("请输入商品描述（至少3个字）");
      return;
    }
    if (selectedTypes.length === 0) {
      toast.error("请先勾选要生成的素材类型");
      return;
    }

    updateActiveSession((s) => ({
      ...s,
      detail: {
        ...(s.detail || { detailImageUrls: [], activeDetailImageIndex: 0, selectedTypes: [], generating: false, results: [], lastError: null }),
        generating: true,
        lastError: null,
      },
    }));

    try {
      const heroPlan = activeSession.detail?.heroPlan || null;
      const res = await fetch("/api/ai-image/v2/detail/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          heroImageUrl: activeDetailImage,
          detailImageUrls: detail?.detailImageUrls || [],
          activeDetailImageIndex: detail?.activeDetailImageIndex ?? 0,
          productDescription: activeSession.goal,
          selectedTypes,
          provider: activeSession.provider,
          output: { width: activeSession.outputWidth, height: activeSession.outputHeight },
          heroPlan,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "生成失败";
        toast.error(msg);
        updateActiveSession((s) => ({
          ...s,
          detail: {
            ...(s.detail || { detailImageUrls: [], activeDetailImageIndex: 0, selectedTypes: [], generating: false, results: [], lastError: null }),
            generating: false,
            lastError: msg,
          },
        }));
        return;
      }

      const pages: Array<{ type: V2DetailType; imageUrl: string; taskId?: string; imageBase64?: string }> = Array.isArray(data?.pages)
        ? data.pages
        : [];
      const now = nowTs();
      updateActiveSession((s) => {
        const prevDetail = s.detail || { detailImageUrls: [], activeDetailImageIndex: 0, selectedTypes: [], generating: false, results: [], lastError: null };
        const newImages = pages
          .filter((p) => p?.imageUrl && p?.type)
          .map((p) => {
            const id = globalThis.crypto?.randomUUID?.() || `img-${now}-${Math.random().toString(36).slice(2, 6)}`;
            return {
              id,
              taskId: p.taskId,
              tab: "detail" as const,
              detailType: p.type,
              imageUrl: p.imageUrl,
              imageBase64: p.imageBase64,
              createdAt: nowTs(),
            };
          });
        const resultPairs: Array<{ type: V2DetailType; imageId: string }> = [];
        newImages.forEach((img) => {
          if (img.detailType) resultPairs.push({ type: img.detailType, imageId: img.id });
        });
        return {
          ...s,
          generatedImages: [...newImages, ...(s.generatedImages || [])],
          detail: {
            ...prevDetail,
            generating: false,
            lastError: null,
            results: [...resultPairs, ...(prevDetail.results || [])],
          },
        };
      });
      toast.success("商详图已生成");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "网络错误";
      toast.error("网络错误，请重试");
      updateActiveSession((s) => ({
        ...s,
        detail: {
          ...(s.detail || { detailImageUrls: [], activeDetailImageIndex: 0, selectedTypes: [], generating: false, results: [], lastError: null }),
          generating: false,
          lastError: msg,
        },
      }));
    }
  }, [activeSession, updateActiveSession]);

  return { toggleDetailType, handleGenerateDetail };
}
