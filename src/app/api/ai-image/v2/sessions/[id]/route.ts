import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deserializeSession } from "@/lib/v2-serialization";
import { getAuthScope, scopedTenantUserWhere } from "@/lib/auth-scope";

// GET /api/ai-image/v2/sessions/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getAuthScope(request);
    if (!scope) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const tenantId = "default";
    const { id } = await params;

    const row = await prisma.aiImageV2Session.findFirst({
      where: { id, ...scopedTenantUserWhere(scope, tenantId) },
      include: { plans: true, images: true, detail: true },
    });

    if (!row) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ data: deserializeSession(row) });
  } catch (error) {
    console.error("[GET /api/ai-image/v2/sessions/:id] Error:", error);
    return NextResponse.json({ error: "获取会话失败" }, { status: 500 });
  }
}

// DELETE /api/ai-image/v2/sessions/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const scope = await getAuthScope(request);
    if (!scope) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const tenantId = "default";
    const { id } = await params;

    await prisma.aiImageV2Session.deleteMany({
      where: { id, ...scopedTenantUserWhere(scope, tenantId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/ai-image/v2/sessions/:id] Error:", error);
    return NextResponse.json({ error: "删除会话失败" }, { status: 500 });
  }
}
