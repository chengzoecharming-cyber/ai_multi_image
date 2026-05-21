export type VisualStyleId =
  | "clean_catalog"
  | "light_technical"
  | "high_contrast_promo"
  | "macro_chiaroscuro"
  | "dark_technical"
  | "workshop_lifestyle"
  | "premium_black"
  | "comparison_drama"
  | "bundle_pop";

export interface VisualStyleProfile {
  id: VisualStyleId;
  label: string;
  visualDirection: string;
  colorDirection: string;
}
