"use client";

import { useRef } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadImageFile } from "@/lib/image-upload";

interface ReferenceUploaderProps {
  urls: string[];
  onAdd: (urls: string[]) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
  maxCount?: number;
}

export default function ReferenceUploader({
  urls,
  onAdd,
  onRemove,
  disabled,
  maxCount = 5,
}: ReferenceUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    const remaining = maxCount - urls.length;
    if (remaining <= 0) {
      alert(`最多支持 ${maxCount} 张风格参考图`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    const newUrls: string[] = [];

    for (const file of toUpload) {
      try {
        const data = await uploadImageFile(file);
        newUrls.push(data.data.url);
      } catch (err) {
        console.error("Upload failed:", err);
        alert(err instanceof Error ? err.message : "上传失败");
      }
    }

    if (newUrls.length > 0) {
      onAdd(newUrls);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canAddMore = urls.length < maxCount;

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {urls.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {urls.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-xl overflow-hidden group bg-[#F5F6F8]"
            >
              <img
                src={url}
                alt={`风格参考 ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onRemove(index)}
                disabled={disabled}
                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {canAddMore && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex flex-col items-center justify-center aspect-square rounded-xl border border-dashed border-gray-200 bg-[#F5F6F8] hover:bg-gray-100 transition-colors"
            >
              <Upload className="w-5 h-5 text-gray-300 mb-1" />
              <span className="text-[10px] text-gray-400">上传</span>
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex flex-col items-center justify-center w-full h-36 rounded-2xl border border-dashed border-[#DDE2F0] bg-white transition-colors"
        >
          <div className="flex items-center gap-1.5 text-indigo-500 mb-3">
            <Upload className="w-4 h-4" />
            <span className="text-[13px] font-medium">上传图片</span>
          </div>
          <p className="text-[12px] text-gray-400 text-center max-w-[280px]">
            支持上传背景、光影、色调等视觉风格参考图
          </p>
        </button>
      )}
    </div>
  );
}
