import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { hashPassword } from "@better-auth/utils/password";

// GET /api/admin/users — list all users (admin only)
export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        imageQuota: true,
        imageQuotaMax: true,
        quotaResetAt: true,
        quotaResetHours: true,
        emailVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: users });
  } catch (error) {
    console.error("[Admin Users] GET error:", error);
    return NextResponse.json({ error: "获取用户列表失败" }, { status: 500 });
  }
}

// POST /api/admin/users — create user (admin only)
export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      email: string;
      password: string;
      role?: string;
      imageQuotaMax?: number;
      quotaResetHours?: number;
    };

    if (!body.email?.trim() || !body.password?.trim()) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: body.email.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "邮箱已被注册" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(body.password);

    const quotaMax =
      typeof body.imageQuotaMax === "number" && Number.isFinite(body.imageQuotaMax)
        ? Math.max(0, Math.floor(body.imageQuotaMax))
        : 9999;
    const resetHours =
      typeof body.quotaResetHours === "number" && Number.isFinite(body.quotaResetHours)
        ? Math.max(1, Math.floor(body.quotaResetHours))
        : 24;

    const user = await prisma.user.create({
      data: {
        name: body.name?.trim() || null,
        email: body.email.trim(),
        role: body.role === "admin" ? "admin" : "user",
        imageQuota: quotaMax,
        imageQuotaMax: quotaMax,
        quotaResetHours: resetHours,
        accounts: {
          create: {
            providerId: "credential",
            accountId: "",
            password: hashedPassword,
          },
        },
      },
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

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("[Admin Users] POST error:", error);
    return NextResponse.json({ error: "创建用户失败" }, { status: 500 });
  }
}
