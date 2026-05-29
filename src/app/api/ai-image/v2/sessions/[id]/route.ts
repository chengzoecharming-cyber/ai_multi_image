import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deserializeSession } from "@/lib/v2-serialization";

// GET /api/ai-image/v2/sessions/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "default";
    const userId = searchParams.get("userId") || "default";
    const { id } = await params;

    const row = await prisma.aiImageV2Session.findFirst({
      where: { id, tenantId, userId },
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
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "default";
    const userId = searchParams.get("userId") || "default";
    const { id } = await params;

    await prisma.aiImageV2Session.deleteMany({
      where: { id, tenantId, userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/ai-image/v2/sessions/:id] Error:", error);
    return NextResponse.json({ error: "删除会话失败" }, { status: 500 });
  }
}
