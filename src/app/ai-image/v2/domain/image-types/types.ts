/**
 * ImageTypeId — 图片用途/类型。
 *
 * 描述的是「这张图用来干什么」，不是视觉风格。
 * 例如：主图、卖点图、对比图、场景图、规格图 等。
 */
export type ImageTypeId =
  | "auto"
  | "ecommerce_hero"
  | "feature_showcase"
  | "product_detail"
  | "lifestyle_scene"
  | "environment_scene"
  | "comparison_chart"
  | "product_showcase"
  | "ecommerce_banner"
  | "spec_info"
  | "promo_sales"
  | "compatible_tools";

/**
 * ImageTypeProfile — 图片用途的配置档案。
 *
 * 只包含用途元信息，不绑定视觉风格。
 */
export interface ImageTypeProfile {
  id: ImageTypeId;
  label: string;
}
