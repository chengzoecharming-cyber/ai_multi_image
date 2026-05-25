export type VisualStyleId =
  | "clean_catalog"
  | "light_technical"
  | "high_contrast_promo"
  | "macro_chiaroscuro"
  | "dark_technical"
  | "workshop_lifestyle"
  | "premium_black"
  | "comparison_drama"
  | "bundle_pop"
  | "cnc_machine_bed"
  | "worn_workbench"
  | "assembly_station"
  // === 空模板专用 Light/Dark 双模式风格 ===
  | "empty_light_clean"
  | "empty_light_bold"
  | "empty_light_technical"
  | "empty_dark_tech"
  | "empty_dark_luxury"
  | "empty_dark_dynamic";

export interface VisualStyleProfile {
  id: VisualStyleId;
  label: string;
  visualDirection: string;
  colorDirection: string;
}
