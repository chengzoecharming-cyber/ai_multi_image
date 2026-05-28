/**
 * Taxonomy — 薄的关系映射层。
 *
 * 只做类型之间的关联，不塞生成规则、不放 prompt 文案。
 */

import type { ImageTypeId } from "./image-types";
import type { LayoutType } from "./layouts";
import type { CopyDensityId } from "./copy-density";

/**
 * 图片用途 -> 推荐版式结构列表。
 *
 * 推荐值，非强制约束。LLM 仍可自由选择。
 */
export const IMAGE_TYPE_TO_ALLOWED_LAYOUTS: Record<ImageTypeId, LayoutType[]> = {
  auto: [],
  ecommerce_hero: [
    "premium_center_product_minimal_text",
    "hero_left_text_right_product",
    "hero_right_product_left_features",
  ],
  feature_showcase: [
    "hero_right_product_left_features",
    "top_headline_bottom_feature_bar",
    "technical_callout_with_insets",
  ],
  product_detail: [
    "technical_callout_with_insets",
    "premium_center_product_minimal_text",
    "exploded_layer_explanation",
  ],
  lifestyle_scene: [
    "four_panel_application_grid",
    "premium_center_product_minimal_text",
    "large_headline_with_bottom_info_bar",
  ],
  environment_scene: [
    "large_headline_with_bottom_info_bar",
    "four_panel_application_grid",
    "top_headline_bottom_feature_bar",
  ],
  comparison_chart: [
    "comparison_two_columns",
    "diagonal_product_with_side_features",
  ],
  product_showcase: [
    "premium_center_product_minimal_text",
    "hero_left_text_right_product",
    "large_headline_with_bottom_info_bar",
  ],
  ecommerce_banner: [
    "top_headline_bottom_feature_bar",
    "diagonal_product_with_side_features",
    "comparison_two_columns",
  ],
  spec_info: [
    "technical_callout_with_insets",
    "exploded_layer_explanation",
    "hero_right_product_left_features",
  ],
  promo_sales: [
    "top_headline_bottom_feature_bar",
    "diagonal_product_with_side_features",
    "comparison_two_columns",
  ],
  compatible_tools: [
    "four_panel_application_grid",
    "hero_right_product_left_features",
    "top_headline_bottom_feature_bar",
  ],
};

/**
 * 图片用途 -> 默认文案密度。
 *
 * 当未指定 copyDensity 时的 fallback。
 */
export const IMAGE_TYPE_TO_DEFAULT_COPY_DENSITY: Record<ImageTypeId, CopyDensityId> = {
  auto: "medium",
  ecommerce_hero: "minimal",
  feature_showcase: "medium",
  product_detail: "headline_only",
  lifestyle_scene: "minimal",
  environment_scene: "medium",
  comparison_chart: "medium",
  product_showcase: "minimal",
  ecommerce_banner: "rich",
  spec_info: "medium",
  promo_sales: "rich",
  compatible_tools: "medium",
};

/**
 * 商详图素材类型 -> 图片用途映射。
 *
 * key 为 detail / multi_angle / lifestyle / feature / comparison / spec。
 *
 * 显式定义，不依赖 detail-assets/presets，避免循环依赖。
 */
export const DETAIL_ASSET_TO_IMAGE_TYPE: Record<string, ImageTypeId> = {
  detail: "product_detail",
  multi_angle: "product_showcase",
  lifestyle: "lifestyle_scene",
  feature: "feature_showcase",
  comparison: "comparison_chart",
  spec: "spec_info",
};
