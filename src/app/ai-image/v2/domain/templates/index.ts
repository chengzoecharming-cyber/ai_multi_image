export type { V2TemplateEntryKind } from "./types";
export { V2_TEMPLATE_ENTRY_KIND_LABELS } from "./types";
export type { SystemTemplate, SavedTemplate, TemplateVariant, CopyProfile, TemplateConfigV2 } from "./types";
export {
  SYSTEM_TEMPLATE_PROFILES,
  getSystemTemplateProfile,
  getTemplateImageType,
  getTemplateDefaultCopyDensity,
  getTemplateAllowedLayouts,
} from "./presets";
export { resolveTemplateFields } from "./compat";
export {
  templateToImageType,
  templateToAllowedLayouts,
  templateToDefaultCopyDensity,
  templateToProfile,
  templateToConstraints,
} from "./mappers";
export {
  getSystemTemplates,
  getSystemTemplateById,
  systemTemplateToPlanTemplate,
  savedTemplateToPlanTemplate,
  planTemplateToSavedTemplate,
} from "./adapter";
export {
  getSavedTemplates,
  saveSavedTemplate,
  deleteSavedTemplate,
  getSavedTemplatesFromServer,
  saveSavedTemplateToServer,
  migrateLocalSavedTemplatesToServer,
} from "./user-templates";
