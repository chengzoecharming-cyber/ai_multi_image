"use client";

import { Eye } from "lucide-react";
import type { ProductAnalysis } from "../../types";

export function ProductAnalysisBlock({ analysis }: { analysis: ProductAnalysis }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2.5">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
        <Eye className="w-3 h-3" />
        商品分析
      </h4>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-400">产品名称:</span>{" "}
          <span className="text-gray-700 font-medium">{analysis.productName}</span>
        </div>
        <div>
          <span className="text-gray-400">产品类型:</span>{" "}
          <span className="text-gray-700">{analysis.productType}</span>
        </div>
      </div>

      <div className="text-sm">
        <span className="text-gray-400">主体描述:</span>{" "}
        <span className="text-gray-700">{analysis.productSubjectDescription}</span>
      </div>

      <div className="text-sm">
        <span className="text-gray-400">可见结构:</span>{" "}
        <span className="text-gray-700">{analysis.visibleFeatures.join("、")}</span>
      </div>

      {analysis.materialGuess && (
        <div className="text-sm">
          <span className="text-gray-400">预估材质:</span>{" "}
          <span className="text-gray-700">{analysis.materialGuess}</span>
        </div>
      )}

      {analysis.detectedNonProductElements.length > 0 && (
        <div className="text-sm">
          <span className="text-gray-400">检测到的非商品元素:</span>{" "}
          <span className="text-amber-700">{analysis.detectedNonProductElements.join("、")}</span>
        </div>
      )}

      <div className="text-sm bg-white rounded border border-gray-100 p-2">
        <span className="text-gray-400">主体提取说明:</span>{" "}
        <span className="text-gray-700">{analysis.isolationInstruction}</span>
      </div>

      <div className="text-sm">
        <span className="text-gray-400">结构保护:</span>{" "}
        <span className="text-gray-700">{analysis.structureRisks.join("；")}</span>
      </div>
    </div>
  );
}
