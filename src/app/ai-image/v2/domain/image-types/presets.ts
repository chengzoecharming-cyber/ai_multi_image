import type { ImageTypeId, ImageTypeProfile } from "./types";

export const IMAGE_TYPE_LABELS: Record<ImageTypeId, string> & Record<string, string | undefined> = {
  auto: "自动判断",
  ecommerce_hero: "主图",
  feature_showcase: "功能卖点",
  product_detail: "局部细节",
  lifestyle_scene: "应用场景",
  environment_scene: "环境场景",
  comparison_chart: "优势对比",
  product_showcase: "产品展示",
  ecommerce_banner: "电商海报",
  spec_info: "规格信息",
  promo_sales: "促销销售",
  compatible_tools: "适配工具",
};

export const IMAGE_TYPE_PROFILES: Record<ImageTypeId, ImageTypeProfile> = {
  auto: { id: "auto", label: "自动判断" },
  ecommerce_hero: { id: "ecommerce_hero", label: "主图" },
  feature_showcase: { id: "feature_showcase", label: "功能卖点" },
  product_detail: { id: "product_detail", label: "局部细节" },
  lifestyle_scene: { id: "lifestyle_scene", label: "应用场景" },
  environment_scene: { id: "environment_scene", label: "环境场景" },
  comparison_chart: { id: "comparison_chart", label: "优势对比" },
  product_showcase: { id: "product_showcase", label: "产品展示" },
  ecommerce_banner: { id: "ecommerce_banner", label: "电商海报" },
  spec_info: { id: "spec_info", label: "规格信息" },
  promo_sales: { id: "promo_sales", label: "促销销售" },
  compatible_tools: { id: "compatible_tools", label: "适配工具" },
};

/**
 * 安全地获取图片用途标签，未知值返回原字符串。
 */
export function getImageTypeLabel(imageType: string): string {
  return IMAGE_TYPE_LABELS[imageType as ImageTypeId] || imageType;
}
