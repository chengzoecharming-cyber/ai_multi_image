import type { DetailAssetTypeProfile, V2DetailType } from "./types";

export const DETAIL_ASSET_TYPE_DESCRIPTIONS: Record<V2DetailType, string> = {
  detail: "围绕细节、纹理、边缘、结构做近景或微距素材。",
  multi_angle: "围绕同一产品换角度展示整体形体和结构。",
  lifestyle: "围绕真实使用或工业场景生成仿实拍素材。",
  feature: "围绕一个卖点生成无文字商品素材。",
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
    label: "仿实拍/场景图",
    description: "围绕真实使用或工业场景生成仿实拍素材。",
    imageType: "lifestyle_scene",
  },
  feature: {
    id: "feature",
    label: "卖点图",
    description: "围绕一个卖点生成无文字商品素材。",
    imageType: "feature_showcase",
  },
};
