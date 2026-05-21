export type V2TemplateEntryKind =
  | "solution_template"
  | "saved_template"
  | "detail_asset_type";

export const V2_TEMPLATE_ENTRY_KIND_LABELS: Record<V2TemplateEntryKind, string> = {
  solution_template: "方案模板库",
  saved_template: "我的模板",
  detail_asset_type: "商详图素材类型",
};
