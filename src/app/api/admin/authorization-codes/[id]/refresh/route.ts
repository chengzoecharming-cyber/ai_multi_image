import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const code = await prisma.authorizationCode.findUnique({
      where: { id },
      select: { quotaMax: true, resetHours: true },
    });
    if (!code) {
      return NextResponse.json({ error: "授权码不存在" }, { status: 404 });
    }

    const updated = await prisma.authorizationCode.update({
      where: { id },
      data: {
        quota: code.quotaMax,
        resetAt: new Date(Date.now() + code.resetHours * 60 * 60 * 1000),
        status: "normal",
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[Admin AuthorizationCodes] refresh error:", error);
    return NextResponse.json({ error: "刷新授权码失败" }, { status: 500 });
  }
}
