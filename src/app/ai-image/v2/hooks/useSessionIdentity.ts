"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "ai_image_v2_client_user_id";
const DEFAULT_TENANT_ID = "default";

function normalizeIdentity(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}

function createClientUserId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `browser-${globalThis.crypto.randomUUID()}`;
  }
  return `browser-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export interface SessionIdentity {
  tenantId: string;
  userId: string;
  ownerKey: string;
  isReady: boolean;
}

export function useSessionIdentity(): SessionIdentity {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userIdFromQuery = normalizeIdentity(params.get("userId"), "");
    if (userIdFromQuery) {
      setUserId(userIdFromQuery);
      return;
    }

    const stored = normalizeIdentity(window.localStorage.getItem(STORAGE_KEY), "");
    if (stored) {
      setUserId(stored);
      return;
    }

    const nextUserId = createClientUserId();
    window.localStorage.setItem(STORAGE_KEY, nextUserId);
    setUserId(nextUserId);
  }, []);

  const tenantId = useMemo(() => {
    if (typeof window === "undefined") return DEFAULT_TENANT_ID;
    const params = new URLSearchParams(window.location.search);
    return normalizeIdentity(params.get("tenantId"), DEFAULT_TENANT_ID);
  }, []);

  const resolvedUserId = userId || "";
  const ownerKey = `${tenantId}::${resolvedUserId || "pending"}`;

  return {
    tenantId,
    userId: resolvedUserId,
    ownerKey,
    isReady: Boolean(userId),
  };
}
