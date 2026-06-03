import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const user = session?.user as { id?: string; role?: string } | undefined;
    const token = (session as { session?: { token?: string } } | null)?.session?.token;
    if (!user?.id || !token) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    if (user.role === "admin") {
      return NextResponse.json({ success: true, role: "admin" });
    }

    const body = (await request.json()) as { authorizationCode?: string };
    const codeValue = normalizeCode(body.authorizationCode || "");
    if (!/^[A-Z0-9]{6}$/.test(codeValue)) {
      return NextResponse.json({ error: "请输入有效的6位授权码" }, { status: 400 });
    }

    const authorizationCode = await prisma.authorizationCode.findUnique({
      where: { code: codeValue },
      select: { id: true, userId: true, status: true, quota: true },
    });
    if (!authorizationCode || authorizationCode.userId !== user.id) {
      return NextResponse.json({ error: "授权码与当前用户不匹配" }, { status: 403 });
    }
    if (authorizationCode.status === "disabled") {
      return NextResponse.json({ error: "授权码已禁用" }, { status: 403 });
    }
    if (authorizationCode.status === "error") {
      return NextResponse.json({ error: "授权码异常，请联系管理员" }, { status: 403 });
    }

    await prisma.$transaction([
      prisma.session.update({
        where: { token },
        data: { authorizationCodeId: authorizationCode.id },
      }),
      prisma.authorizationCode.update({
        where: { id: authorizationCode.id },
        data: { lastUsedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      authorizationCode: {
        id: authorizationCode.id,
        status: authorizationCode.quota <= 0 ? "limited" : authorizationCode.status,
        remaining: authorizationCode.quota,
      },
    });
  } catch (error) {
    console.error("[AuthCode Activate] Error:", error);
    return NextResponse.json({ error: "授权码校验失败" }, { status: 500 });
  }
}
