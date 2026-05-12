"use client";

import { X, Copy, Download } from "lucide-react";

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
  onDownload?: () => void;
}

export default function ImagePreviewModal({
  imageUrl,
  onClose,
  onDownload,
}: ImagePreviewModalProps) {
  const handleCopy = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
    } catch {
      // Fallback: copy URL text
      await navigator.clipboard.writeText(imageUrl);
    }
  };

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

        {/* Action buttons frame */}
        <div className="mt-8 inline-flex items-center gap-[100px] px-10 py-6 rounded-full bg-gradient-to-r from-[#E8ECFE] to-[#F0E6FF]">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-[13px] font-normal text-gray-700 hover:text-indigo-600 transition-colors"
          >
            <Copy className="w-4 h-4" />
            复制图片
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-2 text-[13px] font-normal text-gray-700 hover:text-indigo-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            下载图片
          </button>
        </div>
      </div>
    </div>
  );
}
