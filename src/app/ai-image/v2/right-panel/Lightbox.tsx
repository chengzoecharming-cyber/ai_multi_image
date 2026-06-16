"use client";

import { Copy, Download, X } from "lucide-react";
import { toast } from "sonner";

export function Lightbox({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) {
  const handleCopy = async () => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
        toast.success("图片已复制到剪贴板");
      } else {
        toast.error("当前浏览器不支持复制图片");
      }
    } catch {
      toast.error("复制失败，请重试");
    }
  };

  const handleDownload = async () => {
    try {
      if (imageUrl.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = imageUrl;
        a.download = `image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("下载已开始");
        return;
      }
      const res = await fetch(imageUrl);
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
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
        <img
          src={imageUrl}
          alt=""
          className="max-w-[85vw] max-h-[70vh] object-contain rounded-lg"
        />
        <div className="mt-6 inline-flex items-center gap-6 px-8 py-3 rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#0f1419] transition-colors"
          >
            <Copy className="w-4 h-4" />
            复制
          </button>
          <div className="w-px h-4 bg-gray-300" />
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#0f1419] transition-colors"
          >
            <Download className="w-4 h-4" />
            下载
          </button>
        </div>
      </div>
    </div>
  );
}
