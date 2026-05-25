import type { LayoutType } from "./types";

export const LAYOUT_TYPE_LABELS: Record<LayoutType, string> = {
  hero_left_text_right_product: "左侧文案 + 右侧产品",
  hero_right_product_left_features: "右侧产品 + 左侧卖点",
  top_headline_bottom_feature_bar: "顶部标题 + 底部卖点条",
  comparison_two_columns: "左右双栏对比",
  technical_callout_with_insets: "技术标注 + 局部放大",
  exploded_layer_explanation: "分层结构说明",
  four_panel_application_grid: "四宫格应用场景",
  large_headline_with_bottom_info_bar: "大标题 + 底部信息栏",
  diagonal_product_with_side_features: "对角线产品 + 侧边卖点",
  premium_center_product_minimal_text: "居中产品 + 极简文字",
};
