import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function effectiveStatus(status: string, quota: number): string {
  if (status === "normal" && quota <= 0) return "limited";
  return status;
}

async function generateUniqueCode(reservedCodes = new Set<string>()): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    if (reservedCodes.has(code)) continue;
    const exists = await prisma.authorizationCode.findUnique({ where: { code }, select: { id: true } });
    if (!exists) return code;
  }
  throw new Error("Failed to generate unique authorization code");
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        createdAuthorizationCodes: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            code: true,
            status: true,
            quota: true,
            quotaMax: true,
            resetHours: true,
            resetAt: true,
            note: true,
            lastUsedAt: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      data: {
        currentAdminId: admin.userId,
        admins: admins.map((item) => ({
          ...item,
          authorizationCodes: item.createdAuthorizationCodes.map((code) => ({
            ...code,
            effectiveStatus: effectiveStatus(code.status, code.quota),
          })),
          createdAuthorizationCodes: undefined,
        })),
      },
    });
  } catch (error) {
    console.error("[Admin AuthorizationCodes] GET error:", error);
    return NextResponse.json({ error: "获取授权码失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      quotaMax?: number;
      resetHours?: number;
      note?: string;
      count?: number;
    };
    const count =
      typeof body.count === "number" && Number.isFinite(body.count)
        ? Math.min(100, Math.max(1, Math.floor(body.count)))
        : 1;
    const quotaMax =
      typeof body.quotaMax === "number" && Number.isFinite(body.quotaMax)
        ? Math.max(0, Math.floor(body.quotaMax))
        : 50;
    const resetHours =
      typeof body.resetHours === "number" && Number.isFinite(body.resetHours)
        ? Math.max(1, Math.floor(body.resetHours))
        : 24;
    const resetAt = new Date(Date.now() + resetHours * 60 * 60 * 1000);
    const reservedCodes = new Set<string>();
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const code = await generateUniqueCode(reservedCodes);
      reservedCodes.add(code);
      codes.push(code);
    }

    const created = await prisma.$transaction(
      codes.map((code) => prisma.authorizationCode.create({
        data: {
        code,
        quota: quotaMax,
        quotaMax,
        resetHours,
        resetAt,
        note: body.note?.trim() || null,
        createdByAdminId: admin.userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      }))
    );

    return NextResponse.json({
      data: created.map((item) => ({ ...item, effectiveStatus: effectiveStatus(item.status, item.quota) })),
    });
  } catch (error) {
    console.error("[Admin AuthorizationCodes] POST error:", error);
    return NextResponse.json({ error: "生成授权码失败" }, { status: 500 });
  }
}
