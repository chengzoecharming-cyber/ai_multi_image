import { auth } from "./auth";
import { NextRequest } from "next/server";

export async function requireSession(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session) {
    return null;
  }
  return session;
}

export function getAuthUserId(session: { user: { id: string } } | null): string | null {
  return session?.user?.id ?? null;
}
