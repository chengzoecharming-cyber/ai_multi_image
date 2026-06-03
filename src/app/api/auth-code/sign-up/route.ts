import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@better-auth/utils/password";
import { prisma } from "@/lib/db";

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      authorizationCode?: string;
      name?: string;
      email?: string;
      password?: string;
    };
    const codeValue = normalizeCode(body.authorizationCode || "");
    const email = body.email?.trim().toLowerCase() || "";
    const password = body.password || "";

    if (!/^[A-Z0-9]{6}$/.test(codeValue)) {
      return NextResponse.json({ error: "请输入有效的6位授权码" }, { status: 400 });
    }
    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密码长度至少 6 位" }, { status: 400 });
    }

    const authorizationCode = await prisma.authorizationCode.findUnique({
      where: { code: codeValue },
      select: { id: true, userId: true, status: true, quota: true, quotaMax: true, resetHours: true },
    });
    if (!authorizationCode) {
      return NextResponse.json({ error: "授权码不存在" }, { status: 404 });
    }
    if (authorizationCode.userId) {
      return NextResponse.json({ error: "授权码已绑定用户" }, { status: 409 });
    }
    if (authorizationCode.status === "disabled") {
      return NextResponse.json({ error: "授权码已禁用" }, { status: 403 });
    }
    if (authorizationCode.status === "error") {
      return NextResponse.json({ error: "授权码异常，请联系管理员" }, { status: 403 });
    }
    if (authorizationCode.status === "limited" || authorizationCode.quota <= 0) {
      return NextResponse.json({ error: "授权码额度已耗尽，请等待恢复" }, { status: 429 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "邮箱已被注册" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const resetAt = new Date(Date.now() + authorizationCode.resetHours * 60 * 60 * 1000);
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: body.name?.trim() || null,
          email,
          emailVerified: true,
          role: "user",
          imageQuota: authorizationCode.quota,
          imageQuotaMax: authorizationCode.quotaMax,
          quotaResetHours: authorizationCode.resetHours,
          accounts: {
            create: {
              providerId: "credential",
              accountId: "",
              password: hashedPassword,
            },
          },
        },
        select: { id: true, name: true, email: true },
      });
      await tx.authorizationCode.update({
        where: { id: authorizationCode.id },
        data: {
          userId: created.id,
          resetAt,
          lastUsedAt: new Date(),
        },
      });
      return created;
    });

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("[AuthCode SignUp] Error:", error);
    return NextResponse.json({ error: "注册失败" }, { status: 500 });
  }
}
