"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import type { V2Session } from "../types";

export interface UseUploadHandlersOptions {
  activeSession: V2Session | null;
  updateActiveSession: (updater: (s: V2Session) => V2Session) => void;
}

export interface UploadHandlers {
  productFileInputRef: React.RefObject<HTMLInputElement | null>;
  detailHeroFileInputRef: React.RefObject<HTMLInputElement | null>;
  referenceFileInputRef: React.RefObject<HTMLInputElement | null>;
  handleUploadProductImage: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleUploadDetailHero: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleUploadReferenceImage: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleRemoveReferenceImage: (index: number) => void;
}

export function useUploadHandlers(options: UseUploadHandlersOptions): UploadHandlers {
  const { activeSession, updateActiveSession } = options;

  const productFileInputRef = useRef<HTMLInputElement>(null);
  const detailHeroFileInputRef = useRef<HTMLInputElement>(null);
  const referenceFileInputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(
    async (files: File[]): Promise<string[]> => {
      const urls: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        try {
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          const data = await res.json();
          if (res.ok && data.data?.url) {
            urls.push(data.data.url);
          } else {
            toast.error(data.error || `上传失败: ${file.name}`);
          }
        } catch {
          toast.error(`上传失败: ${file.name}`);
        }
      }
      return urls;
    },
    []
  );

  const handleUploadProductImage = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!activeSession) return;
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      const uploadedUrls = await uploadFiles(files);
      if (uploadedUrls.length > 0) {
        updateActiveSession((s) => {
          const prev = s.productImageUrls || [];
          const nextUrls = [...prev, ...uploadedUrls];
          return {
            ...s,
            productImageUrls: nextUrls,
            activeProductImageIndex: nextUrls.length - 1,
            lastError: null,
            step: "input" as const,
          };
        });
        toast.success(`已上传 ${uploadedUrls.length} 张商品图`);
      }
      if (productFileInputRef.current) productFileInputRef.current.value = "";
    },
    [activeSession, updateActiveSession, uploadFiles]
  );

  const handleUploadDetailHero = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!activeSession) return;
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      const uploadedUrls = await uploadFiles(files);
      if (uploadedUrls.length > 0) {
        updateActiveSession((s) => {
          const prev = s.detail?.detailImageUrls || [];
          const nextUrls = [...prev, ...uploadedUrls];
          return {
            ...s,
            detail: {
              ...(s.detail || { selectedTypes: [], generating: false, results: [], lastError: null }),
              detailImageUrls: nextUrls,
              activeDetailImageIndex: nextUrls.length - 1,
              lastError: null,
            },
          };
        });
        toast.success(`已上传 ${uploadedUrls.length} 张参考图`);
      }
      if (detailHeroFileInputRef.current) detailHeroFileInputRef.current.value = "";
    },
    [activeSession, updateActiveSession, uploadFiles]
  );

  const handleUploadReferenceImage = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!activeSession) return;
      const file = e.target.files?.[0];
      if (!file) return;
      const maxRef = activeSession.provider === "chatgpt2api" ? 0 : 3;
      if ((activeSession.referenceImageUrls?.length || 0) >= maxRef) {
        toast.error(maxRef === 0 ? "ChatGPT2API 不支持参考图" : "参考图最多3张");
        if (referenceFileInputRef.current) referenceFileInputRef.current.value = "";
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok && data.data?.url) {
          updateActiveSession((s) => ({
            ...s,
            referenceImageUrls: [...(s.referenceImageUrls || []), data.data.url],
            lastError: null,
          }));
          toast.success("参考图上传成功");
        } else {
          toast.error(data.error || "上传失败");
        }
      } catch {
        toast.error("上传失败，请重试");
      }
      if (referenceFileInputRef.current) referenceFileInputRef.current.value = "";
    },
    [activeSession, updateActiveSession]
  );

  const handleRemoveReferenceImage = useCallback(
    (index: number) => {
      updateActiveSession((s) => ({
        ...s,
        referenceImageUrls: (s.referenceImageUrls || []).filter((_, i) => i !== index),
      }));
    },
    [updateActiveSession]
  );

  return {
    productFileInputRef,
    detailHeroFileInputRef,
    referenceFileInputRef,
    handleUploadProductImage,
    handleUploadDetailHero,
    handleUploadReferenceImage,
    handleRemoveReferenceImage,
  };
}
