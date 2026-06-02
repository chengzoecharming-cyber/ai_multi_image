"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { V2Session } from "../types";
import {
  createEmptySession,
  deriveSessionStatus,
  mergeSessionsWithServerHistory,
} from "./utils/session-utils";
import {
  dexieGetAllSessions,
  dexieMigrateFromLocalStorage,
  dexieClearLegacyLocalStorage,
} from "@/lib/v2-dexie";

async function loadServerV2Sessions(tenantId: string, userId: string): Promise<V2Session[]> {
  try {
    const res = await fetch(
      `/api/ai-image/v2/sessions?tenantId=${encodeURIComponent(tenantId)}&userId=${encodeURIComponent(userId)}&limit=100`
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: V2Session[] };
    return json.data || [];
  } catch (error) {
    console.warn("[useSessionStore] Failed to load V2 server sessions:", error);
    return [];
  }
}

export interface SessionStoreState {
  sessions: V2Session[];
  setSessions: React.Dispatch<React.SetStateAction<V2Session[]>>;
  activeSessionId: string | null;
  setActiveSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  activeSession: V2Session | null;
  updateActiveSession: (updater: (s: V2Session) => V2Session) => void;
  isHydrated: boolean;
}

export function useSessionStore(): SessionStoreState {
  const searchParams = useSearchParams();

  const [sessions, setSessions] = useState<V2Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;
  }, [sessions, activeSessionId]);

  const updateActiveSession = useCallback(
    (updater: (s: V2Session) => V2Session) => {
      if (!activeSession) return;
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSession.id) return s;
          const next = updater(s);
          const status = deriveSessionStatus(next);
          return { ...next, updatedAt: Date.now(), status };
        })
      );
    },
    [activeSession]
  );

  // ── Hydration: IndexedDB ↔ Server V2 only ──
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      // 1. Migrate legacy localStorage on first load
      const migrated = await dexieMigrateFromLocalStorage();
      if (migrated) {
        await dexieClearLegacyLocalStorage();
      }

      // 2. Load from server V2 API
      const serverV2 = await loadServerV2Sessions("default", "default");

      // 3. Load from IndexedDB
      const indexedDbSessions = await dexieGetAllSessions();

      // 4. Merge server V2 + IndexedDB
      let merged: V2Session[] = [];
      if (serverV2.length > 0) {
        merged = serverV2;
      }
      if (indexedDbSessions.length > 0) {
        merged = mergeSessionsWithServerHistory(merged, indexedDbSessions);
      }

      if (merged.length > 0 && !cancelled) {
        setSessions(merged);
        const nextActiveId =
          migrated?.activeSessionId && merged.some((s) => s.id === migrated.activeSessionId)
            ? migrated.activeSessionId
            : merged[0].id;
        setActiveSessionId(nextActiveId);
        setIsHydrated(true);
        return;
      }

      // 5. Seed a fresh session
      const seeded = createEmptySession({
        productImageUrls: searchParams.get("productImageUrl") ? [searchParams.get("productImageUrl")!] : [],
        goal: searchParams.get("goal") || "",
        workspaceTab: "product",
      });
      if (!cancelled) {
        setSessions([seeded]);
        setActiveSessionId(seeded.id);
        setIsHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return {
    sessions,
    setSessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    updateActiveSession,
    isHydrated,
  };
}
