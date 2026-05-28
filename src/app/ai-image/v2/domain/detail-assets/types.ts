import type { ImageTypeId } from "../image-types";

export type V2DetailType =
  | "detail"
  | "multi_angle"
  | "lifestyle"
  | "feature"
  | "comparison"
  | "spec";

export const V2_DETAIL_TYPE_LABELS: Record<V2DetailType, string> = {
  detail: "细节图",
  multi_angle: "多角度图",
  lifestyle: "场景图",
  feature: "卖点图",
  comparison: "对比图",
  spec: "规格图",
};

/**
 * DetailAssetTypeProfile — 商详图素材类型档案。
 *
 * 商详图素材是商详图工作台的入口，只保留与图片用途（ImageTypeId）的映射。
 * 文案密度、版式等规则统一由 taxonomy.ts 维护，避免重复。
 */
export interface DetailAssetTypeProfile {
  id: V2DetailType;
  label: string;
  description: string;
  imageType: ImageTypeId;
}
