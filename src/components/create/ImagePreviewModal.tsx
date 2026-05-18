"use client";

import { X, Download, Heart, Trash2 } from "lucide-react";
import type { ImageTask } from "@/lib/types";

interface ImagePreviewModalProps {
  imageUrl: string;
  task?: ImageTask | null;
  onClose: () => void;
  onDownload?: () => void;
  onAddToLibrary?: () => void;
  onDelete?: () => void;
}

export default function ImagePreviewModal({
  imageUrl,
  task,
  onClose,
  onDownload,
  onAddToLibrary,
  onDelete,
}: ImagePreviewModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image */}
      <div
        className="flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt=""
          className="max-w-[80vw] max-h-[60vh] object-contain rounded-lg"
        />

        {/* Action buttons frame — light blue to light purple gradient */}
        <div className="mt-8 inline-flex items-center gap-[100px] px-10 py-6 rounded-full bg-gradient-to-r from-[#E8ECFE] to-[#F0E6FF]">
          <button
            onClick={onDownload}
            className="flex items-center gap-2 text-[13px] font-normal text-gray-700 hover:text-indigo-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            下载
          </button>
          <button
            onClick={onAddToLibrary}
            className="flex items-center gap-2 text-[13px] font-normal text-gray-700 hover:text-indigo-600 transition-colors"
          >
            <Heart className="w-4 h-4" />
            添加到素材库
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-2 text-[13px] font-normal text-gray-700 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
