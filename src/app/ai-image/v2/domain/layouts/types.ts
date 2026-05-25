/**
 * LayoutType — 版式结构类型。
 *
 * 描述的是「元素在画面中怎么排」，不是视觉风格。
 */
export type LayoutType =
  | "hero_left_text_right_product"
  | "hero_right_product_left_features"
  | "top_headline_bottom_feature_bar"
  | "comparison_two_columns"
  | "technical_callout_with_insets"
  | "exploded_layer_explanation"
  | "four_panel_application_grid"
  | "large_headline_with_bottom_info_bar"
  | "diagonal_product_with_side_features"
  | "premium_center_product_minimal_text";

export type LayoutRegionRole =
  | "hero_product"
  | "headline_area"
  | "subheadline_area"
  | "feature_stack"
  | "bottom_info_bar"
  | "comparison_left"
  | "comparison_right"
  | "detail_inset"
  | "application_grid"
  | "badge_area";

export type LayoutRegionPosition =
  | "top"
  | "left"
  | "right"
  | "bottom"
  | "center"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface LayoutRegion {
  id: string;
  role: LayoutRegionRole;
  position: LayoutRegionPosition;
  size: "small" | "medium" | "large";
  priority: number;
}

export type IconType =
  | "shield"
  | "wind"
  | "temperature"
  | "speed"
  | "target"
  | "gear"
  | "leaf"
  | "spark"
  | "tool"
  | "check"
  | "cross"
  | "clock"
  | "chart";

export interface IconHint {
  blockId: string;
  iconType: IconType;
  meaning: string;
}

export type TextBlockRole =
  | "headline"
  | "subtitle"
  | "selling_point"
  | "label"
  | "badge"
  | "feature_title"
  | "feature_description"
  | "spec_label"
  | "spec_value"
  | "section_header"
  | "callout";

export type TextBlockPosition = "top-left" | "top-right" | "right" | "left" | "bottom" | "top" | "center";

export interface TextBlock {
  id: string;
  text: string;
  role: TextBlockRole;
  position: TextBlockPosition;
  priority: number;
}

export interface ColorTheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}
