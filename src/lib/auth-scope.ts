import type { NextRequest } from "next/server";
import { auth } from "./auth";
import { prisma } from "./db";

export interface AuthScope {
  userId: string;
  role: string;
  isAdmin: boolean;
  sessionId?: string;
  sessionToken?: string;
  authorizationCodeId?: string | null;
  authorizationCode?: {
    id: string;
    code: string;
    status: string;
    quota: number;
    quotaMax: number;
    resetHours: number;
    resetAt: Date | null;
    note: string | null;
  } | null;
}

export async function getAuthScope(request: NextRequest): Promise<AuthScope | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) return null;
  const authSession = (session as { session?: { id?: string; token?: string } }).session;
  const cookieToken =
    request.cookies.get("__Secure-better-auth.session_token")?.value ||
    request.cookies.get("better-auth.session_token")?.value ||
    null;
  const sessionToken = authSession?.token || cookieToken?.split(".")[0] || undefined;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const role = user?.role || "user";
  const authSessionRow = sessionToken
    ? await prisma.session.findUnique({
        where: { token: sessionToken },
        select: {
          id: true,
          token: true,
          authorizationCodeId: true,
          authorizationCode: {
            select: {
              id: true,
              code: true,
              status: true,
              quota: true,
              quotaMax: true,
              resetHours: true,
              resetAt: true,
              note: true,
            },
          },
        },
      })
    : null;

  return {
    userId,
    role,
    isAdmin: role === "admin",
    sessionId: authSessionRow?.id ?? authSession?.id,
    sessionToken: authSessionRow?.token ?? sessionToken,
    authorizationCodeId: authSessionRow?.authorizationCodeId ?? null,
    authorizationCode: authSessionRow?.authorizationCode ?? null,
  };
}

export function scopedTenantUserWhere(scope: AuthScope, tenantId: string) {
  if (scope.isAdmin) return { tenantId };
  return {
    tenantId,
    userId: scope.userId,
    authorizationCodeId: scope.authorizationCodeId ?? "__missing_authorization_code__",
  };
}

export function requireActiveAuthorizationCode(scope: AuthScope): { ok: true } | { ok: false; error: string; status: number } {
  if (scope.isAdmin) return { ok: true };
  const code = scope.authorizationCode;
  if (!code) {
    return { ok: false, error: "请使用有效授权码登录", status: 403 };
  }
  if (code.status === "disabled") {
    return { ok: false, error: "授权码已禁用，请联系管理员", status: 403 };
  }
  if (code.status === "error") {
    return { ok: false, error: "授权码异常，请联系管理员", status: 403 };
  }
  return { ok: true };
}
