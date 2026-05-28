import type { DetailAssetTypeProfile, V2DetailType } from "./types";

export const DETAIL_ASSET_TYPE_DESCRIPTIONS: Record<V2DetailType, string> = {
  detail: "围绕细节、纹理、边缘、结构做近景或微距素材。",
  multi_angle: "围绕同一产品换角度展示整体形体和结构。",
  lifestyle: "围绕真实使用或工业场景生成仿实拍素材。",
  feature: "围绕一个或多个卖点生成商品素材。",
  comparison: "通过对比方式展示产品优势或差异。",
  spec: "展示产品规格、参数、尺寸等技术信息。",
};

export const DETAIL_ASSET_PROFILES: Record<V2DetailType, DetailAssetTypeProfile> = {
  detail: {
    id: "detail",
    label: "细节图",
    description: "围绕细节、纹理、边缘、结构做近景或微距素材。",
    imageType: "product_detail",
  },
  multi_angle: {
    id: "multi_angle",
    label: "多角度图",
    description: "围绕同一产品换角度展示整体形体和结构。",
    imageType: "product_showcase",
  },
  lifestyle: {
    id: "lifestyle",
    label: "场景图",
    description: "围绕真实使用或工业场景生成仿实拍素材。",
    imageType: "lifestyle_scene",
  },
  feature: {
    id: "feature",
    label: "卖点图",
    description: "围绕一个或多个卖点生成商品素材。",
    imageType: "feature_showcase",
  },
  comparison: {
    id: "comparison",
    label: "对比图",
    description: "通过对比方式展示产品优势或差异。",
    imageType: "comparison_chart",
  },
  spec: {
    id: "spec",
    label: "规格图",
    description: "展示产品规格、参数、尺寸等技术信息。",
    imageType: "spec_info",
  },
};
