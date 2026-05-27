import type { SavedTemplate } from "./types";
import type { PlanTemplate } from "@/lib/plan-templates/types";
import type { PromptGroup } from "@/lib/types";
import { createPromptGroup, getPromptGroups } from "@/lib/api";
import { savedTemplateToPlanTemplate } from "./adapter";

const STORAGE_KEY = "ai_image_v2_saved_templates_v1";
const SERVER_TEMPLATE_KIND = "v2_user_template";
const SERVER_TEMPLATE_VERSION = 1;

export function getSavedTemplates(): SavedTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSavedTemplate(template: SavedTemplate): void {
  if (typeof window === "undefined") return;
  const existing = getSavedTemplates();
  const idx = existing.findIndex((t) => t.id === template.id);
  const next = idx >= 0
    ? existing.map((t) => (t.id === template.id ? template : t))
    : [...existing, template];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function deleteSavedTemplate(id: string): void {
  if (typeof window === "undefined") return;
  const existing = getSavedTemplates();
  const next = existing.filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

type ServerStoredTemplateConfig = {
  kind: typeof SERVER_TEMPLATE_KIND;
  version: number;
  template: PlanTemplate;
  legacyLocalId?: string;
};

function parsePromptGroupConfig(configJson?: string): Record<string, unknown> | null {
  if (!configJson) return null;
  try {
    const parsed = JSON.parse(configJson) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function buildServerStoredConfig(template: PlanTemplate, legacyLocalId?: string): ServerStoredTemplateConfig {
  return {
    kind: SERVER_TEMPLATE_KIND,
    version: SERVER_TEMPLATE_VERSION,
    template,
    legacyLocalId,
  };
}

function isServerUserTemplateGroup(group: PromptGroup): boolean {
  const parsed = parsePromptGroupConfig(group.configJson);
  return parsed?.kind === SERVER_TEMPLATE_KIND;
}

function promptGroupToPlanTemplate(group: PromptGroup): PlanTemplate | null {
  const parsed = parsePromptGroupConfig(group.configJson);
  const embedded = parsed?.template;
  if (embedded && typeof embedded === "object") {
    const template = embedded as PlanTemplate;
    return {
      ...template,
      id: group.id,
      name: group.name || template.name,
      description: group.remark || template.description || "",
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  if (!isServerUserTemplateGroup(group)) return null;

  return {
    id: group.id,
    name: group.name,
    description: group.remark || group.promptContent || "",
    scope: "user",
    category: "single_image",
    tags: ["用户保存"],
    applicablePlatforms: ["通用"],
    applicableProducts: ["工业品"],
    variables: [],
    templatePrompt: group.finalPrompt || group.promptContent,
    defaultRiskRules: [],
    enabled: true,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

export async function getSavedTemplatesFromServer(): Promise<PlanTemplate[]> {
  const res = await getPromptGroups();
  return res.data
    .filter(isServerUserTemplateGroup)
    .map(promptGroupToPlanTemplate)
    .filter((template): template is PlanTemplate => Boolean(template));
}

export async function saveSavedTemplateToServer(template: PlanTemplate): Promise<PlanTemplate> {
  const res = await createPromptGroup({
    name: template.name,
    promptContent: template.description || template.name,
    finalPrompt: template.templatePrompt,
    negativePrompt: "",
    config: buildServerStoredConfig(template, template.id) as unknown as Record<string, unknown>,
    remark: template.description || "",
    coverImageUrl: undefined,
    references: [],
  });

  const mapped = promptGroupToPlanTemplate(res.data);
  if (!mapped) {
    throw new Error("服务端模板返回格式不正确");
  }
  return mapped;
}

export async function migrateLocalSavedTemplatesToServer(): Promise<PlanTemplate[]> {
  const localSaved = getSavedTemplates();
  if (localSaved.length === 0) {
    return getSavedTemplatesFromServer();
  }

  const existingRemote = await getSavedTemplatesFromServer();

  const toMigrate = localSaved
    .map(savedTemplateToPlanTemplate)
    .filter((template) => !existingRemote.some((remote) => remote.name === template.name));

  if (toMigrate.length === 0) {
    return existingRemote;
  }

  await Promise.all(toMigrate.map((template) => saveSavedTemplateToServer(template)));
  localStorage.removeItem(STORAGE_KEY);
  return getSavedTemplatesFromServer();
}
