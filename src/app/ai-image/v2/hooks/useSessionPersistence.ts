"use client";

import { useEffect, useRef, useCallback } from "react";
import type { V2Session } from "../types";
import {
  dexieSaveSessions,
  dexieSaveSession,
  dexieGetAllSessions,
  dexieGetDirtySessions,
  dexieMarkClean,
  dexieDeleteSession,
  dexieMigrateFromLocalStorage,
  dexieClearLegacyLocalStorage,
  dexieGetMeta,
  dexieSetMeta,
} from "@/lib/v2-dexie";
import { mergeSessionsWithServerHistory, stripHeavySessionFields } from "./utils/session-utils";
import { getV2SessionsUrl } from "./sessionFetch";

const SYNC_DEBOUNCE_MS = 2000;
const FULL_SYNC_INTERVAL_MS = 30000;

export interface UseSessionPersistenceOptions {
  sessions: V2Session[];
  isHydrated: boolean;
  tenantId?: string;
  userId?: string;
  ownerKey?: string;
}

export interface PersistenceApi {
  syncNow: () => Promise<void>;
  pushToServer: (session: V2Session) => Promise<void>;
  persistSessionImmediately: (session: V2Session) => Promise<void>;
  pullFromServer: () => Promise<V2Session[]>;
  deleteFromServer: (id: string) => Promise<void>;
}

export function useSessionPersistence(options: UseSessionPersistenceOptions): PersistenceApi {
  const { sessions, isHydrated, tenantId = "default", userId = "default", ownerKey = `${tenantId}::${userId}` } = options;

  const sessionsRef = useRef(sessions);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fullSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // ── Debounced sync to IndexedDB ──
  // NOTE: do NOT pass `dirty=true` here. Preserve existing dirty flags so that
  // already-clean sessions (synced to server) are not re-marked dirty by the
  // background debounce.  `dexieSaveSessions` with `dirty=undefined` keeps the
  // previous dirty value.
  useEffect(() => {
    if (!isHydrated) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const current = sessionsRef.current;
      if (current.length === 0) return;
      const stripped = current.map((s) => stripHeavySessionFields(s));
      dexieSaveSessions(stripped, undefined, ownerKey).catch((e) =>
        console.error("[useSessionPersistence] Failed to save to IndexedDB:", e)
      );
    }, SYNC_DEBOUNCE_MS);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [sessions, isHydrated, ownerKey]);

  // ── Periodic full sync to server ──
  useEffect(() => {
    if (!isHydrated) return;

    const tick = () => {
      fullSyncTimerRef.current = setTimeout(async () => {
        await syncDirtySessionsToServer(ownerKey, tenantId, userId);
        tick();
      }, FULL_SYNC_INTERVAL_MS);
    };

    tick();
    return () => {
      if (fullSyncTimerRef.current) clearTimeout(fullSyncTimerRef.current);
    };
  }, [isHydrated, ownerKey, tenantId, userId]);

  const syncNow = useCallback(async () => {
    await syncDirtySessionsToServer(ownerKey, tenantId, userId);
  }, [ownerKey, tenantId, userId]);

  const pushToServer = useCallback(
    async (session: V2Session) => {
      try {
        await postSessionToServer(session, tenantId, userId);
        await dexieMarkClean(session.id, ownerKey);
      } catch (e) {
        console.error("[useSessionPersistence] Push failed:", e);
      }
    },
    [ownerKey, tenantId, userId]
  );

  const persistSessionImmediately = useCallback(
    async (session: V2Session) => {
      try {
        const stripped = stripHeavySessionFields(session);
        await dexieSaveSession(stripped, true, ownerKey);
        await postSessionToServer(stripped, tenantId, userId);
        await dexieMarkClean(session.id, ownerKey);
      } catch (e) {
        console.error("[useSessionPersistence] Immediate persist failed:", e);
      }
    },
    [ownerKey, tenantId, userId]
  );

  const pullFromServer = useCallback(async (): Promise<V2Session[]> => {
    try {
      const res = await fetch(getV2SessionsUrl());
      if (!res.ok) return [];
      const json = (await res.json()) as { data?: V2Session[] };
      const serverSessions = json.data || [];
      // Save server sessions to IndexedDB (clean)
      if (serverSessions.length > 0) {
        await dexieSaveSessions(serverSessions, false, ownerKey);
      }
      return serverSessions;
    } catch (e) {
      console.error("[useSessionPersistence] Pull failed:", e);
      return [];
    }
  }, [ownerKey, tenantId, userId]);

  const deleteFromServer = useCallback(
    async (id: string) => {
      try {
        await fetch(
          `/api/ai-image/v2/sessions/${id}`,
          { method: "DELETE" }
        );
        await dexieDeleteSession(id, ownerKey);
      } catch (e) {
        console.error("[useSessionPersistence] Delete failed:", e);
      }
    },
    [ownerKey]
  );

  return { syncNow, pushToServer, persistSessionImmediately, pullFromServer, deleteFromServer };
}

// ============================================================
// Static helpers for initial hydration
// ============================================================

export async function hydrateSessions(
  tenantId: string,
  userId: string,
  ownerKey: string,
  searchParams?: { get: (key: string) => string | null }
): Promise<{ sessions: V2Session[]; activeSessionId: string | null }> {
  // 1. Try localStorage migration (first time only)
  const migrated = await dexieMigrateFromLocalStorage(ownerKey);
  if (migrated) {
    await dexieClearLegacyLocalStorage();
    await dexieSetMeta("activeSessionId", migrated.activeSessionId, ownerKey);
  }

  const local = await dexieGetAllSessions(ownerKey);
  const dirtyLocal = await dexieGetDirtySessions(ownerKey);

  // 2. Merge server with IndexedDB. IndexedDB may contain fresh uploads that
  // have not reached the 30s background sync yet; never let server hydration
  // replace those with older snapshots.
  try {
    const res = await fetch(getV2SessionsUrl());
    if (res.ok) {
      const json = (await res.json()) as { data?: V2Session[] };
      const serverSessions = json.data || [];
      if (serverSessions.length > 0) {
        const mergedSessions = mergeSessionsWithServerHistory(local, serverSessions);
        await dexieSaveSessions(mergedSessions, dirtyLocal.length > 0, ownerKey);
        const previousActiveId = await dexieGetMeta<string>("activeSessionId", undefined, ownerKey);
        const activeId =
          previousActiveId && mergedSessions.some((session) => session.id === previousActiveId)
            ? previousActiveId
            : mergedSessions[0]?.id ?? null;
        return { sessions: mergedSessions, activeSessionId: activeId };
      }
    }
  } catch (e) {
    console.warn("[hydrateSessions] Server load failed, falling back to IndexedDB:", e);
  }

  // 3. Fall back to IndexedDB
  if (local.length > 0) {
    const activeId = (await dexieGetMeta<string>("activeSessionId", undefined, ownerKey)) || local[0].id;
    return { sessions: local, activeSessionId: activeId };
  }

  // 4. Seed a fresh session from URL params
  const seedProductImage = searchParams?.get("productImageUrl");
  const seedGoal = searchParams?.get("goal") || "";
  const { createEmptySession } = await import("./utils/session-utils");
  const seeded = createEmptySession({
    productImageUrls: seedProductImage ? [seedProductImage] : [],
    goal: seedGoal,
    workspaceTab: "product",
  });
  await dexieSaveSession(seeded, true, ownerKey);
  return { sessions: [seeded], activeSessionId: seeded.id };
}

// ============================================================
// Internal
// ============================================================

async function postSessionToServer(session: V2Session, _tenantId: string, _userId: string): Promise<void> {
  const res = await fetch(
    `/api/ai-image/v2/sessions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown" }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
}

async function syncDirtySessionsToServer(ownerKey: string, tenantId: string, userId: string): Promise<void> {
  try {
    const dirty = await dexieGetDirtySessions(ownerKey);
    if (dirty.length === 0) return;
    for (const session of dirty) {
      await postSessionToServer(session, tenantId, userId);
      await dexieMarkClean(session.id, ownerKey);
    }
  } catch (e) {
    console.error("[useSessionPersistence] Full sync failed:", e);
  }
}
