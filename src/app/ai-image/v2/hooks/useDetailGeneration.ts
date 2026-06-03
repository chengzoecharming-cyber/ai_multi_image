"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import type { V2Session, V2DetailType } from "../types";
import { nowTs } from "./utils/session-utils";

export interface UseDetailGenerationOptions {
  activeSession: V2Session | null;
  updateActiveSession: (updater: (s: V2Session) => V2Session) => void;
  onSessionPersist?: (session: V2Session) => Promise<void> | void;
}

export interface DetailGenerationActions {
  toggleDetailType: (type: V2DetailType) => void;
  handleGenerateDetail: () => Promise<void>;
}

export function useDetailGeneration(options: UseDetailGenerationOptions): DetailGenerationActions {
  const { activeSession, updateActiveSession, onSessionPersist } = options;

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

    let startedSession: V2Session | null = null;
    updateActiveSession((s) => ({
      ...(startedSession = {
        ...s,
        detail: {
          ...(s.detail || { detailImageUrls: [], activeDetailImageIndex: 0, selectedTypes: [], generating: false, results: [], lastError: null }),
          generating: true,
          lastError: null,
        },
      }),
    }));
    if (startedSession) {
      void onSessionPersist?.(startedSession);
    }

    try {
      const heroPlan = activeSession.detail?.heroPlan || null;
      const failedTypes: Array<{ type: V2DetailType; error: string }> = [];
      let successCount = 0;

      for (const currentType of selectedTypes) {
        const res = await fetch("/api/ai-image/v2/detail/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            heroImageUrl: activeDetailImage,
            detailImageUrls: detail?.detailImageUrls || [],
            activeDetailImageIndex: detail?.activeDetailImageIndex ?? 0,
            productDescription: activeSession.goal,
            selectedTypes: [currentType],
            provider: activeSession.provider,
            output: { width: activeSession.outputWidth, height: activeSession.outputHeight },
            heroPlan,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const errMsg = data?.error || "生成失败";
          if (res.status === 429 && data.code === "QUOTA_EXHAUSTED") {
            toast.error(errMsg);
            failedTypes.push({ type: currentType, error: errMsg });
            break; // 配额耗尽，停止继续生成
          }
          failedTypes.push({ type: currentType, error: errMsg });
          continue;
        }

        const pages: Array<{ type: V2DetailType; imageUrl: string; taskId?: string; imageBase64?: string }> = Array.isArray(data?.pages)
          ? data.pages
          : [];

        if (pages.length === 0) {
          failedTypes.push({ type: currentType, error: "未返回图片结果" });
          continue;
        }

        const now = nowTs();
        let nextSession: V2Session | null = null;
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

          return (nextSession = {
            ...s,
            generatedImages: [...newImages, ...(s.generatedImages || [])],
            detail: {
              ...prevDetail,
              generating: true,
              lastError: null,
              results: [...resultPairs, ...(prevDetail.results || [])],
            },
          });
        });
        if (nextSession) {
          void onSessionPersist?.(nextSession);
        }

        successCount += pages.length;
      }

      const errorMessage =
        failedTypes.length > 0
          ? `部分生成失败：${failedTypes.map((item) => `${item.type}（${item.error}）`).join("；")}`
          : null;

      let completedSession: V2Session | null = null;
      updateActiveSession((s) => ({
        ...(completedSession = {
          ...s,
          detail: {
            ...(s.detail || { detailImageUrls: [], activeDetailImageIndex: 0, selectedTypes: [], generating: false, results: [], lastError: null }),
            generating: false,
            lastError: errorMessage,
          },
        }),
      }));
      if (completedSession) {
        void onSessionPersist?.(completedSession);
      }

      if (successCount > 0 && failedTypes.length === 0) {
        toast.success(`商详图已生成（${successCount}张）`);
        return;
      }

      if (successCount > 0) {
        toast.warning(`已生成 ${successCount} 张，${failedTypes.length} 个类型失败`);
        return;
      }

      const msg = failedTypes[0]?.error || "生成失败";
      toast.error(msg);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "网络错误";
      toast.error("网络错误，请重试");
      let failedSession: V2Session | null = null;
      updateActiveSession((s) => ({
        ...(failedSession = {
          ...s,
          detail: {
            ...(s.detail || { detailImageUrls: [], activeDetailImageIndex: 0, selectedTypes: [], generating: false, results: [], lastError: null }),
            generating: false,
            lastError: msg,
          },
        }),
      }));
      if (failedSession) {
        void onSessionPersist?.(failedSession);
      }
    }
  }, [activeSession, onSessionPersist, updateActiveSession]);

  return { toggleDetailType, handleGenerateDetail };
}
