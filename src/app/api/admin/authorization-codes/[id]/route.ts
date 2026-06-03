import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as {
      status?: string;
      quotaMax?: number;
      resetHours?: number;
      note?: string | null;
      userId?: string | null;
      userEmail?: string | null;
    };
    const data: Record<string, unknown> = {};

    if (body.status !== undefined) {
      data.status = ["normal", "limited", "error", "disabled"].includes(body.status) ? body.status : "normal";
    }
    if (typeof body.quotaMax === "number" && Number.isFinite(body.quotaMax)) {
      const quotaMax = Math.max(0, Math.floor(body.quotaMax));
      data.quotaMax = quotaMax;
      data.quota = quotaMax;
      if (body.status === undefined) data.status = quotaMax <= 0 ? "limited" : "normal";
    }
    if (typeof body.resetHours === "number" && Number.isFinite(body.resetHours)) {
      data.resetHours = Math.max(1, Math.floor(body.resetHours));
      data.resetAt = new Date(Date.now() + Number(data.resetHours) * 60 * 60 * 1000);
    }
    if (body.note !== undefined) {
      data.note = body.note?.trim() || null;
    }
    if (body.userEmail !== undefined) {
      const email = body.userEmail?.trim().toLowerCase();
      if (!email) {
        data.userId = null;
      } else {
        const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
        if (!user) {
          return NextResponse.json({ error: "绑定用户不存在" }, { status: 404 });
        }
        data.userId = user.id;
      }
    } else if (body.userId !== undefined) {
      data.userId = body.userId || null;
    }

    const updated = await prisma.authorizationCode.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[Admin AuthorizationCodes] PUT error:", error);
    return NextResponse.json({ error: "更新授权码失败" }, { status: 500 });
  }
}

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
    await prisma.$transaction([
      prisma.session.updateMany({
        where: { authorizationCodeId: id },
        data: { authorizationCodeId: null },
      }),
      prisma.authorizationCode.delete({ where: { id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin AuthorizationCodes] DELETE error:", error);
    return NextResponse.json({ error: "删除授权码失败" }, { status: 500 });
  }
}
