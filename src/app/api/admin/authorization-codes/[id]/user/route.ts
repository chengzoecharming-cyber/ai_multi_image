import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function DELETE(
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
      select: { userId: true },
    });
    if (!code?.userId) {
      return NextResponse.json({ error: "授权码未绑定用户" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.authorizationCode.update({
        where: { id },
        data: { userId: null },
      }),
      prisma.user.delete({
        where: { id: code.userId },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin AuthorizationCodes] delete bound user error:", error);
    return NextResponse.json({ error: "删除绑定用户失败" }, { status: 500 });
  }
}
