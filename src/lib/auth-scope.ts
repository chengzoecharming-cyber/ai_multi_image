import type { NextRequest } from "next/server";
import { auth } from "./auth";
import { prisma } from "./db";

export interface AuthScope {
  userId: string;
  role: string;
  isAdmin: boolean;
}

export async function getAuthScope(request: NextRequest): Promise<AuthScope | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const role = user?.role || "user";

  return {
    userId,
    role,
    isAdmin: role === "admin",
  };
}

export function scopedTenantUserWhere(scope: AuthScope, tenantId: string) {
  return scope.isAdmin ? { tenantId } : { tenantId, userId: scope.userId };
}
