import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { hashPassword } from "@better-auth/utils/password";

// PUT /api/admin/users/:id — update user (admin only)
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
      name?: string;
      email?: string;
      role?: string;
      password?: string;
      imageQuotaMax?: number;
      quotaResetHours?: number;
    };

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name?.trim() || null;
    if (body.email !== undefined) updateData.email = body.email.trim();
    if (body.role !== undefined) updateData.role = body.role === "admin" ? "admin" : "user";
    if (typeof body.imageQuotaMax === "number" && Number.isFinite(body.imageQuotaMax)) {
      const newMax = Math.max(0, Math.floor(body.imageQuotaMax));
      updateData.imageQuotaMax = newMax;
      // 同时把当前剩余配额也同步到新上限，避免上限降低后剩余反而大于上限
      updateData.imageQuota = newMax;
    }
    if (typeof body.quotaResetHours === "number" && Number.isFinite(body.quotaResetHours)) {
      updateData.quotaResetHours = Math.max(1, Math.floor(body.quotaResetHours));
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        imageQuota: true,
        imageQuotaMax: true,
        quotaResetHours: true,
        createdAt: true,
      },
    });

    // Update password if provided
    if (body.password?.trim()) {
      const hashedPassword = await hashPassword(body.password.trim());
      const account = await prisma.account.findFirst({
        where: { userId: id, providerId: "credential" },
      });
      if (account) {
        await prisma.account.update({
          where: { id: account.id },
          data: { password: hashedPassword },
        });
      } else {
        await prisma.account.create({
          data: {
            userId: id,
            providerId: "credential",
            accountId: "",
            password: hashedPassword,
          },
        });
      }
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("[Admin Users] PUT error:", error);
    return NextResponse.json({ error: "更新用户失败" }, { status: 500 });
  }
}

// DELETE /api/admin/users/:id — delete user (admin only)
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
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Users] DELETE error:", error);
    return NextResponse.json({ error: "删除用户失败" }, { status: 500 });
  }
}
