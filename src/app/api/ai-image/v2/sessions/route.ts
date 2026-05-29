import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { V2Session } from "@/app/ai-image/v2/types";
import {
  deserializeSession,
  toSessionCreateInput,
  toPlanCreateInput,
  toImageCreateInput,
  toDetailStateCreateInput,
} from "@/lib/v2-serialization";

// GET /api/ai-image/v2/sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "default";
    const userId = searchParams.get("userId") || "default";
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const rows = await prisma.aiImageV2Session.findMany({
      where: { tenantId, userId },
      include: { plans: true, images: true, detail: true },
      orderBy: { updatedAt: "desc" },
      take: limit,
      skip: offset,
    });

    const sessions = rows.map(deserializeSession);

    return NextResponse.json({ data: sessions });
  } catch (error) {
    console.error("[GET /api/ai-image/v2/sessions] Error:", error);
    return NextResponse.json({ error: "获取会话列表失败" }, { status: 500 });
  }
}

// POST /api/ai-image/v2/sessions
// Upsert: create or overwrite a session and all its children
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "default";
    const userId = searchParams.get("userId") || "default";

    const body = (await request.json()) as { session: V2Session };
    const session = body.session;
    if (!session?.id) {
      return NextResponse.json({ error: "Missing session.id" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete existing children
      await tx.aiImageV2DetailState.deleteMany({ where: { sessionId: session.id, tenantId, userId } });
      await tx.aiImageV2Plan.deleteMany({ where: { sessionId: session.id, tenantId, userId } });
      await tx.aiImageV2GeneratedImage.deleteMany({ where: { sessionId: session.id, tenantId, userId } });

      // 2. Delete existing session
      await tx.aiImageV2Session.deleteMany({ where: { id: session.id, tenantId, userId } });

      // 3. Recreate session
      await tx.aiImageV2Session.create({
        data: toSessionCreateInput(session, tenantId, userId),
      });

      // 4. Recreate plans
      if (session.singlePlans?.length) {
        for (let i = 0; i < session.singlePlans.length; i++) {
          const plan = session.singlePlans[i];
          await tx.aiImageV2Plan.create({
            data: toPlanCreateInput(plan, session.id, tenantId, userId, i),
          });
        }
      }

      // 5. Recreate images
      if (session.generatedImages?.length) {
        for (const image of session.generatedImages) {
          await tx.aiImageV2GeneratedImage.create({
            data: toImageCreateInput(image, session.id, tenantId, userId),
          });
        }
      }

      // 6. Recreate detail state
      if (session.detail) {
        await tx.aiImageV2DetailState.create({
          data: toDetailStateCreateInput(session.detail, session.id, tenantId, userId),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/ai-image/v2/sessions] Error:", error);
    return NextResponse.json({ error: "保存会话失败" }, { status: 500 });
  }
}
