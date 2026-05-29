"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import type { V2Session, V2WorkspaceTab } from "../types";
import { createEmptySession, deriveSessionStatus } from "./utils/session-utils";
import { safeJsonParse } from "./utils/storage-utils";

export interface UseSessionActionsOptions {
  sessions: V2Session[];
  setSessions: React.Dispatch<React.SetStateAction<V2Session[]>>;
  activeSessionId: string | null;
  setActiveSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  activeSession: V2Session | null;
  updateActiveSession: (updater: (s: V2Session) => V2Session) => void;
  workspaceTab: V2WorkspaceTab;
  setWorkspaceTabState: React.Dispatch<React.SetStateAction<V2WorkspaceTab>>;
}

export interface SessionActions {
  createNewSession: (seed?: Partial<V2Session>) => void;
  duplicateSession: (id: string) => void;
  deleteSession: (id: string) => void;
  setWorkspaceTab: (tab: V2WorkspaceTab) => void;
  handleReset: () => void;
}

export function useSessionActions(options: UseSessionActionsOptions): SessionActions {
  const {
    sessions,
    setSessions,
    activeSessionId,
    setActiveSessionId,
    activeSession,
    updateActiveSession,
    setWorkspaceTabState,
  } = options;

  const createNewSession = useCallback(
    (seed?: Partial<V2Session>) => {
      const sess = createEmptySession(seed);
      setSessions((prev) => [sess, ...prev]);
      setActiveSessionId(sess.id);
      toast.success("已新增记录");
    },
    [setSessions, setActiveSessionId]
  );

  const duplicateSession = useCallback(
    (id: string) => {
      const base = sessions.find((s) => s.id === id);
      if (!base) return;
      const cloned = safeJsonParse<V2Session>(JSON.stringify(base)) || base;
      const ts = Date.now();
      const next: V2Session = {
        ...cloned,
        id: globalThis.crypto?.randomUUID?.() || `sess-${ts}-${Math.random().toString(36).slice(2, 6)}`,
        createdAt: ts,
        updatedAt: ts,
        lastError: null,
        generatingImage: false,
        status: deriveSessionStatus({ ...cloned, generatingImage: false, lastError: null } as V2Session),
      };
      setSessions((prev) => [next, ...prev]);
      setActiveSessionId(next.id);
      toast.success("已复制记录");
    },
    [sessions, setSessions, setActiveSessionId]
  );

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        const fallback = next.length ? next : [createEmptySession({ workspaceTab: "product" })];
        if (activeSessionId === id) setActiveSessionId(fallback[0].id);
        return fallback;
      });
      toast.success("已删除记录");
    },
    [activeSessionId, setActiveSessionId]
  );

  const setWorkspaceTab = useCallback(
    (tab: V2WorkspaceTab) => {
      setWorkspaceTabState(tab);
      setActiveSessionId((prevId) => {
        const current = sessions.find((s) => s.id === prevId) || null;
        if (current && (current.workspaceTab || "product") === tab) return prevId;
        const candidate = sessions.find((s) => (s.workspaceTab || "product") === tab) || null;
        return candidate?.id || prevId;
      });
    },
    [sessions, setWorkspaceTabState]
  );

  const handleReset = useCallback(() => {
    if (!activeSession) return;
    updateActiveSession((s) =>
      createEmptySession({
        id: s.id,
        createdAt: s.createdAt,
        workspaceTab: s.workspaceTab || "product",
      })
    );
  }, [activeSession, updateActiveSession]);

  return {
    createNewSession,
    duplicateSession,
    deleteSession,
    setWorkspaceTab,
    handleReset,
  };
}
