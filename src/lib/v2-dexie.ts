import Dexie, { type EntityTable } from "dexie";
import type { V2Session } from "@/app/ai-image/v2/types";

// ============================================================
// IndexedDB Schema for V2 Workbench
// ============================================================

export interface DexieSession {
  id: string;
  ownerKey: string;
  data: V2Session;
  syncedAt: number; // timestamp of last successful server sync
  updatedAt: number; // timestamp of last local write
  dirty: boolean;   // true if local changes not yet synced
  deleted: boolean; // soft-delete flag
}

export interface DexieMeta {
  key: string;
  value: unknown;
}

const DB_NAME = "ai_image_v2";
const DB_VERSION = 3;
const DEFAULT_OWNER_KEY = "default::default";

class V2Dexie extends Dexie {
  sessions!: EntityTable<DexieSession, "id">;
  meta!: EntityTable<DexieMeta, "key">;

  constructor() {
    super(DB_NAME);
    this.version(1).stores({
      sessions: "id, ownerKey, dirty, deleted, syncedAt",
      meta: "key",
    });
    this.version(2).stores({
      sessions: "id, ownerKey, dirty, deleted, syncedAt",
      meta: "key",
    });
    this.version(3).stores({
      sessions: "id, ownerKey, dirty, deleted, syncedAt, updatedAt",
      meta: "key",
    }).upgrade(async (tx) => {
      // Migrate v2 → v3: add updatedAt (default to syncedAt or 0)
      const sessions = tx.table("sessions");
      await sessions.toCollection().modify((row: DexieSession) => {
        row.updatedAt = row.syncedAt || 0;
      });
    });
  }
}

export const v2db = new V2Dexie();

// ============================================================
// Session CRUD
// ============================================================

export async function dexieSaveSession(session: V2Session, dirty?: boolean, ownerKey = DEFAULT_OWNER_KEY): Promise<void> {
  const existing = await v2db.sessions.get(session.id);
  const nextDirty = dirty !== undefined ? dirty : (existing?.dirty ?? true);
  const nextSyncedAt = dirty === false ? Date.now() : (existing?.syncedAt ?? 0);
  await v2db.sessions.put({
    id: session.id,
    ownerKey,
    data: session,
    syncedAt: nextSyncedAt,
    updatedAt: Date.now(),
    dirty: nextDirty,
    deleted: false,
  });
}

export async function dexieSaveSessions(
  sessions: V2Session[],
  dirty?: boolean,
  ownerKey = DEFAULT_OWNER_KEY
): Promise<void> {
  const existingRows = await v2db.sessions.where('id').anyOf(sessions.map(s => s.id)).toArray();
  const existingMap = new Map(existingRows.map(r => [r.id, r]));

  await v2db.sessions.bulkPut(
    sessions.map((s) => {
      const prev = existingMap.get(s.id);
      const nextDirty = dirty !== undefined ? dirty : (prev?.dirty ?? true);
      const nextSyncedAt = dirty === false ? Date.now() : (prev?.syncedAt ?? 0);
      return {
        id: s.id,
        ownerKey,
        data: s,
        syncedAt: nextSyncedAt,
        updatedAt: Date.now(),
        dirty: nextDirty,
        deleted: false,
      };
    })
  );
}

export async function dexieGetSession(id: string, ownerKey = DEFAULT_OWNER_KEY): Promise<V2Session | null> {
  const row = await v2db.sessions.get(id);
  if (row?.ownerKey !== ownerKey) return null;
  if (!row || row.deleted) return null;
  return row.data;
}

export async function dexieGetAllSessions(ownerKey = DEFAULT_OWNER_KEY): Promise<V2Session[]> {
  const rows = await v2db.sessions.where("ownerKey").equals(ownerKey).and((row) => !row.deleted).toArray();
  return rows.map((r) => r.data).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function dexieDeleteSession(id: string, ownerKey = DEFAULT_OWNER_KEY): Promise<void> {
  const row = await v2db.sessions.get(id);
  if (!row || row.ownerKey !== ownerKey) return;
  await v2db.sessions.delete(id);
}

export async function dexieSoftDeleteSession(id: string, ownerKey = DEFAULT_OWNER_KEY): Promise<void> {
  const row = await v2db.sessions.get(id);
  if (!row || row.ownerKey !== ownerKey) return;
  await v2db.sessions.update(id, { deleted: true, dirty: true });
}

export async function dexieMarkClean(id: string, ownerKey = DEFAULT_OWNER_KEY): Promise<void> {
  const row = await v2db.sessions.get(id);
  if (!row || row.ownerKey !== ownerKey) return;
  await v2db.sessions.update(id, { dirty: false, syncedAt: Date.now(), updatedAt: Date.now() });
}

export async function dexieGetDirtySessions(ownerKey = DEFAULT_OWNER_KEY): Promise<V2Session[]> {
  const rows = await v2db.sessions
    .where("ownerKey")
    .equals(ownerKey)
    .and((row) => row.dirty && !row.deleted)
    .toArray();
  return rows.map((r) => r.data);
}

// ============================================================
// Migration from localStorage legacy
// ============================================================

export async function dexieMigrateFromLocalStorage(
  ownerKey = DEFAULT_OWNER_KEY
): Promise<{ sessions: V2Session[]; activeSessionId: string | null } | null> {
  try {
    // v3
    const v3 = localStorage.getItem("ai_image_v2_sessions_v3");
    if (v3) {
      const parsed = JSON.parse(v3) as { sessions: V2Session[]; activeSessionId: string | null };
      if (parsed.sessions?.length) {
        await dexieSaveSessions(parsed.sessions, true, ownerKey);
        return { sessions: parsed.sessions, activeSessionId: parsed.activeSessionId };
      }
    }
    // v2 groups
    const v2 = localStorage.getItem("ai_image_v2_sessions_v2_groups");
    if (v2) {
      const parsed = JSON.parse(v2) as { groups: Array<{ slots: V2Session[] }> };
      const flat = parsed.groups?.flatMap((g) => g.slots || []) || [];
      if (flat.length) {
        await dexieSaveSessions(flat, true, ownerKey);
        return { sessions: flat, activeSessionId: flat[0]?.id ?? null };
      }
    }
    // v1
    const v1 = localStorage.getItem("ai_image_v2_sessions_v1");
    if (v1) {
      const parsed = JSON.parse(v1) as { sessions: V2Session[]; activeSessionId: string | null };
      if (parsed.sessions?.length) {
        await dexieSaveSessions(parsed.sessions, true, ownerKey);
        return { sessions: parsed.sessions, activeSessionId: parsed.activeSessionId };
      }
    }
  } catch (e) {
    console.error("[dexie] Failed to migrate from localStorage:", e);
  }
  return null;
}

export async function dexieClearLegacyLocalStorage(): Promise<void> {
  localStorage.removeItem("ai_image_v2_sessions_v3");
  localStorage.removeItem("ai_image_v2_sessions_v2_groups");
  localStorage.removeItem("ai_image_v2_sessions_v1");
}

// ============================================================
// Meta store (activeSessionId, lastSync)
// ============================================================

export async function dexieGetMeta<T>(
  key: string,
  defaultValue?: T,
  ownerKey = DEFAULT_OWNER_KEY
): Promise<T | undefined> {
  const row = await v2db.meta.get(`${ownerKey}:${key}`);
  return (row?.value as T) ?? defaultValue;
}

export async function dexieSetMeta(key: string, value: unknown, ownerKey = DEFAULT_OWNER_KEY): Promise<void> {
  await v2db.meta.put({ key: `${ownerKey}:${key}`, value });
}
