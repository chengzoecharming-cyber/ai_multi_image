import { NextRequest, NextResponse } from "next/server";
import { getAuthScope } from "@/lib/auth-scope";
import { checkAndResetQuotaForScope } from "@/lib/quota";

function effectiveStatus(status: string | undefined, remaining: number): string {
  if (!status || status === "normal") return remaining <= 0 ? "limited" : "normal";
  return status;
}

export async function GET(request: NextRequest) {
  const scope = await getAuthScope(request);
  if (!scope) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const quota = await checkAndResetQuotaForScope(scope);
  const code = scope.authorizationCode;

  return NextResponse.json({
    data: {
      userId: scope.userId,
      role: scope.role,
      isAdmin: scope.isAdmin,
      authorizationCode: code
        ? {
            id: code.id,
            code: code.code,
            status: effectiveStatus(code.status, quota.remaining),
            note: code.note,
            quota: quota.remaining,
            quotaMax: code.quotaMax,
            resetAt: quota.resetAt?.toISOString() ?? null,
            resetHours: quota.resetHours,
            hoursUntilReset: quota.hoursUntilReset,
          }
        : null,
    },
  });
}
