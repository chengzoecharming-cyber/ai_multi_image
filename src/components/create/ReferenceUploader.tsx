"use client";

import { useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReferenceImage {
  imageUrl: string;
  imageName?: string;
  sortOrder: number;
}

interface ReferenceUploaderProps {
  images: ReferenceImage[];
  onAdd: (images: ReferenceImage[]) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
  maxCount?: number;
}

export default function ReferenceUploader({
  images,
  onAdd,
  onRemove,
  disabled,
  maxCount = 5,
}: ReferenceUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;

    const remaining = maxCount - images.length;
    if (remaining <= 0) {
      alert(`最多支持 ${maxCount} 张参考图`);
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    const newImages: ReferenceImage[] = [];

    for (const file of toUpload) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok && data.data?.url) {
          newImages.push({
            imageUrl: data.data.url,
            imageName: data.data.name,
            sortOrder: images.length + newImages.length,
          });
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }

    if (newImages.length > 0) {
      onAdd(newImages);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const canAddMore = images.length < maxCount;

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

      {images.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-xl overflow-hidden group bg-[#F5F6F8]"
            >
              <img
                src={img.imageUrl}
                alt={img.imageName || `参考图 ${index + 1}`}
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
          className="flex flex-col items-center justify-center w-full h-36 rounded-2xl border border-dashed border-[#DDE2F0] bg-white hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-indigo-500 mb-3">
            <Upload className="w-4 h-4" />
            <span className="text-[13px] font-medium">上传图片</span>
          </div>
          <p className="text-[12px] text-gray-400 text-center max-w-[280px]">
            上传要求：单纯背景图/画质清晰，避免出现商品文字、人脸等元素
          </p>
        </button>
      )}
    </div>
  );
}
