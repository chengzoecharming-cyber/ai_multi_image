import type { PlanTemplate } from "./types";
import { getSystemTemplates as getDomainSystemTemplates } from "@/app/ai-image/v2/domain/templates";

const STORAGE_KEY = "ai_image_v2_user_templates";

export function getSystemTemplates(): PlanTemplate[] {
  return getDomainSystemTemplates();
}

export function getSystemTemplateById(id: string): PlanTemplate | undefined {
  return getDomainSystemTemplates().find((t) => t.id === id);
}

export function getUserTemplates(): PlanTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PlanTemplate[];
    return parsed.filter((t) => t.scope === "user");
  } catch {
    return [];
  }
}

export function saveUserTemplate(template: PlanTemplate): void {
  if (typeof window === "undefined") return;
  const existing = getUserTemplates();
  const idx = existing.findIndex((t) => t.id === template.id);
  const next = idx >= 0
    ? existing.map((t) => (t.id === template.id ? template : t))
    : [...existing, template];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function deleteUserTemplate(id: string): void {
  if (typeof window === "undefined") return;
  const existing = getUserTemplates();
  const next = existing.filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function getAllTemplates(): PlanTemplate[] {
  return [...getSystemTemplates(), ...getUserTemplates()];
}

export function getTemplateById(id: string): PlanTemplate | undefined {
  return getAllTemplates().find((t) => t.id === id);
}
