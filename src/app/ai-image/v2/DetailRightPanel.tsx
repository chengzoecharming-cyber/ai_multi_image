"use client";

import { ImageIcon } from "lucide-react";
import type { V2DetailType, V2Session } from "./types";
import { V2_DETAIL_TYPE_LABELS } from "./types";

function isDetailImage(img: { tab?: string; detailType?: V2DetailType }) {
  return (img.tab || "product") === "detail";
}

export function DetailRightPanel({ activeSession }: { activeSession: V2Session }) {
  const detail = activeSession.detail;
  const heroUrl = detail?.heroImageUrl || null;

  const detailImages = (activeSession.generatedImages || []).filter(isDetailImage);

  const grouped = new Map<V2DetailType, typeof detailImages>();
  for (const img of detailImages) {
    const t = img.detailType || "detail";
    const arr = grouped.get(t) || [];
    arr.push(img);
    grouped.set(t, arr);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-800">商详图（多页素材）</div>
            <div className="text-xs text-gray-400 truncate">
              {heroUrl ? "已上传主图锚点，风格将保持一致" : "未上传主图锚点：请先上传主图"}
            </div>
          </div>
          {heroUrl && (
            <div className="ml-auto flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                <img src={heroUrl} alt="主图" className="w-full h-full object-cover" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {detailImages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500 mb-1">还没有生成商详素材图</div>
              <div className="text-xs text-gray-400">选择主图与类型后点击「开始生成（多页）」</div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {(Array.from(grouped.entries()) as Array<[V2DetailType, typeof detailImages]>).map(([type, imgs]) => (
              <section key={type}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-semibold text-gray-700">{V2_DETAIL_TYPE_LABELS[type] || type}</div>
                  <div className="text-xs text-gray-400">{imgs.length} 张</div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {imgs.map((img) => (
                    <div key={img.id} className="rounded-xl overflow-hidden border border-gray-200 bg-white">
                      <img src={img.imageUrl} alt="商详图" className="w-full aspect-square object-cover" />
                      <div className="px-3 py-2 text-[10px] text-gray-400 truncate">
                        {new Date(img.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
