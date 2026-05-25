import type { SavedTemplate } from "./types";

const STORAGE_KEY = "ai_image_v2_saved_templates_v1";

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
