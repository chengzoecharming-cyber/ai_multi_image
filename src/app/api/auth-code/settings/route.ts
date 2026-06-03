import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@better-auth/utils/password";
import { getAuthScope } from "@/lib/auth-scope";
import { prisma } from "@/lib/db";

export async function PUT(request: NextRequest) {
  try {
    const scope = await getAuthScope(request);
    if (!scope) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const body = (await request.json()) as { name?: string; password?: string };
    const name = body.name?.trim();
    const password = body.password?.trim();

    await prisma.user.update({
      where: { id: scope.userId },
      data: { name: name || null },
    });

    if (password) {
      const hashedPassword = await hashPassword(password);
      const account = await prisma.account.findFirst({
        where: { userId: scope.userId, providerId: "credential" },
      });
      if (account) {
        await prisma.account.update({
          where: { id: account.id },
          data: { password: hashedPassword },
        });
      } else {
        await prisma.account.create({
          data: {
            userId: scope.userId,
            providerId: "credential",
            accountId: scope.userId,
            password: hashedPassword,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[AuthCode Settings] Error:", error);
    return NextResponse.json({ error: "保存设置失败" }, { status: 500 });
  }
}
