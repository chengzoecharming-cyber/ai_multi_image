export function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const LEGACY_KEYS = [
  "ai_image_v2_sessions_v3",
  "ai_image_v2_sessions_v2_groups",
  "ai_image_v2_sessions_v1",
];

export function getLegacyLocalStorageSessions(): { sessions: unknown[]; activeSessionId: string | null } | null {
  // Try v3 first
  const v3 = safeJsonParse<{ sessions: unknown[]; activeSessionId: string | null }>(localStorage.getItem(LEGACY_KEYS[0]));
  if (v3?.sessions?.length) return v3;

  // Try v2 groups
  const v2 = safeJsonParse<{ groups: Array<{ slots: unknown[]; activeSlotId: string | null }>; activeGroupId: string | null }>(localStorage.getItem(LEGACY_KEYS[1]));
  if (v2?.groups?.length) {
    const flat: unknown[] = [];
    v2.groups.forEach((g) => {
      (g.slots || []).forEach((s) => flat.push(s));
    });
    if (flat.length) {
      const first = flat[0];
      const activeId =
        typeof first === "object" && first !== null && "id" in first
          ? String((first as Record<string, unknown>).id)
          : null;
      return { sessions: flat, activeSessionId: activeId };
    }
  }

  // Try v1
  const v1 = safeJsonParse<{ sessions: unknown[]; activeSessionId: string | null }>(localStorage.getItem(LEGACY_KEYS[2]));
  if (v1?.sessions?.length) return v1;

  return null;
}

export function clearLegacyLocalStorage() {
  LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
}
