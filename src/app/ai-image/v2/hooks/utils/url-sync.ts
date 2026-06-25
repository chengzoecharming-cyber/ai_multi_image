/**
 * URL sync utility for V2 sessions.
 * Uses `history.replaceState` so we do not trigger a full Next.js navigation.
 */

const SESSION_QUERY_KEY = "session";

export function syncSessionToUrl(sessionId: string | null) {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (sessionId) {
    url.searchParams.set(SESSION_QUERY_KEY, sessionId);
  } else {
    url.searchParams.delete(SESSION_QUERY_KEY);
  }

  // Only update if the search params actually changed
  const currentSearch = window.location.search;
  const nextSearch = url.search;
  if (currentSearch !== nextSearch) {
    window.history.replaceState({}, "", url.toString());
  }
}

export function getSessionIdFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get(SESSION_QUERY_KEY);
}
